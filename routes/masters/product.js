const express = require('express');
const router = express.Router();
const serviceMasterService = require('../../services/masters/product');

router
    .post('/get', serviceMasterService.get)
    .post('/create', serviceMasterService.create)
    .post('/getServiceMappingData', serviceMasterService.getServiceMappingData)
    .post('/addServiceMappingData', serviceMasterService.addServiceMappingData)
    .post('/calculateRate', serviceMasterService.calculateRate)
    .post('/calculateUniversalRate', serviceMasterService.calculateUniversalRate)
    .post('/getProductsForBulkOrder', serviceMasterService.getProductsForBulkOrder)
    .put('/update', serviceMasterService.update)

module.exports = router;