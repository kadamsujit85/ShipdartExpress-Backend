const express = require('express');
const router = express.Router();
const ticketGroupService = require('../../services/supportSystem/ticketGroup');

router
    .post('/get', ticketGroupService.get)
    .post('/create', ticketGroupService.validate(), ticketGroupService.create)
    .put('/update', ticketGroupService.validate(), ticketGroupService.update)

module.exports = router;