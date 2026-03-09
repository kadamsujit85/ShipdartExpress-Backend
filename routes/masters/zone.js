const express = require('express');
const router = express.Router();
const zoneMasterService = require('../../services/masters/zone');

router
    .post('/get', zoneMasterService.get)
    .post('/create', zoneMasterService.validate(), zoneMasterService.create)
    .put('/update', zoneMasterService.validate(), zoneMasterService.update)

module.exports = router;