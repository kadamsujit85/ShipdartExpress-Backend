const express = require('express');
const router = express.Router();
const channelMastercarrier = require('../../services/channel/channel.js');

router
    .post('/get', channelMastercarrier.get)
    .post('/create', channelMastercarrier.create)
    .put('/update', channelMastercarrier.update)

module.exports = router;