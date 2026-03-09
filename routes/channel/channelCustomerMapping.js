const express = require('express');
const router = express.Router();
const channelCustomerMappingService = require('../../services/channel/channelCustomerMapping');

router
    .post('/get', channelCustomerMappingService.get)
    .post('/create', channelCustomerMappingService.create)
    .post('/createChannel', channelCustomerMappingService.createChannel)
    .post('/uninstallShopifyChannel', channelCustomerMappingService.uninstallShopifyChannel)
    .put('/update', channelCustomerMappingService.update)

module.exports = router;