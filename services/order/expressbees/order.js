const m2 = require('../../../utilities/dbUtil.js');
const mm = require('../../../utilities/globalModule.js');
const dateUtil = require('../../../utilities/dateUtil.js');
const logger = require('../../../utilities/logger.js');
const axios = require('axios');
const notification = require('../../../utilities/pushNotification')
const wp = require('../../../utilities/whatsappMsgShoot.js')
var request = require('request');

exports.trackShipment = async (req, res) => {

    let orderId = req.body.ORDER_ID;
    var supportKey = req.headers['supportKey']
    try {
        if (orderId && orderId == ' ')
            throw { message: "Bad request", status: 404 }

        getOrder = await m2.executeDataQuery(`select * from view_order_master where ID = ?`, orderId);

        if (!getOrder || getOrder.length == 0)
            throw { message: "Order not found", status: 304 }

        response = await trackOnExpressbees(getOrder[0].AWB_NO)

        getTransactionDetails = await m2.executeDataQuery(`select * from transaction_master where ORDER_ID = ?`, orderId)

        res.send({
            "code": 200,
            "message": "success",
            "data": response,
            "orderData": getOrder,
            "transactionData": getTransactionDetails
        })

    } catch (error) {
        res.send({
            "code": error.status,
            "message": error.message
        })
    }
}

