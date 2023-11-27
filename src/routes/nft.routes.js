const nftController = require('~/controllers/nft.controller');
const commonCtrls = require('~/controllers/common.controllers');

/**
 * @type { Routes.default }
 */
module.exports = {
    prefix: '/nft',
    routes: [
        {
            path: '/loan',
            methods: {
                post: {
                    middlewares: [commonCtrls.isAuthenticated, commonCtrls.isValidTransactionHash, nftController.loanNFTs],
                },
            },
        },
    ],
};
