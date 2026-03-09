const express = require('express');
const router = express.Router();
const carrierMastercarrier = require('../../services/masters/carrier');

router
    .post('/get', carrierMastercarrier.get)
    .post('/create', carrierMastercarrier.create)
    .put('/update', carrierMastercarrier.update)

module.exports = router;