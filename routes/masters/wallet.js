const express = require('express');
const router = express.Router();
const walletMasterService = require('../../services/masters/wallet');

router
    .post('/get', walletMasterService.get)
    .post('/getCodWalletAmount', walletMasterService.getCodWalletAmount)
    .post('/getWalletData', walletMasterService.getWalletData)
    .post('/rechargeWallet', walletMasterService.rechargeWallet)
    .post('/addWalletAmount', walletMasterService.addWalletAmount)
    .post('/createRechargeOrderForEasebuzz', walletMasterService.createRechargeOrderForEasebuzz)
    .post('/successEasebuzz', walletMasterService.successEasebuzz)
    .post('/failEasebuzz', walletMasterService.failEasebuzz)
    .post('/create', walletMasterService.validate(), walletMasterService.create)
    .put('/update', walletMasterService.validate(), walletMasterService.update)

module.exports = router;