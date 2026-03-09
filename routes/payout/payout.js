const express = require('express');
const router = express.Router();
const payoutMastercarrier = require('../../services/payout/payout');

router
    .post('/get', payoutMastercarrier.get)
    .post('/getCustomerPayoutDetails', payoutMastercarrier.getCustomerPayoutDetails)
    .post('/create', payoutMastercarrier.create)
    .post('/makePayout', payoutMastercarrier.makePayout)
    .post('/getCodDates', payoutMastercarrier.getCodDates)
    .post('/uploadPayout', payoutMastercarrier.uploadPayout)
    .put('/update', payoutMastercarrier.update)

module.exports = router;