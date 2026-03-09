const mm = require('../../utilities/globalModule');
const wp = require('../../utilities/whatsappMsgShoot');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
const md5 = require('md5');
const jwt = require('jsonwebtoken');
var customerMaster = "customer_master";
var viewCustomerMaster = "view_" + customerMaster;

function reqData(req) {

    var data = {

        NAME: req.body.NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        PASSWORD: req.body.PASSWORD,
        STATUS: req.body.STATUS ? 1 : 0,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        AADHAR_FRONT: req.body.AADHAR_FRONT,
        AADHAR_BACK: req.body.AADHAR_BACK,
        PAN_FRONT: req.body.PAN_FRONT,
        PAN_BACK: req.body.PAN_BACK,
        IS_KYC_COMPLETE: req.body.IS_KYC_COMPLETE ? 1 : 0,
        LAST_LOGIN_DATE: req.body.LAST_LOGIN_DATE,
        CLOUD_ID: req.body.CLOUD_ID,
        ADDRESS: req.body.ADDRESS,
        FIRM_NAME: req.body.FIRM_NAME,
        STATE_ID: req.body.STATE_ID,
        PAYOUT_COMMISSION_RATE: req.body.PAYOUT_COMMISSION_RATE,
        COD_SETTLEMENT_DAYS: req.body.COD_SETTLEMENT_DAYS,
        W_CLOUD_ID: req.body.W_CLOUD_ID,

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', 'parameter missing').exists(),
        body('MOBILE_NO', 'parameter missing').exists(),
        body('EMAIL_ID', 'parameter missing').exists(),
        body('ADDRESS_ID').optional(),
        body('PASSWORD').optional(),
        body('STATUS').optional(),
        body('CREATED_MODIFIED_DATE').optional(),
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

    (req.body.ID && (req.body.ID).length > 0 ? filter += ` AND ID IN(${req.body.ID})` : '');
    (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND (FIRM_NAME like '%${req.body.SEARCH_FILTER}%'  OR  NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR EMAIL_ID like '%${req.body.SEARCH_FILTER}%' )` : '');

    ((req.body.STATUS === 1 || req.body.STATUS === 0) ? filter += ` AND STATUS = ${req.body.STATUS} ` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewCustomerMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewCustomerMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewCustomerMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewCustomerMaster information."
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
        //console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.create = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = mm.getSystemDate();
    data.PASSWORD = md5(data.PASSWORD)
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
            mm.executeQueryData('select ID from customer_master where (MOBILE_NO = ? OR EMAIL_ID = ?)', [data.MOBILE_NO, data.EMAIL_ID], supportKey, (error, results1) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to check customerMaster information..."
                    });
                }
                else {
                    if (results1.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "customer already registered."
                        })
                    }
                    else {
                        mm.executeQueryData('INSERT INTO ' + customerMaster + ' SET ?', data, supportKey, (error, results) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerMaster information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "customerMaster information saved successfully...",
                                });
                            }
                        });
                    }

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
            mm.executeQueryData(`select ID from customer_master where (MOBILE_NO = ? or EMAIL_ID = ?) AND ID <> ?`, [data.MOBILE_NO, data.EMAIL_ID, criteria.ID], supportKey, (error, checkCustomer) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to check  customerMaster information."
                    });
                }
                else {
                    if (checkCustomer.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "mobile number or email id already registered"
                        })
                    }
                    else {
                        mm.executeQueryData(`UPDATE ` + customerMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customerMaster information."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "customerMaster information updated successfully...",
                                });
                            }
                        });
                    }
                }
            })
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.login = async (req, res) => {
    const errors = validationResult(req);
    const systemDate = mm.getSystemDate();
    var supportKey = req.headers["supportKey"],
        username = req.body.username,
        W_CLOUD_ID = req.body.W_CLOUD_ID,
        password = md5(req.body.password);

    try {
        if (!errors.isEmpty()) {
            res.send({
                "code": 422,
                "message": errors.errors
            });
        }
        else {
            if (username && username != ' ' && username != undefined && password && password != ' ' && password != undefined) {
                mm.executeQueryData(`SELECT ID, NAME, EMAIL_ID, MOBILE_NO, PASSWORD, STATUS, CREATED_MODIFIED_DATE FROM customer_master WHERE (MOBILE_NO = ? OR EMAIL_ID = ?)`, [username, username], supportKey, async (error, results1) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                        res.send({
                            "code": 400,
                            "message": "Failed to verify credentials"
                        });
                    }
                    else {
                        if (results1.length > 0) {
                            if (results1[0].STATUS == 1) {
                                if (results1[0].PASSWORD && (results1[0].PASSWORD == password)) {
                                    mm.executeQueryData(`update customer_master set LAST_LOGIN_DATE = ?, W_CLOUD_ID = ? where ID = ?;`, [systemDate, W_CLOUD_ID, results1[0].ID], supportKey, (error, updateLoginTime) => {
                                        if (error) {
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update time...",
                                            });
                                        }
                                        else {
                                            var userDetails = [{
                                                CUSTOMER_ID: results1[0].ID,
                                                NAME: results1[0].NAME,
                                                EMAIL_ID: results1[0].EMAIL_ID,
                                                MOBILE_NO: results1[0].MOBILE_NO,
                                                LAST_LOGIN_DATE: results1[0].LAST_LOGIN_DATE,
                                                ADDRESS: results1[0].ADDRESS,
                                            }]
                                            generateTokenForMobile(results1[0].ID, res, userDetails);
                                        }
                                    });
                                }
                                else {
                                    if (results1[0].PASSWORD == null || results1[0].PASSWORD == ' ' || results1[0].PASSWORD == undefined) {
                                        res.send({
                                            "code": 402,
                                            "message": "Password Not Found..."
                                        });
                                    }
                                    else {
                                        res.send({
                                            "code": 304,
                                            "message": "Incorrect username or password..."
                                        });
                                    }
                                }
                            }
                            else {
                                res.send({
                                    "code": 422,
                                    "message": "Customer Blocked"
                                })
                            }
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "Incorrect username or password..."
                            });
                        }
                    }
                });
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter Missing"
                });
            }
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    }
};

function generateTokenForMobile(userId, res, resultsUser) {
    var data = {
        "CUSTOMER_ID": userId,
    }
    try {
        var expiresIn = '12h'
        jwt.sign({ data }, process.env.SECRET, { expiresIn }, (error, token) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Logged in successfully...",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        // logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.createCustomer = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var systemDate = mm.getSystemDate()
    data.CREATED_MODIFIED_DATE = systemDate;
    data.PASSWORD = md5(data.PASSWORD)
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
            mm.executeQueryData('select ID from customer_master where (MOBILE_NO = ? OR EMAIL_ID = ?)', [data.MOBILE_NO, data.EMAIL_ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to check customerMaster information..."
                    });
                }
                else {
                    if (results1.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "customer already registered."
                        })
                    }
                    else {
                        data.COD_SETTLEMENT_DAYS = 1;
                        data.PAYOUT_COMMISSION_RATE = 2;
                        const connection = mm.openConnection();
                        mm.executeDML('INSERT INTO ' + customerMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerMaster information..."
                                });
                            }
                            else {
                                mm.executeDML(`insert into wallet_master(CUSTOMER_ID, BALANCE, CREATED_MODIFIED_DATE) values(?,?,?)`, [results.insertId, 0, systemDate], supportKey, connection, (error, insertWalletDetails) => {
                                    if (error) {
                                        mm.rollbackConnection(connection)
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Fail to insert wallet transaction"
                                        })
                                    }
                                    else {
                                        mm.executeDML(`insert into customer_product_mapping(LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, CUSTOMER_ID, PRODUCT_ID, IS_CUSTOM) select LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, ?, ID, 0 from product_master`, results.insertId, supportKey, connection, (error, insertCustomPricing) => {
                                            if (error) {
                                                mm.rollbackConnection(connection)
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Fail to insert custom pricing.."
                                                })
                                            }
                                            else {
                                                mm.executeDML(`insert into customer_whatsapp_configuration_details(CUSTOMER_ID, STATUS, CREATED_MODIFIED_DATE, SHIPMENT_CREATED, SHIPMENT_CANCELLED, SHIPMENT_DELIVERED, SHIPMENT_OUT_OF_DELIVERY, SHIPMENT_IN_TRANSIT) values(?,?,?,?,?,?,?,?)`, [results.insertId, 0, systemDate, 1, 1, 1, 1, 1], supportKey, connection, (error, insertWhatsappConfigurationDetails) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection)
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Fail to insert configuration details.."
                                                        })
                                                    }
                                                    else {
                                                        mm.commitConnection(connection)
                                                        res.send({
                                                            "code": 200,
                                                            "message": "customerMaster information saved successfully...",
                                                        });
                                                        setTimeout(() => {
                                                            wp.sendKycMessage(data.MOBILE_NO, data.NAME, results.insertId)
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
            });
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.resetPassword = (req, res) => {

    var supportKey = req.headers["supportKey"];
    const username = req.body.username,
        systemDate = mm.getSystemDate();

    try {
        if (!username || username.trim() === '') {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            });
        }
        else {
            mm.executeQueryData(`SELECT ID, NAME, EMAIL_ID, MOBILE_NO FROM customer_master WHERE (MOBILE_NO = ? OR EMAIL_ID = ?)`, [username, username], supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "Failed to check customer information"
                    });
                }
                else {
                    if (results.length > 0) {
                        const otp = Math.floor(100000 + Math.random() * 900000).toString();
                        const subject = 'Password Reset OTP - Shipdart Express';
                        const body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset OTP</h2>
                    <p>Dear User,</p>
                    <p>You have requested to reset your password. Please use the following OTP to verify your request:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
                        <h1 style="color: #007bff; margin: 0; font-size: 32px;">${otp}</h1>
                    </div>
                     <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                </div>`;

                        const connection = mm.openConnection();
                        mm.executeDML(`insert into otp_master(OTP, CUSTOMER_ID, SUBJECT, BODY, CREATED_MODIFIED_DATE, MAIL_ID, STATUS, CREATED_DATETIME) values(?,?,?,?,?,?,?,?)`, [otp, results[0].ID, subject, body, systemDate, results[0].EMAIL_ID, 1, systemDate], supportKey, connection, (error, insertOtpDetails) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to insert otp information"
                                });
                            }
                            else {
                                mm.sendEmail(subject, body, results[0].EMAIL_ID, (error, sendMail) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to send otp"
                                        });
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "Otp send successfully.."
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 305,
                            "message": "Customer not found"
                        });
                    }
                }
            });
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    }
};

