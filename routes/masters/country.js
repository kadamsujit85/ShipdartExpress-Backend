const express = require('express');
const router = express.Router();
const countryMasterService = require('../../services/masters/country');

router
    .post('/get', countryMasterService.get)
    .post('/create', countryMasterService.create)
    .put('/update', countryMasterService.update)

module.exports = router;