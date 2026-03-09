const express = require('express');
const router = express.Router();
const productMasterService = require('../../services/masters/service');

router
    .post('/get', productMasterService.get)
    .post('/create', productMasterService.create)
    .put('/update', productMasterService.update)

module.exports = router;