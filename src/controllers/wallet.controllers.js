const log = require('debug')('app');
const isEmpty = require('~/helper/isEmpty');
const { Wallet, Deposit, Withdraw } = require('~/models/index');
const { sendError, getPublic } = require('~/utils/utils');
const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));

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

    return res.status(200).json({ success: true, amount: wallet ? wallet.balance : 0, xbuff_points: wallet ? wallet.xbuff_points : 0 });
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

exports.withdraw = async (req, res) => {
  const { user, body } = req;
  const { wallet_address, amount, asset } = body;
  if (isEmpty(wallet_address) || isEmpty(amount) || isEmpty(asset) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }

  if (!web3.utils.isAddress(wallet_address)) return res.status(400).json({ success: false, message: "Invalid withdraw address!" });

  if (asset == "USDT" || asset == "USDC") {
    const wallet = await Wallet.findOne({
      where: { user_id: user.id }
    })

    if (isEmpty(wallet) || (wallet.balance - amount) < 0) {
      return res.status(400).json({ success: false, message: "Insufficient balance!" });
    }

    await Wallet.decrement({ balance: Number(amount) }, { where: { user_id: user.id } })
    await Withdraw.create({ user_id: user.id, wallet_address, amount: Number(amount), asset });

    return res.status(200).json({ success: true, message: "You will get withdraw soon" })
  } else {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }
}
