const express = require('express');
const router = express.Router();
const stateMasterService = require('../../services/masters/state');

router
    .post('/get', stateMasterService.get)
    .post('/create', stateMasterService.validate(), stateMasterService.create)
    .put('/update', stateMasterService.validate(), stateMasterService.update)

module.exports = router;