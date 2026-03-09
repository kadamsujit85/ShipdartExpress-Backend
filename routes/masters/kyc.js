const express = require('express');
const router = express.Router();
const kycMastercarrier = require('../../services/masters/kyc');

router
    .post('/get', kycMastercarrier.get)
    .post('/create', kycMastercarrier.create)
    .put('/update', kycMastercarrier.update)
    .post('/generate', kycMastercarrier.generate)
    .post('/submit', kycMastercarrier.submit)
    
module.exports = router;