const express = require('express');
const router = express.Router();
const customerMasterService = require('../../services/masters/customer');

router
    .post('/get', customerMasterService.get)
    .post('/setDefaultPassword', customerMasterService.setDefaultPassword)
    .post('/create', customerMasterService.validate(), customerMasterService.create)
    .put('/update', customerMasterService.validate(), customerMasterService.update)

module.exports = router;