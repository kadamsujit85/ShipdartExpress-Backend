const express = require('express');
const router = express.Router();
const kycMastercarrier = require('../../services/masters/ndrOrder');

router
    .post('/get', kycMastercarrier.get)
    .post('/create', kycMastercarrier.create)
    .put('/update', kycMastercarrier.update)

module.exports = router;