const { Web3 } = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));

let ownerAccounts = {
  "0xB2B788752b2521406c3B26F7Fe64A87CB4796b34": 0,
  "0xf49fB8Fd696ddCC1f10c472374FCef8fB806748a": 0
}

module.exports.ownerNonce = async () => {
  const [tx1, tx2] = await Promise.all([
    web3.eth.getTransactionCount("0xB2B788752b2521406c3B26F7Fe64A87CB4796b34", 'pending'),
    web3.eth.getTransactionCount("0xf49fB8Fd696ddCC1f10c472374FCef8fB806748a", "pending"),
  ]);

  ownerAccounts["0xB2B788752b2521406c3B26F7Fe64A87CB4796b34"] = tx1;
  ownerAccounts["0xf49fB8Fd696ddCC1f10c472374FCef8fB806748a"] = tx2;
  console.log("Admin Nonce", tx1, tx2);
}
// main();

module.exports.incrementOwnerAccount = async (publicAddress) => {
  ownerAccounts[publicAddress]++;
}

module.exports.decrementOwnerAccount = async (publicAddress) => {
  ownerAccounts[publicAddress]--;
}

module.exports.ownerAccounts = ownerAccounts;
