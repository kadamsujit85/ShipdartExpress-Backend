const express = require('express');
const router = express.Router();
const WeightDescripanciesServices = require('../../services/masters/weightDiscrepanies');

router
    .post('/get', WeightDescripanciesServices.get)
    .post('/getFilesData', WeightDescripanciesServices.getFilesData)
    .post('/create', WeightDescripanciesServices.create)
    .put('/update', WeightDescripanciesServices.update)

module.exports = router;