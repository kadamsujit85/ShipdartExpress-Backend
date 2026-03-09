const express = require('express');
const router = express.Router();
const commodityMasterService = require('../../services/masters/commodity');

router
    .post('/get', commodityMasterService.get)
    .post('/create', commodityMasterService.create)
    .put('/update', commodityMasterService.update)

module.exports = router;