exports.verifyOTP = (req, res) => {
    var supportKey = req.headers["supportKey"],
        systemDate = mm.getSystemDate(),
        { username, otp } = req.body;

    try {
        if (username && username != ' ' && otp && otp != ' ') {
            mm.executeQueryData(`SELECT ID FROM customer_master where (EMAIL_ID = ? OR MOBILE_NO = ?)`, [username, username], supportKey, (error, checkDetails) => {
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
                        mm.executeQueryData(`select ID, OTP from otp_master where CUSTOMER_ID = ? AND STATUS = 1 AND CREATED_DATETIME >= DATE_SUB(?, INTERVAL 10 MINUTE) order by ID desc LIMIT 1`, [checkDetails[0].ID, systemDate], supportKey, (error, getOtp) => {
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
                                    if (otp == getOtp[0].OTP) {
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

exports.updatePassword = (req, res) => {
    var supportKey = req.headers["supportKey"];
    const { username, newPassword } = req.body;

    try {
        if (!username || !newPassword) {
            res.send({
                "code": 404,
                "message": "Username and new password are required"
            });
        }
        else {
            mm.executeQueryData(`SELECT ID, NAME, EMAIL_ID, MOBILE_NO FROM customer_master WHERE (MOBILE_NO = ? OR EMAIL_ID = ?)`, [username, username], supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "Failed to verify user"
                    });
                }
                else {
                    if (results.length > 0) {
                        mm.executeQueryData(`UPDATE customer_master SET PASSWORD = ? WHERE ID = ?`, [md5(newPassword), results[0].ID], supportKey, async (error, updateResult) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update password"
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "Password updated successfully"
                                });
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 401,
                            "message": "User not found"
                        });
                    }
                }
            });
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    }
}

exports.sendRegistrationEmail = (req, res) => {

    var supportKey = req.headers["supportKey"];
    let EMAIL_ID = req.body.EMAIL_ID,
        NAME = req.body.NAME
    systemDate = mm.getSystemDate();
    try {
        if (EMAIL_ID && EMAIL_ID != ' ' && NAME && NAME != ' ') {
            mm.executeQueryData(`select ID from customer_master where EMAIL_ID = ? `, EMAIL_ID, supportKey, (error, getCustomerDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "Fail to get customer information.."
                    })
                }
                else {
                    if (getCustomerDetails.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "Customer Already Registered."
                        })
                    }
                    else {
                        const otp = Math.floor(100000 + Math.random() * 900000).toString();
                        const subject = 'Password Reset OTP - Shipdart Express';
                        const body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Dear ${NAME},</p>
        <p>Thank you for registering with us! To complete your registration, please verify your email address using the OTP below:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #28a745; margin: 0; font-size: 32px;">${otp}</h1>
        </div>
        <p>This OTP is valid for the next 10 minutes.</p>
        <p>If you did not initiate this request, please disregard this email or contact our support team immediately.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>`;

                        const connection = mm.openConnection();
                        mm.executeDML(`insert into otp_master(OTP,  SUBJECT, BODY, CREATED_MODIFIED_DATE, MAIL_ID, STATUS, CREATED_DATETIME) values(?,?,?,?,?,?,?)`, [otp, subject, body, systemDate, EMAIL_ID, 1, systemDate], supportKey, connection, (error, insertOtpDetails) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to insert otp information"
                                });
                            }
                            else {
                                mm.sendEmail(subject, body, EMAIL_ID, (error, sendMail) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to send otp"
                                        });
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "Otp send successfully.."
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
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.verifyRegistrationOTP = (req, res) => {
    var supportKey = req.headers["supportKey"],
        systemDate = mm.getSystemDate(),
        { EMAIL_ID, OTP } = req.body;

    try {
        if (EMAIL_ID && EMAIL_ID != ' ' && OTP && OTP != ' ') {
            mm.executeQueryData(`select ID, OTP from otp_master where MAIL_ID = ? AND STATUS = 1 AND CREATED_DATETIME >= DATE_SUB(?, INTERVAL 10 MINUTE) order by ID desc LIMIT 1`, [EMAIL_ID, systemDate], supportKey, (error, getOtp) => {
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

exports.sendRegistrationOtp = (req, res) => {

    var supportKey = req.headers["supportKey"];
    let MOBILE_NO = req.body.MOBILE_NO,
        systemDate = mm.getSystemDate();
    try {
        if (MOBILE_NO && MOBILE_NO != ' ') {
            mm.executeQueryData(`select ID from customer_master where MOBILE_NO = ? `, MOBILE_NO, supportKey, (error, getCustomerDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "Fail to get customer information.."
                    })
                }
                else {
                    if (getCustomerDetails.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "Customer Already Registered."
                        })
                    }
                    else {
                        const otp = Math.floor(100000 + Math.random() * 900000).toString();

                        mm.executeQueryData(`select ID from otp_master where MOBILE_NO = ? AND date(CREATED_DATETIME) = CURRENT_DATE `, [MOBILE_NO], supportKey, (error, getCount) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get otp information"
                                });
                            }
                            else {
                                if (getCount.length > 2) {
                                    res.send({
                                        "code": 305,
                                        "message": "You have reached your daily limit, Please try tommarrow."
                                    });
                                }
                                else {
                                    const connection = mm.openConnection();
                                    mm.executeDML(`insert into otp_master(OTP, CREATED_MODIFIED_DATE, MOBILE_NO, STATUS, CREATED_DATETIME) values(?,?,?,?,?)`, [otp, systemDate, MOBILE_NO, 1, systemDate], supportKey, connection, (error, insertOtpDetails) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to insert otp information"
                                            });
                                        }
                                        else {
                                            mm.commitConnection(connection)
                                            res.send({
                                                "code": 200,
                                                "message": "Otp send successfully.."
                                            })
                                            setTimeout(() => {
                                                wp.sendRegistrationOtp(MOBILE_NO, otp)
                                            }, 3000);
                                        }
                                    })
                                }
                            }
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
    }
}

exports.setDefaultPassword = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const customerId = req.body.CUSTOMER_ID;
    try {
        if (customerId && customerId != '') {
            mm.executeQueryData(`select EMAIL_ID, MOBILE_NO from customer_master where ID = ?`, [customerId], supportKey, (error, getCustomerDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                    res.send({
                        "code": 400,
                        "message": "Fail to get customer information."
                    })
                }
                else {
                    if (getCustomerDetails.length > 0) {
                        let newPassword = md5((getCustomerDetails[0].MOBILE_NO).trim() + '#' + (getCustomerDetails[0].EMAIL_ID).trim());
                        mm.executeQueryData(`update customer_master set PASSWORD = ? where ID = ?`, [newPassword, customerId], supportKey, (error, updatePassword) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                res.send({
                                    "code": 400,
                                    "message": "Fail to update customer information."
                                })
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "Success."
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "User not found."
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
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    }
}