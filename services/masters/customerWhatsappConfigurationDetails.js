const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
const wp = require('../../utilities/whatsappMsgShoot')

var zoneMaster = "customer_whatsapp_configuration_details";
var viewZoneMaster = "view_" + zoneMaster;

function reqData(req) {

    var data = {

        CUSTOMER_ID: req.body.CUSTOMER_ID,
        STATUS: req.body.STATUS ? 1 : 0,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        SHIPMENT_CREATED: req.body.SHIPMENT_CREATED ? 1 : 0,
        SHIPMENT_CANCELLED: req.body.SHIPMENT_CANCELLED ? 1 : 0,
        SHIPMENT_DELIVERED: req.body.SHIPMENT_DELIVERED ? 1 : 0,
        SHIPMENT_OUT_OF_DELIVERY: req.body.SHIPMENT_OUT_OF_DELIVERY ? 1 : 0,
        SHIPMENT_IN_TRANSIT: req.body.SHIPMENT_IN_TRANSIT ? 1 : 0

    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID', 'parameter missing').exists(),
        body('STATUS', 'parameter missing').exists(),
        body('SHIPMENT_CREATED', 'parameter missing').exists(),
        body('SHIPMENT_CANCELLED', 'parameter missing').exists(),
        body('SHIPMENT_DELIVERED', 'parameter missing').exists(),
        body('SHIPMENT_OUT_OF_DELIVERY', 'parameter missing').exists(),
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
        mm.executeQuery('select count(*) as cnt from ' + viewZoneMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewZoneMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewZoneMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewZoneMaster information."
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
            mm.executeQueryData('INSERT INTO ' + zoneMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save zoneMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "zoneMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + zoneMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update zoneMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "zoneMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.sendOtpForServiceVerification = (req, res) => {
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        supportKey = req.headers["supportKey"],
        systemDate = mm.getSystemDate(),
        otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ') {
            mm.executeQueryData(`select ID from customer_whatsapp_configuration_details where STATUS = 0 AND CUSTOMER_ID = ?`, CUSTOMER_ID, supportKey, (error, checkDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Fail to get details"
                    })
                }
                else {
                    if (checkDetails.length > 0) {
                        mm.executeQueryData(`select MOBILE_NO from customer_master where ID = ?`, CUSTOMER_ID, supportKey, (error, getMobileNo) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Fail to get mobile number.."
                                })
                            }
                            else {
                                mm.executeQueryData(`insert into otp_master(OTP, CUSTOMER_ID, CREATED_MODIFIED_DATE, MOBILE_NO, STATUS, CREATED_DATETIME) values(?,?,?,?,?,?)`, [otp, CUSTOMER_ID, systemDate, getMobileNo[0].MOBILE_NO, 1, systemDate], supportKey, (error, insertOtpDetails) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Fail to insert otp details.."
                                        })
                                    }
                                    else {
                                        wp.sendServiceVerificationMessage(getMobileNo[0].MOBILE_NO, otp, CUSTOMER_ID);
                                        res.send({
                                            "code": 200,
                                            "message": "otp send successfully."
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "Already Service Enabled.."
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
        throw new Error(error);
    }
}

exports.verifyServiceOTP = (req, res) => {
    var supportKey = req.headers["supportKey"],
        systemDate = mm.getSystemDate(),
        { CUSTOMER_ID, OTP } = req.body;

    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && OTP && OTP != ' ') {
            mm.executeQueryData(`SELECT MOBILE_NO FROM customer_master where ID = ?`, [CUSTOMER_ID], supportKey, (error, checkDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to check customerMaster information..."
                    });
                }
                else {
                    if (checkDetails.length > 0) {
                        mm.executeQueryData(`select ID, OTP from otp_master where CUSTOMER_ID = ? AND STATUS = 1 AND CREATED_DATETIME >= DATE_SUB(?, INTERVAL 10 MINUTE) order by ID desc LIMIT 1`, [CUSTOMER_ID, systemDate], supportKey, (error, getOtp) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get otp information..."
                                });
                            }
                            else {
                                if (getOtp.length > 0) {
                                    if (OTP == getOtp[0].OTP) {
                                        mm.executeQueryData(`update otp_master set STATUS = 0 where ID = ?`, getOtp[0].ID, supportKey, (error, updateStatus) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to update otp status..."
                                                });
                                            }
                                            else {
                                                res.send({
                                                    "code": 200,
                                                    "message": "OTP verified"
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        res.send({
                                            "code": 401,
                                            "message": "Wrong Otp"
                                        })
                                    }
                                }
                                else {
                                    res.send({
                                        "code": 401,
                                        "message": "Otp Not Found"
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "customer not found.."
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
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        res.send({
            "code": 500,
            "message": "Internal server error"
        });
    }
};