const express = require('express');
const router = express.Router();
const serviceMasterService = require('../../services/masters/customerProductMapping');

router
    .post('/get', serviceMasterService.get)
    .post('/create', serviceMasterService.create)
    .post('/referProductMapping', serviceMasterService.referProductMapping)
    .put('/update', serviceMasterService.update)

module.exports = router;