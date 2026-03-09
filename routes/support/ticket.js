const express = require('express');
const router = express.Router();
const supportMasterService = require('../../services/support/ticket');

router
    .post('/get', supportMasterService.get)
    .post('/create', supportMasterService.create)
    .post('/createTicket', supportMasterService.createTicket)
    .put('/update', supportMasterService.update)

module.exports = router;