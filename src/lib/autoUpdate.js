const { sleep } = require('~/helper/sleep.helper');
const divide = require('divide-bigint');
const isEmpty = require('~/helper/isEmpty');
const fs = require('fs');
const { Wallet, Deposit, Transaction, User, Withdraw, NFTLoan, NFTLoanHistory } = require('~/models/index');
const { Web3 } = require('web3');
const { ownerAccounts, incrementOwnerAccount } = require('~/utils/ownerNonce');
const { sendUSDCToken } = require('~/lib/tokenManage');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TEST_PROVIDER));
const token_jsonFile = './src/abis/token.json';
const token_parsed = JSON.parse(fs.readFileSync(token_jsonFile));
const token_abi = token_parsed.abi;

const autoDepositCheck = async () => {
    const pendingDeposit = await Deposit.findAll({
        where: { status: 2 }
    });

    if (!isEmpty(pendingDeposit)) {
        for (let i = 0; i < pendingDeposit.length; i++) {
            console.log("Pending Deposit i", i)
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
                            await Deposit.update({ status: 1 }, {
                                where: { user_id, transaction_hash },
                            });
                            continue;
                        }
                        const user = await User.findOne({
                            where: { id: user_id }
                        })

                        if (isEmpty(user)) {
                            console.log("Can't find user ")
                            await Deposit.update({ status: 1 }, {
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
                                    await Deposit.update({ status: 1 }, {
                                        where: { user_id, transaction_hash },
                                    });
                                    continue;
                                }

                            } else {
                                console.log("Sender address is not matching");
                                await Deposit.update({ status: 1 }, {
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
                await Deposit.update({ status: 1 }, {
                    where: { user_id, transaction_hash },
                });
                continue;
            }
        }

    } else {
        console.log("Not Deposit pending history")
        await sleep(60000);
    }

    autoDepositCheck();
}

const autoWithdrawCheck = async () => {
    const pendingWithdraw = await Withdraw.findAll({
        where: { status: 2 }
    });

    if (!isEmpty(pendingWithdraw)) {
        for (let i = 0; i < pendingWithdraw.length; i++) {
            console.log("Pending Withdraw i", i);
            let pending_orderId = pendingWithdraw[i].id;
            let user_id = pendingWithdraw[i].user_id;
            let amount = pendingWithdraw[i].amount;
            let asset = pendingWithdraw[i].asset;
            let wallet_address = pendingWithdraw[i].wallet_address;

            let contract_address = '';
            if (asset == "USDT") {
                contract_address = process.env.USDT_CONTRACT_ADDRESS;
            } else if (asset == "USDC") {
                contract_address = process.env.USDC_CONTRACT_ADDRESS;
            }
            let transaction_hash = '';
            try {
                var contract_router = new web3.eth.Contract(token_abi, web3.utils.toChecksumAddress(contract_address));
                const expectedGas = await contract_router.methods.transfer(wallet_address, web3.utils.toWei(amount.toString(), 'ether')).estimateGas({ from: process.env.WIthDRAW_PUBLIC_KEY });
                const tx = await contract_router.methods.transfer(wallet_address, web3.utils.toWei(amount.toString(), 'ether'));

                const _data = tx.encodeABI();

                const nonce = ownerAccounts[process.env.WIthDRAW_PUBLIC_KEY];
                await incrementOwnerAccount(process.env.WIthDRAW_PUBLIC_KEY);

                const signedTx = await web3.eth.accounts.signTransaction(
                    {
                        to: web3.utils.toChecksumAddress(contract_address),
                        data: _data,
                        gasLimit: expectedGas * 10n,
                        gasPrice: parseInt(expectedGas * 5n),
                        nonce: nonce
                    },
                    process.env.WITHDRAW_PRIVATE_KEY
                );
                const token_hash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                transaction_hash = await token_hash.transactionHash;
                console.log(i, "Auto Withdraw Success ", transaction_hash);

                await Transaction.create({ user_id, asset, amount, type: "Withdraw", destination: wallet_address, transaction_hash });

                await Withdraw.update({ status: 0 }, {
                    where: { id: pending_orderId },
                });
                continue;
            } catch (error) {
                if (error.message.includes("However, be aware that it might still be mined!")) {
                    const transactionHashMatch = error.message.match(/Transaction Hash: (0x[0-9a-fA-F]+)/);
                    if (transactionHashMatch) {
                        transaction_hash = transactionHashMatch[1];
                        console.log(i, "Pending Auto Withdraw Success ", transaction_hash);
                        await Transaction.create({ user_id, asset, amount, type: "Withdraw", destination: wallet_address, transaction_hash });

                        await Withdraw.update({ status: 0 }, {
                            where: { id: pending_orderId },
                        });
                    } else {
                        console.log("Transaction Hash not found in the error message.");
                    }
                } else {
                    console.log("Auto Withdraw Transaction Checking Error ", error.message);
                    continue;
                }
            }
        }

    } else {
        console.log("Not Withdraw pending history")
        await sleep(60000);
    }

    autoWithdrawCheck();
}

const autoNFTLoanRequestCheck = async () => {
    const pendingLoanRequest = await NFTLoan.findAll({
        where: { status: 2 }
    });

    if (!isEmpty(pendingLoanRequest)) {
        for (let i = 0; i < pendingLoanRequest.length; i++) {
            console.log("Pending NFT Loan i", i)
            let user_id = pendingLoanRequest[i].user_id;
            let transaction_hash = pendingLoanRequest[i].transaction_hash;
            let created_day = new Date(pendingLoanRequest[i].createdAt).toISOString();
            let standard_day = new Date(new Date() - process.env.ONE_DAY).toISOString();

            if (standard_day < created_day) {
                try {
                    const receipt = await web3.eth.getTransaction(transaction_hash);
                    if (receipt.blockHash) {
                        if (receipt.to.toLowerCase() == process.env.LOAN_NFT_CONTRACT_ADDRESS.toLowerCase()) {
                            const user = await User.findOne({
                                where: { id: user_id }
                            })

                            if (isEmpty(user)) {
                                console.log("Can't find user ")
                                await NFTLoan.update({ status: 1 }, {
                                    where: { user_id, transaction_hash },
                                });
                                continue;
                            } else {
                                if (user.wallet_address.toLowerCase() == receipt.from.toLowerCase()) {
                                    const input = receipt.input;
                                    const parameters = input.slice(10);

                                    // Assuming the function signature corresponds to transferFrom(address,address,uint256)
                                    const decodedParameters = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], parameters);

                                    const fromAddress = decodedParameters[0];
                                    const toAddress = decodedParameters[1];
                                    const tokenId = decodedParameters[2];

                                    console.log('From Address:', fromAddress);
                                    console.log('To Address:', toAddress);
                                    console.log('Token ID:', tokenId);

                                    if (toAddress.toLowerCase() == process.env.NFT_MANAGER_PUBLIC_KEY.toLocaleLowerCase()) {
                                        const sendUSDCResult = await sendUSDCToken(process.env.NFT_MANAGER_PUBLIC_KEY, process.env.NFT_MANAGER_PRIVATE_KEY, process.env.NFT_LOAN_TEST_AMOUNT, user.wallet_address)

                                        if (sendUSDCResult.success) {
                                            await Transaction.create({ user_id: user.id, asset: "USDC", amount: process.env.NFT_LOAN_TEST_AMOUNT, type: "Loan", destination: user.wallet_address, transaction_hash: sendUSDCResult.hash });

                                            await NFTLoanHistory.create({ user_id: user.id, transaction_hash: sendUSDCResult.hash, tokenId, loanAmount: process.env.NFT_LOAN_TEST_AMOUNT });

                                            await NFTLoan.update({ status: 0 }, {
                                                where: { user_id, transaction_hash },
                                            });
                                            console.log("Success Loan history ", i)
                                        } else {
                                            console.log("Error occured while sending USDC ", sendUSDCResult.message)
                                        }
                                    } else {
                                        console.log("Receiver address is not matching");
                                        await NFTLoan.update({ status: 1 }, {
                                            where: { user_id, transaction_hash },
                                        });
                                        continue;
                                    }
                                } else {
                                    console.log("Sender address is not matching");
                                    await NFTLoan.update({ status: 1 }, {
                                        where: { user_id, transaction_hash },
                                    });
                                    continue;
                                }
                            }
                        } else {
                            console.log("Interacted with other NFTs");
                            await NFTLoan.update({ status: 1 }, {
                                where: { user_id, transaction_hash },
                            });
                            continue;
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
                await NFTLoan.update({ status: 1 }, {
                    where: { user_id, transaction_hash },
                });
                continue;
            }
        }

    } else {
        console.log("Not Deposit pending history")
        await sleep(60000);
    }

    autoNFTLoanRequestCheck();
}

module.exports.autoTransactionCheck = async () => {
    autoDepositCheck();
    autoWithdrawCheck();
    autoNFTLoanRequestCheck();
}
