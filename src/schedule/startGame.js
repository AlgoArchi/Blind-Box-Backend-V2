const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));
const fs = require('fs');
const { Round } = require('~/models/index');
const { getBlockTimeStamp } = require('~/helper/getBlockTimeStamp.helper');
const { getMilliseconds } = require('~/helper/getMilliseconds.helper');

const contract_address = process.env.XBUFF_CONTRACT_ADDRESS;
const jsonFile = './src/abis/xbuff_betting.json';
const parsed = JSON.parse(fs.readFileSync(jsonFile));
const abi = parsed.abi;
const contract_router = new web3.eth.Contract(abi, web3.utils.toChecksumAddress(contract_address));

const { averagePrice } = require('~/lib/realTimeBTC.socket');

module.exports.startRound = async (roundId) => {
    try {
        const expectedGas = await contract_router.methods.startRound(roundId, averagePrice.price).estimateGas({ from: process.env.BETTING_GAME_MANAGER_PUBLIC_KEY });

        const tx = await contract_router.methods.startRound(roundId, averagePrice.price);

        const _data = tx.encodeABI();

        const nonce = await web3.eth.getTransactionCount(process.env.BETTING_GAME_MANAGER_PUBLIC_KEY, 'pending');

        const signedTx = await web3.eth.accounts.signTransaction(
            {
                to: web3.utils.toChecksumAddress(contract_address),
                data: _data,
                gasLimit: expectedGas * 10n,
                gasPrice: parseInt(expectedGas * 5n),
                nonce: nonce
            },
            process.env.BETTING_GAME_MANAGER_PRIVATE_KEY
        );
        const token_hash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        const transaction_hash = await token_hash.transactionHash;
        console.log("Start transaction_hash ", transaction_hash);

        await Round.update({ status: "STARTED", startPrice: averagePrice.price }, {
            where: { id: roundId }
        });
    } catch (error) {
        if (error.message.includes("However, be aware that it might still be mined!")) {
            const transactionHashMatch = error.message.match(/Transaction Hash: (0x[0-9a-fA-F]+)/);
            if (transactionHashMatch) {
                const transaction_hash = transactionHashMatch[1];
                console.log("Start transaction_hash  ===", transaction_hash);
                await Round.update({ status: "STARTED", startPrice: averagePrice.price }, {
                    where: { id: roundId }
                });
            } else {
                console.log("Transaction Hash not found in the error message.");
            }
        } else {
            console.log("Auto Start Transaction Error ", error.message);
        }
    }
}
