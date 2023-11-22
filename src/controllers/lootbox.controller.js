const log = require('debug')('app:controllers:product');
const { sendError } = require('~/utils/utils');
const { LootBoxFirst } = require('~/models');
const { LootBoxSecond } = require('~/models');
const { getRandomNumber } = require('~/helper/randomNumber.helper');
const isEmpty = require('~/helper/isEmpty');
const { Wallet, Transaction } = require('~/models/index');

exports.getAllLootBoxes = async (req, res) => {
  try {
    const lootBoxes = [
      {
        id: 1,
        items: 6,
        name: "R BOX",
        entry_fee: 10
      },
      {
        id: 2,
        items: 4,
        name: "X BOX",
        entry_fee: 1
      }
    ];

    return res.status(200).json({ success: true, lootBoxes });
  } catch (err) {
    log(err);
    return sendError(req, res, 500, 'Server Error');
  }
};

exports.getLootBoxDetails = async (req, res) => {
  const { lootBoxId } = req.params;
  if (isEmpty(lootBoxId)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }
  log("lootBoxId", lootBoxId);
  if (lootBoxId == 1) {
    const lootBoxDetails = await LootBoxFirst.findAll();
    return res.status(200).json({ success: true, lootBoxDetails });
  } else if (lootBoxId == 2) {
    const lootBoxDetails = await LootBoxSecond.findAll();
    return res.status(200).json({ success: true, lootBoxDetails });
  }
}

exports.playGame = async (req, res) => {
  const { user, body } = req;
  const { lootBoxId } = body;
  if (isEmpty(lootBoxId)) return res.status(400).json({ success: false, message: "Invalid Request!" });

  try {
    const randomNum = await getRandomNumber(1000);
    let prizeDetail = '';
    let entry_fee = 0;
    if (lootBoxId == 1) {
      entry_fee = 10;
    } else if (lootBoxId == 2) {
      entry_fee = 1;
    }

    const wallet = await Wallet.findOne({
      where: { user_id: user.id }
    })

    if (isEmpty(wallet) || wallet.balance - entry_fee < 0) return res.status(400).json({ success: false, message: "Insufficient balance" });

    await Wallet.decrement({ balance: Number(entry_fee) }, { where: { user_id: user.id } });
    await Transaction.create({ user_id: user.id, asset: "xbuff", amount: entry_fee, type: "Entry_Fee" });

    if (lootBoxId == 1) {
      prizeDetail = await LootBoxFirst.findOne({
        where: { id: randomNum },
      });
    } else if (lootBoxId == 2) {
      prizeDetail = await LootBoxSecond.findOne({
        where: { id: randomNum },
      });
    }

    if (!isEmpty(prizeDetail)) {
      await Wallet.increment({ balance: Number(prizeDetail.rewards), xbuff_points: Number(prizeDetail.xbuff_points) }, { where: { user_id: user.id } });

      await Transaction.create({ user_id: user.id, asset: "xbuff", amount: Number(prizeDetail.rewards), type: "Prize" });

      return res.status(200).json({ success: true, reward: prizeDetail.rewards, xbuff_points: prizeDetail.xbuff_points });
    } else {
      return res.status(400).json({ success: false, message: "Request could not be processed. Please try again." });
    }
  } catch (error) {
    console.log("Error while playing game ", error);
    return res.status(400).json({ success: false, message: "Request could not be processed. Please try again." });
  }
}
