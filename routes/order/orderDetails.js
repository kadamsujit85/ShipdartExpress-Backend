const express = require('express');
const router = express.Router();
const orderDetailsService = require('../../services/order/orderDetails');

router
    .post('/get', orderDetailsService.get)
    .post('/create', orderDetailsService.validate(), orderDetailsService.create)
    .put('/update', orderDetailsService.validate(), orderDetailsService.update)

module.exports = router;