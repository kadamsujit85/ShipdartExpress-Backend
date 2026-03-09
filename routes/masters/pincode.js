const express = require('express');
const router = express.Router();
const employeeMasterService = require('../../services/masters/pincode');

router
    .post('/get', employeeMasterService.get)
    .post('/getPincodeDataForDropdown', employeeMasterService.getPincodeDataForDropdown)
    .post('/create', employeeMasterService.create)
    .post('/createPincode', employeeMasterService.createPincode)
    .post('/updatePincode', employeeMasterService.updatePincode)
    .put('/update', employeeMasterService.update)

module.exports = router;