const log = require('debug')('app:controllers:product');
const { sendError } = require('~/utils/utils');
const { LootBoxFirst } = require('~/models');
const { LootBoxSecond } = require('~/models');
const { getRandomNumber } = require('~/helper/randomNumber.helper');
const isEmpty = require('~/helper/isEmpty');

exports.getAllLootBoxes = async (req, res) => {
  try {
    const lootBoxes = [
      {
        id: 1,
        items: 6,
        name: "lootboxfirst",
        entry_fee: 10
      },
      {
        id: 2,
        items: 4,
        name: "lootboxsecond",
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
  const { lootBoxId } = req.body;
  try {
    const randomNum = await getRandomNumber(1000);
    console.log("Random Num ", randomNum);
    if (lootBoxId == 1) {
      const prizeDetail = await LootBoxFirst.findOne({
        where: { id: randomNum },
      });
      if (!isEmpty(prizeDetail)) {
        return res.status(200).json({ success: true, reward: prizeDetail.rewards, xbuff_points: prizeDetail.xbuff_points });
      } else {
        return res.status(400).json({ success: false, message: "Request could not be processed. Please try again." });
      }
    } else if (lootBoxId == 2) {
      const prizeDetail = await LootBoxSecond.findOne({
        where: { id: randomNum },
      });
      if (!isEmpty(prizeDetail)) {
        return res.status(200).json({ success: true, reward: prizeDetail.rewards, xbuff_points: prizeDetail.xbuff_points });
      } else {
        return res.status(400).json({ success: false, message: "Request could not be processed. Please try again." });
      }
    }
  } catch (error) {
    console.log("Error while playing game ", error);
    return res.status(400).json({ success: false, message: "Request could not be processed. Please try again." });
  }
  if (isEmpty(lootBoxId)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }

}
