const express = require('express');
const router = express.Router();
const notificationMastercarrier = require('../../services/masters/notification');

router
    .post('/get', notificationMastercarrier.get)
    .post('/getNotificationDetailsEmployeewise', notificationMastercarrier.getNotificationDetailsEmployeewise)
    .post('/getNotificationCount', notificationMastercarrier.getNotificationCount)
// .put('/update', carrierMastercarrier.update)

module.exports = router;