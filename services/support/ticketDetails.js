const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')

var ticketDetails = "ticket_details";
var viewTicketDetails = "view_" + ticketDetails;

function reqData(req) {

    var data = {

        TICKET_ID: req.body.TICKET_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        CREATED_DATETIME: req.body.CREATED_DATETIME,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        ATTACHMENT: req.body.ATTACHMENT,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        USER_ID: req.body.USER_ID,
        
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_ID', 'parameter missing').exists(),
        body('DESCRIPTION', 'parameter missing').exists(),
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

    (req.body.TICKET_ID && (req.body.TICKET_ID).length > 0 ? filter += ` AND TICKET_ID IN(${req.body.TICKET_ID})` : '')

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewTicketDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewTicketDetails count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewTicketDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewTicketDetails information."
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
    data.CREATED_DATETIME = mm.getSystemDate()
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
            mm.executeQueryData('INSERT INTO ' + ticketDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save ticketDetails information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ticketDetails information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + ticketDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update ticketDetails information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ticketDetails information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}