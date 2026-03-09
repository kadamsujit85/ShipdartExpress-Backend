const express = require('express');
const router = express.Router();
const transactionMasterService = require('../../services/masters/transaction');

router
    .post('/get', transactionMasterService.get)
    .post('/getPastTransaction', transactionMasterService.getPastTransaction)
    .post('/create', transactionMasterService.validate(), transactionMasterService.create)
    .put('/update', transactionMasterService.validate(), transactionMasterService.update)

module.exports = router;