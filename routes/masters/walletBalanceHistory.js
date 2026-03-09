const express = require('express');
const router = express.Router();
const walletBalanceHistoryService = require('../../services/masters/walletBalanceHistory');

router
    .post('/get', walletBalanceHistoryService.get)
    .post('/create', walletBalanceHistoryService.validate(), walletBalanceHistoryService.create)
    .put('/update', walletBalanceHistoryService.validate(), walletBalanceHistoryService.update)

module.exports = router;