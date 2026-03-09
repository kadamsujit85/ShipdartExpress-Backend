const express = require("express");
const router = express.Router();
var globalService = require("../services/global");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router

    .post('/createOrderForShopify', require('../services/order/order').createOrderForShopify)
    .post('/channelCustomerMapping/createChannel', require('../services/channel/channelCustomerMapping').createChannel)
    .post('/api/channelCustomerMapping/create', require('../services/channel/channelCustomerMapping').create)
    .post('/uninstallShopifyChannel', require('../services/channel/channelCustomerMapping').uninstallShopifyChannel)
    .post('/successEasebuzz', require('../services/masters/wallet').successEasebuzz)
    .post('/failEasebuzz', require('../services/masters/wallet').failEasebuzz)

    .all("*", globalService.checkAuthorization)
    .use("/api", globalService.checkToken)

    .use('/api/form', require('./UserAccess/form'))
    .use('/api/role', require('./UserAccess/role'))
    .use('/api/roleDetails', require('./UserAccess/roleDetail'))
    .post('/user/login', require('../services/UserAccess/user').login)
    .post('/customer/login', require('../services/masters/customer').login)
    .post('/customer/reset-password', require('../services/masters/customer').resetPassword)
    .post('/customer/verify-otp', require('../services/masters/customer').verifyOTP)
    .post('/customer/update-password', require('../services/masters/customer').updatePassword)
    .use('/api/user', require('./UserAccess/user'))

    //Masters
    .use('/api/customer', require('./masters/customer'))
    .use('/api/notification', require('./masters/notification'))
    .use('/api/commodity', require('./masters/commodity'))
    .use('/api/service', require('./masters/service'))
    .use('/api/product', require('./masters/product'))
    .use('/api/customerProductMapping', require('./masters/customerProductMapping'))
    .use('/api/country', require('./masters/country'))
    .use('/api/carrier', require('./masters/carrier'))
    .use('/api/transaction', require('./masters/transaction'))
    .use('/api/state', require('./masters/state'))
    .use('/api/wallet', require('./masters/wallet'))
    .use('/api/walletBalanceHistory', require('./masters/walletBalanceHistory'))
    .use('/api/zone', require('./masters/zone'))
    .use('/api/pincode', require('./masters/pincode'))
    .use('/pincode/get', require('../services/masters/pincode').getPincodeDataForDropdown)
    .use('/api/address', require('./masters/address'))
    .use('/api/kyc', require('./masters/kyc'))
    .use('/api/customerBankDetails', require('./masters/customerBankDetails'))
    .use('/api/weightDiscrepancies', require('./masters/weightDiscrepancies'))
    .use('/api/printLabel', require('./masters/printLabel'))
    .use('/api/customerWhatsappConfigurationDetails', require('./masters/customerWhatsappConfigurationDetails'))
    .use('/api/ndrOrder', require('./masters/ndrOrder'))
    .post('/customer/create', require('../services/masters/customer').createCustomer)
    .post('/calculateGlobalRate', require('../services/masters/product').calculateGlobalRate)
    .post('/addExistingAddress', require('../services/masters/address').addExistingAddress)
    .post('/customer/sendRegistrationEmail', require('../services/masters/customer').sendRegistrationEmail)
    .post('/customer/sendRegistrationOtp', require('../services/masters/customer').sendRegistrationOtp)
    .post('/customer/verifyRegistrationOTP', require('../services/masters/customer').verifyRegistrationOTP)
    .post('/api/sendOtpForServiceVerification', require('../services/masters/customerWhatsappConfigurationDetails').sendOtpForServiceVerification)
    .post('/api/verifyServiceOTP', require('../services/masters/customerWhatsappConfigurationDetails').verifyServiceOTP)

    //Order
    .use('/api/order', require('./order/order'))
    .use('/api/orderDetails', require('./order/orderDetails'))
    .post('/order/shipnowOrderForBulk', require('../services/order/order').shipnowOrderForBulk)
    .post('/order/shipnowOrderForDelhiveryWithBulk', require('../services/order/order').shipnowOrderForDelhiveryWithBulk)
    .post('/order/shipnowOrderForEkartForBulk', require('../services/order/order').shipnowOrderForEkartForBulk)
    .post('/order/shipnowOrderExpressbeesForBulk', require('../services/order/expressbees/order').shipnowOrderExpressbeesForBulk)



    .post('/trackDTDCShipment', require('../services/order/order').trackShipment)
    .post('/trackDelhiveryShipment', require('../services/order/order').trackDelhiveryShipment)
    .post('/trackEkartShipment', require('../services/order/order').trackEkartShipment)
    .post('/trackShiprocketShipment', require('../services/order/order').trackShiprocketShipment)
    .post('/trackXpressbeesShipment', require('../services/order/expressbees/order').trackShipment)

    //Support
    .use('/api/ticket', require('./support/ticket'))
    .use('/api/ticketDetails', require('./support/ticketDetails'))

    //Payout
    .use('/api/payout', require('./payout/payout'))
    .use('/api/payoutDetails', require('./payout/payoutDetails'))


    //channel
    .use('/api/channel', require('./channel/channel'))
    .use('/api/channelCustomerMapping', require('./channel/channelCustomerMapping'))
    .post('/getPayload', require('../services/channel/channelCustomerMapping').getPayload)

    //reports
    .use('/api/reports', require('./reports/reports'))

    //upload calls
    .post("/upload/employeeProfile", require("../services/global").employeeProfile)
    .post("/upload/franchiseProfile", require("../services/global").franchiseProfile)
    .post("/upload/uploadProductCatalouge",upload.single("file"), require("../services/global").uploadProductsCatalouge)
    .post("/upload/adhaarImg", require("../services/global").adhaarImg)
    .post("/upload/panImg", require("../services/global").panImg)
    .post("/upload/gst", require("../services/global").gst)
    .post("/upload/carrierLogo", require("../services/global").carrierLogo)
    .post("/api/upload/dtdcExcelImport", require("../services/global").dtdcExcelImport)
    .post("/api/upload/weightDiscrepanciesDocuments", require("../services/global").weightDiscrepanciesDocuments)
    .post("/api/upload/uploadPayout", require("../services/global").uploadPayout)
    .post("/api/upload/cheque", require("../services/global").cheque)
    .post("/api/upload/printLabel", require("../services/global").printLabel)
    .post("/api/fetchTrackingDetails", require("../services/global").fetchTrackingDetails)
    .post("/upload/uploadPincodeFile", upload.single("file"),require("../services/global").uploadPincodeFile)
    
// .post("/upload/orderDetails", require("../services/global").orderDetails)


module.exports = router;