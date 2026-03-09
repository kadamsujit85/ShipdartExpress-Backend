const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')

var customerBankDetailsMaster = "customer_bank_details";
var viewCustomerBankDetailsMaster = "view_" + customerBankDetailsMaster;

function reqData(req) {

    var data = {

        ACCOUNT_HOLDERS_NAME: req.body.ACCOUNT_HOLDERS_NAME,
        ACCOUNT_NO: req.body.ACCOUNT_NO,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        IFSC_CODE: req.body.IFSC_CODE,
        CANCEL_CHEQUE: req.body.CANCEL_CHEQUE,
        CUSTOMER_ID: req.body.CUSTOMER_ID,

    }
    return data;
}

exports.validate = function () {
    return [
        body('ACCOUNT_HOLDERS_NAME', 'parameter missing').exists(),
        body('ACCOUNT_NO', 'parameter missing').exists(),
        body('IFSC_CODE', 'parameter missing').exists(),
        body('CANCEL_CHEQUE', 'parameter missing').exists(),
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
    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewCustomerBankDetailsMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewCustomerBankDetailsMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewCustomerBankDetailsMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewCustomerBankDetailsMaster information."
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
            mm.executeQueryData(`select ID from customer_bank_details where CUSTOMER_ID = ?`, data.CUSTOMER_ID, supportKey, (error, getRecords) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get customerBankDetailsMaster information..."
                    });
                }
                else {
                    if (getRecords.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "Already Bank Details Created"
                        })
                    }
                    else {
                        mm.executeQueryData('INSERT INTO ' + customerBankDetailsMaster + ' SET ?', data, supportKey, (error, results) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerBankDetailsMaster information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "customerBankDetailsMaster information saved successfully...",
                                });
                            }
                        });
                    }
                }
            })

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
            mm.executeQueryData(`UPDATE ` + customerBankDetailsMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update customerBankDetailsMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "customerBankDetailsMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}