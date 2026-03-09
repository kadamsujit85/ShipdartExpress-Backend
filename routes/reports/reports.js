const express = require('express');
const router = express.Router();
const carrierMastercarrier = require('../../services/reports/report');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router
    .post('/getCustomerShipmentSummary', carrierMastercarrier.getCustomerShipmentSummary)
    .post('/getCustomerInvoiceReport', carrierMastercarrier.getCustomerInvoiceReport)
    .post('/dashboardReport', carrierMastercarrier.dashboardReport)
    .post('/codSummaryReport', carrierMastercarrier.codSummaryReport)
    .post('/adminCodSummaryReport', carrierMastercarrier.adminCodSummaryReport)
    .post('/carrierChartData',carrierMastercarrier.carrierChartData)
    .post('/orderStatusChartData',carrierMastercarrier.orderStatusChartData)
    .post('/getAdminInvoiceReportWithGST',carrierMastercarrier.getAdminInvoiceReportWithGST)
    .post('/getAdminInvoiceReportWithoutGST',carrierMastercarrier.getAdminInvoiceReportWithoutGST)
    .post('/uploadChannelOrdersProductsFile',upload.single("file"),carrierMastercarrier.readChannelOrdersProductsFile)

module.exports = router;