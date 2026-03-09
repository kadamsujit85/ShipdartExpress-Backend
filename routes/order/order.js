const express = require('express');
const router = express.Router();
const orderMasterService = require('../../services/order/order');
const expressbeesOrderService = require('../../services/order/expressbees/order');

router
    .post('/get', orderMasterService.get)
    .post('/getCodDetails', orderMasterService.getCodDetails)
    .post('/getAwbNo', orderMasterService.getAwbNo)
    .post('/create', orderMasterService.validate(), orderMasterService.create)
    .post('/createOrder', orderMasterService.validate(), orderMasterService.createOrder)
    .post('/updateOrder', orderMasterService.validate(), orderMasterService.updateOrder)
    .put('/update', orderMasterService.validate(), orderMasterService.update)
    .post('/cancelOrder', orderMasterService.cancelOrder)
    .post('/shipnowOrder', orderMasterService.shipnowOrder)
    .post('/shipnowOrderForShiprocket', orderMasterService.shipnowOrderForShiprocket)
    .post('/cancelShipment', orderMasterService.cancelShipment)
    .post('/cancelEkartOrder', orderMasterService.cancelEkartOrder)
    .post('/cancelDelhiveryOrder', orderMasterService.cancelDelhiveryOrder)
    .post('/shipnowOrderForDelhivery', orderMasterService.shipnowOrderForDelhivery)
    .post('/shipnowOrderForEkart', orderMasterService.shipnowOrderForEkart)
    .post('/shipnowOrderXpressbees', expressbeesOrderService.shipnowOrderExpressbees)
    .post('/cancelShipmentXpressbees', expressbeesOrderService.cancelShipment)
    .post('/trackXpressbeesShipment', expressbeesOrderService.trackShipment)
    .post('/trackDelhiveryShipment', orderMasterService.trackDelhiveryShipment)
    .post('/trackEkartShipment', orderMasterService.trackDelhiveryShipment)
    .post('/scheduleDelhiveryShipment', orderMasterService.scheduleDelhiveryShipment)
    .post('/shipBulkOrder', orderMasterService.shipBulkOrder)
    .post('/cancelShiprocketOrder', orderMasterService.cancelShiprocketOrder)
    .post('/trackShiprocketShipment', orderMasterService.trackShiprocketShipment)
    .post('/deleteOrder', orderMasterService.deleteOrder)
    .post('/cloneOrder', orderMasterService.cloneOrder)
    .post('/createNdrForDtdc', orderMasterService.createNdrForDtdc)
    .post('/createNdrForShiprocket', orderMasterService.createNdrForShiprocket)
    .post('/createNdrForDelhivery', orderMasterService.createNdrForDelhivery)
    .post('/createNdrForXpressbees', expressbeesOrderService.createNdrForXpressbees)
    .post('/approveDtdcNdr', orderMasterService.approveDtdcNdr)
    .post('/manifestCreate', orderMasterService.manifestCreate)
    .post('/importBulkExcelOrder', orderMasterService.importBulkExcelOrder)

module.exports = router;