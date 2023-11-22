const fs = require('fs');
const { ethers } = require('ethers');
const { User, Betting, Round, Admin } = require('~/models/index');
const isEmpty = require('~/helper/isEmpty');
const provider = new ethers.JsonRpcProvider(process.env.TEST_PROVIDER);
const xbuff_betting_jsonFile = './src/abis/xbuff_betting.json';
const xbuff_betting_parsed = JSON.parse(fs.readFileSync(xbuff_betting_jsonFile));
const xbuff_betting_abi = xbuff_betting_parsed.abi;
const contract = new ethers.Contract(process.env.XBUFF_CONTRACT_ADDRESS, xbuff_betting_abi, provider);

const roundCreateFilter = contract.filters.RoundCreated();
const roundStarteFilter = contract.filters.RoundStarted();
const roundEndFilter = contract.filters.RoundEnded();
const roundJoinFilter = contract.filters.JoinedRound();
const tradeReturnFilter = contract.filters.TradeReturned();
const adminFeeFilter = contract.filters.AdminFeeSent();
const roundLoserFilter = contract.filters.TradeLostsSent();
const roundDrawnFilter = contract.filters.RoundDrawed();
const roundWinnerFilter = contract.filters.TradeWinningsSent();
const gameStopFilter = contract.filters.GameStopped();

const initializeProvider = async () => {
    await provider.ready;

    contract.on(roundCreateFilter, async (event) => {
        console.log("Listening Create Event");
        // Accessing event arguments using .toObject()
        const { roundId, startTime, endTime } = event.args.toObject();

        console.log('Create Round:', roundId.toString(), " created", startTime.toString(), endTime.toString());
    });

    contract.on(roundStarteFilter, async (event) => {
        console.log("Listening Start Event");
        // Accessing event arguments using .toObject()
        const { roundId, timestamp, price } = event.args.toObject();

        console.log('Start Round:', roundId.toString(), " start time", timestamp.toString(), "price ", price);

        await Round.update({ startPrice: Number(price), status: "STARTED" }, {
            where: { id: roundId },
        });
    });

    contract.on(roundEndFilter, async (event) => {
        console.log("Listening End Event");
        // Accessing event arguments using .toObject()
        const { roundId, timestamp, startPrice, endPrice } = event.args.toObject();

        console.log('End Round:', roundId.toString(), " end time", timestamp.toString(), "startPrice ", startPrice, "endPrice", endPrice);
        await Round.update({ endPrice: Number(endPrice), status: "ENDED" }, {
            where: { id: roundId },
        });
    });

    contract.on(roundJoinFilter, async (event) => {
        console.log("Listening Join Event");
        // Accessing event arguments using .toObject()
        const { roundId, sender, amount, prediction, newTotal } = event.args.toObject();

        console.log('Player Join:', roundId.toString(), " Player", sender.toString(), " amount", amount, "prediction", prediction, "newTotal", newTotal);
        const user = await User.findOne({
            where: { wallet_address: sender.toLowerCase() }
        });

        if (isEmpty(user)) {
            console.log("User Didn't Register ", sender.toString());
        } else {
            await Betting.create({ user_id: user.id, wallet_address: sender.toLowerCase(), roundId: roundId, betAmount: Number(amount) / 10 ** 18, prediction });
            console.log("New User Joined", user.id, Number(amount));
        }

    });

    contract.on(tradeReturnFilter, async (event) => {
        console.log("Listening Trade Return Event");
        // Accessing event arguments using .toObject()
        const { roundId, sender, amount } = event.args.toObject();

        console.log('Trade Return:', roundId.toString(), " Player", sender, " amount", amount);
        await Betting.update({ status: "DRAW" }, {
            where: { roundId, wallet_address: sender.toLowerCase(), },
        });
    });

    contract.on(adminFeeFilter, async (event) => {
        console.log("Listening Admin Fee Send Event");
        // Accessing event arguments using .toObject()
        const { roundId, amount } = event.args.toObject();

        console.log('Admin Fee Sent:', roundId.toString(), " amount", amount);
        await Admin.create({ roundId, rewardAmount: Number(amount) / 10 ** 18 })
    });

    contract.on(roundLoserFilter, async (event) => {
        console.log("Listening Round Loser Event");
        // Accessing event arguments using .toObject()
        const { roundId, losers, amount } = event.args.toObject();

        console.log('Round Losers:', roundId.toString(), "losers", losers, " amount", amount);
        for (i = 0; i < losers.length; i++) {
            let loserAddress = losers[i].toLowerCase();
            console.log("loserAddress", loserAddress);
            await Betting.update({ status: "LOST" }, {
                where: { roundId, wallet_address: loserAddress }
            })
        }
    });

    // contract.on(roundDrawnFilter, (event) => {
    //     console.log("Listening Round Drawn Event");
    //     // Accessing event arguments using .toObject()
    //     const { roundId, drawnAddresses, timestamp } = event.args.toObject();

    //     console.log('Round:', roundId.toString(), "drawnAddresses", drawnAddresses, " timestamp", timestamp);
    // });

    contract.on(roundWinnerFilter, async (event) => {
        console.log("Listening Winner List Event");
        // Accessing event arguments using .toObject()
        const { roundId, winner, tradeAmount, winningsAmount } = event.args.toObject();

        console.log('Round Winner:', roundId.toString(), "winner", winner, " tradeAmount", tradeAmount, " winningsAmount", winningsAmount);
        await Betting.update({ status: "WIN", prize: Number(winningsAmount) / 10 ** 18 }, {
            where: { roundId, wallet_address: winner.toLowerCase(), },
        })
    });

    contract.on(gameStopFilter, (event) => {
        console.log("Listening Game Stop Event");
        // Accessing event arguments using .toObject()
        const { reason } = event.args.toObject();
        console.log('Game Stopped', reason.toString());
    });

};

initializeProvider();