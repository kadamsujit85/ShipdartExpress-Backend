const express = require('express');
const router = express.Router();
const addressMasterService = require('../../services/masters/address');

router
    .post('/get', addressMasterService.get)
    .post('/create', addressMasterService.validate(), addressMasterService.create)
    .put('/update', addressMasterService.validate(), addressMasterService.update)
    .post('/delete', addressMasterService.delete)

module.exports = router;