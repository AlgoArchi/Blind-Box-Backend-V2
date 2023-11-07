const log = require('debug')('app');
const fs = require('fs');
const divide = require('divide-bigint');
const isEmpty = require('~/helper/isEmpty');
const { sleep } = require('~/helper/sleep.helper');
const { Wallet, Deposit, Transaction, User } = require('~/models/index');
const { sendError, getPublic } = require('~/utils/utils');
const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));

const token_jsonFile = './src/abis/token.json';
const token_parsed = JSON.parse(fs.readFileSync(token_jsonFile));
const token_abi = token_parsed.abi;

/**
 * Get a specific user details by its email
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getWalletBalance = async (req, res) => {
  const { user } = req;

  try {
    const wallet = await Wallet.findOne({
      where: { user_id: user.id },
    });

    return res.status(200).json({ success: true, amount: wallet ? wallet.balance : 0 });
  } catch (e) {
    log('error while fetching the user %s', e);
  }

  if (!user) {
    return sendError(req, res, 404, 'User not found');
  }

  return res.json({ success: true, user: getPublic(user) });
};

exports.deposit = async (req, res) => {
  const { user, body } = req;
  const { transaction_hash } = body;
  if (isEmpty(transaction_hash)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }

  const existHash = await Deposit.findOne({
    where: { user_id: user.id, transaction_hash: transaction_hash.toLowerCase(), },
  });

  if (isEmpty(existHash)) {
    await Deposit.create({ user_id: user.id, transaction_hash: transaction_hash.toLowerCase() });
  }

  return res.status(200).json({ success: true, message: "Your balance will be top up soon." })
}

const autoDepositCheck = async () => {
  const pendingDeposit = await Deposit.findAll({
    where: { status: 2 }
  });

  if (!isEmpty(pendingDeposit)) {
    for (i = 0; i < pendingDeposit.length; i++) {
      console.log("i", i)
      let user_id = pendingDeposit[i].user_id;
      let transaction_hash = pendingDeposit[i].transaction_hash;
      let created_day = new Date(pendingDeposit[i].createdAt).toISOString();
      let standard_day = new Date(new Date() - process.env.ONE_DAY).toISOString();

      if (standard_day < created_day) {
        try {
          const receipt = await web3.eth.getTransaction(transaction_hash);
          if (receipt.blockHash) {
            let currency = '';
            if (receipt.to.toLowerCase() == process.env.USDT_CONTRACT_ADDRESS.toLowerCase()) {
              currency = "USDT"
            } else if (receipt.to.toLowerCase() == process.env.USDC_CONTRACT_ADDRESS.toLowerCase()) {
              currency = "USDC"
            } else {
              console.log("Interacted with other tokens");
              await Transaction.update({ status: 1 }, {
                where: { user_id, transaction_hash },
              });
              continue;
            }
            const user = await User.findOne({
              where: { id: user_id }
            })

            if (isEmpty(user)) {
              console.log("Can't find user ")
              await Transaction.update({ status: 1 }, {
                where: { user_id, transaction_hash },
              });
              continue;
            } else {
              if (user.wallet_address.toLowerCase() == receipt.from.toLowerCase()) {
                if (receipt.input.toString().includes(process.env.DEPOSIT_WALLET.substring(2).toLowerCase())) {
                  const amount = divide(BigInt(web3.utils.toBigInt("0x" + receipt.input.substring(74)).toString()), BigInt(10 ** 18));

                  await Transaction.create({ user_id: user.id, asset: currency, amount, type: "Deposit", destination: process.env.DEPOSIT_WALLET, transaction_hash });
                  const wallet = await Wallet.findOne({
                    where: { user_id: user_id }
                  })

                  if (isEmpty(wallet)) {
                    await Wallet.create({ user_id, balance: Number(amount) });
                  } else {
                    await Wallet.increment({ balance: Number(amount) }, { where: { user_id } })
                  }

                  await Deposit.update({ status: 0 }, {
                    where: { user_id, transaction_hash },
                  });
                } else {
                  console.log("Receiver address is not matching");
                  await Transaction.update({ status: 1 }, {
                    where: { user_id, transaction_hash },
                  });
                  continue;
                }

              } else {
                console.log("Sender address is not matching");
                await Transaction.update({ status: 1 }, {
                  where: { user_id, transaction_hash },
                });
                continue;
              }
            }

          } else {
            console.log('Transaction receipt not found.');
            continue;
          }
        } catch (error) {
          console.log("Auto Deposit Transaction Checking Error ", error);
          continue;
        }
      } else {
        await Transaction.update({ status: 1 }, {
          where: { user_id, transaction_hash },
        });
        continue;
      }
    }

  } else {
    console.log("Not pending history")
    await sleep(60000);
  }

  autoDepositCheck();
}

autoDepositCheck();
