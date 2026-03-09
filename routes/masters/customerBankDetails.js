const express = require('express');
const router = express.Router();
const customerBankDetailsService = require('../../services/masters/customerBankDetails');

router
    .post('/get', customerBankDetailsService.get)
    .post('/create', customerBankDetailsService.create)
    .put('/update', customerBankDetailsService.update)

module.exports = router;