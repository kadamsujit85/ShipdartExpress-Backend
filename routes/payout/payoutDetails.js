const express = require('express');
const router = express.Router();
const payoutDetailscarrier = require('../../services/payout/payoutDetails');

router
    .post('/get', payoutDetailscarrier.get)
    .post('/create', payoutDetailscarrier.create)
    .put('/update', payoutDetailscarrier.update)

module.exports = router;