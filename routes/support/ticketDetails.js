const express = require('express');
const router = express.Router();
const supportDetailsService = require('../../services/support/ticketDetails');

router
    .post('/get', supportDetailsService.get)
    .post('/create', supportDetailsService.create)
    .put('/update', supportDetailsService.update)

module.exports = router;