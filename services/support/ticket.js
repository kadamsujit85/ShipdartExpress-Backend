const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')

var ticketMaster = "ticket_master";
var viewTicketMaster = "view_" + ticketMaster;

function reqData(req) {

    var data = {

        TICKET_NO: req.body.TICKET_NO,
        CREATED_DATETIME: req.body.CREATED_DATETIME,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        STATUS: req.body.STATUS,
        ORDER_ID: req.body.ORDER_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SUBJECT: req.body.SUBJECT,
        TOPIC: req.body.TOPIC,
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_NO', 'parameter missing').exists(),
        body('ORDER_ID', 'parameter missing').exists(),
        body('DESCRIPTION', 'parameter missing').exists(),
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
    (req.body.STATUS && req.body.STATUS != ' ' ? filter += ` AND STATUS  = '${req.body.STATUS}' ` : '');
    (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND TICKET_NO LIKE '%${req.body.SEARCH_FILTER}%'` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewTicketMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewTicketMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewTicketMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewTicketMaster information."
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
            mm.executeQueryData('INSERT INTO ' + ticketMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save ticketMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ticketMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + ticketMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update ticketMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ticketMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.createTicket = (req, res) => {

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
            const connection = mm.openConnection();
            data.CREATED_DATETIME = systemDate
            data.TICKET_NO = 'TK/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];
            mm.executeDML('INSERT INTO ' + ticketMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save ticketMaster information..."
                    });
                }
                else {
                    const ATTACHMENT = req.body.ATTACHMENT;
                    mm.executeDML(`insert into ticket_details(TICKET_ID, DESCRIPTION, CREATED_DATETIME, CREATED_MODIFIED_DATE, ATTACHMENT, CUSTOMER_ID) values(?,?,?,?,?,?)`, [results.insertId, data.DESCRIPTION, systemDate, systemDate, ATTACHMENT, data.CUSTOMER_ID], supportKey, connection, (error, createDetails) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to save ticketDetails information..."
                            });
                        }
                        else {
                            mm.commitConnection(connection);
                            res.send({
                                "code": 200,
                                "message": "ticketMaster information saved successfully...",
                            });
                        }
                    })
                }
            });
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}