exports.shipnowOrderExpressbees = async (req, res) => {

    var systemDate = dateUtil.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT;
    var serviceId = req.body.SERVICE_ID;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;

    var orderData = req.body.orderData;

    try {

        if (!orderId || orderId == ' ' || !customerId && customerId == ' ' || !serviceId && serviceId == ' ' || !carrierId || carrierId == ' ' && !productId && productId == ' ')
            throw { message: "Parameter Missing", status: 404 }

        getOrder = await m2.executeDataQuery(`select ID from order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId])

        if (getOrder.length === 0)
            throw { message: "Order not found", status: 304 }

        getBalance = await m2.executeDataQuery(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId])

        if (getBalance.length <= 0 || getBalance[0].BALANCE < orderAmount)
            throw { message: "Insufficient wallet Amount", status: 307 }

        const token = await generateExpressbeesToken();

        let response = null;
        mm.executeQueryData(`select KEYWORD from view_product_master where ID = ?`, productId, "12345", async (error, getKeyword) => {
            if (error) {
                console.log(error);
                throw { message: "fail to get Product information", status: 400 }
            }
            else {
                orderData.courier_id = getKeyword[0].KEYWORD;
                orderData.request_auto_pickup = "yes";
                response2 = await axios.post(process.env.EXPRESSBEES_SHIPPING_URL, orderData, {
                    headers: {
                        'Content-Type': "application/json",
                        'Authorization': "Bearer " + token
                    },
                });
                console.log("response", response2.data);
                response = { awb: response2.data.data['awb_number'], data: JSON.stringify(response2.data) };

                if (response.awb && response.awb != ' ') {
                    var transactions = [];
                    transactions.push({
                        query: `update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`,
                        data: [orderAmount, customerId]
                    });
                    transactions.push({
                        query: `update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, ORDER_AMOUNT = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', CHARGABLE_WEIGHT = ? where ID = ? `,
                        data: [systemDate, response.awb, orderAmount, systemDate, response.data, serviceId, carrierId, productId, applicableWeight, orderId]
                    });
                    transactions.push({
                        query: `insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`,
                        data: [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId]
                    });

                    const date = new Date(systemDate.split(' ')[0]);
                    const options = { day: '2-digit', month: 'long', year: 'numeric' };
                    const formattedDate = date.toLocaleDateString('en-GB', options);
                    const titleData = '📦 Shipment Created.';
                    const bodyData = `Shipment with AWB no. ${response.awb} has been created successfully using Xpressbees for delivery to ${getOrder[0].DELIVER_TO} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                    notification.sendNotification(titleData, bodyData, 0, customerId)
                    await m2.executeTransactions(transactions);
                    res.send({
                        "code": 200,
                        "message": "success",
                        "AWB_NO": response.awb
                    })
                    wp.sendOrderPlacedMessage(orderId)
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "Something went wrong with carrier"
                    })
                }
            }
        })
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        res.send({
            "code": error.status,
            "message": error.message
        })
    }
}

exports.cancelShipment = async (req, res) => {
    var systemDate = dateUtil.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var CANCEL_REMARK = req.body.CANCEL_REMARK;

    try {
        if (!orderId || orderId == ' ' || !CANCEL_REMARK || CANCEL_REMARK == ' ')
            throw { message: 'Bad Request', status: 404 };

        const getOrder = await m2.executeDataQuery(`select AWB_NO, PAID_AMOUNT, ORDER_AMOUNT, CUSTOMER_ID from order_master where ID = ? AND ORDER_STATUS IN('S', 'PA', 'PS', 'PR', 'NP')`, [orderId])

        if (getOrder.length == 0 || !getOrder[0].AWB_NO)
            throw { message: 'Order not found', status: 304 }

        response = await cancelShipmentInExpressbees(getOrder[0].AWB_NO)
        if (response.status) {
            var transactions = [];

            transactions.push({
                query: `update order_master set CANCEL_REMARK = ?, CANCEL_DATETIME = ?, IS_SHIPPED = 1, ORDER_STATUS = 'C', CANCEL_DATA = ? where ID = ? `,
                data: [CANCEL_REMARK, systemDate, JSON.stringify(response.data), orderId]
            });
            transactions.push({
                query: `insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`,
                data: [getOrder[0].CUSTOMER_ID, 'O', getOrder[0].ORDER_AMOUNT, 'C', systemDate, systemDate, orderId]
            });
            transactions.push({
                query: `update wallet_master set BALANCE = (BALANCE + ?) where CUSTOMER_ID = ? `,
                data: [getOrder[0].ORDER_AMOUNT, getOrder[0].CUSTOMER_ID]
            });
            const date = new Date(systemDate.split(' ')[0]);
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            const formattedDate = date.toLocaleDateString('en-GB', options);
            const titleData = '📦 Shipment Cancelled.';
            const bodyData = `Shipment with AWB No. ${getOrder[0].AWB_NO} has been cancelled successfully on ${formattedDate}.`
            notification.sendNotification(titleData, bodyData, 0, getOrder[0].CUSTOMER_ID)
            await m2.executeTransactions(transactions)
            wp.sendCancelShipmentMessage(orderId);
            res.send({
                "code": 200,
                "message": "success"
            })
        }
        else {
            res.send({
                "code": 400,
                "message": "failed"
            })
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        res.send({
            "code": error.status,
            "message": error.message
        })
    }
}

async function placeOrderExpressbees(orderData, productId) {
    let ORDER_DATA = orderData;


    try {


    } catch (error) {
        console.log(error);
        throw { message: error.message, status: 308 }
    }
}

async function cancelShipmentInExpressbees(awb) {

    try {
        token = await generateExpressbeesToken();
        const orderData = {
            "awb": awb
        }
        const response = await axios.post(process.env.EXPRESSBEES_CANCEL_URL, orderData, {
            headers: {
                'Content-Type': "application/json",
                'Authorization': "Bearer " + token
            },
        });

        return response.data;

    } catch (error) {
        throw { message: error.message, status: 305 }
    }
}

async function trackOnExpressbees(awb) {
    try {
        const token = await generateExpressbeesToken()
        const response = await axios.get(`${process.env.EXPRESSBEES_TRACKING_URL}` + awb, {
            headers: {
                'Content-Type': "application/json",
                'Authorization': "Bearer " + token
            },
        });

        return response.data;

    } catch (error) {
        throw { message: error.message, status: 305 }
    }
}

async function generateExpressbeesToken() {
    userData = { email: process.env.EXPRESSBEES_USER, password: process.env.EXPRESSBEES_PASSWORD }
    const response = await axios.post(process.env.EXPRESSBEES_TOKEN_URL, userData, {
        headers: {
            'Content-Type': "application/json"
        },
    });
    if (response.status != 200)
        throw { message: "Erorr while authenticating with expressbees" }
    return response.data.data;
}

exports.shipnowOrderExpressbeesForBulk = async (req, res) => {

    var systemDate = dateUtil.getSystemDate()
    var supportKey = req.headers["supportKey"];
    var orderId = req.body.ORDER_ID;
    var customerId = req.body.CUSTOMER_ID;
    var orderAmount = req.body.ORDER_AMOUNT;
    var serviceId = req.body.SERVICE_ID;
    var carrierId = req.body.CARRIER_ID;
    var productId = req.body.PRODUCT_ID;
    var applicableWeight = req.body.APPLICABLE_WEIGHT;

    var orderData = req.body.orderData;

    try {

        if (process.env.BULK_SHIPMENT_SECRET == req.body.BULK_SHIPMENT_SECRET) {
            if (!orderId || orderId == ' ' || !customerId && customerId == ' ' || !serviceId && serviceId == ' ' || !carrierId || carrierId == ' ' && !productId && productId == ' ')
                throw { message: "Parameter Missing", status: 404 }

            const getOrder = await m2.executeDataQuery(`select * from view_order_master where ID = ? AND ORDER_STATUS = 'P'`, [orderId])

            if (getOrder.length === 0)
                throw { message: "Order not found", status: 304 }

            getBalance = await m2.executeDataQuery(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, [customerId])

            if (getBalance.length <= 0 || getBalance[0].BALANCE < orderAmount)
                throw { message: "Insufficient wallet Amount", status: 307 }

            const token = await generateExpressbeesToken();

            let response = null;
            mm.executeQueryData(`select KEYWORD from view_product_master where ID = ?`, productId, "12345", async (error, getKeyword) => {
                if (error) {
                    console.log(error);
                    throw { message: "fail to get Product information", status: 400 }
                }
                else {
                    orderData.courier_id = getKeyword[0].KEYWORD;
                    orderData.request_auto_pickup = "yes";
                    response2 = await axios.post(process.env.EXPRESSBEES_SHIPPING_URL, orderData, {
                        headers: {
                            'Content-Type': "application/json",
                            'Authorization': "Bearer " + token
                        },
                    });
                    console.log("response", response2.data);
                    response = { awb: response2.data.data['awb_number'], data: JSON.stringify(response2.data) };

                    if (response.awb && response.awb != ' ') {
                        var transactions = [];
                        transactions.push({
                            query: `update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`,
                            data: [orderAmount, customerId]
                        });
                        transactions.push({
                            query: `update order_master set IS_SHIPPED = 1, SHIPPING_DATETIME = ?, AWB_NO = ?, ORDER_AMOUNT = ?, CREATED_MODIFIED_DATE = ?, COURIER_API_DATA = ?, SERVICE_ID = ?, CARRIER_ID = ?, PRODUCT_ID = ?, ORDER_STATUS = 'S', CHARGABLE_WEIGHT = ? where ID = ? `,
                            data: [systemDate, response.awb, orderAmount, systemDate, response.data, serviceId, carrierId, productId, applicableWeight, orderId]
                        });
                        transactions.push({
                            query: `insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`,
                            data: [customerId, 'O', orderAmount, 'D', systemDate, systemDate, orderId]
                        });
                        const date = new Date(systemDate.split(' ')[0]);
                        const options = { day: '2-digit', month: 'long', year: 'numeric' };
                        const formattedDate = date.toLocaleDateString('en-GB', options);
                        const titleData = '📦 Shipment Created.';
                        const bodyData = `Shipment with AWB no. ${response.awb} has been created successfully using Xpressbees for delivery to ${(getOrder[0].DELIVER_TO).trim()} on ${formattedDate}, from ${getOrder[0].PICKUP_PINCODE} (${getOrder[0].PICKUP_CITY_NAME}) ➝ ${getOrder[0].PINCODE} (${getOrder[0].CITY_NAME})`
                        notification.sendNotification(titleData, bodyData, 0, customerId)
                        await m2.executeTransactions(transactions);
                        res.send({
                            "code": 200,
                            "message": "success",
                            "AWB_NO": response.awb
                        })
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "Something went wrong with carrier"
                        })
                    }


                }
            })
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
        res.send({
            "code": error.status,
            "message": error.message
        })
    }
}

exports.createNdrForXpressbees = (req, res) => {
    const ORDER_ID = req.body.ORDER_ID,
        supportKey = req.headers['supportKey'];
    var re_attempt_date = req.body.re_attempt_date ? req.body.re_attempt_date : null;
    var name = req.body.name ? req.body.name : null;
    var address_1 = req.body.address_1 ? req.body.address_1 : null;
    var address_2 = req.body.address_2 ? req.body.address_2 : null;
    var phone = req.body.phone ? req.body.phone : null;
    var reason = req.body.reason ? req.body.reason : null;
    try {
        if (reason && re_attempt_date || phone || (name && (address_1 || address_2))) {
            let payloadData = []
            mm.executeQueryData(`select AWB_NO, MOBILE_NO, ADDRESS, DELIVER_TO, CUSTOMER_ID, ID from order_master where ID = ? AND ORDER_STATUS NOT IN('D', 'C', 'P') AND IS_SHIPPED = 1  AND CARRIER_ID = ?`, [ORDER_ID, 2], supportKey, async (error, getOrderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get orderDetails."
                    })
                }
                else {
                    if (re_attempt_date) {
                        payloadData.push({
                            "awb": getOrderDetails[0].AWB_NO,
                            "action": "re-attempt",
                            "action_data": {
                                "re_attempt_date": re_attempt_date
                            }
                        })
                    }

                    if (phone) {
                        payloadData.push({
                            "awb": getOrderDetails[0].AWB_NO,
                            "action": "change_phone",
                            "action_data": {
                                "phone": phone
                            }
                        })
                    }
                    else {
                        phone = getOrderDetails[0].MOBILE_NO;
                    }


                    if (name && (address_1 || address_2)) {
                        payloadData.push({
                            "awb": getOrderDetails[0].AWB_NO,
                            "action": "change_address",
                            "action_data": {
                                "name": name,
                                "address_1": address_1,
                                "address_2": address_2,

                            }
                        })
                    }
                    else {
                        name = getOrderDetails[0].DELIVER_TO;
                        address_1 = getOrderDetails[0].ADDRESS;
                        address_2 = null;
                    }

                    const token = await generateExpressbeesToken();

                    var options = {
                        'method': 'POST',
                        'url': 'https://shipment.xpressbees.com/api/ndr/create',
                        'headers': {
                            'Authorization': "Bearer " + token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payloadData)

                    };
                    request(options, function (error, response, body) {
                        if (error) {
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "fail to create ndr",
                                "error": error
                            })
                        }
                        else {
                            let data = JSON.parse(body)
                            if (!data.status) {
                                console.log(data);
                                res.send({
                                    "code": 400,
                                    "message": "fail to create ndr",
                                    "error": data
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
                                        mm.executeDML(`insert into ndr_order_master(ORDER_ID, PAYLOAD_DATA, ADDRESS_1, ADDRESS_2, MOBILE_NO, NAME, OLD_ADDRESS_1, OLD_ADDRESS_2, OLD_MOBILE_NO, OLD_NAME, CREATED_MODIFIED_DATE, STATUS, RE_ATTEMPT_DATE, REASON, NDR_STATUS) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [ORDER_ID, body, address_1, address_2, phone, name, getOrderDetails[0].ADDRESS, null, getOrderDetails[0].MOBILE_NO, getOrderDetails[0].DELIVER_TO, mm.getSystemDate(), 'C', re_attempt_date, reason, "R"], supportKey, connection, (error, insertDetails) => {
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

