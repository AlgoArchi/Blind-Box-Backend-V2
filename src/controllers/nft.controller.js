const log = require('debug')('app');
const isEmpty = require('~/helper/isEmpty');
const { Wallet, Deposit, Withdraw, NFTLoan } = require('~/models/index');
const { sendError, getPublic } = require('~/utils/utils');
const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));

/**
 * Get a specific user details by its email
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */

exports.loanNFTs = async (req, res) => {
  const { user, body } = req;
  const { transaction_hash } = body;
  if (isEmpty(transaction_hash)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }

  const existHash = await NFTLoan.findOne({
    where: { user_id: user.id, transaction_hash: transaction_hash.toLowerCase(), },
  });

  if (isEmpty(existHash)) {
    await NFTLoan.create({ user_id: user.id, transaction_hash: transaction_hash.toLowerCase() });
  }

  return res.status(200).json({ success: true, message: "You will get the loan soon." })
}
