const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')

var notificationMaster = "notification_master";
var viewNotificationMaster = "view_" + notificationMaster;



exports.validate = function () {
    return [
        body('CARRIER_NAME', 'parameter missing').exists(),
        body('STATUS', 'parameter missing').exists(),
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
    // (req.body.searchFilter && req.body.searchFilter != ' ' ? filter += ` AND (CARRIER_NAME like '%${req.body.searchFilter}%')  ` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewNotificationMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewNotificationMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewNotificationMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewNotificationMaster information."
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

exports.getNotificationDetailsEmployeewise = (req, res) => {

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
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    filter += ` AND RECEIVER_CUSTOMER_ID IN(${CUSTOMER_ID}) `



    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && CUSTOMER_ID.length > 0) {
            mm.executeQuery('select count(*) as cnt from ' + viewNotificationMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get viewNotificationMaster count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewNotificationMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to get viewNotificationMaster information."
                            });
                        }
                        else {
                            let query = `update notification_master set READ_STATUS = 'R' where RECEIVER_EMP_ID IN(${CUSTOMER_ID})`;
                            mm.executeQuery(query, supportKey, (error, updateReadStatus) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update NotificationMaster information."
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
                            })
                        }
                    });
                }
            });
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

exports.getNotificationCount = (req, res) => {
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        supportKey = req.headers["supportKey"];
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ') {
            mm.executeQueryData(`select count(ID) as cnt from notification_master where RECEIVER_EMP_ID = ?`, CUSTOMER_ID, supportKey, (error, getNotificationCount) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get NotificationMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success.",
                        "data": getNotificationCount[0].cnt
                    });
                }
            })
        }
        else {
            res.send({
                "code": "404",
                "message": "Parameter Missing."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}