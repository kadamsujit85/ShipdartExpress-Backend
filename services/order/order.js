const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger');
const axios = require('axios');
const request = require('request');
const async = require('async');
const jwt = require('jsonwebtoken');
const notification = require('../../utilities/pushNotification');
const wp = require('../../utilities/whatsappMsgShoot');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

var orderMaster = "order_master";
var viewOrderMaster = "view_" + orderMaster;

function reqData(req) {

    var data = {

        ORDER_NO: req.body.ORDER_NO,
        ORDER_DATETIME: req.body.ORDER_DATETIME,
        MOBILE_NO: req.body.MOBILE_NO,
        DELIVER_TO: req.body.DELIVER_TO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS: req.body.ADDRESS,
        LANDMARK: req.body.LANDMARK,
        PINCODE_ID: req.body.PINCODE_ID,
        PICKUP_ADDRESS: req.body.PICKUP_ADDRESS,
        PICKUP_CONTACT_PERSON: req.body.PICKUP_CONTACT_PERSON,
        PICKUP_MOBILE_NO: req.body.PICKUP_MOBILE_NO,
        PICKUP_EMAIL_ID: req.body.PICKUP_EMAIL_ID,
        PICKUP_ALT_MOBILE_NO: req.body.PICKUP_ALT_MOBILE_NO,
        PICKUP_LANDMARK: req.body.PICKUP_LANDMARK,
        PICKUP_PINCODE_ID: req.body.PICKUP_PINCODE_ID,
        DEAD_WEIGHT: req.body.DEAD_WEIGHT,
        LENGTH: req.body.LENGTH,
        WIDTH: req.body.WIDTH,
        HEIGHT: req.body.HEIGHT,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        ORDER_AMOUNT: req.body.ORDER_AMOUNT,
        ORDER_STATUS: req.body.ORDER_STATUS,
        IS_SHIPPED: req.body.IS_SHIPPED ? 1 : 0,
        SHIPPING_DATETIME: req.body.SHIPPING_DATETIME,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        AWB_NO: req.body.AWB_NO,
        PAID_AMOUNT: req.body.PAID_AMOUNT,
        SERVICE_ID: req.body.SERVICE_ID,
        CARRIER_ID: req.body.CARRIER_ID,
        PRODUCT_ID: req.body.PRODUCT_ID,
        CHARGABLE_WEIGHT: req.body.CHARGABLE_WEIGHT,
        CANCEL_DATETIME: req.body.CANCEL_DATETIME,
        CANCEL_REMARK: req.body.CANCEL_REMARK,
        COD_AMOUNT: req.body.COD_AMOUNT,
        COD_PAID_AMOUNT: req.body.COD_PAID_AMOUNT,
        ORDER_STATUS_UPDATED_DATETIME: req.body.ORDER_STATUS_UPDATED_DATETIME,
        PAYOUT_DATETIME: req.body.PAYOUT_DATETIME,
        C_ID: req.body.C_ID,
        RTO_AMOUNT: req.body.RTO_AMOUNT ? req.body.RTO_AMOUNT : 0,
        IS_NDR: req.body.IS_NDR ? 1 : 0,

    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_NO', 'parameter missing').optional(),
        body('ORDER_DATETIME').optional(),
        body('MOBILE_NO', 'parameter missing').exists(),
        body('DELIVER_TO', 'parameter missing').exists(),
        body('EMAIL_ID').optional(),
        body('ADDRESS', 'parameter missing').exists(),
        body('LANDMARK').optional(),
        body('PINCODE_ID', 'parameter missing').exists(),
        body('PICKUP_ADDRESS', 'parameter missing').exists(),
        body('PICKUP_CONTACT_PERSON', 'parameter missing').exists(),
        body('PICKUP_MOBILE_NO', 'parameter missing').exists(),
        body('PICKUP_EMAIL_ID').optional(),
        body('PICKUP_ALT_MOBILE_NO').optional(),
        body('PICKUP_LANDMARK').optional(),
        body('PICKUP_PINCODE_ID', 'parameter missing').exists(),
        body('DEAD_WEIGHT').optional(),
        body('LENGTH').optional(),
        body('WIDTH').optional(),
        body('HEIGHT').optional(),
        body('CREATED_MODIFIED_DATE', 'parameter missing').optional(),
        body('ORDER_AMOUNT', 'parameter missing').exists(),
        body('PAYMENT_MODE', 'parameter missing').exists(),
        body('ORDER_STATUS', 'parameter missing').exists(),
        body('CUSTOMER_ID', 'parameter missing').exists(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND(AWB_NO like '%${req.body.SEARCH_FILTER}%' OR ORDER_NO like '%${req.body.SEARCH_FILTER}%' OR CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR PICKUP_MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR PICKUP_CONTACT_PERSON like '%${req.body.SEARCH_FILTER}%' OR DELIVER_TO like '%${req.body.SEARCH_FILTER}%' )` : '');

    (req.body.IS_NDR == 1 ? filter += ` AND IS_NDR = 1 ` : '');

    // (req.body.IS_SHIPPED == 1 && req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND(AWB_NO like '%${req.body.SEARCH_FILTER}%' OR CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR PICKUP_MOBILE_NO like '%${req.body.SEARCH_FILTER}%')` : '');

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '');
    (req.body.CARRIER_ID && (req.body.CARRIER_ID).length > 0 ? filter += ` AND CARRIER_ID IN(${req.body.CARRIER_ID})` : '');
    (req.body.ID && (req.body.ID).length > 0 ? filter += ` AND ID IN(${req.body.ID})` : '');
    (req.body.ORDER_STATUS && req.body.ORDER_STATUS != ' ' ? filter += ` AND ORDER_STATUS = '${req.body.ORDER_STATUS}'` : '');
    (req.body.IS_LABEL && req.body.IS_LABEL != ' ' ? filter += ` AND ORDER_STATUS NOT IN('C', 'P') AND IS_SHIPPED = 1` : '');
    (req.body.PAYMENT_MODE && req.body.PAYMENT_MODE != ' ' ? filter += ` AND PAYMENT_MODE = '${req.body.PAYMENT_MODE}'` : '');
    (req.body.IS_SHIPPED == 1 || req.body.IS_SHIPPED == 0 ? filter += ` AND IS_SHIPPED = ${req.body.IS_SHIPPED}` : '');
    (req.body.IS_SHIPPED == 0 && req.body.ORDER_FROM_DATE && req.body.ORDER_FROM_DATE != ' ' && req.body.ORDER_TO_DATE && req.body.ORDER_TO_DATE != ' ' ? filter += ` AND date(ORDER_DATETIME) between '${req.body.ORDER_FROM_DATE}' AND '${req.body.ORDER_TO_DATE}' ` : '');
    (req.body.SHIPPING_FROM_DATE && req.body.SHIPPING_FROM_DATE != ' ' && req.body.SHIPPING_TO_DATE && req.body.SHIPPING_TO_DATE != ' ' ? filter += ` AND date(SHIPPING_DATETIME) between '${req.body.SHIPPING_FROM_DATE}' AND '${req.body.SHIPPING_TO_DATE}' ` : '');

    (req.body.IS_RTO == 1 ? filter += ` AND ORDER_STATUS IN('RPR', 'RI', 'RTOD', 'RTD', 'RTBK', 'SETRTO')` : "");

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];


    try {
        mm.executeQuery('select count(*) as cnt from ' + viewOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewOrderMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewOrderMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewOrderMaster information."
                        });
                    }
                    else {
                        const roundSize = Math.ceil(results1[0].cnt / pageSize);
                        res.send({
                            "code": 200,
                            "message": "success",
                            "pages": (pageIndex && pageSize ? roundSize : 1),
                            "count": results1[0].cnt,
                            "data": results
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.create = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "orderMaster information saved successfully...",
                    });
                }
            });
        } catch (error) {
            console.log(error);

            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var criteria = {
        ID: req.body.ID,
    };
    var supportKey = req.headers["supportKey"];
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] != null ? setData += `${key}= ? , ` : true;
        data[key] != null ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + orderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "orderMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.createOrder = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var systemDate = mm.getSystemDate()
    data.CREATED_MODIFIED_DATE = systemDate;
    data.ORDER_DATETIME = systemDate;
    const orderDetails = req.body.orderDetails && (req.body.orderDetails).length > 0 ? req.body.orderDetails : [];
    var supportKey = req.headers["supportKey"];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            if (orderDetails.length > 0) {
                data.ORDER_NO = 'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];
                const connection = mm.openConnection();
                mm.executeDML('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection)
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to save orderMaster information..."
                        });
                    }
                    else {
                        var recordData = [];
                        var cod_amount = 0;
                        for (let i = 0; i < orderDetails.length; i++) {
                            let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), results.insertId];
                            recordData.push(rec);
                            cod_amount = data.PAYMENT_MODE == 'COD' ? cod_amount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0;
                        }
                        mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ? ;`, [recordData], supportKey, connection, (error, insertDetails) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save orderDetails information..."
                                });
                            }
                            else {
                                mm.executeDML(`update order_master set COD_AMOUNT = ?, COD_PAID_AMOUNT = 0 where ID = ?`, [(data.PAYMENT_MODE == 'COD' ? cod_amount : 0), results.insertId], supportKey, connection, (error, updateOrder) => {
                                    if (error) {
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update order information..."
                                        });
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "orderMaster information saved successfully...",
                                        });
                                    }
                                })
                            }
                        })
                    }
                });
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.updateOrder = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var criteria = {
        ID: req.body.ID,
    };
    var supportKey = req.headers["supportKey"];
    const orderDetails = req.body.orderDetails && (req.body.orderDetails).length > 0 ? req.body.orderDetails : [];
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] != null ? setData += `${key}= ? , ` : true;
        data[key] != null ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            if (orderDetails.length > 0) {
                var recordData2 = [];
                var codAmount = 0;
                for (let i = 0; i < orderDetails.length; i++) {
                    let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), criteria.ID];
                    recordData2.push(rec);
                    codAmount = (data.PAYMENT_MODE == 'COD' ? codAmount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0);
                }

                const connection = mm.openConnection();
                setData += ` COD_AMOUNT = ${codAmount},`;
                setData += ` COD_PAID_AMOUNT = 0,`;
                mm.executeDML(`UPDATE ` + orderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderMaster information."
                        });
                    }
                    else {

                        mm.executeDML(`delete from order_details where ORDER_ID = ?; insert into order_details(PRODUCT_NAME,PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ?`, [criteria.ID, recordData2], supportKey, connection, (error, insertDetails) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save orderDetails information..."
                                });
                            }
                            else {
                                mm.commitConnection(connection);
                                res.send({
                                    "code": 200,
                                    "message": "orderMaster information updated successfully...",
                                });
                            }
                        })
                    }
                });
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.cancelOrder = (req, res) => {

    var supportKey = req.headers["supportKey"];
    const ID = req.body.ID;
    var systemDate = mm.getSystemDate();
    try {
        if (ID && ID != ' ') {
            mm.executeQueryData(`UPDATE order_master SET ORDER_STATUS = 'R', CANCEL_DATETIME = ?, CREATED_MODIFIED_DATE = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, systemDate, systemDate, ID], supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to cancel order."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "order Cancel successfully...",
                    });
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }

    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.shipnowOrder = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;

    try {
        if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, async (error, getOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order."
                    });
                }
                else {
                    if (getOrder.length > 0) {
                        let getOrderDetails = getOrder

                        let getShipNowList = {
                            "orderData": getOrderDetails
                        }

                        let data = await calculateUniversalRateForWeightDescripancy(supportKey, getOrderDetails[0].DEAD_WEIGHT, getOrderDetails[0].CUSTOMER_ID, getOrderDetails[0].PICKUP_PINCODE_ID, getOrderDetails[0].PINCODE_ID, getOrderDetails[0].PAYMENT_MODE, productId, carrierId, serviceId, getOrderDetails[0].COD_AMOUNT, getOrderDetails[0].LENGTH, getOrderDetails[0].WIDTH, getOrderDetails[0].HEIGHT, getOrderDetails[0].ORDER_NO);
                        orderAmount = data.amount;
                        let record = {
                            "productData": data.productData
                        }
                        let productDetails = JSON.parse(getOrderDetails[0].PRODUCT_DETAILS);

                        orderData = {
                            consignments: [
                                {
                                    service_type_id: record?.productData[0]?.SERVICE_NAME,
                                    load_type: 'NON-DOCUMENT',
                                    // num_pieces: productDetails
                                    // .map((item: any) =>  item.TOTAL_UNIT)
                                    // .reduce((sum: number, amt: number) => sum + amt, 0),

                                    description: productDetails[0]?.PRODUCT_NAME, ...(getShipNowList?.orderData?.[0]?.PAYMENT_MODE !== "P" ? {
                                        cod_amount: productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0),
                                        cod_collection_mode: "cash"
                                    } : {}),
                                    length: getShipNowList?.orderData?.[0]?.LENGTH,
                                    width: getShipNowList?.orderData?.[0]?.WIDTH,
                                    height: getShipNowList?.orderData?.[0]?.HEIGHT,
                                    weight_unit: 'kg',
                                    weight: data.chargableWeight,
                                    declared_value: productDetails.map((item) => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0),
                                    invoice_number: getShipNowList?.orderData?.[0].ORDER_NO,
                                    invoice_date: formatInvoiceDate(getShipNowList?.orderData?.[0]?.ORDER_DATE),
                                    commodity_id: productDetails[0]?.PRODUCT_NAME,
                                    consignment_type: 'Forward',
                                    origin_details: {
                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME // PICKUP_STATE_NAME
                                    },
                                    destination_details: {
                                        name: getShipNowList?.orderData?.[0]?.DELIVER_TO, //DELIVER_TO
                                        alternate_phone: getShipNowList?.orderData?.[0]?.MOBILE_NO, //MOBILE_NO
                                        phone: getShipNowList?.orderData?.[0]?.MOBILE_NO, //MOBILE_NO
                                        address_line_1: getShipNowList?.orderData?.[0]?.ADDRESS, // ADDRESS
                                        address_line_2: getShipNowList?.orderData?.[0]?.ADDRESS, //ADDRESS
                                        pincode: getShipNowList?.orderData?.[0]?.PINCODE, //PINCODE
                                        city: getShipNowList?.orderData?.[0]?.CITY_NAME, // CITY_NAME
                                        state: getShipNowList?.orderData?.[0]?.STATE_NAME // STATE_NAME
                                    },
                                    return_details: {
                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME, // PICKUP_STATE_NAME
                                        Country: 'India', // COUNTRY_NAME
                                        email: getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID // PICKUP_EMAIL_ID
                                    },
                                    exceptional_return_details: {
                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME, // PICKUP_STATE_NAME
                                        Country: 'India', // COUNTRY_NAME
                                        email: getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID // PICKUP_EMAIL_ID
                                    },
                                    pieces_detail: productDetails.map((product) => ({
                                        description: product?.PRODUCT_NAME,
                                        declared_value: product?.PER_UNIT_PRICE * product?.TOTAL_UNIT,
                                        weight: 0,
                                        height: 0,
                                        length: 0,
                                        width: 0
                                    }))
                                }
                            ]
                        }

                        mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, async (error, getBalance) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get wallet."
                                });
                            }
                            else {
                                if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                    orderData.customer_code = process.env.DTDC_CUSTOMER_CODE;
                                    const response = await axios.post(process.env.DTDC_BASEURL + process.env.DTDC_ORDER_API, orderData, {
                                        headers: {
                                            "api-key": process.env.DTDC_API_KEY,
                                            'Content-Type': "application/json"
                                        },
                                    });

                                    if (response && response != ' ') {
                                        let awbNo = response.data.data[0].reference_number;
                                        if (response.data.data[0].reference_number != ' ' && response.data.data[0].reference_number) {
                                            const connection = mm.openConnection();
                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                if (error) {
                                                    console.log(error);
                                                    mm.rollbackConnection(connection);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to update wallet."
                                                    });
                                                }
                                                else {
                                                    var stringData = JSON.stringify(response.data)
                                                    mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?,CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                        if (error) {
                                                            console.log(error);
                                                            mm.rollbackConnection(connection);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to update order."
                                                            });
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection);
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to transaction_master order."
                                                                    });
                                                                }
                                                                else {
                                                                    const date = new Date(systemDate.split(' ')[0]);
                                                                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                    const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                    const titleData = '📦 Shipment Created.';
                                                                    const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using DTDC for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                    notification.sendNotification(titleData, bodyData, 0, customerId)
                                                                    mm.commitConnection(connection);
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "success",
                                                                        "AWB_NO": awbNo
                                                                    })
                                                                    setTimeout(() => {
                                                                        wp.sendOrderPlacedMessage(orderId)
                                                                    }, 3000);
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                        else {
                                            res.send({
                                                "code": 308,
                                                "message": "Something went wrong.",
                                                "error": response.data
                                            })
                                        }
                                    }
                                }
                                else {
                                    res.send({
                                        "code": 307,
                                        "message": "Insufficient wallet Amount"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "order not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.cancelShipment = async (req, res) => {

    var systemDate = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var CANCEL_REMARK = req.body.CANCEL_REMARK;

    try {
        if (orderId && orderId != ' ' && CANCEL_REMARK && CANCEL_REMARK != ' ') {
            mm.executeQueryData(`select AWB_NO, PAID_AMOUNT, ORDER_AMOUNT, CUSTOMER_ID, CITY_NAME, PINCODE, PICKUP_CITY_NAME, PICKUP_CITY_NAME, PICKUP_PINCODE from view_order_master where ID = ? AND ORDER_STATUS IN('S', 'PA', 'PS', 'PR', 'NP')`, orderId, supportKey, async (error, getAwb) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get wallet."
                    });
                }
                else {
                    if (getAwb.length > 0 && getAwb[0].AWB_NO) {
                        const orderData = {
                            "AWBNo": [getAwb[0].AWB_NO],
                            "customerCode": process.env.DTDC_CUSTOMER_CODE
                        }
                        const response = await axios.post(process.env.DTDC_BASEURL + process.env.DTDC_CANCELLATION_API, orderData, {
                            headers: {
                                "api-key": process.env.DTDC_API_KEY,
                                'Content-Type': "application/json"
                            },
                        });
                        if (response.data.status == 'OK' && response.data.success === true) {
                            const connection = mm.openConnection();
                            var stringData = JSON.stringify(response.data)
                            mm.executeDML(`update order_master set CANCEL_REMARK = ?, CANCEL_DATETIME = ?, IS_SHIPPED = 1, ORDER_STATUS = 'C', CANCEL_DATA = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [CANCEL_REMARK, systemDate, stringData, systemDate, orderId], supportKey, connection, (error, cancelOrder) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to cancel order."
                                    });
                                }
                                else {
                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getAwb[0].CUSTOMER_ID, 'O', getAwb[0].ORDER_AMOUNT, 'C', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to insert transaction."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?) where CUSTOMER_ID = ? `, [getAwb[0].ORDER_AMOUNT, getAwb[0].CUSTOMER_ID], supportKey, connection, (error, cancelOrder) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to cancel order."
                                                    });
                                                }
                                                else {

                                                    const date = new Date(systemDate.split(' ')[0]);
                                                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                    const formattedDate = date.toLocaleDateString('en-GB', options);
                                                    const titleData = '📦 Shipment Cancelled.';
                                                    const bodyData = `Shipment with AWB No. ${getAwb[0].AWB_NO} has been cancelled successfully on ${formattedDate}.`
                                                    notification.sendNotification(titleData, bodyData, 0, getAwb[0].CUSTOMER_ID)
                                                    mm.commitConnection(connection)
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success"
                                                    })
                                                    setTimeout(() => {
                                                        wp.sendCancelShipmentMessage(orderId);
                                                    }, 3000);
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "failed.."
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "no order found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.shipnowOrderForDelhivery = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT ? req.body.ORDER_AMOUNT : 0;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;

    try {
        if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, async (error, getOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order."
                    });
                }
                else {
                    if (getOrder.length > 0) {


                        let getOrderDetails = getOrder;

                        let getShipNowList = {
                            "orderData": getOrderDetails
                        }

                        let data = await calculateUniversalRateForWeightDescripancy(supportKey, getOrderDetails[0].DEAD_WEIGHT, getOrderDetails[0].CUSTOMER_ID, getOrderDetails[0].PICKUP_PINCODE_ID, getOrderDetails[0].PINCODE_ID, getOrderDetails[0].PAYMENT_MODE, productId, carrierId, serviceId, getOrderDetails[0].COD_AMOUNT, getOrderDetails[0].LENGTH, getOrderDetails[0].WIDTH, getOrderDetails[0].HEIGHT, getOrderDetails[0].ORDER_NO);
                        orderAmount = data.amount;
                        let record = {
                            "productData": data.productData
                        }
                        let productDetails = JSON.parse(getOrderDetails[0].PRODUCT_DETAILS);


                        orderData = {
                            "shipments": [
                                {
                                    "add": getShipNowList?.orderData?.[0]?.ADDRESS,
                                    "phone": getShipNowList?.orderData?.[0]?.MOBILE_NO,
                                    "payment_mode": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 'Prepaid' : 'COD',
                                    "name": getShipNowList?.orderData?.[0]?.DELIVER_TO,
                                    "pin": getShipNowList?.orderData?.[0]?.PINCODE,
                                    "order": getShipNowList?.orderData?.[0]?.ORDER_NO,
                                    // Ewaybill-related fields (Required for intra-state shipments)
                                    "consignee_gst_amount": "", // Required for ewaybill
                                    "integrated_gst_amount": "", // Required for ewaybill
                                    "ewbn": "", // Required if total package amount >= 50k
                                    "consignee_gst_tin": "",
                                    "seller_gst_tin": "",
                                    "client_gst_tin": "",
                                    "hsn_code": "", // Required for ewaybill
                                    "gst_cess_amount": "", // Required for ewaybill
                                    "shipping_mode": record?.productData[0]?.SERVICE_NAME,
                                    // Optional fields (use only if needed)
                                    "client": process.env.DELHIVERY_CLIENT_ID,
                                    "tax_value": "",
                                    "seller_tin": "",
                                    "seller_gst_amount": "",
                                    "seller_inv": "",
                                    "city": getShipNowList?.orderData?.[0]?.CITY_NAME,
                                    "commodity_value": "",
                                    "weight": (data.chargableWeight * 1000),
                                    "return_state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                    "document_number": "",
                                    "od_distance": "",
                                    "sales_tax_form_ack_no": "",
                                    "document_type": "",
                                    "seller_cst": "",
                                    "seller_name": "",
                                    "fragile_shipment": "true",
                                    "return_city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                    "return_phone": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                    // QC (Quality Check) - Required only for RVP packages
                                    // "qc": {
                                    //     "item": [
                                    //         {
                                    //             "images": "img1-static image url",
                                    //             "color": "Color of the product",
                                    //             "reason": "Damaged Product/Return reason of the product",
                                    //             "descr": "description of the product",
                                    //             "ean": "EAN no. that needs to be checked for a product (apparels)",
                                    //             "imei": "IMEI no. that needs to be checked for a product (mobile phones)",
                                    //             "brand": "Brand of the product",
                                    //             "pcat": "Product category like mobile, apparels etc.",
                                    //             "si": "special instruction for FE",
                                    //             "item_quantity": 2
                                    //         }
                                    //     ]
                                    // },
                                    "shipment_height": getShipNowList?.orderData?.[0]?.HEIGHT,
                                    "shipment_width": getShipNowList?.orderData?.[0]?.WIDTH,
                                    "shipment_length": getShipNowList?.orderData?.[0]?.LENGTH,
                                    "category_of_goods": "",
                                    "cod_amount": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 0 : parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                    "return_country": getShipNowList?.orderData?.[0]?.COUNTRY_NAME,
                                    "document_date": "", // Required for ewaybill if applicable
                                    "taxable_amount": "", // Required for ewaybill if applicable
                                    "products_desc": "", // Required for ewaybill if applicable
                                    "state": getShipNowList?.orderData?.[0]?.STATE_NAME,
                                    "dangerous_good": "False", // Specify true if applicable
                                    "waybill": "",
                                    "consignee_tin": "",
                                    "order_date": formatInvoiceDate(getShipNowList?.orderData?.[0]?.ORDER_DATE),
                                    "return_add": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                    "total_amount": parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                    "seller_add": "",
                                    "country": "IN",
                                    "return_pin": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE,
                                    // "extra_parameters": {
                                    //     "return_reason": "string"
                                    // },
                                    "return_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                    "supply_sub_type": "", // Required for ewaybill if applicable
                                    "plastic_packaging": "true/false",
                                    "quantity": "" // Optional field
                                }
                            ],
                            "pickup_location": {
                                "name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                "pin": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE,
                                "country": getShipNowList?.orderData?.[0]?.COUNTRY_NAME,
                                "phone": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                "add": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS
                            }
                        }


                        mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, (error, getBalance) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get wallet."
                                });
                            }
                            else {
                                if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                    const pickup_location = orderData.pickup_location;
                                    mm.executeQueryData(`select DELHIVERY_CLIENT_ID from view_address_master where CONTACT_PERSON = ? AND CITY_NAME = ? AND PINCODE = ?`, [pickup_location.name, pickup_location.city, pickup_location.pin], supportKey, async (error, getAddressDetails) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update wallet."
                                            });
                                        }
                                        else {
                                            if (getAddressDetails.length > 0) {
                                                // orderData.shipments[0].client = getAddressDetails[0].DELHIVERY_CLIENT_ID;
                                                const options = {
                                                    url: process.env.DELHIVERY_ORDER_MANIFEST,
                                                    method: 'POST',
                                                    headers: {
                                                        "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                                        'Content-Type': 'application/json',
                                                        "Cookie": "sessionid=ze4ncds5tobeyynmbb1u0l6ccbpsmggx; sessionid=ze4ncds5tobeyynmbb1u0l6ccbpsmggx"
                                                    },
                                                    body: `format=json&data=` + JSON.stringify(orderData)
                                                };

                                                request(options, (error, response, body) => {
                                                    if (error) {
                                                        console.log("Error creating order:", error);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "wrong with delhivery server"
                                                        })
                                                    }
                                                    else {
                                                        body = JSON.parse(body);
                                                        if (body.success) {
                                                            if (body.packages[0].client != ' ' && body.packages[0].client) {
                                                                const connection = mm.openConnection();
                                                                let awbNo = body.packages[0].waybill;
                                                                mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ? `, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        mm.rollbackConnection(connection);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to update wallet."
                                                                        });
                                                                    }
                                                                    else {
                                                                        var stringData = JSON.stringify(body)
                                                                        mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?, CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                mm.rollbackConnection(connection);
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "Failed to update order."
                                                                                });
                                                                            }
                                                                            else {
                                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                        mm.rollbackConnection(connection);
                                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                        res.send({
                                                                                            "code": 400,
                                                                                            "message": "Failed to transaction_master order."
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        mm.executeDML(`select ID from delhivery_pickup_schedule where PICKUP_ADDRESS = ? AND date(CREATED_DATETIME) = CURRENT_DATE AND CUSTOMER_ID = ? AND STATUS = 'P'`, [getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON, customerId], supportKey, connection, (error, getScheduleData) => {
                                                                                            if (error) {
                                                                                                console.log(error);
                                                                                                mm.rollbackConnection(connection);
                                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                res.send({
                                                                                                    "code": 400,
                                                                                                    "message": "Failed to get delhivery schedule orders."
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                let queryForScheduleData = ''
                                                                                                let queryDataForScheduleData = []
                                                                                                if (getScheduleData.length > 0) {
                                                                                                    queryForScheduleData = `update delhivery_pickup_schedule SET PACKAGE_COUNT = PACKAGE_COUNT + 1 where ID = ? `;
                                                                                                    queryDataForScheduleData = [getScheduleData[0].ID]
                                                                                                }
                                                                                                else {
                                                                                                    queryForScheduleData = `insert into delhivery_pickup_schedule(PICKUP_DATETIME, PICKUP_ADDRESS, PACKAGE_COUNT, CUSTOMER_ID, CREATED_MODIFIED_DATE, STATUS, CREATED_DATETIME) values(?, ?, ?, ?, ?, 'P',?)`;
                                                                                                    queryDataForScheduleData = [null, getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON, 1, customerId, systemDate, systemDate]
                                                                                                }

                                                                                                mm.executeDML(queryForScheduleData, queryDataForScheduleData, supportKey, connection, (error, insertScheduleData) => {
                                                                                                    if (error) {
                                                                                                        console.log(error);
                                                                                                        mm.rollbackConnection(connection);
                                                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                        res.send({
                                                                                                            "code": 400,
                                                                                                            "message": "Failed to maintain delhivery schedule orders."
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        const date = new Date(systemDate.split(' ')[0]);
                                                                                                        const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                                                        const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                                                        const titleData = '📦 Shipment Created.';
                                                                                                        const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using Delhivery for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                                                        notification.sendNotification(titleData, bodyData, 0, customerId)
                                                                                                        mm.commitConnection(connection)
                                                                                                        setTimeout(() => {
                                                                                                            wp.sendOrderPlacedMessage(orderId)
                                                                                                        }, 3000);
                                                                                                        res.send({
                                                                                                            "code": 200,
                                                                                                            "message": "success",
                                                                                                            "AWB_NO": awbNo
                                                                                                        })
                                                                                                    }
                                                                                                })
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                res.send({
                                                                    "code": 308,
                                                                    "message": "Something went wrong.",
                                                                })
                                                            }
                                                        }
                                                        else {
                                                            console.log("body", body.packages[0].remarks[0]);
                                                            res.send({
                                                                "code": 308,
                                                                "message": "Something went wrong.",
                                                            })
                                                        }
                                                    }
                                                });
                                            }
                                            else {
                                                res.send({
                                                    "code": 400,
                                                    "message": "DELHIVERY_CLIENT_ID not found"
                                                })
                                            }
                                        }
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 307,
                                        "message": "Insufficient wallet Amount"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "order not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.trackShipment = (req, res) => {

    let orderId = req.body.ORDER_ID;
    var supportKey = req.headers['supportKey']
    try {
        if (orderId && orderId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? `, orderId, supportKey, async (error, checkAWO) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    if (checkAWO.length > 0) {
                        const bodyData = {
                            "trkType": "cnno",
                            "strcnno": checkAWO[0].AWB_NO,
                            "addtnlDtl": "Y"
                        }
                        const loginToken = await axios.get(`https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate?username=${process.env.DTDC_TRACKING_USERNAME}&password=${process.env.DTDC_TRACKING_PASSWORD}`);


                        const response = loginToken ? await axios.post(`${process.env.DTDC_TRACKING_URL}`, bodyData, {
                            headers: {
                                "X-Access-Token": loginToken.data,
                                'Content-Type': "application/json"
                            },
                        }) : null;

                        if (response.data.statusFlag == true && response.data.statusCode == 200) {
                            mm.executeQueryData(`select * from transaction_master where ORDER_ID = ?`, orderId, supportKey, (error, getTransactionDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to get transaction details"
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "data": response.data,
                                        "orderData": checkAWO,
                                        "transactionData": getTransactionDetails
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "Something went wrong"
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "AWB not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.cancelDelhiveryOrder = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var CANCEL_REMARK = req.body.CANCEL_REMARK;

    try {
        if (orderId && orderId != ' ' && CANCEL_REMARK && CANCEL_REMARK != ' ') {
            mm.executeQueryData(`select AWB_NO, PAID_AMOUNT, ORDER_AMOUNT, CUSTOMER_ID from order_master where ID = ? AND ORDER_STATUS IN('S', 'PA', 'PS', 'PR', 'NP')`, orderId, supportKey, async (error, getAwb) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get wallet."
                    });
                }
                else {
                    if (getAwb.length > 0 && getAwb[0].AWB_NO) {

                        const bodyData = {
                            "waybill": getAwb[0].AWB_NO,
                            "cancellation": "true"
                        }

                        const response = await axios.post(process.env.DELHIVERY_CANCEL_ORDER_API, bodyData, {
                            headers: {
                                "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                'Content-Type': "application/json"
                            },
                        });

                        if (response.data.status) {
                            const connection = mm.openConnection();
                            var stringData = JSON.stringify(response.data)
                            mm.executeDML(`update order_master set CANCEL_REMARK = ?, CANCEL_DATETIME = ?, IS_SHIPPED = 1, ORDER_STATUS = 'C', CANCEL_DATA = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [CANCEL_REMARK, systemDate, stringData, systemDate, orderId], supportKey, connection, (error, cancelOrder) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to cancel order."
                                    });
                                }
                                else {
                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getAwb[0].CUSTOMER_ID, 'O', getAwb[0].ORDER_AMOUNT, 'C', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to insert transaction."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?) where CUSTOMER_ID = ? `, [getAwb[0].ORDER_AMOUNT, getAwb[0].CUSTOMER_ID], supportKey, connection, (error, cancelOrder) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to cancel order."
                                                    });
                                                }
                                                else {

                                                    const date = new Date(systemDate.split(' ')[0]);
                                                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                    const formattedDate = date.toLocaleDateString('en-GB', options);
                                                    const titleData = '📦 Shipment Cancelled.';
                                                    const bodyData = `Shipment with AWB No. ${getAwb[0].AWB_NO} has been cancelled successfully on ${formattedDate}.`
                                                    notification.sendNotification(titleData, bodyData, 0, getAwb[0].CUSTOMER_ID)
                                                    mm.commitConnection(connection)
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success"
                                                    })
                                                    setTimeout(() => {
                                                        wp.sendCancelShipmentMessage(orderId);
                                                    }, 3000);
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "failed.."
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "no order found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.trackDelhiveryShipment = async (req, res) => {

    let orderId = req.body.ORDER_ID;
    var supportKey = req.headers['supportKey']
    try {
        if (orderId && orderId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? `, orderId, supportKey, async (error, checkAWO) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    if (checkAWO.length > 0) {
                        const response = await axios.get(`https://track.delhivery.com/api/v1/packages/json?waybill=${checkAWO[0].AWB_NO}&token=${process.env.DELHIVERY_TOKEN}`);

                        if (response.data) {
                            mm.executeQueryData(`select * from transaction_master where ORDER_ID = ?`, orderId, supportKey, (error, getTransactionDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to get transaction details"
                                    })
                                }
                                else {

                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "data": response.data.ShipmentData ? response.data.ShipmentData[0].Shipment : null,
                                        "orderData": checkAWO,
                                        "transactionData": getTransactionDetails
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "Something went wrong"
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "AWB not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.shipnowOrderForEkart = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT ? req.body.ORDER_AMOUNT : 0;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;
    var tendigitrandomnumber = Math.floor(1000000000 + Math.random() * 9000000000);

    try {
        if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {

            mm.executeQueryData(`select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, async (error, getOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order."
                    });
                }
                else {
                    if (getOrder.length > 0) {
                        let getOrderDetails = getOrder
                        let getShipNowList = {
                            "orderData": getOrderDetails
                        }
                        let data = await calculateUniversalRateForWeightDescripancy(supportKey, getOrderDetails[0].DEAD_WEIGHT, getOrderDetails[0].CUSTOMER_ID, getOrderDetails[0].PICKUP_PINCODE_ID, getOrderDetails[0].PINCODE_ID, getOrderDetails[0].PAYMENT_MODE, productId, carrierId, serviceId, getOrderDetails[0].COD_AMOUNT, getOrderDetails[0].LENGTH, getOrderDetails[0].WIDTH, getOrderDetails[0].HEIGHT, getOrderDetails[0].ORDER_NO);
                        orderAmount = data.amount;
                        let record = {
                            "productData": data.productData
                        }
                        let productDetails = JSON.parse(getOrderDetails[0].PRODUCT_DETAILS);

                        orderData = {
                            "goods_category": "ESSENTIAL",
                            "services": [
                                {
                                    "service_code": "REGULAR",
                                    "service_details": [
                                        {
                                            "service_leg": "FORWARD",
                                            "service_data": {
                                                "service_types": [
                                                    {
                                                        "name": "regional_handover",
                                                        "value": "true"
                                                    },
                                                    {
                                                        "name": "delayed_dispatch",
                                                        "value": "false"
                                                    }
                                                ],
                                                "vendor_name": "Ekart",
                                                "amount_to_collect": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 0 : parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                "dispatch_date": formatDateToDispatchFormat(new Date()),
                                                "customer_promise_date": "",
                                                "delivery_type": "SMALL",
                                                "source": {
                                                    "address": {
                                                        "seller_id": "",
                                                        "address_id": "",
                                                        "first_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        "attn_name": "",
                                                        "address_line1": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                        "address_line2": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                        "pincode": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE.toString(),
                                                        "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                        "state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                        "alternate_contact_number": "",
                                                        "landmark": "",
                                                        "email_id": getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID
                                                    }
                                                    // "location_code": "ABC_del_01"
                                                },
                                                "destination": {
                                                    "address": {
                                                        "first_name": getShipNowList?.orderData?.[0]?.DELIVER_TO,
                                                        "address_line1": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                        "address_line2": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                        "pincode": getShipNowList?.orderData?.[0]?.PINCODE.toString(),
                                                        "city": getShipNowList?.orderData?.[0]?.CITY_NAME,
                                                        "state": getShipNowList?.orderData?.[0]?.STATE_NAME,
                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.MOBILE_NO,
                                                        "email_id": getShipNowList?.orderData?.[0]?.EMAIL_ID ? getShipNowList?.orderData?.[0]?.EMAIL_ID : ''
                                                    }
                                                },
                                                "return_location": {
                                                    "address": {
                                                        "first_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        "address_line1": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                        "address_line2": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                        "pincode": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE.toString(),
                                                        "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                        "state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                        "email_id": getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID
                                                    }
                                                }
                                            },
                                            "shipment": {
                                                // "client_reference_id":getShipNowList?.orderData?.[0]?.ORDER_NO,
                                                // "tracking_id": "SWIP1234567891",
                                                "shipment_value": parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                "shipment_dimensions": {
                                                    "length": {
                                                        "value": getShipNowList?.orderData?.[0]?.LENGTH,
                                                        "unit": 'CMS'
                                                    },
                                                    "breadth": {
                                                        "value": getShipNowList?.orderData?.[0].WIDTH,
                                                        "unit": 'CMS'
                                                    },
                                                    "height": {
                                                        "value": getShipNowList?.orderData?.[0]?.HEIGHT,
                                                        "unit": 'CMS'
                                                    },
                                                    "weight": {
                                                        "value": data.chargableWeight,
                                                        "unit": 'KG'
                                                    }
                                                },
                                                "return_label_desc_1": "",
                                                "return_label_desc_2": "",
                                                "shipment_items": productDetails?.map((product) => ({
                                                    "product_id": product?.ID,
                                                    "category": product?.PRODUCT_CATEGORY,
                                                    "product_title": product?.PRODUCT_NAME,
                                                    "quantity": product?.TOTAL_UNIT,
                                                    "cost": {
                                                        "total_sale_value": product?.PER_UNIT_PRICE * product?.TOTAL_UNIT,
                                                        "total_tax_value": 0,
                                                        "tax_breakup": {
                                                            "cgst": 0,
                                                            "sgst": 0,
                                                            "igst": 0
                                                        }
                                                    },
                                                    "seller_details": {
                                                        "seller_reg_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        "gstin_id": ""
                                                    },
                                                    "hsn": "",
                                                    "ern": "",
                                                    "discount": 0,
                                                    "item_attributes": [
                                                        {
                                                            "name": "order_id",
                                                            "value": getShipNowList?.orderData?.[0]?.ORDER_NO
                                                        },
                                                        {
                                                            "name": "invoice_id",
                                                            "value": getShipNowList?.orderData?.[0]?.ORDER_NO
                                                        },
                                                        {
                                                            "name": "item_dimensions",
                                                            "value": "l:b:h:w"
                                                        },
                                                        {
                                                            "name": "brand_name",
                                                            "value": ""
                                                        },
                                                        {
                                                            "name": "eway_bill_number",
                                                            "value": ""
                                                        }
                                                    ],
                                                    "handling_attributes": [
                                                        {
                                                            "name": "isFragile",
                                                            "value": "false"
                                                        },
                                                        {
                                                            "name": "isDangerous",
                                                            "value": "false"
                                                        }
                                                    ]
                                                }))
                                            }
                                        }
                                    ]
                                }
                            ]
                        }

                        orderData.services[0].service_details[0].shipment.tracking_id = process.env.EKART_MERCHANT_CODE + (getOrder[0].PAYMENT_MODE == 'P' ? `P` : 'C') + tendigitrandomnumber;
                        orderData.services[0].service_details[0].shipment.client_reference_id = process.env.EKART_MERCHANT_CODE + (getOrder[0].PAYMENT_MODE == 'P' ? `P` : 'C') + tendigitrandomnumber;

                        mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, async (error, getBalance) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get wallet."
                                });
                            }
                            else {
                                if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                    orderData.client_name = process.env.EKART_MERCHANT_CODE;
                                    orderData = JSON.stringify(orderData)
                                    const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                        headers: {
                                            HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                            Authorization: process.env.EKART_AUTHORIZATION
                                        }
                                    })
                                    const options = {
                                        url: process.env.EKART_BASEURL + process.env.EKART_ORDER_CREATE,
                                        method: 'POST',
                                        headers: {
                                            HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                            Authorization: token.data.Authorization,
                                            "Content-Type": "application/json"
                                        },
                                        body: orderData
                                    };

                                    const request = require('request');
                                    request(options, (error, response, body) => {
                                        if (error) {
                                            console.log(error);
                                            console.log("Error creating order:", error);
                                            res.send({
                                                "code": 400,
                                                "message": "wrong with delhivery server"
                                            })
                                        }
                                        else {
                                            body = JSON.parse(body);
                                            console.log(body);

                                            if (body.response[0].status_code == 200) {
                                                const connection = mm.openConnection();
                                                let awbNo = body.response[0].tracking_id;
                                                mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ? `, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to update wallet."
                                                        });
                                                    }
                                                    else {
                                                        var stringData = JSON.stringify(body)
                                                        mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?, CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                            if (error) {
                                                                console.log(error);
                                                                mm.rollbackConnection(connection);
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to update order."
                                                                });
                                                            }
                                                            else {
                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        mm.rollbackConnection(connection);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to transaction_master order."
                                                                        });
                                                                    }
                                                                    else {
                                                                        const date = new Date(systemDate.split(' ')[0]);
                                                                        const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                        const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                        const titleData = '📦 Shipment Created.';
                                                                        const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using Ekart for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                        notification.sendNotification(titleData, bodyData, 0, customerId)
                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "success",
                                                                            "AWB_NO": awbNo
                                                                        })
                                                                        setTimeout(() => {
                                                                            wp.sendOrderPlacedMessage(orderId)
                                                                        }, 3000);
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                            else {
                                                res.send({
                                                    "code": 308,
                                                    "message": "Something went wrong.",
                                                    "error": body
                                                })
                                            }
                                        }
                                    });
                                }
                                else {
                                    res.send({
                                        "code": 307,
                                        "message": "Insufficient wallet Amount"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "order not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getAwbNo = (req, res) => {

    let customerId = req.body.CUSTOMER_ID;
    var supportKey = req.headers['supportKey']
    var filter = ` AND CUSTOMER_ID IN(${customerId})`
    try {
        if (customerId && customerId.length > 0) {
            mm.executeQueryData(`select ID, AWB_NO from order_master where 1 ` + filter, [], supportKey, (error, checkAWO) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": checkAWO
                    })
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.cancelEkartOrder = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var CANCEL_REMARK = req.body.CANCEL_REMARK;

    try {
        if (orderId && orderId != ' ' && CANCEL_REMARK && CANCEL_REMARK != ' ') {
            mm.executeQueryData(`select AWB_NO, PAID_AMOUNT, ORDER_AMOUNT, CUSTOMER_ID, COURIER_API_DATA from order_master where ID = ? AND ORDER_STATUS IN('S', 'PA', 'PS', 'PR', 'NP')`, orderId, supportKey, async (error, getAwb) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get wallet."
                    });
                }
                else {
                    if (getAwb.length > 0 && getAwb[0].AWB_NO) {
                        const jsonApiData = JSON.parse(getAwb[0].COURIER_API_DATA);

                        const bodyData = {
                            "request_id": jsonApiData.request_id,
                            "request_details": {
                                "tracking_id": getAwb[0].AWB_NO,
                                "reason": CANCEL_REMARK
                            }
                        }

                        const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                            headers: {
                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                Authorization: process.env.EKART_AUTHORIZATION
                            }
                        })

                        const response = await axios.put(process.env.EKART_BASEURL + process.env.EKART_ORDER_CANCEL, bodyData, {
                            headers: {
                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                Authorization: token.data.Authorization
                            },
                        });

                        if (response.data.response[0].status_code == 200) {
                            const connection = mm.openConnection();
                            var stringData = JSON.stringify(response.data)
                            mm.executeDML(`update order_master set CANCEL_REMARK = ?, CANCEL_DATETIME = ?, IS_SHIPPED = 1, ORDER_STATUS = 'C', CANCEL_DATA = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [CANCEL_REMARK, systemDate, stringData, systemDate, orderId], supportKey, connection, (error, cancelOrder) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to cancel order."
                                    });
                                }
                                else {
                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getAwb[0].CUSTOMER_ID, 'O', getAwb[0].ORDER_AMOUNT, 'C', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to insert transaction."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?) where CUSTOMER_ID = ? `, [getAwb[0].ORDER_AMOUNT, getAwb[0].CUSTOMER_ID], supportKey, connection, (error, cancelOrder) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to cancel order."
                                                    });
                                                }
                                                else {

                                                    const date = new Date(systemDate.split(' ')[0]);
                                                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                    const formattedDate = date.toLocaleDateString('en-GB', options);
                                                    const titleData = '📦 Shipment Cancelled.';
                                                    const bodyData = `Shipment with AWB No. ${getAwb[0].AWB_NO} has been cancelled successfully on ${formattedDate}.`
                                                    notification.sendNotification(titleData, bodyData, 0, getAwb[0].CUSTOMER_ID)
                                                    mm.commitConnection(connection)
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success"
                                                    })
                                                    setTimeout(() => {
                                                        wp.sendCancelShipmentMessage(orderId);
                                                    }, 3000);
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "failed.."
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "no order found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.trackEkartShipment = async (req, res) => {

    let orderId = req.body.ORDER_ID;
    var supportKey = req.headers['supportKey']
    try {
        if (orderId && orderId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? `, orderId, supportKey, async (error, checkAWO) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    if (checkAWO.length > 0) {
                        let data = JSON.parse(checkAWO[0].COURIER_API_DATA);
                        let bodyData = {
                            "request_id": data.request_id,
                            "tracking_ids": [
                                data.response[0].tracking_id
                            ]
                        }

                        const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                            headers: {
                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                Authorization: process.env.EKART_AUTHORIZATION
                            }
                        })

                        const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_TRACK, bodyData, {
                            headers: {
                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                Authorization: token.data.Authorization
                            },
                        });

                        if (response.data) {
                            mm.executeQueryData(`select * from transaction_master where ORDER_ID = ?`, orderId, supportKey, (error, getTransactionDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to get transaction details"
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "data": response.data,
                                        "orderData": checkAWO,
                                        "transactionData": getTransactionDetails
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 305,
                                "message": "Something went wrong"
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "AWB not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.getCodDetails = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    (req.body.IS_SHIPPED == 0 && req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND(ORDER_NO like '%${req.body.SEARCH_FILTER}%' OR CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR PICKUP_MOBILE_NO like '%${req.body.SEARCH_FILTER}%')` : '');

    (req.body.IS_SHIPPED == 1 && req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND(AWB_NO like '%${req.body.SEARCH_FILTER}%' OR CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR PICKUP_MOBILE_NO like '%${req.body.SEARCH_FILTER}%')` : '');

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '');
    (req.body.CARRIER_ID && (req.body.CARRIER_ID).length > 0 ? filter += ` AND CARRIER_ID IN(${req.body.CARRIER_ID})` : '');
    (req.body.ID && (req.body.ID).length > 0 ? filter += ` AND ID IN(${req.body.ID})` : '');
    (req.body.ORDER_STATUS && req.body.ORDER_STATUS != ' ' ? filter += ` AND ORDER_STATUS = '${req.body.ORDER_STATUS}'` : '');
    (req.body.PAYMENT_MODE && req.body.PAYMENT_MODE != ' ' ? filter += ` AND PAYMENT_MODE = '${req.body.PAYMENT_MODE}'` : '');
    (req.body.IS_SHIPPED == 1 || req.body.IS_SHIPPED == 0 ? filter += ` AND IS_SHIPPED = ${req.body.IS_SHIPPED}` : '');
    (req.body.IS_SHIPPED == 0 && req.body.ORDER_FROM_DATE && req.body.ORDER_FROM_DATE != ' ' && req.body.ORDER_TO_DATE && req.body.ORDER_TO_DATE != ' ' ? filter += ` AND date(ORDER_DATETIME) between '${req.body.ORDER_FROM_DATE}' AND '${req.body.ORDER_TO_DATE}' ` : '');
    (req.body.SHIPPING_FROM_DATE && req.body.SHIPPING_FROM_DATE != ' ' && req.body.SHIPPING_TO_DATE && req.body.SHIPPING_TO_DATE != ' ' ? filter += ` AND date(SHIPPING_DATETIME) between '${req.body.SHIPPING_FROM_DATE}' AND '${req.body.SHIPPING_TO_DATE}' ` : '');
    filter += ` AND PAYMENT_MODE = 'COD'`
    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];


    try {
        mm.executeQuery('select count(*) as cnt from ' + viewOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewOrderMaster count.",
                });
            }
            else {
                mm.executeQuery('select ID, AWB_NO, CUSTOMER_NAME, ORDER_NO, ORDER_DATETIME, MOBILE_NO, COD_AMOUNT, COD_PAID_AMOUNT, PAYOUT_TRANSACTION_ID, ORDER_STATUS_UPDATED_DATETIME, ORDER_STATUS, CUSTOMER_NAME, CUSTOMER_ID, PAYOUT_DATETIME, CARRIER_NAME from ' + viewOrderMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewOrderMaster information."
                        });
                    }
                    else {
                        const roundSize = Math.ceil(results1[0].cnt / pageSize);
                        res.send({
                            "code": 200,
                            "message": "success",
                            "pages": (pageIndex && pageSize ? roundSize : 1),
                            "count": results1[0].cnt,
                            "data": results
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.scheduleDelhiveryShipment = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const PICKUP_DATETIME = req.body.PICKUP_DATETIME,
        CUSTOMER_ID = req.body.CUSTOMER_ID,
        PICKUP_ADDRESS = req.body.PICKUP_ADDRESS,
        PACKAGE_COUNT = req.body.PACKAGE_COUNT,
        systemDate = mm.getSystemDate();
    try {
        if (PICKUP_DATETIME && PICKUP_DATETIME != ' ' && CUSTOMER_ID && CUSTOMER_ID != ' ' && PACKAGE_COUNT && PACKAGE_COUNT > 0 && PICKUP_ADDRESS && PICKUP_ADDRESS != ' ') {


            const bodyData = {
                "pickup_time": PICKUP_DATETIME.split(" ")[1],
                "pickup_date": PICKUP_DATETIME.split(" ")[0],
                "pickup_location": PICKUP_ADDRESS,
                "expected_package_count": PACKAGE_COUNT
            }
            const options = {
                url: process.env.DELHIVERY_PICKUP_SCHEDULE_RECORD,
                method: 'POST',
                headers: {
                    "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            };

            request(options, (error, response, body) => {
                if (error) {
                    console.log("Error creating order:", error);
                    res.send({
                        "code": 400,
                        "message": "wrong with delhivery server"
                    })
                }
                else {
                    body = JSON.parse(body);
                    if (body.pickup_date) {
                        const connection = mm.openConnection();
                        mm.executeDML(`insert into delhivery_pickup_schedule(PICKUP_DATETIME, PICKUP_ADDRESS, PACKAGE_COUNT, CUSTOMER_ID, CREATED_MODIFIED_DATE, DELHIVERY_PAYLOAD, STATUS, CREATED_DATETIME) values(?,?,?,?,?,?,'C',?)`, [PICKUP_DATETIME, PICKUP_ADDRESS, PACKAGE_COUNT, CUSTOMER_ID, systemDate, JSON.stringify(body), systemDate], supportKey, connection, (error, insertRecord) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to insert delhivery_pickup_schedule information.",
                                });
                            }
                            else {
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": "success"
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": body
                        })
                    }
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

async function calculateUniversalRateForWeightDescripancy(supportKey, DEAD_WEIGHT, CUSTOMER_ID, PICKUP_PINCODE_ID, PINCODE_ID, PAYMENT_MODE, PRODUCT_ID, CARRIER_ID, SERVICE_ID, COD_AMOUNT, LENGTH, WIDTH, HEIGHT, ORDER_NO) {

    var rateDetails = [];
    const systemDate = mm.getSystemDate();
    var ServicableProductIds = [];
    DEAD_WEIGHT = parseFloat(DEAD_WEIGHT);
    LENGTH = parseInt(LENGTH);
    WIDTH = parseInt(WIDTH);
    HEIGHT = parseInt(HEIGHT);

    return new Promise((resolve, reject) => {
        try {

            if (CUSTOMER_ID && CUSTOMER_ID != ' ' && PICKUP_PINCODE_ID && PICKUP_PINCODE_ID != ' ' && PINCODE_ID && PINCODE_ID != ' ' && DEAD_WEIGHT && DEAD_WEIGHT != ' ' && PRODUCT_ID && PRODUCT_ID != ' ') {

                const results = [
                    {
                        "CUSTOMER_ID": CUSTOMER_ID,
                        "PICKUP_PINCODE_ID": PICKUP_PINCODE_ID,
                        "PINCODE_ID": PINCODE_ID,
                        "DEAD_WEIGHT": DEAD_WEIGHT,
                        "LENGTH": LENGTH,
                        "WIDTH": WIDTH,
                        "HEIGHT": HEIGHT,
                        "ORDER_NO": ORDER_NO,
                        "PAYMENT_MODE": PAYMENT_MODE
                    }
                ]

                let getCodAmount = [
                    {
                        "COD_AMOUNT": COD_AMOUNT
                    }
                ]

                if (results.length > 0) {
                    const CUSTOMER_ID = results[0].CUSTOMER_ID;
                    const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                    const PINCODE_ID = results[0].PINCODE_ID;
                    const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                    const LENGTH = results[0].LENGTH;
                    const WIDTH = results[0].WIDTH;
                    const HEIGHT = results[0].HEIGHT;
                    const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                    mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID, PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            reject({
                                "code": 400,
                                "message": "Failed to get pincode information."
                            });
                        }
                        else {
                            const pickupPincodeData = getPincodeData[0];
                            const deliverPincodeData = getPincodeData[1];

                            if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                                var ZONE_ID = 0;
                                var query = ``;
                                var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                                var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                                var pickupStateZone = pickupPincodeData[0].STATE_ID;
                                var deliverStateZone = deliverPincodeData[0].STATE_ID;

                                var pickupLocalZone = pickupPincodeData[0].ID;
                                var deliverLocalZone = deliverPincodeData[0].ID;

                                var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                                var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                                var pickupPincode = pickupPincodeData[0].PINCODE;
                                var deliverPincode = deliverPincodeData[0].PINCODE;

                                mm.executeQueryData(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1 AND ID = ?; select ID from carrier_master where STATUS = 1 AND ID = ?`, [SERVICE_ID, CARRIER_ID], supportKey, async (error, getServiceData) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        reject({
                                            "code": 400,
                                            "message": "Failed to get service mapping information."
                                        });
                                    }
                                    else {
                                        let serviceList = []
                                        let apiCondition = 0;
                                        let apiCondition2 = 0;
                                        let apiCondition3 = 0;
                                        let apiCondition4 = 0;
                                        let zoneCondition = null;


                                        let loginData = JSON.stringify({
                                            "email": process.env.SHIPROCKET_EMAIL,
                                            "password": process.env.SHIPROCKET_PASSWORD
                                        });

                                        let config = {
                                            method: 'post',
                                            maxBodyLength: Infinity,
                                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            data: loginData
                                        };

                                        axios.request(config).then(async (shiprocketToken) => {
                                            let shiprocketPincodeData = JSON.stringify({
                                                "pickup_postcode": pickupPincode,
                                                "delivery_postcode": deliverPincode,
                                                "weight": DEAD_WEIGHT,
                                                "cod": CARRIER_ID == 6 && results[0].PAYMENT_MODE == 'COD' ? 1 : 0
                                            });
                                            let config2 = {
                                                method: 'get',
                                                maxBodyLength: Infinity,
                                                url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                                },
                                                data: shiprocketPincodeData
                                            };

                                            axios.request(config2)
                                                .then(async (shiprocketPincodeServicable) => {
                                                    if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                        (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))
                                                        for (let i = 0; i < getServiceData[1].length; i++) {
                                                            var carrierId = getServiceData[1][i].ID;


                                                            if (carrierId == 1) {
                                                                var pincodeData = {
                                                                    "orgPincode": pickupPincode + "",
                                                                    "desPincode": deliverPincode + ""
                                                                }
                                                                const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                                var message = response.data.ZIPCODE_RESP;
                                                                serviceList = response.data.SERV_LIST_DTLS;

                                                                results[0].PAYMENT_MODE == 'COD' ?

                                                                    (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO') ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                    :
                                                                    (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid") ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                            }



                                                            if (carrierId == 3) {
                                                                const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                                const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                                ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                            }

                                                            if (carrierId == 2) {
                                                                const bodyData = {
                                                                    "email": process.env.EXPRESSBEES_USERNAME,
                                                                    "password": process.env.EXPRESSBEES_PASSWORD
                                                                }

                                                                let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})

                                                                if (expressbeesToken.data.status == true) {
                                                                    const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                        "origin": pickupPincode,
                                                                        "destination": deliverPincode,
                                                                        "payment_type": "prepaid"
                                                                    }, {
                                                                        headers: {
                                                                            Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                        }
                                                                    });

                                                                    (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                                }
                                                                else {
                                                                    apiCondition3 = 1
                                                                }
                                                            }

                                                            if (carrierId == 4) {

                                                                const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                    headers: {
                                                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                        Authorization: process.env.EKART_AUTHORIZATION
                                                                    }
                                                                })

                                                                const bodyData = {
                                                                    "request_id": results[0].ORDER_NO,
                                                                    "service_type": "FORWARD",
                                                                    "dispatch_date": systemDate,
                                                                    "customer_pincode": deliverPincode,
                                                                    "seller_pincode": pickupPincode,
                                                                    "rto_pincode": pickupPincode,
                                                                    "rc_pincode": pickupPincode,
                                                                    "weight": volumetricWeight / 5000,
                                                                    "height": HEIGHT,
                                                                    "breadth": WIDTH,
                                                                    "length": LENGTH,
                                                                    "delivery_type": "SMALL",
                                                                    "is_dangerous": false,
                                                                    "is_fragile": false
                                                                }

                                                                const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                    headers: {
                                                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                        Authorization: token.data.Authorization
                                                                    }
                                                                });
                                                                (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                            }
                                                        }

                                                        const filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                            service.courier_name.toLowerCase().includes("blue")
                                                        );

                                                        if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                            async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                                let carrierId = data2.ID;


                                                                if (carrierId == 6) {
                                                                    serviceCondition = false
                                                                    mm.executeQueryData(`select LOGO_URL from carrier_master where ID = ? `, carrierId, supportKey, (error, getLogo) => {
                                                                        if (error) {
                                                                            callback1(error)
                                                                        }
                                                                        else {
                                                                            for (let i = 0; i < filteredCompanies.length; i++) {
                                                                                shiprocketAvailable = 1
                                                                                let commisionAmount = (40 / 100) * (filteredCompanies[i].rate);
                                                                                let codCommision = results[0].PAYMENT_MODE == 'COD' ? (2.36 / 100) * (getCodAmount[0].COD_AMOUNT) : 0;
                                                                                let finalAmount = filteredCompanies[i].rate + commisionAmount + codCommision;
                                                                                console.log("finalAmount", finalAmount);

                                                                                rateDetails.push({
                                                                                    "productData": [
                                                                                        {
                                                                                            "CARRIER_NAME": "Shiprocket",
                                                                                            "SERVICE_ID": filteredCompanies[i].courier_company_id,
                                                                                            "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                            "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                            "MODE": "Domestic",
                                                                                            "CARRIER_ID": carrierId,
                                                                                            "LOGO_URL": getLogo[0].LOGO_URL,
                                                                                            "ID": 0
                                                                                        }
                                                                                    ],
                                                                                    "amount": finalAmount,
                                                                                    "volumetricWeight": filteredCompanies[i].charge_weight,
                                                                                    "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                                })
                                                                            }
                                                                            callback1()
                                                                        }
                                                                    })
                                                                }




                                                                if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                    async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                        let serviceId = data.ID;
                                                                        let serviceName = data.SERVICE_NAME;
                                                                        let serviceCondition = true;
                                                                        let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;

                                                                        (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)

                                                                        if (serviceCondition) {
                                                                            let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND PRODUCT_ID <> 2 ';
                                                                            if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                                ZONE_ID = 5;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }
                                                                            if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                                ZONE_ID = 3;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                                ZONE_ID = 4;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                                ZONE_ID = 1;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                                ZONE_ID = 2;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            if (ZONE_ID > 0 && ZONE_ID <= 5) {

                                                                                // for (let i = 0; i < filteredCompanies.length; i++) {
                                                                                //     productData.push({
                                                                                //         "productData": [
                                                                                //             {
                                                                                //                 "CARRIER_NAME": "Blue Dart Express",
                                                                                //                 "SERVICE_ID": 0,
                                                                                //                 "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                //                 "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                //                 "MODE": "Domestic",
                                                                                //                 "CARRIER_ID": 6,
                                                                                //                 "LOGO_URL": "",
                                                                                //                 "ID": 0
                                                                                //             }
                                                                                //         ],
                                                                                //         "amount": filteredCompanies[i].rate,
                                                                                //         "volumetricWeight": 1,
                                                                                //         "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                                //     })
                                                                                // }


                                                                                mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId, CUSTOMER_ID], supportKey, (error, getProductData) => {
                                                                                    if (error) {
                                                                                        callback(error)
                                                                                    }
                                                                                    else {
                                                                                        if (getProductData.length > 0) {
                                                                                            let codAmount = 0;
                                                                                            if (results[0].PAYMENT_MODE == 'COD') {
                                                                                                let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                                codAmount = cod;
                                                                                            }
                                                                                            else {
                                                                                                codAmount = 0;
                                                                                            }

                                                                                            getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));
                                                                                            let conditionWeight = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            if (getProductData[0].ADD_WEIGHT == 0 || (conditionWeight <= getProductData[0].END_RANGE)) {
                                                                                                var amount = getProductData[0].ZONE_AMOUNT;
                                                                                                var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                                let productData = []
                                                                                                for (let i = 0; i < getProductData.length; i++) {
                                                                                                    ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                    productData.push({
                                                                                                        "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                        "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                        "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                        "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                        "MODE": getProductData[i].MODE,
                                                                                                        "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                        "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                        "ID": getProductData[i].PRODUCT_ID
                                                                                                    })
                                                                                                }
                                                                                                rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                callback();
                                                                                            }
                                                                                            else {
                                                                                                var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA));
                                                                                                var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                                var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                                var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;

                                                                                                let productData = []
                                                                                                for (let i = 0; i < getProductData.length; i++) {
                                                                                                    ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                    productData.push({
                                                                                                        "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                        "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                        "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                        "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                        "MODE": getProductData[i].MODE,
                                                                                                        "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                        "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                        "ID": getProductData[i].PRODUCT_ID
                                                                                                    })
                                                                                                }
                                                                                                rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                callback();
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            callback()
                                                                                        }
                                                                                    }
                                                                                })
                                                                            }
                                                                            else {
                                                                                callback()
                                                                            }
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    }, function subCb(error) {
                                                                        if (error) {
                                                                            callback1(error)
                                                                        }
                                                                        else {
                                                                            callback1()
                                                                        }
                                                                    });
                                                                }
                                                                else {
                                                                    callback1()
                                                                }
                                                            }, function subCb(error) {
                                                                if (error) {
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    reject(error);
                                                                }
                                                                else {
                                                                    resolve({
                                                                        "code": 200,
                                                                        "message": "success",
                                                                        "amount": rateDetails[0].amount,
                                                                        "chargableWeight": rateDetails[0].volumetricWeight,
                                                                        "productData": rateDetails[0].productData
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            reject({
                                                                "code": 306,
                                                                "message": "service or carrier data not found."
                                                            })
                                                        }
                                                    }
                                                    else {
                                                        reject({
                                                            "code": 308,
                                                            "message": "zone not found."
                                                        })
                                                    }
                                                })
                                                .catch((error) => {
                                                    console.log(error);
                                                    reject({
                                                        "code": 400,
                                                        "message": "Something went wrong"
                                                    })
                                                });
                                        }).catch((error) => {
                                            console.log(error);
                                            reject({
                                                "code": 400,
                                                "message": "something went wrpng."
                                            })
                                        });
                                    }
                                })
                            }
                            else {
                                reject({
                                    "code": 304,
                                    "message": "Pincode not deliverable."
                                })
                            }
                        }
                    })
                }
                else {

                    reject({
                        "code": 404,
                        "message": "Order not found."
                    })
                }
            }
            else {
                reject({
                    "code": 404,
                    "message": "Parameter Missing"
                });
            }
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            reject(error);
        }
    })
}

