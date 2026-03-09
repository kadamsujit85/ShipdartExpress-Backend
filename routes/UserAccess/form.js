const express = require('express');
const router = express.Router();
const formService = require('../../services/UserAccess/form');

router
    .post('/get', formService.get)
    .post('/create', formService.create)
    .put('/update', formService.update)
    .post('/getForms', formService.getForms)

module.exports = router;
