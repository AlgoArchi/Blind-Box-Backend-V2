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

module.exports.createRound = async () => {
    const startTime = await getMilliseconds(process.env.DEPOSIT_TIME);
    const endTime = await getMilliseconds(Number(process.env.DEPOSIT_TIME) + Number(process.env.PLAY_TIME));

    const block_startTime = await getBlockTimeStamp(startTime);
    const block_endTime = await getBlockTimeStamp(endTime);

    const minBetAmount = Number(process.env.BET_MINT_AMOUNT);
    const maxBetAmount = Number(process.env.BET_MAX_AMOUNT);
    const roundBetLimit = Number(process.env.ROUND_BET_LIMIT);

    const round = await Round.create({ startTime, endTime });

    try {
        const expectedGas = await contract_router.methods.createRound(round.id, web3.utils.toWei(minBetAmount.toString(), 'ether'), web3.utils.toWei(maxBetAmount.toString(), 'ether'), roundBetLimit, block_startTime, block_endTime).estimateGas({ from: process.env.BETTING_GAME_MANAGER_PUBLIC_KEY });

        const tx = await contract_router.methods.createRound(round.id, web3.utils.toWei(minBetAmount.toString(), 'ether'), web3.utils.toWei(maxBetAmount.toString(), 'ether'), roundBetLimit, block_startTime, block_endTime);

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
        console.log("Create transaction_hash ", transaction_hash);
    } catch (error) {
        console.log("Creation Error ", error.message)
        if (error.message.includes("However, be aware that it might still be mined!")) {
            const transactionHashMatch = error.message.match(/Transaction Hash: (0x[0-9a-fA-F]+)/);
            if (transactionHashMatch) {
                const transaction_hash = transactionHashMatch[1];
                console.log("Create transaction_hash  ===", transaction_hash)
                await round.destroy();
            } else {
                console.log("Transaction Hash not found in the error message.");
                await round.destroy();
            }
        } else {
            console.log("Auto Create Transaction Checking Error ", error.message);
            await round.destroy();
        }
    }
}
