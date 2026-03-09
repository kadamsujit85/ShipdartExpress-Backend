const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
var request = require('request');
const jwt = require('jsonwebtoken');

var channelCustomerMapping = "channel_customer_mapping";
var viewChannelCustomerMapping = "view_" + channelCustomerMapping;

function reqData(req) {

    var data = {
        CHANNEL_ID: req.body.CHANNEL_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        SHOP_NAME: req.body.SHOP_NAME,
        STATUS: req.body.STATUS ? 1 : 0,
        ARCHIVE_FLAG: req.body.ARCHIVE_FLAG ? 1 : 0,
        IS_VERIFY: req.body.IS_VERIFY ? 1 : 0,

    }
    return data;
}

exports.validate = function () {
    return [
        body('CHANNEL_ID', 'parameter missing').exists(),
        body('CUSTOMER_ID', 'parameter missing').exists(),
        body('HMAC', 'parameter missing').exists(),
        body('CODE', 'parameter missing').exists(),
        body('SHOP_NAME', 'parameter missing').exists(),
        body('STATE', 'parameter missing').exists(),
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
    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN (${req.body.CUSTOMER_ID})` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewChannelCustomerMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewChannelCustomerMapping count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewChannelCustomerMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewChannelCustomerMapping information."
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
            data.ARCHIVE_FLAG = 0;
            data.STATUS = 1;
            data.IS_VERIFY = 0;
            mm.executeQueryData('INSERT INTO ' + channelCustomerMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save channelCustomerMapping information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "channelCustomerMapping information saved successfully...",
                        "ID": results.insertId
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
            mm.executeQueryData(`UPDATE ` + channelCustomerMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update channelCustomerMapping information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "channelCustomerMapping information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.createChannel_old = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    try {
        jwt.verify(req.headers['token'], process.env.SECRET_KEY_FOR_SHOPIFY, (error, tokenData) => {
            if (error) {
                res.status(403).send({
                    "code": 403,
                    "message": "Wrong Token."
                });
            }
            else {
                tokenData.data = JSON.parse(tokenData.data)
                if (!tokenData.data.SHOP_NAME && tokenData.data.SHOP_NAME == ' ') {
                    res.status(403).send({
                        "code": 403,
                        "message": "Wrong Token."
                    });
                }
                else {
                    data.SHOP_NAME = tokenData.data.SHOP_NAME;
                    mm.executeQueryData(`update channel_customer_mapping SET IS_VERIFY = 1 where SHOP_NAME = ?`, [data.SHOP_NAME], supportKey, (error, checkChannel) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to check information..."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "channelCustomerMapping information saved successfully...",
                            });
                        }
                    })
                }
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getPayload = (req, res) => {
    var supportKey = req.headers['supportkey'];

    try {
        console.log("body", req.body);
        console.log("headers", req.headers);

        mm.executeQueryData(`insert into testing(HEADERS, BODY) values(?,?)`, [JSON.stringify(req.headers), JSON.stringify(req.body)], supportKey, (error, insert) => {
            if (error) {
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "failed"
                })
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success"
                })
            }
        })

    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.uninstallShopifyChannel = (req, res) => {

    var supportKey = req.headers["supportKey"];
    try {
        jwt.verify(req.headers['token'], process.env.SECRET_KEY_FOR_SHOPIFY, (error, tokenData) => {
            if (error) {
                res.status(403).send({
                    "code": 403,
                    "message": "Wrong Token."
                });
            }
            else {
                tokenData.data = JSON.parse(tokenData.data)
                if (!tokenData.data.SHOP_NAME && tokenData.data.SHOP_NAME == ' ') {
                    res.status(403).send({
                        "code": 403,
                        "message": "Wrong Token."
                    });
                }
                else {
                    mm.executeQueryData(`update channel_customer_mapping SET ARCHIVE_FLAG = 1, STATUS = 0 where SHOP_NAME = ? AND ARCHIVE_FLAG = 0`, tokenData.data.SHOP_NAME, supportKey, (error, updateArchiveFlag) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to check information..."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "Uninstalled Successfully..."
                            });
                        }
                    })
                }
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.createChannel = (req, res) => {

    let CUSTOMER_ID = req.body.CUSTOMER_ID,
        ID = req.body.ID;
    var supportKey = req.headers["supportKey"];
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && ID && ID != ' ') {
            mm.executeQueryData(`SELECT SHOP_NAME FROM channel_customer_mapping WHERE CREATED_MODIFIED_DATE BETWEEN NOW() - INTERVAL 5 MINUTE AND NOW() AND ID = ?;`, [ID], supportKey, (error, getRecords) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to check information..."
                    });
                }
                else {
                    if (getRecords.length > 0) {
                        mm.executeQueryData(`select ID from channel_customer_mapping where SHOP_NAME = ? AND ID <> ? AND CUSTOMER_ID = ? AND IS_VERIFY = 1 AND ARCHIVE_FLAG = 0`, [getRecords[0].SHOP_NAME, ID, CUSTOMER_ID], supportKey, (error, checkShopName) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to check recors..."
                                });
                            }
                            else {
                                if (checkShopName.length > 0) {
                                    res.send({
                                        "code": 304,
                                        "message": "Shop Already Registered"
                                    })
                                }
                                else {
                                    const connection = mm.openConnection()
                                    mm.executeDML(`UPDATE channel_customer_mapping SET IS_VERIFY = 1, CUSTOMER_ID = ? WHERE ID = ?; `, [CUSTOMER_ID, ID], supportKey, connection, (error, updateRecords) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update information..."
                                            });
                                        }
                                        else {
                                            mm.commitConnection(connection)
                                            res.send({
                                                "code": 200,
                                                "meesage": "success."
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 408,
                            "message": "Request Timeout"
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
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}