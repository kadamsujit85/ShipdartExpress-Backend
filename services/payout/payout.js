const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
const axios = require('axios');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const xlsx = require("xlsx");
const async = require("async");

var payoutMaster = "payout_master";
var viewPayoutMaster = "view_" + payoutMaster;

function reqData(req) {

    var data = {

        PAYOUT_DATETIME: req.body.PAYOUT_DATETIME,
        CREATED_DATETIME: req.body.CREATED_DATETIME,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        TOTAL_ORDER: req.body.TOTAL_ORDER,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT,
        STATUS: req.body.STATUS,
        FILE_URL: req.body.FILE_URL,
        PAYOUT_NO: req.body.PAYOUT_NO,
    }
    return data;
}

exports.validate = function () {
    return [
        body('PAYOUT_DATETIME', 'parameter missing').exists(),
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

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '')
    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewPayoutMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewPayoutMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewPayoutMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewPayoutMaster information."
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
    const systemDate = mm.getSystemDate();
    data.CREATED_MODIFIED_DATE = systemDate;
    data.CREATED_DATETIME = systemDate;
    data.STATUS = 'P';
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
            data.PAYOUT_NO = (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];

            mm.executeQueryData('INSERT INTO ' + payoutMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save payoutMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "payoutMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + payoutMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update payoutMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "payoutMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.makePayout_old = (req, res) => {

    const ORDER_ID = req.body.ORDER_ID,
        USER_ID = req.body.USER_ID,
        supportKey = req.headers['supportKey'];
    const systemDate = mm.getSystemDate();
    try {
        if (ORDER_ID && ORDER_ID != ' ' && USER_ID && USER_ID != ' ') {
            mm.executeQueryData(`select CUSTOMER_ID, COD_PAID_AMOUNT from order_master where ID = ? AND PAYMENT_MODE = 'COD' AND ORDER_STATUS = 'D'`, ORDER_ID, supportKey, (error, getOrderData) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get orderData."
                    })
                }
                else {
                    if (getOrderData.length > 0 && getOrderData[0].COD_PAID_AMOUNT == 0) {
                        mm.executeQueryData(`select sum(PER_UNIT_PRICE * TOTAL_UNIT) as COD_AMOUNT from order_details where ORDER_ID = ? `, ORDER_ID, supportKey, (error, getCodAmount) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "fail to get order amount Details."
                                })
                            }
                            else {
                                if (getCodAmount.length > 0) {
                                    mm.executeQueryData(`select ACCOUNT_HOLDERS_NAME, ACCOUNT_NO, IFSC_CODE from view_customer_bank_details where CUSTOMER_ID = ?`, [getOrderData[0].CUSTOMER_ID], supportKey, async (error, getCustomerBankDetails) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "fail to get customerBankDetails."
                                            })
                                        }
                                        else {

                                            if (getCustomerBankDetails.length > 0) {
                                                const key_id = process.env.KEY_ID;
                                                const key_secret = process.env.KEY_SECRET;
                                                const account_number = process.env.X_ACCOUNT_NO;

                                                const auth = {
                                                    username: key_id,
                                                    password: key_secret
                                                };
                                                const contact = await axios.post('https://api.razorpay.com/v1/contacts', {
                                                    name: getCustomerBankDetails[0].ACCOUNT_HOLDERS_NAME,
                                                    contact: getCustomerBankDetails[0].MOBILE_NO,
                                                    email: getCustomerBankDetails[0].EMAIL_ID,
                                                    type: 'customer'
                                                }, { auth });

                                                const contact_id = contact.data.id;
                                                const fund = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
                                                    contact_id,
                                                    account_type: 'bank_account',
                                                    bank_account: {
                                                        name: getCustomerBankDetails[0].ACCOUNT_HOLDERS_NAME,
                                                        ifsc: getCustomerBankDetails[0].IFSC_CODE,
                                                        account_number: getCustomerBankDetails[0].ACCOUNT_NO
                                                    }
                                                }, { auth });
                                                const fund_account_id = fund.data.id;
                                                const payout = await axios.post('https://api.razorpay.com/v1/payouts', {
                                                    account_number,
                                                    fund_account_id,
                                                    amount: getCodAmount[0].COD_AMOUNT * 100,
                                                    currency: 'INR',
                                                    mode: 'IMPS',
                                                    purpose: 'payout',
                                                    queue_if_low_balance: true
                                                }, {
                                                    auth,
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    }
                                                });

                                                if (!payout.data.failure_reason) {
                                                    const connection = mm.openConnection()
                                                    mm.executeDML(`update order_master set COD_PAID_AMOUNT = ?, PAYOUT_TRANSACTION_ID = ? where ID = ?`, [getCodAmount[0].COD_AMOUNT, payout.data.id, ORDER_ID], supportKey, connection, (error, updateCod) => {
                                                        if (error) {
                                                            console.log(error);
                                                            mm.rollbackConnection(connection)
                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                            res.send({
                                                                "code": 400,
                                                                "message": "fail to get customerBankDetails."
                                                            })
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID, USER_ID, TRANSACTION_ID) values(?,?,?,?,?,?,?,?,?)`, [getOrderData[0].CUSTOMER_ID, 'P', getCodAmount[0].COD_AMOUNT, 'C', systemDate, systemDate, ORDER_ID, USER_ID, payout.data.id], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection)
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "fail to insert transaction."
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
                                                        "code": 304,
                                                        "message": "something went wrong"
                                                    })
                                                }
                                            }
                                            else {
                                                res.send({
                                                    "code": 304,
                                                    "message": "dank detail not found.."
                                                })
                                            }
                                        }
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 204,
                                        "message": "No order Details Found"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 204,
                            "message": "No order Found"
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.uploadPayout = function (req, res) {
    const supportKey = req.headers['supportKey']
    const systemDate = mm.getSystemDate();
    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = systemDate;
    data.CREATED_DATETIME = systemDate;
    data.STATUS = 'C';
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            const USER_ID = fields.USER_ID;
            if (USER_ID && USER_ID != ' ') {
                const convertedFilename = mm.getTimeDate() + ".csv"
                var newPath = path.join(__dirname, '../../uploads/payout') + '/' + convertedFilename;
                var rawData = fs.readFileSync(oldPath)
                fs.writeFile(newPath, rawData, async function (err) {
                    if (!err) {
                        console.log('uploaded successfully..');
                        var jsonData = await importExcel(newPath);
                        if (jsonData.length > 0) {
                            const connection = mm.openConnection();
                            async.eachSeries(jsonData, function iteratorOverElems(payoutData, callback) {
                                let EMAIL_ID = payoutData.EMAIL_ID;
                                let UTR_ID = payoutData.UTR_ID;
                                let DELIVERED_DATE = payoutData.DELIVERED_DATE;
                                let PAID_DATE = payoutData.PAID_DATE;

                                mm.executeDML(`select ID from customer_master where EMAIL_ID = ?`, EMAIL_ID, supportKey, connection, (error, checkCustomer) => {
                                    if (error) {
                                        callback(error)
                                    }
                                    else {
                                        if (checkCustomer.length > 0) {
                                            mm.executeDML(`select BALANCE from wallet_master where CUSTOMER_ID = ?`, checkCustomer[0].ID, supportKey, connection, (error, walletAmount) => {
                                                if (error) {
                                                    callback(error)
                                                }
                                                else {
                                                    let WALLET_BALANCE = (walletAmount[0].BALANCE >= 0 ? 0 : (walletAmount[0].BALANCE * (-1)))
                                                    mm.executeDML(`select ID, COD_AMOUNT as TOTAL_COD_AMOUNT from order_master where CUSTOMER_ID = ? AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND COD_PAID_AMOUNT = 0 AND PAYMENT_MODE = 'COD'`, [checkCustomer[0].ID, DELIVERED_DATE], supportKey, connection, (error, getTotalAmt) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            if (getTotalAmt.length > 0) {
                                                                mm.executeDML(`update order_master set COD_PAID_AMOUNT = (COD_AMOUNT * 0.98), PAYOUT_DATETIME = ?, PAYOUT_TRANSACTION_ID = ? where COD_PAID_AMOUNT = 0 AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = ?  AND PAYMENT_MODE = 'COD'`, [PAID_DATE, UTR_ID, DELIVERED_DATE, checkCustomer[0].ID], supportKey, connection, (error, updateCodAmt) => {
                                                                    if (error) {
                                                                        callback(error)
                                                                    }
                                                                    else {
                                                                        let query = '';
                                                                        let queryData = [];
                                                                        let payoutAmount = 0;
                                                                        for (let i = 0; i < updateCodAmt.length; i++) {
                                                                            query += `insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID, USER_ID, TRANSACTION_ID) values ?`
                                                                            queryData.push([checkCustomer[0].ID, 'P', updateCodAmt[i].TOTAL_COD_AMOUNT, 'C', PAID_DATE, systemDate, updateCodAmt[i].ID, USER_ID, UTR_ID])
                                                                            payoutAmount = payoutAmount + updateCodAmt[i].TOTAL_COD_AMOUNT;
                                                                        }
                                                                        let amt = (WALLET_BALANCE > 0 && payoutAmount > WALLET_BALANCE ? true : false);
                                                                        if (amt) {
                                                                            query += `insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID, USER_ID) values ?`
                                                                            queryData.push([checkCustomer[0].ID, 'A', WALLET_BALANCE, 'D', systemDate, systemDate, 0, USER_ID])
                                                                            query += `update wallet_master set BALANCE = BALANCE + ? where CUSTOMER_ID = ?`;
                                                                            queryData.push([WALLET_BALANCE, checkCustomer[0].ID])
                                                                        }
                                                                        mm.executeDML(query, queryData, supportKey, connection, (error, insertTransactionDetails) => {
                                                                            if (error) {
                                                                                callback(error)
                                                                            }
                                                                            else {
                                                                                callback()
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                            else {
                                                                callback()
                                                            }
                                                        }
                                                    })
                                                }
                                            })

                                        }
                                        else {
                                            callback()
                                        }
                                    }
                                })
                            }, function subCb(error) {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to Insert details..."
                                    });
                                }
                                else {
                                    data.PAYOUT_DATETIME = systemDate
                                    data.FILE_URL = convertedFilename;
                                    data.PAYOUT_NO = (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];

                                    mm.executeDML('INSERT INTO ' + payoutMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save payoutMaster information..."
                                            });
                                        }
                                        else {
                                            mm.commitConnection(connection)
                                            res.send({
                                                "code": 200,
                                                "message": "payoutMaster information saved successfully...",
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            res.send({
                                "code": 404,
                                "message": "Parameter or no data in file"
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
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing.."
                })
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}

const importExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return sheetData;
};

exports.getCustomerPayoutDetails_old = (req, res) => {
    var supportKey = req.headers['supportkey'],
        FROM_DATE = req.body.FROM_DATE,
        TO_DATE = req.body.TO_DATE;

    try {
        if (FROM_DATE && FROM_DATE != ' ' && TO_DATE && TO_DATE != ' ') {
            mm.executeQueryData(`select cm.ID, cm.NAME as CUSTOMER_NAME, cm.FIRM_NAME, (SELECT IFNULL(sum(COD_AMOUNT),0) from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = cm.ID) AS TOTAL_COD_AMOUNT, (SELECT count(ID) from order_master where COD_PAID_AMOUNT = 0  AND PAYMENT_MODE = 'COD' AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = cm.ID) AS TOTAL_ORDERS, (select BALANCE from wallet_master where CUSTOMER_ID = cm.ID) as WALLET_BALANCE FROM customer_master cm where (SELECT IFNULL(SUM(COD_AMOUNT), 0) FROM order_master WHERE COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND DATE(ORDER_STATUS_UPDATED_DATETIME) BETWEEN ? AND ? AND CUSTOMER_ID = cm.ID) > 0`, [FROM_DATE, TO_DATE, FROM_DATE, TO_DATE, FROM_DATE, TO_DATE], supportKey, (error, getCodDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get cod information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": getCodDetails
                    })
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
    }
}

exports.getCustomerPayoutDetails_old = (req, res) => {
    var supportKey = req.headers['supportkey'],
        DELIVERED_DATE = req.body.DELIVERED_DATE;

    try {
        if (DELIVERED_DATE && DELIVERED_DATE != ' ') {
            mm.executeQueryData(`select cm.ID, cm.NAME as CUSTOMER_NAME, cm.FIRM_NAME, (SELECT IFNULL(sum(COD_AMOUNT),0) from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = cm.ID) * 0.98 AS TOTAL_COD_AMOUNT, (SELECT count(ID) from order_master where COD_PAID_AMOUNT = 0  AND PAYMENT_MODE = 'COD' AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = cm.ID) AS TOTAL_ORDERS, (select BALANCE from wallet_master where CUSTOMER_ID = cm.ID) as WALLET_BALANCE FROM customer_master cm where (SELECT IFNULL(SUM(COD_AMOUNT), 0) FROM order_master WHERE COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND DATE(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = cm.ID) > 0`, [DELIVERED_DATE, DELIVERED_DATE, DELIVERED_DATE], supportKey, (error, getCodDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get cod information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": getCodDetails
                    })
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
    }
}

exports.makePayout_old = (req, res) => {

    const FROM_DATE = req.body.FROM_DATE,
        TO_DATE = req.body.TO_DATE,
        CUSTOMER_ID = req.body.CUSTOMER_ID,
        USER_ID = req.body.USER_ID,
        UTR_NO = req.body.UTR_NO,
        PAYOUT_DATETIME = req.body.PAYOUT_DATETIME,
        supportKey = req.headers['supportKey'],
        systemDate = mm.getSystemDate();
    try {
        if (FROM_DATE && FROM_DATE != ' ' && TO_DATE && TO_DATE != ' ' && USER_ID && USER_ID != ' ' && CUSTOMER_ID && CUSTOMER_ID != ' ', PAYOUT_DATETIME && PAYOUT_DATETIME != ' ' && UTR_NO && UTR_NO != ' ') {
            mm.executeQueryData(`SELECT count(ID) AS TOTAL_ORDERS from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = ?  AND PAYMENT_MODE = 'COD';
            SELECT IFNULL(sum(COD_AMOUNT),0) as TOTAL_COD_AMOUNT from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = ?  AND PAYMENT_MODE = 'COD';
            SELECT BALANCE from wallet_master where CUSTOMER_ID = ?;
            `, [FROM_DATE, TO_DATE, CUSTOMER_ID, FROM_DATE, TO_DATE, CUSTOMER_ID, CUSTOMER_ID], supportKey, (error, getOrderAndCodDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order amount information.."
                    })
                }
                else {
                    let totalorders = getOrderAndCodDetails[0][0].TOTAL_ORDERS;
                    let codAmount = getOrderAndCodDetails[1][0].TOTAL_COD_AMOUNT;
                    let walletBalance = getOrderAndCodDetails[2][0].BALANCE;

                    mm.executeQueryData(`select ID, AWB_NO, COD_AMOUNT from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = ? AND PAYMENT_MODE = 'COD';`, [FROM_DATE, TO_DATE, CUSTOMER_ID], supportKey, (error, getOrderData) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "fail to get order information.."
                            })
                        }
                        else {
                            let deductableAmount = (walletBalance >= 0 ? 0 : (walletBalance * (-1) >= codAmount) ? codAmount : (walletBalance * (-1) < codAmount ? codAmount - walletBalance : null))

                            if ((deductableAmount == 0 || deductableAmount) && deductableAmount != null) {
                                const connection = mm.openConnection();
                                mm.executeDML(`update order_master set COD_PAID_AMOUNT = COD_AMOUNT where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) between ? AND ? AND CUSTOMER_ID = ?;`, [FROM_DATE, TO_DATE, CUSTOMER_ID], supportKey, connection, (error, updateCodAmount) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "fail to update order cod amount.."
                                        })
                                    }
                                    else {



                                        let PAYOUT_NO = (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];
                                        mm.executeDML(`insert into payout_master(PAYOUT_DATETIME, CREATED_DATETIME, CREATED_MODIFIED_DATE, TOTAL_ORDER, TOTAL_AMOUNT, STATUS, PAYOUT_NO, UTR_NO, FROM_DATE, TO_DATE, WALLET_DEDUCTION_AMOUNT, ACTUAL_PAYOUT_PAID_AMOUNT, CUSTOMER_ID, USER_ID) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [PAYOUT_DATETIME, systemDate, systemDate, totalorders, codAmount, 'C', PAYOUT_NO, UTR_NO, FROM_DATE, TO_DATE, deductableAmount, (codAmount - deductableAmount), CUSTOMER_ID, USER_ID], supportKey, connection, (error, insertPayout) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to insert payoutMaster Information."
                                                })
                                            }
                                            else {
                                                let walletAdjustmentAmt = 0;
                                                let recordData = [];
                                                let recordData2 = [];
                                                let remainingCodAmount = deductableAmount;
                                                if (walletBalance >= 0) {
                                                    for (let i = 0; i < getOrderData.length; i++) {
                                                        let difference = 0;
                                                        if (getOrderData[i].COD_AMOUNT <= remainingCodAmount) {
                                                            difference = getOrderData[i].COD_AMOUNT;
                                                            remainingCodAmount = remainingCodAmount - difference;
                                                        }
                                                        else if (getOrderData[i].COD_AMOUNT >= remainingCodAmount) {
                                                            difference = remainingCodAmount;
                                                            remainingCodAmount = remainingCodAmount - difference;
                                                        }
                                                        walletAdjustmentAmt = walletAdjustmentAmt + difference;
                                                        let rec = [getOrderData[i].AWB_NO, getOrderData[i].COD_AMOUNT, systemDate, insertPayout.insertId, getOrderData[i].ID, (getOrderData[i].COD_AMOUNT - difference)]
                                                        let rec2 = [CUSTOMER_ID, 'P', (getOrderData[i].COD_AMOUNT - difference), "D", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID]
                                                        recordData.push(rec);
                                                        recordData2.push(rec2);

                                                    }
                                                }
                                                else {
                                                    for (let i = 0; i < getOrderData.length; i++) {
                                                        let rec = [getOrderData[i].AWB_NO, getOrderData[i].COD_AMOUNT, systemDate, insertPayout.insertId, getOrderData[i].ID, getOrderData[i].COD_AMOUNT];
                                                        let rec2 = [CUSTOMER_ID, 'P', getOrderData[i].COD_AMOUNT, "C", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID]
                                                        recordData.push(rec)
                                                        recordData2.push(rec2)
                                                    }
                                                }

                                                mm.executeDML(`insert into payout_details(AWB_NO, AMOUNT, CREATED_MODIFIED_DATE, PAYOUT_ID, ORDER_ID, PAID_AMOUNT) values ?`, [recordData], supportKey, connection, (error, insertPayoutDetails) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "fail to insert payoutDetails Information."
                                                        })
                                                    }
                                                    else {
                                                        mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, ORDER_ID, USER_ID) values ?`, [recordData2], supportKey, connection, (error, insertTransactions) => {
                                                            if (error) {
                                                                console.log(error);
                                                                mm.rollbackConnection(connection);
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "fail to insert payout transaction Information."
                                                                })
                                                            }
                                                            else {
                                                                if (walletAdjustmentAmt > 0) {
                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, ORDER_ID, USER_ID) values(?,?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', walletAdjustmentAmt, "D", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID], supportKey, connection, (error, insertTransaction) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            mm.rollbackConnection(connection);
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "fail to insert adjustment transaction Information."
                                                                            })
                                                                        }
                                                                        else {
                                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE + ? where CUSTOMER_ID = ?`, [walletAdjustmentAmt, CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                                                if (error) {
                                                                                    console.log(error);
                                                                                    mm.rollbackConnection(connection);
                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                    res.send({
                                                                                        "code": 400,
                                                                                        "message": "fail to update wallet Information."
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
                                                                    mm.commitConnection(connection)
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "success"
                                                                    })
                                                                }
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
                                    "code": 304,
                                    "message": "amount condition not satisfied"
                                })
                            }
                        }
                    })
                }
            })
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.makePayout = (req, res) => {

    let DELIVERED_DATE = req.body.DELIVERED_DATE,
        CUSTOMER_ID = req.body.CUSTOMER_ID,
        USER_ID = req.body.USER_ID,
        UTR_NO = req.body.UTR_NO,
        PAYOUT_DATETIME = req.body.PAYOUT_DATETIME,
        supportKey = req.headers['supportKey'],
        systemDate = mm.getSystemDate();
    try {
        if (DELIVERED_DATE && DELIVERED_DATE != ' ' && USER_ID && USER_ID != ' ' && CUSTOMER_ID && CUSTOMER_ID != ' ', PAYOUT_DATETIME && PAYOUT_DATETIME != ' ' && UTR_NO && UTR_NO != ' ') {
            mm.executeQueryData(`select COD_SETTLEMENT_DAYS, PAYOUT_COMMISSION_RATE from customer_master where ID = ?`, CUSTOMER_ID, supportKey, (error, getCommissionDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get commission information.."
                    })
                }
                else {
                    if (getCommissionDetails.length > 0) {
                        let days = getCommissionDetails[0].COD_SETTLEMENT_DAYS;
                        let dateObj = new Date(DELIVERED_DATE);
                        dateObj.setDate(dateObj.getDate() - days);
                        DELIVERED_DATE = dateObj.toISOString().split('T')[0];
                        const date1 = new Date(DELIVERED_DATE);
                        const date2 = new Date(systemDate.split(' ')[0]);
                        const diffTime = Math.abs(date2 - date1);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= parseFloat(getCommissionDetails[0].COD_SETTLEMENT_DAYS)) {
                            mm.executeQueryData(`select ID from payout_master where DELIVERED_DATE = ? AND CUSTOMER_ID = ?`, [DELIVERED_DATE, CUSTOMER_ID], supportKey, (error, checkPayoutDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to check payoutMaster information.."
                                    })
                                }
                                else {
                                    if (checkPayoutDetails.length == 0) {
                                        mm.executeQueryData(`SELECT count(ID) AS TOTAL_ORDERS from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = ? AND PAYMENT_MODE = 'COD';
            SELECT IFNULL(sum(COD_AMOUNT),0) as TOTAL_COD_AMOUNT from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = ?  AND PAYMENT_MODE = 'COD';
            SELECT BALANCE from wallet_master where CUSTOMER_ID = ?;
            `, [DELIVERED_DATE, CUSTOMER_ID, DELIVERED_DATE, CUSTOMER_ID, CUSTOMER_ID], supportKey, (error, getOrderAndCodDetails) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to get order amount information.."
                                                })
                                            }
                                            else {
                                                let totalorders = getOrderAndCodDetails[0][0].TOTAL_ORDERS;
                                                let codAmount = getOrderAndCodDetails[1][0].TOTAL_COD_AMOUNT;
                                                let walletBalance = getOrderAndCodDetails[2][0].BALANCE;

                                                mm.executeQueryData(`select ID, AWB_NO, COD_AMOUNT from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = ? AND PAYMENT_MODE = 'COD';`, [DELIVERED_DATE, CUSTOMER_ID], supportKey, (error, getOrderData) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "fail to get order information.."
                                                        })
                                                    }
                                                    else {
                                                        let deductableAmount = walletBalance > 0 ? 0 : walletBalance * -1;
                                                        let percentageAmount = (100 - parseFloat(getCommissionDetails[0].PAYOUT_COMMISSION_RATE)) / 100;
                                                        let orderAmount = (codAmount * percentageAmount)
                                                        let payableAmount = 0;
                                                        let actualDeductableAmount = 0;

                                                        if (deductableAmount == 0) {
                                                            payableAmount = orderAmount;
                                                            actualDeductableAmount = 0;
                                                        }
                                                        else {
                                                            if (orderAmount < deductableAmount) {
                                                                payableAmount = 0;
                                                                actualDeductableAmount = orderAmount;
                                                            }
                                                            else {
                                                                payableAmount = orderAmount - deductableAmount;
                                                                actualDeductableAmount = deductableAmount;
                                                            }
                                                        }

                                                        if ((deductableAmount == 0 || deductableAmount) && deductableAmount != null) {
                                                            const connection = mm.openConnection();
                                                            mm.executeDML(`update order_master set COD_PAID_AMOUNT = COD_AMOUNT * ? where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = ? AND CUSTOMER_ID = ? AND PAYMENT_MODE = 'COD';`, [percentageAmount, DELIVERED_DATE, CUSTOMER_ID], supportKey, connection, (error, updateCodAmount) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection);
                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "fail to update order cod amount.."
                                                                    })
                                                                }
                                                                else {
                                                                    let PAYOUT_NO = (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];

                                                                    mm.executeDML(`insert into payout_master(PAYOUT_DATETIME, CREATED_DATETIME, CREATED_MODIFIED_DATE, TOTAL_ORDER, TOTAL_AMOUNT, STATUS, PAYOUT_NO, UTR_NO, DELIVERED_DATE, WALLET_DEDUCTION_AMOUNT, ACTUAL_PAYOUT_PAID_AMOUNT, CUSTOMER_ID, USER_ID) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [PAYOUT_DATETIME, systemDate, systemDate, totalorders, codAmount, 'C', PAYOUT_NO, UTR_NO, DELIVERED_DATE, actualDeductableAmount, payableAmount, CUSTOMER_ID, USER_ID], supportKey, connection, (error, insertPayout) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            mm.rollbackConnection(connection);
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "fail to insert payoutMaster Information."
                                                                            })
                                                                        }
                                                                        else {
                                                                            let recordData = [];
                                                                            let recordData2 = [];
                                                                            let remainingCodAmount = actualDeductableAmount;

                                                                            for (let i = 0; i < getOrderData.length; i++) {
                                                                                if (getOrderData[i].COD_AMOUNT * percentageAmount <= remainingCodAmount && remainingCodAmount != 0) {
                                                                                    let rec = [getOrderData[i].AWB_NO, getOrderData[i].COD_AMOUNT, systemDate, insertPayout.insertId, getOrderData[i].ID, 0, (getOrderData[i].COD_AMOUNT *percentageAmount)];
                                                                                    remainingCodAmount = remainingCodAmount - (getOrderData[i].COD_AMOUNT * percentageAmount)

                                                                                    let rec2 = [CUSTOMER_ID, 'P', 0, "D", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID]
                                                                                    recordData.push(rec);
                                                                                    recordData2.push(rec2);
                                                                                }
                                                                                else {
                                                                                    let rec = []
                                                                                    let rec2 = []
                                                                                    if (remainingCodAmount == 0) {
                                                                                        rec = [getOrderData[i].AWB_NO, getOrderData[i].COD_AMOUNT, systemDate, insertPayout.insertId, getOrderData[i].ID, getOrderData[i].COD_AMOUNT * percentageAmount, 0];
                                                                                        rec2 = [CUSTOMER_ID, 'P', getOrderData[i].COD_AMOUNT * percentageAmount, "D", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID]
                                                                                        recordData.push(rec);
                                                                                        recordData2.push(rec2);
                                                                                    }
                                                                                    else {
                                                                                        rec = [getOrderData[i].AWB_NO, getOrderData[i].COD_AMOUNT, systemDate, insertPayout.insertId, getOrderData[i].ID, (getOrderData[i].COD_AMOUNT * percentageAmount) - remainingCodAmount, remainingCodAmount];
                                                                                        remainingCodAmount = remainingCodAmount - remainingCodAmount;
                                                                                        rec2 = [CUSTOMER_ID, 'P', (getOrderData[i].COD_AMOUNT * percentageAmount) - remainingCodAmount, "D", systemDate, systemDate, UTR_NO, getOrderData[i].ID, USER_ID]
                                                                                        recordData.push(rec);
                                                                                        recordData2.push(rec2);
                                                                                    }
                                                                                }
                                                                            }

                                                                            mm.executeDML(`insert into payout_details(AWB_NO, AMOUNT, CREATED_MODIFIED_DATE, PAYOUT_ID, ORDER_ID, PAID_AMOUNT, DEDUCTABLE_AMOUNT) values ?`, [recordData], supportKey, connection, (error, insertPayoutDetails) => {
                                                                                if (error) {
                                                                                    console.log(error);
                                                                                    mm.rollbackConnection(connection);
                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                    res.send({
                                                                                        "code": 400,
                                                                                        "message": "fail to insert payoutDetails Information."
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, ORDER_ID, USER_ID) values ?`, [recordData2], supportKey, connection, (error, insertTransactions) => {
                                                                                        if (error) {
                                                                                            console.log(error);
                                                                                            mm.rollbackConnection(connection);
                                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                            res.send({
                                                                                                "code": 400,
                                                                                                "message": "fail to insert payout transaction Information."
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            if (actualDeductableAmount > 0) {
                                                                                                mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, TRANSACTION_ID, USER_ID) values(?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, 'A', actualDeductableAmount, "D", systemDate, systemDate, UTR_NO, USER_ID], supportKey, connection, (error, insertTransaction) => {
                                                                                                    if (error) {
                                                                                                        console.log(error);
                                                                                                        mm.rollbackConnection(connection);
                                                                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                        res.send({
                                                                                                            "code": 400,
                                                                                                            "message": "fail to insert adjustment transaction Information."
                                                                                                        })
                                                                                                    }
                                                                                                    else {
                                                                                                        mm.executeDML(`update wallet_master set BALANCE = BALANCE + ? where CUSTOMER_ID = ?`, [actualDeductableAmount, CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                                                                            if (error) {
                                                                                                                console.log(error);
                                                                                                                mm.rollbackConnection(connection);
                                                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                                res.send({
                                                                                                                    "code": 400,
                                                                                                                    "message": "fail to update wallet Information."
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
                                                                                                mm.commitConnection(connection)
                                                                                                res.send({
                                                                                                    "code": 200,
                                                                                                    "message": "success"
                                                                                                })
                                                                                            }
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
                                                                "code": 304,
                                                                "message": "amount condition not satisfied"
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        console.log(checkPayoutDetails.length);
                                        res.send({
                                            "code": 305,
                                            "message": "You already made a payout..",
                                            "data": checkPayoutDetails.length
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "Please check Settlement Date."
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "fail to get commission information."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getCodDates = (req, res) => {
    const supportKey = req.headers['supportKey']
    try {
        mm.executeQueryData(`select distinct(DATE_ADD(date(ORDER_STATUS_UPDATED_DATETIME), INTERVAL COD_SETTLEMENT_DAYS DAY)) AS DATES from view_order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND date(ORDER_STATUS_UPDATED_DATETIME) <= DATE_SUB(CURRENT_DATE, INTERVAL COD_SETTLEMENT_DAYS DAY)`, [], supportKey, (error, getDates) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "fail to get cod order information.."
                })
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": getDates
                })
            }
        })
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getCustomerPayoutDetails = (req, res) => {
    var supportKey = req.headers['supportkey'],
        DELIVERED_DATE = req.body.DELIVERED_DATE;

    try {
        if (DELIVERED_DATE && DELIVERED_DATE != ' ') {
            mm.executeQueryData(`select cm.ID, cm.NAME as CUSTOMER_NAME, cm.FIRM_NAME, cm.COD_SETTLEMENT_DAYS, cm.PAYOUT_COMMISSION_RATE, (SELECT IFNULL(sum(COD_AMOUNT),0) from order_master where COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND date(ORDER_STATUS_UPDATED_DATETIME) = DATE_SUB(?,INTERVAL cm.COD_SETTLEMENT_DAYS DAY) AND CUSTOMER_ID = cm.ID) * ((100 - cm.PAYOUT_COMMISSION_RATE))/100 AS TOTAL_COD_AMOUNT, (SELECT count(ID) from order_master where COD_PAID_AMOUNT = 0  AND PAYMENT_MODE = 'COD' AND ORDER_STATUS = 'D' AND date(ORDER_STATUS_UPDATED_DATETIME) = DATE_SUB(?,INTERVAL cm.COD_SETTLEMENT_DAYS DAY) AND CUSTOMER_ID = cm.ID) AS TOTAL_ORDERS, (select BALANCE from wallet_master where CUSTOMER_ID = cm.ID) as WALLET_BALANCE FROM customer_master cm where 1 AND DATE_SUB(?,INTERVAL cm.COD_SETTLEMENT_DAYS DAY) <= DATE_SUB(CURRENT_DATE, INTERVAL cm.COD_SETTLEMENT_DAYS DAY) AND (SELECT IFNULL(SUM(COD_AMOUNT), 0) FROM order_master WHERE COD_PAID_AMOUNT = 0 AND ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND DATE(ORDER_STATUS_UPDATED_DATETIME) = DATE_SUB(?,INTERVAL cm.COD_SETTLEMENT_DAYS DAY) AND CUSTOMER_ID = cm.ID) > 0`, [DELIVERED_DATE, DELIVERED_DATE, DELIVERED_DATE, DELIVERED_DATE], supportKey, (error, getCodDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get cod information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": getCodDetails
                    })
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
    }
}