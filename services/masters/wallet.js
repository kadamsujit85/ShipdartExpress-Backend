const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
const axios = require('axios');
const crypto = require("crypto");
const notification = require('../../utilities/pushNotification')
const request = require('request');

var walletMaster = "wallet_master";
var viewWalletMaster = "view_" + walletMaster;

function reqData(req) {

    var data = {

        CUSTOMER_ID: req.body.CUSTOMER_ID,
        BALANCE: req.body.BALANCE,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        TRANSACTION_ID: req.body.TRANSACTION_ID,

    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID', 'parameter missing').exists(),
        body('BALANCE', 'parameter missing').exists(),
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

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewWalletMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewWalletMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewWalletMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewWalletMaster information."
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
            mm.executeQueryData('INSERT INTO ' + walletMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save walletMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "walletMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + walletMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update walletMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "walletMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.getWalletData = (req, res) => {

    var CUSTOMER_ID = req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? req.body.CUSTOMER_ID : [];
    var supportKey = req.headers['supportkey'];

    try {
        if (CUSTOMER_ID.length > 0) {
            mm.executeQueryData('select * from ' + viewWalletMaster + ' where 1 AND CUSTOMER_ID IN(?) ', CUSTOMER_ID, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get viewWalletMaster information."
                    });
                }
                else {
                    mm.executeQueryData(`select IS_COMPLETED_KYC from kyc_master where CUSTOMER_ID IN(?)`, CUSTOMER_ID, supportKey, (error, kycDetails) => {
                        if (error) {
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to get viewWalletMaster information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "data": results,
                                "kycDetails": kycDetails.length > 0 ? kycDetails : [{ "IS_COMPLETED_KYC": 0 }]
                            });
                        }
                    })
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.rechargeWallet = async (req, res) => {

    var systemDate = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    var CUSTOMER_ID = req.body.CUSTOMER_ID,
        AMOUNT = req.body.AMOUNT,
        PAYMENT_MODE = null,
        TRANSACTION_ID = req.body.TRANSACTION_ID;
    var data = {
        "CUSTOMER_ID": req.body.CUSTOMER_ID,
        "BALANCE": req.body.AMOUNT,
        "CREATED_MODIFIED_DATE": systemDate,
        "TRANSACTION_ID": TRANSACTION_ID
    }
    try {
        let baseAmount = AMOUNT
        if (CUSTOMER_ID && AMOUNT >= 500) {
            const razorpayRes = await axios.get(`https://api.razorpay.com/v1/payments/${TRANSACTION_ID}`, {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID,
                    password: process.env.RAZORPAY_SECRET,
                },
            });
            PAYMENT_MODE = razorpayRes.data.method;
            mm.executeQueryData(`select ID from kyc_master where IS_COMPLETED_KYC = 1 AND CUSTOMER_ID = ?`, CUSTOMER_ID, supportKey, (error, getKycInformation) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save walletMaster information..."
                    });
                }
                else {
                    if (getKycInformation.length > 0) {
                        const connection = mm.openConnection();
                        mm.executeDML(`select ID from transaction_master where CUSTOMER_ID = ? AND TRASACTION_TYPE = 'W'`, CUSTOMER_ID, supportKey, connection, (error, checkTrasanction) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get transactionMaster information..."
                                });
                            }
                            else {
                                let isFirstRecharge = 0
                                if (checkTrasanction.length > 0 || CUSTOMER_ID == 128) {
                                    isFirstRecharge = 0;
                                }
                                else {
                                    isFirstRecharge = 1;
                                }

                                mm.executeDML(`select ID from wallet_master where CUSTOMER_ID = ?;`, [CUSTOMER_ID], supportKey, connection, (error, checkAccount) => {
                                    if (error) {
                                        mm.rollbackConnection(connection)
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save walletMaster information..."
                                        });
                                    }
                                    else {
                                        (isFirstRecharge == 1 && AMOUNT >= 500 && CUSTOMER_ID != 128 ? AMOUNT = AMOUNT + 500 : AMOUNT = AMOUNT);
                                        if (checkAccount.length > 0) {
                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?), CREATED_MODIFIED_DATE = ? where CUSTOMER_ID = ?`, [AMOUNT, systemDate, CUSTOMER_ID], supportKey, connection, async (error, updateWallet) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "fail to update wallet information.."
                                                    })
                                                }
                                                else {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'W', baseAmount, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "fail to insert transaction information."
                                                            })
                                                        }
                                                        else {
                                                            const date = new Date(systemDate.split(' ')[0]);
                                                            const timePart = new Date(systemDate.split(' ')[1]);
                                                            const fullDateTime = new Date(`${date}T${timePart}`);
                                                            const options = {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            };

                                                            const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                            const titleData = '💳 Wallet Recharged.';
                                                            const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                            notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);

                                                            if (isFirstRecharge == 1 && AMOUNT >= 500) {
                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', 500, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "fail to insert transaction information."
                                                                        })
                                                                    }
                                                                    else {
                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "walletMaster information saved successfully...",
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                mm.commitConnection(connection)
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "walletMaster information saved successfully...",
                                                                });
                                                            }
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                        else {
                                            mm.executeDML('INSERT INTO ' + walletMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to save walletMaster information..."
                                                    });
                                                }
                                                else {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'W', AMOUNT, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "fail to insert transaction information."
                                                            })
                                                        }
                                                        else {
                                                            const date = new Date(systemDate.split(' ')[0]);
                                                            const timePart = new Date(systemDate.split(' ')[1]);
                                                            const fullDateTime = new Date(`${date}T${timePart}`);
                                                            const options = {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            };

                                                            const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                            const titleData = '💳 Wallet Recharged.';
                                                            const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                            notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);
                                                            if (isFirstRecharge == 1 && AMOUNT >= 500) {
                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', AMOUNT, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "fail to insert transaction information."
                                                                        })
                                                                    }
                                                                    else {
                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "walletMaster information saved successfully...",
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                mm.commitConnection(connection)
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "walletMaster information saved successfully...",
                                                                });
                                                            }
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 308,
                            "message": "Kyc Pending.."
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

exports.addWalletAmount = (req, res) => {

    var systemDate = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    var CUSTOMER_ID = req.body.CUSTOMER_ID,
        AMOUNT = req.body.AMOUNT,
        USER_ID = req.body.USER_ID,
        EFFECT = req.body.EFFECT;
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && AMOUNT > 0 && USER_ID && USER_ID != ' ' && (EFFECT == 'C' || EFFECT == 'D')) {
            const connection = mm.openConnection();
            let query = '';
            (EFFECT === 'C' ? query = `update wallet_master set BALANCE = BALANCE + ? where CUSTOMER_ID = ? ` : query = `update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ? `);
            mm.executeDML(query, [AMOUNT, CUSTOMER_ID], supportKey, connection, (error, insertWalletAmount) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save walletMaster information..."
                    });
                }
                else {
                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, USER_ID) values(?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', AMOUNT, EFFECT, systemDate, systemDate, USER_ID], supportKey, connection, (error, insertTransaction) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to save transaction information..."
                            });
                        }
                        else {
                            mm.commitConnection(connection);
                            res.send({
                                "code": 200,
                                "message": "success"
                            });
                        }
                    })
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

exports.getCodWalletAmount = (req, res) => {

    var supportKey = req.headers["supportKey"];
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ') {
            mm.executeQueryData(`select sum(IFNULL(COD_AMOUNT,0)) as COD_WALLET_AMOUNT from order_master where CUSTOMER_ID = ? AND COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = "COD"`, CUSTOMER_ID, supportKey, (error, getCodWalletBalance) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get cod wallet information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": getCodWalletBalance
                    })
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

exports.createRechargeOrderForEasebuzz = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const systemDate = mm.getSystemDate()
    let { AMOUNT, FIRST_NAME, EMAIL_ID, MOBILE_NO, productinfo, CUSTOMER_ID } = req.body;
    productinfo = "Recharge"
    try {
        const ENV = process.env.EASEBUZZ_ENV; // or "prod"
        if (CUSTOMER_ID && AMOUNT && FIRST_NAME && EMAIL_ID && MOBILE_NO && productinfo && CUSTOMER_ID) {
            const timestamp = Date.now();
            const randomStr = crypto.randomBytes(4).toString("hex");
            let txnid = `TXN${timestamp}${randomStr}`.substring(0, 25);

            const hashString = `${process.env.EASEBUZZ_MERCHANT_KEY}|${txnid}|${AMOUNT}|${productinfo}|${FIRST_NAME}|${EMAIL_ID}|||||||||||${process.env.EASEBUZZ_SALT_KEY}`;
            const hash = crypto.createHash("sha512").update(hashString).digest("hex");


            const options = {
                method: 'POST',
                url: `https://${ENV == "test" ? ENV : ''}pay.easebuzz.in/payment/initiateLink`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                },
                form: {
                    "key": process.env.EASEBUZZ_MERCHANT_KEY,
                    "txnid": txnid,
                    "amount": AMOUNT,
                    "firstname": FIRST_NAME,
                    "email": EMAIL_ID,
                    "phone": MOBILE_NO,
                    "productinfo": productinfo,
                    "hash": hash,
                    "env": ENV,
                    "unique_id": CUSTOMER_ID
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    throw new Error(error);
                }
                else {
                    console.log(body);
                    let parsedData = JSON.parse(body)
                    if (parsedData.status == 1) {
                        const connection = mm.openConnection()
                        mm.executeDML(`insert into payment_order_master(TRANSACTION_ID, CUSTOMER_ID, PAYMENT_STATUS, CREATED_DATETIME, LAST_UPDATED_DATETIME, KEY_DATA) values(?,?,?,?,?,?)`, [txnid, CUSTOMER_ID, 'P', systemDate, systemDate, parsedData.data], supportKey, connection, (error, insertData) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "failed."
                                })
                            }
                            else {
                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_STATUS, TRANSACTION_ID) values (?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'W', AMOUNT, 'C', systemDate, systemDate, 'P', txnid], supportKey, connection, (error, insertTransaction) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "failed to insert transaction."
                                        })
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "key": process.env.EASEBUZZ_MERCHANT_KEY,
                                            "txnid": txnid,
                                             "unique_id": CUSTOMER_ID,
                                            "access_key": parsedData.data,
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
                            "code": 400,
                            "message": parsedData
                        })
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

exports.successEasebuzz_old = (req, res) => {
    console.log("Payment Success:", req.body);
    res.send("Payment successful");
}

exports.failEasebuzz = (req, res) => {
    console.log("Payment Failed:", req.body);
    res.send({
        "code": 400,
        "message": "Payment Failed"
    });
}

exports.successEasebuzz_old = async (req, res) => {
    var supportKey = req.headers["supportKey"];

    var systemDate = mm.getSystemDate();

    var AMOUNT = parseFloat(req.body.amount),
        CUSTOMER_ID = null,
        PAYMENT_MODE = req.body.mode,
        TRANSACTION_ID = req.body.txnid;
    var data = {
        "BALANCE": parseFloat(req.body.amount),
        "CREATED_MODIFIED_DATE": systemDate,
        "TRANSACTION_ID": TRANSACTION_ID
    }
    try {
        // mm.executeQueryData(`insert into testing(HEADERS, BODY) values(?,?)`, [JSON.stringify(req.headers), JSON.stringify(req.body)], supportKey, (error, insert) => {
        //     if (error) {
        //         console.log(error);
        //         res.send({
        //             "code": 400,
        //             "message": "failed"
        //         })
        //     }
        //     else {
        //         res.send({
        //             "code": 200,
        //             "message": "walletMaster information saved successfully...",
        //         });



        //     }
        // })


        let baseAmount = AMOUNT;
        if (AMOUNT && req.body.status == "success") {
            mm.executeQueryData(`select CUSTOMER_ID from payment_order_master where TRANSACTION_ID = ? AND PAYMENT_STATUS = 'P'`, [TRANSACTION_ID], supportKey, (error, getCustomerId) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get payment order details."
                    })
                }
                else {
                    if (getCustomerId.length > 0) {
                        CUSTOMER_ID = getCustomerId[0].CUSTOMER_ID;
                        data.CUSTOMER_ID = CUSTOMER_ID;
                        mm.executeQueryData(`select ID from kyc_master where IS_COMPLETED_KYC = 1 AND CUSTOMER_ID = ?`, CUSTOMER_ID, supportKey, (error, getKycInformation) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save walletMaster information..."
                                });
                            }
                            else {
                                if (getKycInformation.length > 0) {
                                    const connection = mm.openConnection();
                                    mm.executeDML(`update payment_order_master set PAYMENT_STATUS = 'C' where TRANSACTION_ID = ?`, [TRANSACTION_ID], supportKey, connection, (error, updatePaymentOrder) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update payment Order information..."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`select ID from transaction_master where CUSTOMER_ID = ? AND TRASACTION_TYPE = 'W' AND TRANSACTION_STATUS = 'C'`, CUSTOMER_ID, supportKey, connection, (error, checkTrasanction) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get transactionMaster information..."
                                                    });
                                                }
                                                else {
                                                    let isFirstRecharge = 0
                                                    if (checkTrasanction.length > 0 || CUSTOMER_ID == 128) {
                                                        isFirstRecharge = 0;
                                                    }
                                                    else {
                                                        isFirstRecharge = 1;
                                                    }

                                                    mm.executeDML(`select ID from wallet_master where CUSTOMER_ID = ?;`, [CUSTOMER_ID], supportKey, connection, (error, checkAccount) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to save walletMaster information..."
                                                            });
                                                        }
                                                        else {
                                                            (isFirstRecharge == 1 && AMOUNT >= 5000 && CUSTOMER_ID != 128 ? AMOUNT = AMOUNT + 2000 : AMOUNT = AMOUNT);
                                                            if (checkAccount.length > 0) {
                                                                mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?), CREATED_MODIFIED_DATE = ? where CUSTOMER_ID = ?`, [AMOUNT, systemDate, CUSTOMER_ID], supportKey, connection, async (error, updateWallet) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection);
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "fail to update wallet information.."
                                                                        })
                                                                    }
                                                                    else {
                                                                        let query = `update transaction_master set TRANSACTION_STATUS = 'C', TRANSACTION_DATETIME = ?, PAYMENT_MODE = ? where TRANSACTION_ID = ? `
                                                                        mm.executeDML(query, [systemDate, PAYMENT_MODE, TRANSACTION_ID], supportKey, connection, (error, insertTransactionLog) => {
                                                                            if (error) {
                                                                                mm.rollbackConnection(connection)
                                                                                console.log(error);
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "fail to update transaction information."
                                                                                })
                                                                            }
                                                                            else {
                                                                                const date = new Date(systemDate.split(' ')[0]);
                                                                                const timePart = new Date(systemDate.split(' ')[1]);
                                                                                const fullDateTime = new Date(`${date}T${timePart}`);
                                                                                const options = {
                                                                                    day: '2-digit',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                };

                                                                                const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                                                const titleData = '💳 Wallet Recharged.';
                                                                                const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                                                notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);

                                                                                if (isFirstRecharge == 1 && AMOUNT >= 5000) {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', 2000, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                                        if (error) {
                                                                                            mm.rollbackConnection(connection)
                                                                                            console.log(error);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "fail to insert transaction information."
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            mm.commitConnection(connection)
                                                                                            res.send({
                                                                                                "code": 200,
                                                                                                "message": "walletMaster information saved successfully...",
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    mm.commitConnection(connection)
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "walletMaster information saved successfully...",
                                                                                    });
                                                                                }
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                mm.executeDML('INSERT INTO ' + walletMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to save walletMaster information..."
                                                                        });
                                                                    }
                                                                    else {
                                                                        let query = `update transaction_master set TRANSACTION_STATUS = 'C', TRANSACTION_DATETIME = ?, PAYMENT_MODE = ? where TRANSACTION_ID = ? `
                                                                        mm.executeDML(query, [systemDate, PAYMENT_MODE, TRANSACTION_ID], supportKey, connection, (error, insertTransactionLog) => {
                                                                            if (error) {
                                                                                mm.rollbackConnection(connection)
                                                                                console.log(error);
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "fail to insert transaction information."
                                                                                })
                                                                            }
                                                                            else {
                                                                                const date = new Date(systemDate.split(' ')[0]);
                                                                                const timePart = new Date(systemDate.split(' ')[1]);
                                                                                const fullDateTime = new Date(`${date}T${timePart}`);
                                                                                const options = {
                                                                                    day: '2-digit',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                };

                                                                                const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                                                const titleData = '💳 Wallet Recharged.';
                                                                                const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                                                notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);
                                                                                if (isFirstRecharge == 1 && AMOUNT >= 5000) {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', AMOUNT, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                                        if (error) {
                                                                                            mm.rollbackConnection(connection)
                                                                                            console.log(error);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "fail to insert transaction information."
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            mm.commitConnection(connection)
                                                                                            res.send({
                                                                                                "code": 200,
                                                                                                "message": "walletMaster information saved successfully...",
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    mm.commitConnection(connection)
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "walletMaster information saved successfully...",
                                                                                    });
                                                                                }
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                            }
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
                                        "message": "Kyc Pending.."
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "wrong order."
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

exports.successEasebuzz = async (req, res) => {
    var supportKey = req.headers["supportKey"];

    var systemDate = mm.getSystemDate();

    var AMOUNT = parseFloat(req.body.amount),
        CUSTOMER_ID = null,
        PAYMENT_MODE = req.body.mode,
        TRANSACTION_ID = req.body.txnid;
    var data = {
        "BALANCE": parseFloat(req.body.amount),
        "CREATED_MODIFIED_DATE": systemDate,
        "TRANSACTION_ID": TRANSACTION_ID
    }
    try {
        // mm.executeQueryData(`insert into testing(HEADERS, BODY) values(?,?)`, [JSON.stringify(req.headers), JSON.stringify(req.body)], supportKey, (error, insert) => {
        //     if (error) {
        //         console.log(error);
        //         res.send({
        //             "code": 400,
        //             "message": "failed"
        //         })
        //     }
        //     else {
        //         res.send({
        //             "code": 200,
        //             "message": "walletMaster information saved successfully...",
        //         });



        //     }
        // })


        let baseAmount = AMOUNT;
        if (AMOUNT && req.body.status == "success") {
            mm.executeQueryData(`select CUSTOMER_ID from payment_order_master where TRANSACTION_ID = ? AND PAYMENT_STATUS = 'P'`, [TRANSACTION_ID], supportKey, (error, getCustomerId) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get payment order details."
                    })
                }
                else {
                    if (getCustomerId.length > 0) {
                        CUSTOMER_ID = getCustomerId[0].CUSTOMER_ID;
                        data.CUSTOMER_ID = CUSTOMER_ID;
                        mm.executeQueryData(`select ID from kyc_master where IS_COMPLETED_KYC = 1 AND CUSTOMER_ID = ?`, CUSTOMER_ID, supportKey, (error, getKycInformation) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save walletMaster information..."
                                });
                            }
                            else {
                                if (getKycInformation.length > 0) {
                                    const connection = mm.openConnection();
                                    mm.executeDML(`update payment_order_master set PAYMENT_STATUS = 'C' where TRANSACTION_ID = ?`, [TRANSACTION_ID], supportKey, connection, (error, updatePaymentOrder) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update payment Order information..."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`select ID from transaction_master where CUSTOMER_ID = ? AND TRASACTION_TYPE = 'W' AND TRANSACTION_STATUS = 'C'`, CUSTOMER_ID, supportKey, connection, (error, checkTrasanction) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get transactionMaster information..."
                                                    });
                                                }
                                                else {
                                                    let isFirstRecharge = 0
                                                    if (checkTrasanction.length > 0 || CUSTOMER_ID == 128) {
                                                        isFirstRecharge = 0;
                                                    }
                                                    else {
                                                        isFirstRecharge = 1;
                                                    }

                                                    mm.executeDML(`select ID from wallet_master where CUSTOMER_ID = ?;`, [CUSTOMER_ID], supportKey, connection, (error, checkAccount) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to save walletMaster information..."
                                                            });
                                                        }
                                                        else {
                                                            (isFirstRecharge == 1 && AMOUNT >= 1000 && CUSTOMER_ID != 128 ? AMOUNT = AMOUNT + 500 : AMOUNT = AMOUNT);
                                                            if (checkAccount.length > 0) {
                                                                mm.executeDML(`update wallet_master set BALANCE = (BALANCE + ?), CREATED_MODIFIED_DATE = ? where CUSTOMER_ID = ?`, [AMOUNT, systemDate, CUSTOMER_ID], supportKey, connection, async (error, updateWallet) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection);
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "fail to update wallet information.."
                                                                        })
                                                                    }
                                                                    else {
                                                                        let query = `update transaction_master set TRANSACTION_STATUS = 'C', TRANSACTION_DATETIME = ?, PAYMENT_MODE = ? where TRANSACTION_ID = ? `
                                                                        mm.executeDML(query, [systemDate, PAYMENT_MODE, TRANSACTION_ID], supportKey, connection, (error, insertTransactionLog) => {
                                                                            if (error) {
                                                                                mm.rollbackConnection(connection)
                                                                                console.log(error);
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "fail to update transaction information."
                                                                                })
                                                                            }
                                                                            else {
                                                                                const date = new Date(systemDate.split(' ')[0]);
                                                                                const timePart = new Date(systemDate.split(' ')[1]);
                                                                                const fullDateTime = new Date(`${date}T${timePart}`);
                                                                                const options = {
                                                                                    day: '2-digit',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                };

                                                                                const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                                                const titleData = '💳 Wallet Recharged.';
                                                                                const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                                                notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);

                                                                                if (isFirstRecharge == 1 && AMOUNT >= 1000) {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', 500, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                                        if (error) {
                                                                                            mm.rollbackConnection(connection)
                                                                                            console.log(error);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "fail to insert transaction information."
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            mm.commitConnection(connection)
                                                                                            res.send({
                                                                                                "code": 200,
                                                                                                "message": "walletMaster information saved successfully...",
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    mm.commitConnection(connection)
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "walletMaster information saved successfully...",
                                                                                    });
                                                                                }
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                mm.executeDML('INSERT INTO ' + walletMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to save walletMaster information..."
                                                                        });
                                                                    }
                                                                    else {
                                                                        let query = `update transaction_master set TRANSACTION_STATUS = 'C', TRANSACTION_DATETIME = ?, PAYMENT_MODE = ? where TRANSACTION_ID = ? `
                                                                        mm.executeDML(query, [systemDate, PAYMENT_MODE, TRANSACTION_ID], supportKey, connection, (error, insertTransactionLog) => {
                                                                            if (error) {
                                                                                mm.rollbackConnection(connection)
                                                                                console.log(error);
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": "fail to insert transaction information."
                                                                                })
                                                                            }
                                                                            else {
                                                                                const date = new Date(systemDate.split(' ')[0]);
                                                                                const timePart = new Date(systemDate.split(' ')[1]);
                                                                                const fullDateTime = new Date(`${date}T${timePart}`);
                                                                                const options = {
                                                                                    day: '2-digit',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                };

                                                                                const formattedDate = fullDateTime.toLocaleString('en-GB', options);
                                                                                const titleData = '💳 Wallet Recharged.';
                                                                                const bodyData = `Your wallet has been successfully recharged with ₹${AMOUNT} on ${formattedDate}.\nTransaction No: ${TRANSACTION_ID}.`;
                                                                                notification.sendNotification(titleData, bodyData, 0, CUSTOMER_ID);
                                                                                if (isFirstRecharge == 1 && AMOUNT >= 1000) {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, PAYMENT_MODE) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', AMOUNT, 'C', systemDate, systemDate, TRANSACTION_ID, PAYMENT_MODE], supportKey, connection, (error, insertTransactionLog) => {
                                                                                        if (error) {
                                                                                            mm.rollbackConnection(connection)
                                                                                            console.log(error);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "fail to insert transaction information."
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            mm.commitConnection(connection)
                                                                                            res.send({
                                                                                                "code": 200,
                                                                                                "message": "walletMaster information saved successfully...",
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    mm.commitConnection(connection)
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "walletMaster information saved successfully...",
                                                                                    });
                                                                                }
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                            }
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
                                        "message": "Kyc Pending.."
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "wrong order."
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