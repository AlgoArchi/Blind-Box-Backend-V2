const { ownerAccounts, incrementOwnerAccount, ownerNonce } = require('~/utils/ownerNonce');

const { Web3 } = require('web3');
const fs = require('fs');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));
const token_jsonFile = './src/abis/token.json';
const token_parsed = JSON.parse(fs.readFileSync(token_jsonFile));
const token_abi = token_parsed.abi;

module.exports.sendUSDCToken = async (sender, private_key, amount, receiver) => {
  try {
    const contract_address = process.env.USDC_CONTRACT_ADDRESS;
    const contract_router = new web3.eth.Contract(token_abi, web3.utils.toChecksumAddress(contract_address));
    const expectedGas = await contract_router.methods.transfer(receiver, web3.utils.toWei(amount.toString(), 'ether')).estimateGas({ from: sender });
    const tx = await contract_router.methods.transfer(receiver, web3.utils.toWei(amount.toString(), 'ether'));

    const _data = tx.encodeABI();

    const nonce = ownerAccounts[sender];
    await incrementOwnerAccount(sender);

    const signedTx = await web3.eth.accounts.signTransaction(
      {
        to: web3.utils.toChecksumAddress(contract_address),
        data: _data,
        gasLimit: expectedGas * 10n,
        gasPrice: parseInt(expectedGas * 5n),
        nonce: nonce
      },
      private_key
    );
    const token_hash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    const transaction_hash = await token_hash.transactionHash;
    console.log("Auto Loan Success ", transaction_hash);

    return { success: true, hash: transaction_hash };
  } catch (error) {
    await ownerNonce();
    if (error.message.includes("However, be aware that it might still be mined!")) {
      const transactionHashMatch = error.message.match(/Transaction Hash: (0x[0-9a-fA-F]+)/);
      if (transactionHashMatch) {
        const transaction_hash = transactionHashMatch[1];
        console.log("Pending NFT Loan Success ", transaction_hash);
        return { success: true, hash: transaction_hash };
      } else {
        console.log("Transaction Hash not found in the error message.");
        return { success: false, message: "Please try again later" };
      }
    } else {
      console.log("Auto Loan Transaction Checking Error ", error.message);
      return { success: false, message: "Please try again later" };

    }
  }
};