const formatInvoiceDate = (dateString) => {
    if (!dateString) return "";

    const dateObj = new Date(dateString.replace(" ", "T"));

    return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateToDispatchFormat = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

exports.shipBulkOrder = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        PRODUCT_ID = req.body.PRODUCT_ID,
        SERVICE_ID = req.body.SERVICE_ID,
        CARRIER_ID = req.body.CARRIER_ID,
        ORDER_ID = req.body.ORDER_ID && (req.body.ORDER_ID).length > 0 ? req.body.ORDER_ID : [];
    var orderNumbers = []
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && ORDER_ID && ORDER_ID.length > 0 && PRODUCT_ID && PRODUCT_ID != " " && SERVICE_ID && SERVICE_ID != ' ' && CARRIER_ID && CARRIER_ID != ' ') {
            async.eachSeries(ORDER_ID, function iteratorOverElems(orderId, callback) {
                mm.executeQueryData(`select * from view_order_master where ID = ? AND CUSTOMER_ID = ? AND ORDER_STATUS = 'P'`, [orderId, CUSTOMER_ID], supportKey, async (error, getOrderDetails) => {
                    if (error) {
                        console.log(error);
                        callback(error)
                    }
                    else {
                        if (getOrderDetails.length > 0) {
                            try {
                                let data = await calculateUniversalRateForWeightDescripancy(supportKey, getOrderDetails[0].DEAD_WEIGHT, getOrderDetails[0].CUSTOMER_ID, getOrderDetails[0].PICKUP_PINCODE_ID, getOrderDetails[0].PINCODE_ID, getOrderDetails[0].PAYMENT_MODE, PRODUCT_ID, CARRIER_ID, SERVICE_ID, getOrderDetails[0].COD_AMOUNT, getOrderDetails[0].LENGTH, getOrderDetails[0].WIDTH, getOrderDetails[0].HEIGHT, getOrderDetails[0].ORDER_NO);

                                if (data.code == 200) {
                                    let getShipNowList = {
                                        "orderData": getOrderDetails
                                    }

                                    let orderData = null;
                                    let record = {
                                        "productData": data.productData
                                    }
                                    let productDetails = JSON.parse(getOrderDetails[0].PRODUCT_DETAILS);
                                    let carrierId = CARRIER_ID;
                                    let endPoint = ''
                                    if (carrierId == 1) {
                                        endPoint = '/order/shipnowOrderForBulk'
                                        orderData = {
                                            consignments: [
                                                {
                                                    service_type_id: record?.productData[0]?.SERVICE_NAME,
                                                    load_type: 'NON-DOCUMENT',
                                                    // num_pieces: productDetails
                                                    // .map((item: any) =>  item.TOTAL_UNIT)
                                                    // .reduce((sum: number, amt: number) => sum + amt, 0),

                                                    description: productDetails[0]?.PRODUCT_NAME, ...(getShipNowList?.orderData?.[0]?.PAYMENT_MODE !== "P" ? {
                                                        cod_amount: productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0),
                                                        cod_collection_mode: "cash"
                                                    } : {}),
                                                    length: getShipNowList?.orderData?.[0]?.LENGTH,
                                                    width: getShipNowList?.orderData?.[0]?.WIDTH,
                                                    height: getShipNowList?.orderData?.[0]?.HEIGHT,
                                                    weight_unit: 'kg',
                                                    weight: data.chargableWeight,
                                                    declared_value: productDetails.map((item) => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0),
                                                    invoice_number: getShipNowList?.orderData?.[0].ORDER_NO,
                                                    invoice_date: formatInvoiceDate(getShipNowList?.orderData?.[0]?.ORDER_DATE),
                                                    commodity_id: productDetails[0]?.PRODUCT_NAME,
                                                    consignment_type: 'Forward',
                                                    origin_details: {
                                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME // PICKUP_STATE_NAME
                                                    },
                                                    destination_details: {
                                                        name: getShipNowList?.orderData?.[0]?.DELIVER_TO, //DELIVER_TO
                                                        alternate_phone: getShipNowList?.orderData?.[0]?.MOBILE_NO, //MOBILE_NO
                                                        phone: getShipNowList?.orderData?.[0]?.MOBILE_NO, //MOBILE_NO
                                                        address_line_1: getShipNowList?.orderData?.[0]?.ADDRESS, // ADDRESS
                                                        address_line_2: getShipNowList?.orderData?.[0]?.ADDRESS, //ADDRESS
                                                        pincode: getShipNowList?.orderData?.[0]?.PINCODE, //PINCODE
                                                        city: getShipNowList?.orderData?.[0]?.CITY_NAME, // CITY_NAME
                                                        state: getShipNowList?.orderData?.[0]?.STATE_NAME // STATE_NAME
                                                    },
                                                    return_details: {
                                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME, // PICKUP_STATE_NAME
                                                        Country: 'India', // COUNTRY_NAME
                                                        email: getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID // PICKUP_EMAIL_ID
                                                    },
                                                    exceptional_return_details: {
                                                        name: getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                        phone: getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                        alternate_phone: getShipNowList?.orderData?.[0]?.PICKUP_ALT_MOBILE_NO,
                                                        address_line_1: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        address_line_2: getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS, //PICKUP_ADDRESS
                                                        pincode: getShipNowList?.orderData?.[0]?.PICKUP_PINCODE, // PICKUP_PINCODE
                                                        city: getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME, // PICKUP_CITY_NAME
                                                        state: getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME, // PICKUP_STATE_NAME
                                                        Country: 'India', // COUNTRY_NAME
                                                        email: getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID // PICKUP_EMAIL_ID
                                                    },
                                                    pieces_detail: productDetails.map((product) => ({
                                                        description: product?.PRODUCT_NAME,
                                                        declared_value: product?.PER_UNIT_PRICE * product?.TOTAL_UNIT,
                                                        weight: 0,
                                                        height: 0,
                                                        length: 0,
                                                        width: 0
                                                    }))
                                                }
                                            ]
                                        }
                                    }
                                    else if (carrierId == 2) {
                                        endPoint = '/order/shipnowOrderExpressbeesForBulk'
                                        orderData = {
                                            "order_number": getShipNowList?.orderData?.[0]?.ORDER_NO,
                                            "unique_order_number": "yes",
                                            // "shipping_charges": 40,
                                            // "discount": 100,
                                            // "cod_charges": (getShipNowList?.orderData?.[0]?.PAYMENT_MODE == 'COD' ? shipmentAmount : 0),
                                            "payment_type": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? "prepaid" : 'cod',
                                            "order_amount": productDetails.map((item) => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0),
                                            //  "order_amount":getShipNowList?.orderData?.[0]?.PAYMENT_MODE=="P" ? getShipNowList?.orderData?.[0]?.ORDER_AMOUNT:orderProduct?.[0]?.PAID_AMOUNT-orderProduct?.[0]?.ORDER_AMOUNT,
                                            "package_weight": data.chargableWeight * 1000,
                                            "package_length": parseFloat(getShipNowList?.orderData?.[0]?.LENGTH),
                                            // "package_breadth": 10,
                                            "package_height": parseFloat(getShipNowList?.orderData?.[0]?.HEIGHT),
                                            "request_auto_pickup": "yes",
                                            "consignee": {
                                                "name": getShipNowList?.orderData?.[0]?.DELIVER_TO,
                                                "address": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                "address_2": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                "city": getShipNowList?.orderData?.[0]?.CITY_NAME,
                                                "state": getShipNowList?.orderData?.[0]?.STATE_NAME,
                                                "pincode": getShipNowList?.orderData?.[0]?.PINCODE,
                                                "phone": getShipNowList?.orderData?.[0]?.MOBILE_NO
                                            },
                                            "pickup": {
                                                "warehouse_name": "warehouse 1",
                                                "name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                "address": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                "address_2": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                "state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                "pincode": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE,
                                                "phone": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO
                                            },
                                            "order_items": productDetails?.map((product) => ({
                                                "name": product.PRODUCT_NAME,
                                                "qty": product.TOTAL_UNIT,
                                                'sku': 'N/A',
                                                'price': product.TOTAL_UNIT * product?.PER_UNIT_PRICE
                                            })),
                                            "courier_id": record?.productData[0]?.XPRESSBEES_ID,
                                            // calculate collectable amount for COD orders
                                            "collectable_amount": getShipNowList?.orderData?.[0]?.PAYMENT_MODE !== "P" ? productDetails.map((item) => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0) : 0,
                                            // "collectable_amount": productDetails?
                                        }
                                    }
                                    else if (carrierId == 3) {
                                        endPoint = '/order/shipnowOrderForDelhiveryWithBulk'
                                        orderData = {
                                            "shipments": [
                                                {
                                                    "add": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                    "phone": getShipNowList?.orderData?.[0]?.MOBILE_NO,
                                                    "payment_mode": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 'Prepaid' : 'COD',
                                                    "name": getShipNowList?.orderData?.[0]?.DELIVER_TO,
                                                    "pin": getShipNowList?.orderData?.[0]?.PINCODE,
                                                    "order": getShipNowList?.orderData?.[0]?.ORDER_NO,
                                                    // Ewaybill-related fields (Required for intra-state shipments)
                                                    "consignee_gst_amount": "", // Required for ewaybill
                                                    "integrated_gst_amount": "", // Required for ewaybill
                                                    "ewbn": "", // Required if total package amount >= 50k
                                                    "consignee_gst_tin": "",
                                                    "seller_gst_tin": "",
                                                    "client_gst_tin": "",
                                                    "hsn_code": "", // Required for ewaybill
                                                    "gst_cess_amount": "", // Required for ewaybill
                                                    "shipping_mode": record?.productData[0]?.SERVICE_NAME,
                                                    // Optional fields (use only if needed)
                                                    "client": "client-name-as-registered-with-delhivery",
                                                    "tax_value": "",
                                                    "seller_tin": "",
                                                    "seller_gst_amount": "",
                                                    "seller_inv": "",
                                                    "city": getShipNowList?.orderData?.[0]?.CITY_NAME,
                                                    "commodity_value": "",
                                                    "weight": (data.chargableWeight * 1000),
                                                    "return_state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                    "document_number": "", // Required for ewaybill if applicable
                                                    "od_distance": "", // Distance between origin and destination
                                                    "sales_tax_form_ack_no": "",
                                                    "document_type": "", // Required for ewaybill if applicable
                                                    "seller_cst": "",
                                                    "seller_name": "",
                                                    "fragile_shipment": "true", // Set to "true" if fragile
                                                    "return_city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                    "return_phone": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                    // QC (Quality Check) - Required only for RVP packages
                                                    // "qc": {
                                                    //     "item": [
                                                    //         {
                                                    //             "images": "img1-static image url",
                                                    //             "color": "Color of the product",
                                                    //             "reason": "Damaged Product/Return reason of the product",
                                                    //             "descr": "description of the product",
                                                    //             "ean": "EAN no. that needs to be checked for a product (apparels)",
                                                    //             "imei": "IMEI no. that needs to be checked for a product (mobile phones)",
                                                    //             "brand": "Brand of the product",
                                                    //             "pcat": "Product category like mobile, apparels etc.",
                                                    //             "si": "special instruction for FE",
                                                    //             "item_quantity": 2
                                                    //         }
                                                    //     ]
                                                    // },
                                                    "shipment_height": getShipNowList?.orderData?.[0]?.HEIGHT,
                                                    "shipment_width": getShipNowList?.orderData?.[0]?.WIDTH,
                                                    "shipment_length": getShipNowList?.orderData?.[0]?.LENGTH,
                                                    "category_of_goods": "",
                                                    "cod_amount": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 0 : parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                    "return_country": getShipNowList?.orderData?.[0]?.COUNTRY_NAME,
                                                    "document_date": "", // Required for ewaybill if applicable
                                                    "taxable_amount": "", // Required for ewaybill if applicable
                                                    "products_desc": "", // Required for ewaybill if applicable
                                                    "state": getShipNowList?.orderData?.[0]?.STATE_NAME,
                                                    "dangerous_good": "True/False", // Specify true if applicable
                                                    "waybill": "",
                                                    "consignee_tin": "",
                                                    "order_date": formatInvoiceDate(getShipNowList?.orderData?.[0]?.ORDER_DATE),
                                                    "return_add": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                    "total_amount": parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                    "seller_add": "",
                                                    "country": "IN",
                                                    "return_pin": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE,
                                                    "extra_parameters": {
                                                        "return_reason": "string"
                                                    },
                                                    "return_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                    "supply_sub_type": "", // Required for ewaybill if applicable
                                                    "plastic_packaging": "true/false",
                                                    "quantity": "" // Optional field
                                                }
                                            ],
                                            "pickup_location": {
                                                "name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                "pin": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE,
                                                "country": getShipNowList?.orderData?.[0]?.COUNTRY_NAME,
                                                "phone": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                "add": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS
                                            }
                                        }
                                    }
                                    else if (carrierId == 4) {
                                        endPoint = '/order/shipnowOrderForEkartForBulk'
                                        orderData = {
                                            "goods_category": "ESSENTIAL",
                                            "services": [
                                                {
                                                    "service_code": "REGULAR",
                                                    "service_details": [
                                                        {
                                                            "service_leg": "FORWARD",
                                                            "service_data": {
                                                                "service_types": [
                                                                    {
                                                                        "name": "regional_handover",
                                                                        "value": "true"
                                                                    },
                                                                    {
                                                                        "name": "delayed_dispatch",
                                                                        "value": "false"
                                                                    }
                                                                ],
                                                                "vendor_name": "Ekart",
                                                                "amount_to_collect": getShipNowList?.orderData?.[0]?.PAYMENT_MODE == "P" ? 0 : parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                                "dispatch_date": formatDateToDispatchFormat(new Date()),
                                                                "customer_promise_date": "",
                                                                "delivery_type": "SMALL",
                                                                "source": {
                                                                    "address": {
                                                                        "seller_id": "",
                                                                        "address_id": "",
                                                                        "first_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                                        "attn_name": "",
                                                                        "address_line1": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                                        "address_line2": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                                        "pincode": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE.toString(),
                                                                        "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                                        "state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                                        "alternate_contact_number": "",
                                                                        "landmark": "",
                                                                        "email_id": getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID
                                                                    }
                                                                    // "location_code": "ABC_del_01"
                                                                },
                                                                "destination": {
                                                                    "address": {
                                                                        "first_name": getShipNowList?.orderData?.[0]?.DELIVER_TO,
                                                                        "address_line1": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                                        "address_line2": getShipNowList?.orderData?.[0]?.ADDRESS,
                                                                        "pincode": getShipNowList?.orderData?.[0]?.PINCODE.toString(),
                                                                        "city": getShipNowList?.orderData?.[0]?.CITY_NAME,
                                                                        "state": getShipNowList?.orderData?.[0]?.STATE_NAME,
                                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.MOBILE_NO,
                                                                        "email_id": getShipNowList?.orderData?.[0]?.EMAIL_ID ? getShipNowList?.orderData?.[0]?.EMAIL_ID : ''
                                                                    }
                                                                },
                                                                "return_location": {
                                                                    "address": {
                                                                        "first_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                                        "address_line1": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                                        "address_line2": getShipNowList?.orderData?.[0]?.PICKUP_ADDRESS,
                                                                        "pincode": getShipNowList?.orderData?.[0]?.PICKUP_PINCODE.toString(),
                                                                        "city": getShipNowList?.orderData?.[0]?.PICKUP_CITY_NAME,
                                                                        "state": getShipNowList?.orderData?.[0]?.PICKUP_STATE_NAME,
                                                                        "primary_contact_number": getShipNowList?.orderData?.[0]?.PICKUP_MOBILE_NO,
                                                                        "email_id": getShipNowList?.orderData?.[0]?.PICKUP_EMAIL_ID
                                                                    }
                                                                }
                                                            },
                                                            "shipment": {
                                                                // "client_reference_id":getShipNowList?.orderData?.[0]?.ORDER_NO,
                                                                // "tracking_id": "SWIP1234567891",
                                                                "shipment_value": parseFloat(productDetails.map(item => item.PER_UNIT_PRICE * item.TOTAL_UNIT).reduce((sum, amt) => sum + amt, 0)),
                                                                "shipment_dimensions": {
                                                                    "length": {
                                                                        "value": getShipNowList?.orderData?.[0]?.LENGTH,
                                                                        "unit": 'CMS'
                                                                    },
                                                                    "breadth": {
                                                                        "value": getShipNowList?.orderData?.[0].WIDTH,
                                                                        "unit": 'CMS'
                                                                    },
                                                                    "height": {
                                                                        "value": getShipNowList?.orderData?.[0]?.HEIGHT,
                                                                        "unit": 'CMS'
                                                                    },
                                                                    "weight": {
                                                                        "value": data.chargableWeight,
                                                                        "unit": 'KG'
                                                                    }
                                                                },
                                                                "return_label_desc_1": "",
                                                                "return_label_desc_2": "",
                                                                "shipment_items":
                                                                    productDetails?.map((product) => ({
                                                                        "product_id": product?.ID,
                                                                        "category": product?.PRODUCT_CATEGORY,
                                                                        "product_title": product?.PRODUCT_NAME,
                                                                        "quantity": product?.TOTAL_UNIT,
                                                                        "cost": {
                                                                            "total_sale_value": product?.PER_UNIT_PRICE * product?.TOTAL_UNIT,
                                                                            "total_tax_value": 0,
                                                                            "tax_breakup": {
                                                                                "cgst": 0,
                                                                                "sgst": 0,
                                                                                "igst": 0
                                                                            }
                                                                        },
                                                                        "seller_details": {
                                                                            "seller_reg_name": getShipNowList?.orderData?.[0]?.PICKUP_CONTACT_PERSON,
                                                                            "gstin_id": ""
                                                                        },
                                                                        "hsn": "",
                                                                        "ern": "",
                                                                        "discount": 0,
                                                                        "item_attributes": [
                                                                            {
                                                                                "name": "order_id",
                                                                                "value": getShipNowList?.orderData?.[0]?.ORDER_NO
                                                                            },
                                                                            {
                                                                                "name": "invoice_id",
                                                                                "value": getShipNowList?.orderData?.[0]?.ORDER_NO
                                                                            },
                                                                            {
                                                                                "name": "item_dimensions",
                                                                                "value": "l:b:h:w"
                                                                            },
                                                                            {
                                                                                "name": "brand_name",
                                                                                "value": ""
                                                                            },
                                                                            {
                                                                                "name": "eway_bill_number",
                                                                                "value": ""
                                                                            }
                                                                        ],
                                                                        "handling_attributes": [
                                                                            {
                                                                                "name": "isFragile",
                                                                                "value": "false"
                                                                            },
                                                                            {
                                                                                "name": "isDangerous",
                                                                                "value": "false"
                                                                            }
                                                                        ]
                                                                    }))

                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                    else {
                                        orderNumbers.push(getOrderDetails[0].ORDER_NO)
                                        callback()
                                    }
                                    let bodyData = {
                                        "ORDER_ID": orderId,
                                        "CUSTOMER_ID": CUSTOMER_ID,
                                        "ORDER_AMOUNT": data.amount,
                                        "APPLICABLE_WEIGHT": data.chargableWeight,
                                        "SERVICE_ID": SERVICE_ID,
                                        "CARRIER_ID": carrierId,
                                        "PRODUCT_ID": PRODUCT_ID,
                                        "orderData": orderData,
                                        "BULK_SHIPMENT_SECRET": process.env.BULK_SHIPMENT_SECRET
                                    }
                                    let response = await axios.post(process.env.BULK_ORDER_BASEURL + endPoint, bodyData, {
                                        headers: {
                                            "apikey": process.env.APIKEY,
                                            'Content-Type': "application/json"
                                        }
                                    })

                                    if (response.data.code == 200) {
                                        callback()
                                    }
                                    else {
                                        orderNumbers.push(getOrderDetails[0].ORDER_NO)
                                        callback()
                                    }
                                }
                                else {
                                    orderNumbers.push(getOrderDetails[0].ORDER_NO)
                                    callback()
                                }
                            } catch (error) {
                                console.log(error);
                                callback(error)
                            }
                        }
                        else {
                            callback()
                        }
                    }
                })
            }, function subCb(error) {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed..."
                    });
                }
                else {
                    res.send({
                        "code": orderNumbers.length > 0 && orderNumbers.length < ORDER_ID.length ? 400 : 200,
                        "message": orderNumbers.length > 0 && orderNumbers.length < ORDER_ID.length ? orderNumbers.toString() + " This orders is not placed.." : "success",
                    })
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.shipnowOrderForBulk = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;

    try {
        if (process.env.BULK_SHIPMENT_SECRET == req.body.BULK_SHIPMENT_SECRET) {
            if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {
                mm.executeQueryData(` select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, (error, getOrder) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get order."
                        });
                    }
                    else {
                        if (getOrder.length > 0) {
                            mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, async (error, getBalance) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get wallet."
                                    });
                                }
                                else {
                                    if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                        orderData.customer_code = process.env.DTDC_CUSTOMER_CODE;
                                        const response = await axios.post(process.env.DTDC_BASEURL + process.env.DTDC_ORDER_API, orderData, {
                                            headers: {
                                                "api-key": process.env.DTDC_API_KEY,
                                                'Content-Type': "application/json"
                                            },
                                        });

                                        if (response && response != ' ') {
                                            let awbNo = response.data.data[0].reference_number;
                                            if (response.data.data[0].reference_number != ' ' && response.data.data[0].reference_number) {
                                                const connection = mm.openConnection();
                                                mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to update wallet."
                                                        });
                                                    }
                                                    else {
                                                        var stringData = JSON.stringify(response.data)
                                                        mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?,CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                            if (error) {
                                                                console.log(error);
                                                                mm.rollbackConnection(connection);
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to update order."
                                                                });
                                                            }
                                                            else {
                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        mm.rollbackConnection(connection);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to transaction_master order."
                                                                        });
                                                                    }
                                                                    else {
                                                                        const date = new Date(systemDate.split(' ')[0]);
                                                                        const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                        const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                        const titleData = '📦 Shipment Created.';
                                                                        const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using DTDC for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                        notification.sendNotification(titleData, bodyData, 0, customerId)

                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "success",
                                                                            "AWB_NO": awbNo
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                            else {
                                                res.send({
                                                    "code": 308,
                                                    "message": "Something went wrong.",
                                                    "error": response.data
                                                })
                                            }
                                        }
                                    }
                                    else {
                                        res.send({
                                            "code": 307,
                                            "message": "Insufficient wallet Amount"
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "order not found"
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        }
        else {
            res.send({
                "code": 401,
                "message": "Unauthorised User.."
            })
        }

    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.shipnowOrderForDelhiveryWithBulk = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT ? req.body.ORDER_AMOUNT : 0;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;

    try {
        if (process.env.BULK_SHIPMENT_SECRET == req.body.BULK_SHIPMENT_SECRET) {
            if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {
                mm.executeQueryData(` select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, (error, getOrder) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get order."
                        });
                    }
                    else {
                        if (getOrder.length > 0) {
                            mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, (error, getBalance) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get wallet."
                                    });
                                }
                                else {
                                    if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                        const pickup_location = orderData.pickup_location;
                                        mm.executeQueryData(`select DELHIVERY_CLIENT_ID from view_address_master where CONTACT_PERSON = ? AND CITY_NAME = ? AND PINCODE = ?`, [pickup_location.name, pickup_location.city, pickup_location.pin], supportKey, async (error, getAddressDetails) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to update wallet."
                                                });
                                            }
                                            else {
                                                if (getAddressDetails.length > 0) {
                                                    orderData.shipments[0].client = getAddressDetails[0].DELHIVERY_CLIENT_ID;
                                                    const options = {
                                                        url: process.env.DELHIVERY_ORDER_MANIFEST,
                                                        method: 'POST',
                                                        headers: {
                                                            "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                                            'Content-Type': 'application/json',
                                                            "Cookie": "sessionid=ze4ncds5tobeyynmbb1u0l6ccbpsmggx; sessionid=ze4ncds5tobeyynmbb1u0l6ccbpsmggx"
                                                        },
                                                        body: `format=json&data=` + JSON.stringify(orderData)
                                                    };

                                                    request(options, (error, response, body) => {
                                                        if (error) {
                                                            console.log("Error creating order:", error);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "wrong with delhivery server"
                                                            })
                                                        }
                                                        else {
                                                            body = JSON.parse(body);
                                                            if (body.success) {
                                                                if (body.packages[0].client != ' ' && body.packages[0].client) {
                                                                    const connection = mm.openConnection();
                                                                    let awbNo = body.packages[0].waybill;
                                                                    mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ? `, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            mm.rollbackConnection(connection);
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "Failed to update wallet."
                                                                            });
                                                                        }
                                                                        else {
                                                                            var stringData = JSON.stringify(body)
                                                                            mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?, CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                                                if (error) {
                                                                                    console.log(error);
                                                                                    mm.rollbackConnection(connection);
                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                    res.send({
                                                                                        "code": 400,
                                                                                        "message": "Failed to update order."
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                                        if (error) {
                                                                                            console.log(error);
                                                                                            mm.rollbackConnection(connection);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "Failed to transaction_master order."
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            const date = new Date(systemDate.split(' ')[0]);
                                                                                            const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                                            const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                                            const titleData = '📦 Shipment Created.';
                                                                                            const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using Delhivery for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                                            notification.sendNotification(titleData, bodyData, 0, customerId);

                                                                                            mm.commitConnection(connection)
                                                                                            res.send({
                                                                                                "code": 200,
                                                                                                "message": "success",
                                                                                                "AWB_NO": awbNo
                                                                                            })
                                                                                        }
                                                                                    })
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                                else {
                                                                    res.send({
                                                                        "code": 308,
                                                                        "message": "Something went wrong.",
                                                                    })
                                                                }
                                                            }
                                                            else {
                                                                console.log("body", body);
                                                                res.send({
                                                                    "code": 308,
                                                                    "message": "Something went wrong.",
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                                else {
                                                    res.send({
                                                        "code": 400,
                                                        "message": "DELHIVERY_CLIENT_ID not found"
                                                    })
                                                }
                                            }
                                        })
                                    }
                                    else {
                                        res.send({
                                            "code": 307,
                                            "message": "Insufficient wallet Amount"
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 400,
                                "message": "order not found"
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        }
        else {
            res.send({
                "code": 401,
                "message": "Unauthorised User.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.shipnowOrderForEkartForBulk = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT ? req.body.ORDER_AMOUNT : 0;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var orderData = req.body.orderData;
    var tendigitrandomnumber = Math.floor(1000000000 + Math.random() * 9000000000);

    try {
        if (process.env.BULK_SHIPMENT_SECRET == req.body.BULK_SHIPMENT_SECRET) {
            if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ' && productId && productId != ' ') {

                mm.executeQueryData(` select * from from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, (error, getOrder) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get order."
                        });
                    }
                    else {
                        if (getOrder.length > 0) {
                            orderData.services[0].service_details[0].shipment.tracking_id = process.env.EKART_MERCHANT_CODE + (getOrder[0].PAYMENT_MODE == 'P' ? `P` : 'C') + tendigitrandomnumber;
                            orderData.services[0].service_details[0].shipment.client_reference_id = process.env.EKART_MERCHANT_CODE + (getOrder[0].PAYMENT_MODE == 'P' ? `P` : 'C') + tendigitrandomnumber;
                            mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, async (error, getBalance) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get wallet."
                                    });
                                }
                                else {
                                    if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                        orderData.client_name = process.env.EKART_MERCHANT_CODE;
                                        orderData = JSON.stringify(orderData)
                                        const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                            headers: {
                                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                Authorization: process.env.EKART_AUTHORIZATION
                                            }
                                        })
                                        const options = {
                                            url: process.env.EKART_BASEURL + process.env.EKART_ORDER_CREATE,
                                            method: 'POST',
                                            headers: {
                                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                Authorization: token.data.Authorization,
                                                "Content-Type": "application/json"
                                            },
                                            body: orderData
                                        };

                                        const request = require('request');
                                        request(options, (error, response, body) => {
                                            if (error) {
                                                console.log(error);
                                                console.log("Error creating order:", error);
                                                res.send({
                                                    "code": 400,
                                                    "message": "wrong with delhivery server"
                                                })
                                            }
                                            else {
                                                body = JSON.parse(body);
                                                console.log(body);

                                                if (body.response[0].status_code == 200) {
                                                    const connection = mm.openConnection();
                                                    let awbNo = body.response[0].tracking_id;
                                                    mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ? `, [orderAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                        if (error) {
                                                            console.log(error);
                                                            mm.rollbackConnection(connection);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to update wallet."
                                                            });
                                                        }
                                                        else {
                                                            var stringData = JSON.stringify(body)
                                                            mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?, CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, serviceId, carrierId, productId, orderAmount, applicableWeight, systemDate, orderId], supportKey, connection, (error, updateOrder) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection);
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to update order."
                                                                    });
                                                                }
                                                                else {
                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            mm.rollbackConnection(connection);
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "Failed to transaction_master order."
                                                                            });
                                                                        }
                                                                        else {
                                                                            const date = new Date(systemDate.split(' ')[0]);
                                                                            const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                            const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                            const titleData = '📦 Shipment Created.';
                                                                            const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using Ekart for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                            notification.sendNotification(titleData, bodyData, 0, customerId);

                                                                            mm.commitConnection(connection)
                                                                            res.send({
                                                                                "code": 200,
                                                                                "message": "success",
                                                                                "AWB_NO": awbNo
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    res.send({
                                                        "code": 308,
                                                        "message": "Something went wrong.",
                                                        "error": body
                                                    })
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        res.send({
                                            "code": 307,
                                            "message": "Insufficient wallet Amount"
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 400,
                                "message": "order not found"
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        }
        else {
            res.send({
                "code": 401,
                "message": "Unauthorised User.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.createOrderForShopify = (req, res) => {

    jwt.verify(req.headers.token, process.env.SECRET_KEY_FOR_SHOPIFY, (error) => {
        if (error) {
            return res.status(403).send({
                code: 403,
                message: "Wrong Token."
            });
        }
    
        
        const payload = req.body?.PAYLOAD;
        const shopName = req.body?.SHOP_NAME;
    
        if (!payload || !shopName) {
            return res.status(400).send({
                code: 400,
                message: "Invalid Shopify payload"
            });
        }
    
        const systemDate = mm.getSystemDate();
        const shopifyData = payload;            var data = {
                "ORDER_DATETIME": systemDate,
                "MOBILE_NO": shopifyData.shipping_address.phone ? (shopifyData.shipping_address.phone).replace(/^(\+91)/, "") : '',
                "DELIVER_TO": shopifyData.customer.first_name + ' ' + shopifyData.customer.last_name,
                "EMAIL_ID": shopifyData.customer.email,
                "ADDRESS": shopifyData.shipping_address.address1 + ', ' + shopifyData.shipping_address.address2,
                "LANDMARK": null,
                "PINCODE_ID": shopifyData.billing_address.zip,
                "PICKUP_ADDRESS": null,
                "PICKUP_CONTACT_PERSON": null,
                "PICKUP_MOBILE_NO": null,
                "PICKUP_EMAIL_ID": null,
                "PICKUP_ALT_MOBILE_NO": null,
                "PICKUP_LANDMARK": null,
                "PICKUP_PINCODE_ID": null,
                "DEAD_WEIGHT": shopifyData.total_weight / 1000,
                "LENGTH": 0,
                "WIDTH": 0,
                "HEIGHT": 0,
                "CREATED_MODIFIED_DATE": systemDate,
                "PAYMENT_MODE": null,
                "ORDER_AMOUNT": 0,
                "ORDER_STATUS": "P",
                "CUSTOMER_ID": null,
                "IS_SHIPPED": 0,
                "PAID_AMOUNT": 0,
                "COD_AMOUNT": 0,
                "COD_PAID_AMOUNT": 0,
                "C_ID": 0,
                "RTO_AMOUNT": 0
            };

            shopifyData.financial_status == 'pending' ? data.PAYMENT_MODE = "COD" : data.PAYMENT_MODE = "P";
            data.CREATED_MODIFIED_DATE = systemDate;
            data.ORDER_DATETIME = systemDate;
            const items = shopifyData.line_items;

            const orderDetails = [];

            for (let i = 0; i < items.length; i++) {
                let tax_lines = items[i].tax_lines;
                let taxAmt = 0;
                for (let j = 0; j < tax_lines.length; j++) {
                    taxAmt = taxAmt + parseFloat(tax_lines[j].price)
                }
                let rec = {
                    "PRODUCT_NAME": items[i].name,
                    "PER_UNIT_PRICE": parseFloat(items[i].price) + (taxAmt / parseFloat(items[i].current_quantity)),
                    "TOTAL_UNIT": parseFloat(items[i].current_quantity),
                    "PRODUCT_CATEGORY": items[i].title
                }
                orderDetails.push(rec)
            }


            var supportKey = req.headers["supportKey"];
            try {
                if (orderDetails.length > 0) {

                    mm.executeQueryData(`select CUSTOMER_ID from channel_customer_mapping where SHOP_NAME = ? AND STATUS = 1 AND IS_VERIFY = 1 AND ARCHIVE_FLAG = 0`, [shopName], supportKey, (error, getCustomerId) => {
                        if (error) {
                            console.log(error)
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to get customerId information..."
                            });
                        }
                        else {
                            if (getCustomerId.length > 0) {
                                data.CUSTOMER_ID = getCustomerId[0].CUSTOMER_ID;
                                data.ORDER_NO = shopifyData.order_number//'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];

                                if (data.PINCODE_ID && data.PINCODE_ID != ' ') {
                                    mm.executeQueryData(`select ID from pincode_master where PINCODE = ?`, data.PINCODE_ID, supportKey, (error, getPincodeId) => {
                                        if (error) {
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get pincode information..."
                                            });
                                        }
                                        else {
                                            if (getPincodeId.length > 0) {
                                                data.PINCODE_ID = getPincodeId[0].ID;
                                                const connection = mm.openConnection();
                                                if (items.length === 1) {
                                                    mm.executeQueryData(
                                                        "SELECT * FROM product_catalouge WHERE CUSTOMER_ID = ? AND NAME = ?",
                                                        [getCustomerId[0].CUSTOMER_ID, items[0].name],
                                                        "",
                                                        (err, itemRow) => {
                                                            if (err) {
                                                                console.log("createOrderForWoocom product_catalouge error", err);
                                                                return res.send({
                                                                    code: 400,
                                                                    message: "Internal Server Error",
                                                                });
                                                            }
        
                                                            if (itemRow && itemRow.length > 0) {
                                                                const item = itemRow[0];
        
                                                                mm.executeQueryData(
                                                                    "SELECT * FROM view_address_master WHERE CONTACT_PERSON = ?",
                                                                    [item.WAREHOUSE_NAME],
                                                                    "",
                                                                    (pickupErr, pickupRow) => {
                                                                        if (pickupErr) {
                                                                            console.log("createOrderForWoocom pickup error", pickupErr);
                                                                            return res.send({
                                                                                code: 400,
                                                                                message: "Internal Server Error",
                                                                            });
                                                                        }
        
                                                                        if (!pickupRow || pickupRow.length === 0) {
                                                                            console.log("Pickup address not found");
                                                                            return res.send({
                                                                                code: 400,
                                                                                message: "Pickup address not found",
                                                                            });
                                                                        }
        
                                                                        const pickupAddress = pickupRow[0];
        
                                                                        data.LENGTH = item.LENGTH;
                                                                        data.WIDTH = item.WIDTH;
                                                                        data.HEIGHT = item.HEIGHT;
                                                                        data.DEAD_WEIGHT = item.WEIGHT/1000;
                                                                        data.CUSTOMER_ID = item.CUSTOMER_ID;
        
                                                                        const volWght = (item.LENGTH * item.WIDTH * item.HEIGHT) / 5000;
                                                                        data.CHARGABLE_WEIGHT = volWght > item.WEIGHT/1000 ? volWght : item.WEIGHT;
        
                                                                        data.PICKUP_ADDRESS = pickupAddress.ADDRESS;
                                                                        data.PICKUP_CONTACT_PERSON = pickupAddress.DISPLAY_NAME;
                                                                        data.PICKUP_PINCODE_ID = pickupAddress.PINCODE_ID;
                                                                        data.MOBILE_NO = pickupAddress.MOBILE_NO;
                                                                        data.EMAIL_ID = pickupAddress.EMAIL_ID;
                                                                        mm.executeDML('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                                            if (error) {
                                                                                console.log(error)
                                                                                mm.rollbackConnection(connection)
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "Failed to save orderMaster information..."
                                                                                });
                                                                            }
                                                                            else {
                                                                                var recordData = [];
                                                                                var cod_amount = 0;
                                                                                for (let i = 0; i < orderDetails.length; i++) {
                                                                                    let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), results.insertId];
                                                                                    recordData.push(rec);
                                                                                    cod_amount = data.PAYMENT_MODE == 'COD' ? cod_amount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0;
                                                                                }
                                                                                mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ? ;`, [recordData], supportKey, connection, (error, insertDetails) => {
                                                                                    if (error) {
                                                                                        console.log(error)
                                                                                        mm.rollbackConnection(connection)
                                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                        res.send({
                                                                                            "code": 400,
                                                                                            "message": "Failed to save orderDetails information..."
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        mm.executeDML(`update order_master set COD_AMOUNT = ?, COD_PAID_AMOUNT = 0 where ID = ?`, [(data.PAYMENT_MODE == 'COD' ? cod_amount : 0), results.insertId], supportKey, connection, (error, updateOrder) => {
                                                                                            if (error) {
                                                                                                console.log(error)
                                                                                                mm.rollbackConnection(connection)
                                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                res.send({
                                                                                                    "code": 400,
                                                                                                    "message": "Failed to update order information..."
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                mm.commitConnection(connection)
                                                                                                res.send({
                                                                                                    "code": 200,
                                                                                                    "message": "orderMaster information saved successfully...",
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                })
                                                                            }
                                                                        });
                                                                    }
                                                                );
                                                            } else {
                                                                mm.executeDML('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                        mm.rollbackConnection(connection)
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to save orderMaster information..."
                                                                        });
                                                                    }
                                                                    else {
                                                                        var recordData = [];
                                                                        var cod_amount = 0;
                                                                        for (let i = 0; i < orderDetails.length; i++) {
                                                                            let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), results.insertId];
                                                                            recordData.push(rec);
                                                                            cod_amount = data.PAYMENT_MODE == 'COD' ? cod_amount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0;
                                                                        }
                                                                        mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ? ;`, [recordData], supportKey, connection, (error, insertDetails) => {
                                                                            if (error) {
                                                                                console.log(error)
                                                                                mm.rollbackConnection(connection)
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "Failed to save orderDetails information..."
                                                                                });
                                                                            }
                                                                            else {
                                                                                mm.executeDML(`update order_master set COD_AMOUNT = ?, COD_PAID_AMOUNT = 0 where ID = ?`, [(data.PAYMENT_MODE == 'COD' ? cod_amount : 0), results.insertId], supportKey, connection, (error, updateOrder) => {
                                                                                    if (error) {
                                                                                        console.log(error)
                                                                                        mm.rollbackConnection(connection)
                                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                        res.send({
                                                                                            "code": 400,
                                                                                            "message": "Failed to update order information..."
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        mm.commitConnection(connection)
                                                                                        res.send({
                                                                                            "code": 200,
                                                                                            "message": "orderMaster information saved successfully...",
                                                                                        });
                                                                                    }
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    );
                                                } else {
                                                    mm.executeDML('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                        if (error) {
                                                            console.log(error)
                                                            mm.rollbackConnection(connection)
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to save orderMaster information..."
                                                            });
                                                        }
                                                        else {
                                                            var recordData = [];
                                                            var cod_amount = 0;
                                                            for (let i = 0; i < orderDetails.length; i++) {
                                                                let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), results.insertId];
                                                                recordData.push(rec);
                                                                cod_amount = data.PAYMENT_MODE == 'COD' ? cod_amount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0;
                                                            }
                                                            mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ? ;`, [recordData], supportKey, connection, (error, insertDetails) => {
                                                                if (error) {
                                                                    console.log(error)
                                                                    mm.rollbackConnection(connection)
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to save orderDetails information..."
                                                                    });
                                                                }
                                                                else {
                                                                    mm.executeDML(`update order_master set COD_AMOUNT = ?, COD_PAID_AMOUNT = 0 where ID = ?`, [(data.PAYMENT_MODE == 'COD' ? cod_amount : 0), results.insertId], supportKey, connection, (error, updateOrder) => {
                                                                        if (error) {
                                                                            console.log(error)
                                                                            mm.rollbackConnection(connection)
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "Failed to update order information..."
                                                                            });
                                                                        }
                                                                        else {
                                                                            mm.commitConnection(connection)
                                                                            res.send({
                                                                                "code": 200,
                                                                                "message": "orderMaster information saved successfully...",
                                                                            });
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    });
                                                }
                                               
                                            }
                                            else {
                                                res.send({
                                                    "code": 404,
                                                    "message": "Pincode not found..."
                                                });
                                            }
                                        }
                                    })
                                }
                                else {
                                    data.PINCODE_ID = null
                                    const connection = mm.openConnection();
                                    mm.executeDML('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                        if (error) {
                                            console.log(error)
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save orderMaster information..."
                                            });
                                        }
                                        else {
                                            var recordData = [];
                                            var cod_amount = 0;
                                            for (let i = 0; i < orderDetails.length; i++) {
                                                let rec = [orderDetails[i].PRODUCT_NAME, orderDetails[i].PER_UNIT_PRICE, orderDetails[i].TOTAL_UNIT, orderDetails[i].PRODUCT_CATEGORY, mm.getSystemDate(), results.insertId];
                                                recordData.push(rec);
                                                cod_amount = data.PAYMENT_MODE == 'COD' ? cod_amount + (orderDetails[i].PER_UNIT_PRICE * orderDetails[i].TOTAL_UNIT) : 0;
                                            }
                                            mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values ? ;`, [recordData], supportKey, connection, (error, insertDetails) => {
                                                if (error) {
                                                    console.log(error)
                                                    mm.rollbackConnection(connection)
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to save orderDetails information..."
                                                    });
                                                }
                                                else {
                                                    mm.executeDML(`update order_master set COD_AMOUNT = ?, COD_PAID_AMOUNT = 0 where ID = ?`, [(data.PAYMENT_MODE == 'COD' ? cod_amount : 0), results.insertId], supportKey, connection, (error, updateOrder) => {
                                                        if (error) {
                                                            console.log(error)
                                                            mm.rollbackConnection(connection)
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to update order information..."
                                                            });
                                                        }
                                                        else {
                                                            mm.commitConnection(connection)
                                                            res.send({
                                                                "code": 200,
                                                                "message": "orderMaster information saved successfully...",
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    });
                                }
                            }
                            else {
                                res.send({
                                    "code": 304,
                                    "message": "customerId not found..."
                                });
                            }
                        }
                    })
                }
                else {
                    res.send({
                        "code": 404,
                        "message": "Parameter Missing"
                    })
                }
            } catch (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            }

        
    })

}

exports.shipnowOrderForShiprocket = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT;
    var serviceId = req.body.SERVICE_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;
    var carrierId = req.body.CARRIER_ID;
    let shipment_id = null;
    let token = null;

    try {
        if (orderId && orderId != ' ' && customerId && customerId != ' ' && serviceId && serviceId != ' ' && carrierId && carrierId != ' ') {
            mm.executeQueryData(` select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId], supportKey, (error, getOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order."
                    });
                }
                else {
                    if (getOrder.length > 0) {

                        let pickupPincode = parseInt(getOrder[0].PICKUP_PINCODE),
                            deliverPincode = parseInt(getOrder[0].PINCODE),
                            DEAD_WEIGHT = parseFloat(getOrder[0].DEAD_WEIGHT),
                            volumetricWeight = parseFloat(getOrder[0].HEIGHT) * parseFloat(getOrder[0].WIDTH) * parseFloat(getOrder[0].LENGTH);
                        mm.executeQueryData(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId], supportKey, async (error, getBalance) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get wallet."
                                });
                            }
                            else {
                                if (getBalance.length > 0 && getBalance[0].BALANCE >= orderAmount) {
                                    let loginData = JSON.stringify({
                                        "email": process.env.SHIPROCKET_EMAIL,
                                        "password": process.env.SHIPROCKET_PASSWORD
                                    });

                                    let config = {
                                        method: 'post',
                                        maxBodyLength: Infinity,
                                        url: process.env.SHIPROCKET_AUTH_BASEURL,
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        data: loginData
                                    };

                                    axios.request(config).then(async (shiprocketToken) => {

                                        token = shiprocketToken.data.token;
                                        let shiprocketPincodeData = JSON.stringify({
                                            "weight": parseFloat(DEAD_WEIGHT) > (parseFloat(volumetricWeight) / 5000) ? parseFloat(DEAD_WEIGHT) : (parseFloat(volumetricWeight) / 5000),
                                            "cod": getOrder[0].PAYMENT_MODE == 'COD' ? 1 : 0,
                                            "pickup_postcode": pickupPincode,
                                            "delivery_postcode": deliverPincode
                                        })


                                        let config2 = {
                                            method: 'get',
                                            maxBodyLength: Infinity,
                                            url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            data: shiprocketPincodeData
                                        };

                                        axios.request(config2).then(async (shiprocketPincodeServicable) => {

                                            if (shiprocketPincodeServicable.data.status == 200) {

                                                const productDetails = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(
                                                    service => service.courier_company_id == serviceId
                                                );

                                                if (productDetails.length > 0) {
                                                    orderAmount = productDetails[0].rate;
                                                    applicableWeight = productDetails[0].charge_weight;

                                                    let itemDetails = JSON.parse(getOrder[0].PRODUCT_DETAILS);
                                                    let orderDetails = []
                                                    let productAmt = 0;
                                                    for (let i = 0; i < itemDetails.length; i++) {
                                                        productAmt = productAmt + (itemDetails[i].TOTAL_UNIT * itemDetails[i].PER_UNIT_PRICE)
                                                        orderDetails.push({
                                                            "name": itemDetails[i].PRODUCT_NAME,
                                                            "sku": `sku${itemDetails[i].ID}`,
                                                            "units": itemDetails[i].TOTAL_UNIT,
                                                            "selling_price": itemDetails[i].PER_UNIT_PRICE,
                                                            "discount": "",
                                                            "tax": ""
                                                        })
                                                    }

                                                    var options = {
                                                        'method': 'POST',
                                                        'url': 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
                                                        'headers': {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({
                                                            "order_id": getOrder[0].ORDER_NO,
                                                            "order_date": getOrder[0].ORDER_DATETIME.split(':')[0] + ':' + getOrder[0].ORDER_DATETIME.split(':')[1],
                                                            "pickup_location": getOrder[0].PICKUP_CONTACT_PERSON,
                                                            "comment": "",
                                                            "billing_customer_name": getOrder[0].DELIVER_TO,
                                                            "billing_last_name": "",
                                                            "billing_address": getOrder[0].ADDRESS,
                                                            "billing_address_2": "",
                                                            "billing_city": getOrder[0].CITY_NAME,
                                                            "billing_pincode": deliverPincode,
                                                            "billing_state": getOrder[0].STATE_NAME,
                                                            "billing_country": "India",
                                                            "billing_email": getOrder[0].EMAIL_ID,
                                                            "billing_phone": getOrder[0].MOBILE_NO,
                                                            "shipping_is_billing": true,
                                                            "shipping_customer_name": "",
                                                            "shipping_last_name": "",
                                                            "shipping_address": "",
                                                            "shipping_address_2": "",
                                                            "shipping_city": "",
                                                            "shipping_pincode": "",
                                                            "shipping_country": "",
                                                            "shipping_state": "",
                                                            "shipping_email": "",
                                                            "shipping_phone": "",
                                                            "order_items": orderDetails,
                                                            "payment_method": getOrder[0].PAYMENT_MODE == 'COD' ? "COD" : "Prepaid",
                                                            "shipping_charges": 0,
                                                            "giftwrap_charges": 0,
                                                            "transaction_charges": 0,
                                                            "total_discount": 0,
                                                            "sub_total": productAmt,
                                                            "length": getOrder[0].LENGTH,
                                                            "breadth": getOrder[0].WIDTH,
                                                            "height": getOrder[0].HEIGHT,
                                                            "weight": applicableWeight
                                                        })
                                                    };
                                                    request(options, function (error, response, body) {
                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Server is busy at the moment, Please try again.."
                                                            })
                                                        }
                                                        else {
                                                            let courierData = [{ "orderCreateResponse": body }]
                                                            body = JSON.parse(body);

                                                            if (body.shipment_id) {
                                                                shipment_id = body.shipment_id;
                                                                var options2 = {
                                                                    'method': 'POST',
                                                                    'url': 'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
                                                                    'headers': {
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: JSON.stringify({
                                                                        "shipment_id": body.shipment_id,
                                                                        "base_courier_id": parseInt(serviceId)
                                                                    })
                                                                };
                                                                request(options2, function (error, response, body2) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Server is busy at the moment, Please try again.."
                                                                        })
                                                                    }
                                                                    else {
                                                                        courierData.push({ "awbData": body2 })
                                                                        body2 = JSON.parse(body2);
                                                                        if (body2.awb_assign_status == 1) {
                                                                            let awbNo = body2.response.data.awb_code;
                                                                            if (awbNo) {
                                                                                if (shipment_id) {
                                                                                    const inputDate = new Date(systemDate.split(" ")[0]);
                                                                                    inputDate.setDate(inputDate.getDate() + 1);
                                                                                    const nextDay = inputDate.toISOString().split("T")[0];


                                                                                    var options4 = {
                                                                                        'method': 'POST',
                                                                                        'url': 'https://apiv2.shiprocket.in/v1/external/courier/generate/pickup',
                                                                                        'headers': {
                                                                                            'Content-Type': 'application/json',
                                                                                            'Authorization': `Bearer ${token}`
                                                                                        },
                                                                                        body: JSON.stringify({
                                                                                            "shipment_id": [shipment_id],
                                                                                            "pickup_date": [nextDay]
                                                                                        })
                                                                                    };
                                                                                    request(options4, function (error, response, body4) {
                                                                                        if (error) {
                                                                                            console.log(error);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "Failed to schedule shipment."
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            courierData.push({ "scheduleData": body4 })
                                                                                            const connection = mm.openConnection();
                                                                                            let commisionAmount = (40 / 100) * orderAmount;
                                                                                            let codCommision = getOrder[0].PAYMENT_MODE == 'COD' ? (2.36 / 100) * productAmt : 0;
                                                                                            let finalAmount = orderAmount + commisionAmount + codCommision;
                                                                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`, [finalAmount, customerId], supportKey, connection, (error, updateWallet) => {
                                                                                                if (error) {
                                                                                                    console.log(error);
                                                                                                    mm.rollbackConnection(connection);
                                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                    res.send({
                                                                                                        "code": 400,
                                                                                                        "message": "Failed to update wallet."
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    var stringData = JSON.stringify(courierData)
                                                                                                    mm.executeDML(`update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', ORDER_AMOUNT = ?,CHARGABLE_WEIGHT = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [systemDate, awbNo, systemDate, stringData, 0, 6, (serviceId == 1 ? 20 : 19), finalAmount, applicableWeight, systemDate, orderId,], supportKey, connection, (error, updateOrder) => {
                                                                                                        if (error) {
                                                                                                            console.log(error);
                                                                                                            mm.rollbackConnection(connection);
                                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                            res.send({
                                                                                                                "code": 400,
                                                                                                                "message": "Failed to update order."
                                                                                                            });
                                                                                                        }
                                                                                                        else {
                                                                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [customerId, 'O', finalAmount, 'D', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                                                                                if (error) {
                                                                                                                    console.log(error);
                                                                                                                    mm.rollbackConnection(connection);
                                                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                                    res.send({
                                                                                                                        "code": 400,
                                                                                                                        "message": "Failed to transaction_master order."
                                                                                                                    });
                                                                                                                }
                                                                                                                else {
                                                                                                                    const date = new Date(systemDate.split(' ')[0]);
                                                                                                                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                                                                    const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                                                                    const titleData = '📦 Shipment Created.';
                                                                                                                    const bodyData = `Shipment with AWB no. ${awbNo} has been created successfully using Blue Dart for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                                                                                                                    notification.sendNotification(titleData, bodyData, 0, customerId)
                                                                                                                    mm.commitConnection(connection)
                                                                                                                    res.send({
                                                                                                                        "code": 200,
                                                                                                                        "message": "success",
                                                                                                                        "AWB_NO": awbNo
                                                                                                                    })
                                                                                                                    setTimeout(() => {
                                                                                                                        wp.sendOrderPlacedMessage(orderId)
                                                                                                                    }, 3000);
                                                                                                                }
                                                                                                            })
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                            else {
                                                                                res.send({
                                                                                    "code": 308,
                                                                                    "message": "Something went wrong."
                                                                                })
                                                                            }
                                                                        }
                                                                        else {
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "Server is busy at the moment, Please try again..",
                                                                                "error": body2
                                                                            })
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Server is busy at the moment, Please try again..",
                                                                    "error": body
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                                else {
                                                    res.send({
                                                        "code": 404,
                                                        "message": "Service Not Available."
                                                    });
                                                }
                                            }
                                            else {
                                                res.send({
                                                    "code": 400,
                                                    "message": "Server is busy at the moment, Please try again..",
                                                    "error": shiprocketPincodeServicable
                                                })
                                            }
                                        })
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 307,
                                        "message": "Insufficient wallet Amount"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "order not found"
                        })
                    }
                }
            })


        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.cancelShiprocketOrder = async (req, res) => {

    var systemDate = mm.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var CANCEL_REMARK = req.body.CANCEL_REMARK;

    try {
        if (orderId && orderId != ' ' && CANCEL_REMARK && CANCEL_REMARK != ' ') {
            mm.executeQueryData(`select AWB_NO, PAID_AMOUNT, ORDER_AMOUNT, CUSTOMER_ID, COURIER_API_DATA, ORDER_NO from order_master where ID = ? AND ORDER_STATUS IN('S', 'PA', 'PS', 'PR', 'NP')`, orderId, supportKey, async (error, getAwb) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get wallet."
                    });
                }
                else {
                    if (getAwb.length > 0 && getAwb[0].AWB_NO) {
                        let courierData = JSON.parse(getAwb[0].COURIER_API_DATA)

                        courierData = JSON.parse(courierData[0].orderCreateResponse);

                        let loginData = JSON.stringify({
                            "email": process.env.SHIPROCKET_EMAIL,
                            "password": process.env.SHIPROCKET_PASSWORD
                        });

                        let config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: loginData
                        };

                        axios.request(config).then(async (shiprocketToken) => {

                            var options = {
                                'method': 'POST',
                                'url': 'https://apiv2.shiprocket.in/v1/external/orders/cancel',
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                },
                                body: JSON.stringify({
                                    "ids": [courierData.order_id]
                                })
                            };

                            request(options, function (error, response, body) {
                                if (error) {
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Something went wrong with server."
                                    })
                                }
                                else {
                                    body = JSON.parse(body);
                                    console.log(body);

                                    if (body.status == 200) {
                                        const connection = mm.openConnection();
                                        var stringData = JSON.stringify(body);
                                        mm.executeDML(`update order_master set CANCEL_REMARK = ?, CANCEL_DATETIME = ?, IS_SHIPPED = 1, ORDER_STATUS = 'C', CANCEL_DATA = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ? `, [CANCEL_REMARK, systemDate, stringData, systemDate, orderId], supportKey, connection, (error, cancelOrder) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to cancel order."
                                                });
                                            }
                                            else {
                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getAwb[0].CUSTOMER_ID, 'O', getAwb[0].ORDER_AMOUNT, 'C', systemDate, systemDate, orderId], supportKey, connection, (error, insertTransaction) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to insert transaction."
                                                        });
                                                    }
                                                    else {
                                                        mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?) where CUSTOMER_ID = ? `, [getAwb[0].ORDER_AMOUNT, getAwb[0].CUSTOMER_ID], supportKey, connection, (error, cancelOrder) => {
                                                            if (error) {
                                                                console.log(error);
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to cancel order."
                                                                });
                                                            }
                                                            else {

                                                                const date = new Date(systemDate.split(' ')[0]);
                                                                const options = { day: '2-digit', month: 'long', year: 'numeric' };
                                                                const formattedDate = date.toLocaleDateString('en-GB', options);
                                                                const titleData = '📦 Shipment Cancelled.';
                                                                const bodyData = `Shipment with AWB No. ${getAwb[0].AWB_NO} has been cancelled successfully on ${formattedDate}.`
                                                                notification.sendNotification(titleData, bodyData, 0, getAwb[0].CUSTOMER_ID)
                                                                mm.commitConnection(connection)
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "success"
                                                                })
                                                                setTimeout(() => {
                                                                    wp.sendCancelShipmentMessage(orderId);
                                                                }, 3000);
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        res.send({
                                            "code": 400,
                                            "message": "failed to cancel Order.."
                                        })
                                    }
                                }
                            });
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "no order found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    }
    catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.trackShiprocketShipment = async (req, res) => {

    let orderId = req.body.ORDER_ID;
    var supportKey = req.headers['supportKey']
    try {
        if (orderId && orderId != ' ') {
            mm.executeQueryData(`select * from view_order_master where ID = ? `, orderId, supportKey, async (error, checkAWO) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    if (checkAWO.length > 0) {

                        let loginData = JSON.stringify({
                            "email": process.env.SHIPROCKET_EMAIL,
                            "password": process.env.SHIPROCKET_PASSWORD
                        });

                        let config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: loginData
                        };

                        axios.request(config).then(async (shiprocketToken) => {
                            var options = {
                                'method': 'GET',
                                'url': 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + checkAWO[0].AWB_NO,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                }
                            };

                            request(options, function (error, response, body) {
                                if (error) {
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Fail to get tracking details"
                                    })
                                }
                                else {
                                    body = JSON.parse(body);
                                    if (body) {
                                        mm.executeQueryData(`select * from transaction_master where ORDER_ID = ?`, orderId, supportKey, (error, getTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to get transaction details"
                                                })
                                            }
                                            else {
                                                res.send({
                                                    "code": 200,
                                                    "message": "success",
                                                    "data": body,
                                                    "orderData": checkAWO,
                                                    "transactionData": getTransactionDetails
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        res.send({
                                            "code": 305,
                                            "message": "failed"
                                        })
                                    }
                                }
                            });
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "AWB not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.deleteOrder = (req, res) => {

    var supportKey = req.headers["supportKey"];
    var ORDER_ID = req.body.ORDER_ID;
    try {
        if (ORDER_ID && ORDER_ID != ' ') {
            mm.executeQueryData('select ID from order_master where ID = ? AND ORDER_STATUS = "P" AND IS_SHIPPED = 0', ORDER_ID, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    if (results.length > 0) {
                        mm.executeQueryData(`delete from order_master where ID = ? AND ORDER_STATUS = "P" AND IS_SHIPPED = 0`, ORDER_ID, supportKey, (error, deleteOrder) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to delete orderMaster information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "orderMaster information deleted successfully...",
                                });
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "order not found...",
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);

        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.cloneOrder = (req, res) => {

    var supportKey = req.headers["supportKey"];
    var ORDER_ID = req.body.ORDER_ID;
    var systemDate = mm.getSystemDate();
    var ORDER_NO = 'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];

    try {
        if (ORDER_ID && ORDER_ID != ' ') {
            mm.executeQueryData(`select ID from order_master where ID = ?`, ORDER_ID, supportKey, (error, checkOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster information..."
                    });
                }
                else {
                    if (checkOrder.length > 0) {
                        const connection = mm.openConnection();
                        mm.executeDML('insert into order_master(ORDER_NO, ORDER_DATETIME, MOBILE_NO, DELIVER_TO, EMAIL_ID, ADDRESS, LANDMARK, PINCODE_ID, PICKUP_ADDRESS, PICKUP_CONTACT_PERSON, PICKUP_MOBILE_NO, PICKUP_EMAIL_ID, PICKUP_ALT_MOBILE_NO, PICKUP_LANDMARK, PICKUP_PINCODE_ID, DEAD_WEIGHT, LENGTH, WIDTH, HEIGHT, CREATED_MODIFIED_DATE, PAYMENT_MODE, ORDER_AMOUNT, ORDER_STATUS, CUSTOMER_ID, IS_SHIPPED, COD_AMOUNT, COD_PAID_AMOUNT) select ?, ?, MOBILE_NO, DELIVER_TO, EMAIL_ID, ADDRESS, LANDMARK, PINCODE_ID, PICKUP_ADDRESS, PICKUP_CONTACT_PERSON, PICKUP_MOBILE_NO, PICKUP_EMAIL_ID, PICKUP_ALT_MOBILE_NO, PICKUP_LANDMARK, PICKUP_PINCODE_ID, DEAD_WEIGHT, LENGTH, WIDTH, HEIGHT, ?, PAYMENT_MODE, ?, ?, CUSTOMER_ID, ?, COD_AMOUNT, ? from order_master where ID = ?', [ORDER_NO, systemDate, systemDate, 0, 'P', 0, 0, ORDER_ID], supportKey, connection, (error, results) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save orderMaster information..."
                                });
                            }
                            else {
                                mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) select PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, ?, ? from order_details where ORDER_ID = ?`, [systemDate, results.insertId, ORDER_ID], supportKey, connection, (error, insertDetails) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to delete orderMaster information..."
                                        });
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "orderMaster information deleted successfully...",
                                        });
                                    }
                                })
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Order not found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing"
            })
        }
    } catch (error) {
        console.log(error);

        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.createNdrForDtdc = (req, res) => {
    const ORDER_ID = req.body.ORDER_ID,
        supportKey = req.headers['supportKey'];
    var name = req.body.name ? req.body.name : null;
    var address_1 = req.body.address_1 ? req.body.address_1 : null;
    var address_2 = req.body.address_2 ? req.body.address_2 : null;
    var re_attempt_date = req.body.re_attempt_date ? req.body.re_attempt_date : null;
    var phone = req.body.phone ? req.body.phone : null;
    var reason = req.body.reason ? req.body.reason : null;
    try {
        if (reason && phone && name && (address_1 || address_2) && re_attempt_date) {
            mm.executeQueryData(`select AWB_NO, MOBILE_NO, ADDRESS, DELIVER_TO, CUSTOMER_ID, ID from order_master where ID = ? AND ORDER_STATUS NOT IN('D', 'C', 'P') AND IS_SHIPPED = 1  AND CARRIER_ID = ?`, [ORDER_ID, 1], supportKey, async (error, getOrderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get orderDetails."
                    })
                }
                else {
                    if (getOrderDetails.length > 0) {
                        const connection = mm.openConnection();
                        mm.executeDML(`insert into ndr_order_master(ORDER_ID, PAYLOAD_DATA, ADDRESS_1, ADDRESS_2, MOBILE_NO, NAME, OLD_ADDRESS_1, OLD_ADDRESS_2, OLD_MOBILE_NO, OLD_NAME, CREATED_MODIFIED_DATE, STATUS, RE_ATTEMPT_DATE, REASON, NDR_STATUS) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [ORDER_ID, body, address_1, address_2, phone, name, getOrderDetails[0].ADDRESS, null, getOrderDetails[0].MOBILE_NO, getOrderDetails[0].DELIVER_TO, mm.getSystemDate(), 'P', re_attempt_date, reason, 'R'], supportKey, connection, (error, insertDetails) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "fail to insert ndr details."
                                })
                            }
                            else {
                                mm.executeDML(`update wallet_master set BALANCE =  BALANCE - ? where CUSTOMER_ID = ?`, [3, getOrderDetails[0].CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "fail to update wallet information."
                                        })
                                    }
                                    else {
                                        const systemDate = mm.getSystemDate();
                                        mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getOrderDetails[0].CUSTOMER_ID, 'ND', 3, 'D', systemDate, systemDate, getOrderDetails[0].ID], supportKey, connection, (error, insertTransaction) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to insert transaction information."
                                                })
                                            }
                                            else {
                                                mm.commitConnection(connection)
                                                res.send({
                                                    "code": 200,
                                                    "message": "success"
                                                })
                                                setTimeout(() => {
                                                    wp.sendNdrCreateMessage(getOrderDetails[0].ID, re_attempt_date)
                                                }, 3000);

                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Order not found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        res.send({
            "code": 400,
            "message": error
        })
    }
}

exports.createNdrForShiprocket = (req, res) => {
    const ORDER_ID = req.body.ORDER_ID,
        supportKey = req.headers['supportKey'];
    var re_attempt_date = req.body.re_attempt_date ? req.body.re_attempt_date : null;
    var address_1 = req.body.address_1 ? req.body.address_1 : null;
    var address_2 = req.body.address_2 ? req.body.address_2 : null;
    var phone = req.body.phone ? req.body.phone : null;
    var reason = req.body.reason ? req.body.reason : null;
    try {
        if (re_attempt_date && phone && reason && ((address_1 || address_2))) {
            mm.executeQueryData(`select AWB_NO, MOBILE_NO, ADDRESS, DELIVER_TO, CUSTOMER_ID, ID from order_master where ID = ? AND ORDER_STATUS NOT IN('D', 'C', 'P') AND IS_SHIPPED = 1  AND CARRIER_ID = ?`, [ORDER_ID, 6], supportKey, async (error, getOrderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get orderDetails."
                    })
                }
                else {
                    var options2 = {
                        'method': 'POST',
                        'url': process.env.SHIPROCKET_AUTH_BASEURL,
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "email": process.env.SHIPROCKET_EMAIL,
                            "password": process.env.SHIPROCKET_PASSWORD
                        })
                    };

                    request(options2, function (error, response, body) {
                        if (error) {
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Fail to generate token"
                            })
                        }
                        else {
                            let tokenData = JSON.parse(body);
                            var options = {
                                'method': 'POST',
                                'url': `https://apiv2.shiprocket.in/v1/external/ndr/${getOrderDetails[0].AWB_NO}/action`,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${tokenData.token}`
                                },
                                body: JSON.stringify({
                                    "action": "re-attempt",
                                    "comments": reason,
                                    "phone": phone,
                                    "address1": address_1,
                                    "address2": address_2,
                                    "deferred_date": re_attempt_date
                                })

                            };
                            request(options, function (error, response, body) {
                                if (error) {
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "messsage": "fail to reattempt"
                                    })

                                }
                                else {
                                    const connection = mm.openConnection()
                                    mm.executeDML(`update order_master set ADDRESS = ?, DELIVER_TO = ?, MOBILE_NO = ?, REATTEMPT_COUNT = REATTEMPT_COUNT + 1 where ID = ?`, [address_1 + ', ' + address_2, name, phone, ORDER_ID], supportKey, connection, (error, updateOrderDetails) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "fail to update orderDetails."
                                            })
                                        }
                                        else {
                                            mm.executeDML(`insert into ndr_order_master(ORDER_ID, PAYLOAD_DATA, ADDRESS_1, ADDRESS_2, MOBILE_NO, NAME, OLD_ADDRESS_1, OLD_ADDRESS_2, OLD_MOBILE_NO, OLD_NAME, CREATED_MODIFIED_DATE, STATUS, RE_ATTEMPT_DATE, REASON, NDR_STATUS) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [ORDER_ID, body, address_1, address_2, phone, name, getOrderDetails[0].ADDRESS, null, getOrderDetails[0].MOBILE_NO, getOrderDetails[0].DELIVER_TO, mm.getSystemDate(), 'C', re_attempt_date, reason, 'R'], supportKey, connection, (error, insertDetails) => {
                                                if (error) {
                                                    console.log(error);
                                                    mm.rollbackConnection(connection)
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "fail to insert ndr details."
                                                    })
                                                }
                                                else {
                                                    mm.executeDML(`update wallet_master set BALANCE =  BALANCE - ? where CUSTOMER_ID = ?`, [3, getOrderDetails[0].CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                        if (error) {
                                                            console.log(error);
                                                            mm.rollbackConnection(connection)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "fail to update wallet information."
                                                            })
                                                        }
                                                        else {
                                                            const systemDate = mm.getSystemDate()
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getOrderDetails[0].CUSTOMER_ID, 'ND', 3, 'D', systemDate, systemDate, getOrderDetails[0].ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "fail to insert transaction information."
                                                                    })
                                                                }
                                                                else {
                                                                    mm.commitConnection(connection)
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "success"
                                                                    })
                                                                    setTimeout(() => {
                                                                        wp.sendNdrCreateMessage(getOrderDetails[0].ID, re_attempt_date)
                                                                    }, 3000);
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        res.send({
            "code": 400,
            "message": error
        })
    }
}

exports.approveDtdcNdr = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const ndrId = req.body.NDR_ID,
        orderStatus = req.body.NDR_STATUS;
    try {
        if (ndrId && ndrId.trim() != '' && orderStatus && orderStatus.trim() != '') {
            mm.executeQueryData(`select * from ndr_order_master where ID = ? AND STATUS = 'P'`, [ndrId], supportKey, (error, getNdrDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "fail to get ndrOrderDetails."
                    })
                }
                else {
                    if (getNdrDetails.length > 0) {
                        const connection = mm.openConnection()
                        mm.executeDML(`update ndr_order_master set STATUS = ? where ID = ?`, [orderStatus, ndrId], supportKey, connection, (error, updateOrder) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "fail to update ndrOrderDetails."
                                })
                            }
                            else {
                                mm.executeDML(`update order_master set IS_NDR = 1, REATTEMPT_COUNT = REATTEMPT_COUNT + ? where ID = ?`, [(orderStatus == 'C' ? 1 : 0), getNdrDetails[0].ORDER_ID], supportKey, connection, (error, updateOrder) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                        res.send({
                                            "code": 400,
                                            "message": "fail to update orderDetails."
                                        })
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "success"
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 305,
                            "message": "order not found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        console.log(error);
    }
}

exports.createNdrForDelhivery = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const orderId = req.body.ORDER_ID;
    var re_attempt_date = req.body.re_attempt_date ? req.body.re_attempt_date : null;
    var address_1 = req.body.address_1 ? req.body.address_1 : null;
    var address_2 = req.body.address_2 ? req.body.address_2 : null;
    var phone = req.body.phone ? req.body.phone : null;
    var reason = req.body.reason ? req.body.reason : null;
    var name = req.body.name ? req.body.name : null;

    try {
        if (orderId && reason && reason != ' ' && ((re_attempt_date && re_attempt_date != ' ') || (address_1 || address_2) && phone && phone != '' && name && name != '')) {

            mm.executeQueryData(`select AWB_NO, MOBILE_NO, ADDRESS, DELIVER_TO, CUSTOMER_ID, ID from order_master where ID = ? AND ORDER_STATUS NOT IN('D', 'C', 'P') AND IS_SHIPPED = 1  AND CARRIER_ID = ?`, [orderId, 3], supportKey, (error, getOrderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get orderDetails."
                    })
                }
                else {
                    if (getOrderDetails.length > 0) {
                        const bodyData = []

                        if (re_attempt_date && re_attempt_date != ' ') {
                            bodyData.push({
                                "waybill": getOrderDetails[0].AWB_NO,
                                "act": "DEFER_DLV",
                                "action_data": {
                                    "deferred_date": re_attempt_date
                                }
                            })
                        }

                        if ((address_1 || address_2) && phone && phone != '' && name && name != '') {
                            bodyData.push({
                                "waybill": getOrderDetails[0].AWB_NO,
                                "act": "DEFER_DLV",
                                "action_data": {
                                    "deferred_date": re_attempt_date
                                }
                            })
                        }
                        else {
                            phone = getOrderDetails[0].MOBILE_NO;
                            name = getOrderDetails[0].DELIVER_TO;
                            address_1 = getOrderDetails[0].ADDRESS;
                            address_2 = null;
                        }

                        var options = {
                            'method': 'POST',
                            'url': 'https://staging-express.delhivery.com/api/p/update',
                            'headers': {
                                'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "data": bodyData
                            })
                        };

                        request(options, function (error, response, body) {
                            if (error) {
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": error
                                })
                            }
                            else {
                                console.log(body);
                                const connection = mm.openConnection()
                                mm.executeDML(`update order_master set ADDRESS = ?, DELIVER_TO = ?, MOBILE_NO = ?, REATTEMPT_COUNT = REATTEMPT_COUNT + 1 where ID = ?`, [address_1 + ', ' + address_2, name, phone, orderId], supportKey, connection, (error, updateOrderDetails) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "fail to update orderDetails."
                                        })
                                    }
                                    else {
                                        mm.executeDML(`insert into ndr_order_master(ORDER_ID, PAYLOAD_DATA, ADDRESS_1, ADDRESS_2, MOBILE_NO, NAME, OLD_ADDRESS_1, OLD_ADDRESS_2, OLD_MOBILE_NO, OLD_NAME, CREATED_MODIFIED_DATE, STATUS, RE_ATTEMPT_DATE, REASON, NDR_STATUS) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [orderId, body, address_1, address_2, phone, name, getOrderDetails[0].ADDRESS, null, getOrderDetails[0].MOBILE_NO, getOrderDetails[0].DELIVER_TO, mm.getSystemDate(), 'C', re_attempt_date, reason, 'R'], supportKey, connection, (error, insertDetails) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to insert ndr details."
                                                })
                                            }
                                            else {
                                                // mm.executeDML(`update wallet_master set BALANCE =  BALANCE - ? where CUSTOMER_ID = ?`, [3, getOrderDetails[0].CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                //     if (error) {
                                                //         console.log(error);
                                                //         mm.rollbackConnection(connection)
                                                //         res.send({
                                                //             "code": 400,
                                                //             "message": "fail to update wallet information."
                                                //         })
                                                //     }
                                                //     else {
                                                //         const systemDate = mm.getSystemDate()
                                                //         mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [getOrderDetails[0].CUSTOMER_ID, 'ND', 3, 'D', systemDate, systemDate, getOrderDetails[0].ID], supportKey, connection, (error, insertTransaction) => {
                                                //             if (error) {
                                                //                 console.log(error);
                                                //                 mm.rollbackConnection(connection)
                                                //                 res.send({
                                                //                     "code": 400,
                                                //                     "message": "fail to insert transaction information."
                                                //                 })
                                                //             }
                                                //             else {

                                                //             }
                                                //         })
                                                //     }
                                                // })

                                                mm.commitConnection(connection)
                                                res.send({
                                                    "code": 200,
                                                    "message": "success"
                                                })
                                                setTimeout(() => {
                                                    wp.sendNdrCreateMessage(getOrderDetails[0].ID, re_attempt_date)
                                                }, 3000);
                                            }
                                        })
                                    }
                                })

                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "order Not Found.."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing."
            })
        }



    } catch (error) {
        console.log(error)
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    }
}

exports.manifestCreate = (req, res) => {
    const supportKey = req.headers["supportKey"];
    let ORDER_ID = req.body.ORDER_ID;
    const systemDate = mm.getSystemDate()
    try {
        if (ORDER_ID && ORDER_ID != ' ') {
            mm.executeQueryData(`select ORDER_NO, AWB_NO, CARRIER_NAME, SERVICE_NAME, CUSTOMER_ID, PRODUCT_DETAILS from view_order_master where ID = ?`, [ORDER_ID], supportKey, (error, getOrderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order details"
                    })
                }
                else {
                    if (getOrderDetails.length > 0) {
                        mm.executeQueryData(`select MANIFEST_ID from manifest_details where ORDER_ID = ?`, ORDER_ID, supportKey, (error, getManifestDetails) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "fail to get order details"
                                })
                            }
                            else {
                                if (getManifestDetails.length > 0) {
                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "data": getOrderDetails,
                                        "manifestId": getManifestDetails[0].MANIFEST_ID
                                    })
                                }
                                else {

                                    mm.executeQueryData(`select count(ID) as cnt from manifest_details where CUSTOMER_ID = ?`, getOrderDetails[0].CUSTOMER_ID, supportKey, (error, getCount) => {
                                        if (error) {
                                            console.log(error);
                                            res.send({
                                                "code": 400,
                                                "message": "fail to get count"
                                            })
                                        }
                                        else {
                                            let count = getCount[0].cnt + 1;
                                            mm.executeQueryData(`insert into manifest_details(ORDER_ID, MANIFEST_ID, CREATED_MODIFIED_DATE, CUSTOMER_ID) values(?,?,?,?)`, [ORDER_ID, "MANIFEST-" + count, systemDate, getOrderDetails[0].CUSTOMER_ID], supportKey, (error, insertManifest) => {
                                                if (error) {
                                                    console.log(error);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "fail to insert manifest information."
                                                    })
                                                }
                                                else {
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success",
                                                        "data": getOrderDetails,
                                                        "manifestId": "MANIFEST-" + count
                                                    })
                                                }
                                            })

                                        }
                                    })

                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "Order not found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 503,
            "message": "Something went wrong."
        })
    }
}

exports.importBulkExcelOrder = (req, res) => {
    const supportKey = req.headers['supportKey'];
    let systemDate = mm.getSystemDate();
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            let CUSTOMER_ID = fields.CUSTOMER_ID;
            var newPath = path.join(__dirname, '../../uploads/bulkOrders') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    const excelData = mm.importExcel(newPath);
                    if (excelData.length > 0) {
                        console.log("excelData", excelData);
                        let orderUnique = 1;
                        const connection = mm.openConnection();
                        async.eachSeries(excelData, function iteratorOverElems(data, callback) {
                            var orderNo = 'SML/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2] + orderUnique;
                            orderUnique = orderUnique + 1;
                            systemDate = mm.getSystemDate();

                            let deliverPerson = data["Receiver Name"];
                            let mobileNumber = data["Receiver Mob."];
                            let emailId = data["Receiver Email"];
                            let deliveryAddress1 = data["Receiver Address 1"];
                            let deliveryAddress2 = data["Receiver Address 2"];
                            let deliverPincode = data["Receiver Pincode"];
                            let warehouseName = data["Warehouse Name"];
                            let weight = data["Weight(grams)"] / 1000;
                            let length = data["Length(cms)"];
                            let width = data["Breadth(cms)"];
                            let height = data["Height(cms)"];
                            let productName = data["Product Name"];
                            let productCategory = data["Product Category"];
                            let productPrice = data["Product Price"];
                            let productQuantity = data["Product Quantity"];
                            let paymentMode = data["Payment(Prepaid/COD)"] == "Prepaid" ? "P" : "COD";
                            console.log("deliverPincode", deliverPincode);


                            mm.executeQueryData(`select ID from pincode_master where PINCODE = ? and STATUS = 1; `, [deliverPincode], supportKey, (error, getPincodeDetails) => {
                                if (error) {
                                    console.log(error);
                                    callback(error);
                                }
                                else {
                                    if (getPincodeDetails.length > 0) {
                                        mm.executeQueryData(`select * from address_master where CONTACT_PERSON = ? AND CUSTOMER_ID = ?`, [warehouseName, CUSTOMER_ID], supportKey, (error, getAddressDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback(error);
                                            }
                                            else {
                                                if (getAddressDetails.length > 0) {
                                                    let query = `insert into order_master(ORDER_NO, ORDER_DATETIME, MOBILE_NO, DELIVER_TO, EMAIL_ID, ADDRESS, PINCODE_ID, PICKUP_ADDRESS, PICKUP_CONTACT_PERSON, PICKUP_MOBILE_NO, PICKUP_EMAIL_ID, PICKUP_PINCODE_ID, DEAD_WEIGHT, LENGTH, WIDTH, HEIGHT, CREATED_MODIFIED_DATE, PAYMENT_MODE, ORDER_AMOUNT, ORDER_STATUS, CUSTOMER_ID, IS_SHIPPED, COD_AMOUNT, COD_PAID_AMOUNT) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                                    let cod_amount = 0;
                                                    cod_amount = paymentMode == 'COD' ? cod_amount + (productPrice * productQuantity) : 0;
                                                    let rec = [orderNo, systemDate, mobileNumber, deliverPerson, emailId, deliveryAddress1 + " " + deliveryAddress2, getPincodeDetails[0].ID, getAddressDetails[0].ADDRESS, getAddressDetails[0].CONTACT_PERSON, getAddressDetails[0].MOBILE_NO, getAddressDetails[0].EMAIL_ID, getAddressDetails[0].PINCODE_ID, weight, length, width, height, systemDate, paymentMode, 0, 'P', CUSTOMER_ID, 0, cod_amount, 0];

                                                    mm.executeDML(query, rec, supportKey, connection, (error, insertOrder) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into order_details(PRODUCT_NAME, PER_UNIT_PRICE, TOTAL_UNIT, PRODUCT_CATEGORY, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?)`, [productName, productPrice, productQuantity, productCategory, systemDate, insertOrder.insertId], supportKey, connection, (error, insertDetails) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback();
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    callback();
                                                }
                                            }
                                        })
                                    }
                                    else {
                                        callback();
                                    }
                                }
                            })
                        }, function subCb(error) {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).send({
                                    "code": 400,
                                    "message": "Failed to Insert Orders..."
                                });
                            }
                            else {
                                mm.commitConnection(connection)
                                res.status(200).send({
                                    "code": 200,
                                    "message": "Success.."
                                })
                            }
                        });

                    }
                    else {
                        res.status(404).send({
                            "code": 404,
                            "message": "No Data Found in File.."
                        })
                    }
                }
                else {
                    console.log(err);
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    } catch (error) {
        console.log(error);
        res.send({
            "code": 403,
            "message": "Something went wrong."
        })
    }
}