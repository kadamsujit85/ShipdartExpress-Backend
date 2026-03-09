const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')

var ndrOrderMaster = "ndr_order_master";
var viewNdrOrderMaster = "view_" + ndrOrderMaster;

function reqData(req) {

    var data = {

        ORDER_ID: req.body.ORDER_ID,
        PAYLOAD_DATA: req.body.PAYLOAD_DATA,
        ADDRESS_1: req.body.ADDRESS_1,
        ADDRESS_2: req.body.ADDRESS_2,
        MOBILE_NO: req.body.MOBILE_NO,
        NAME: req.body.NAME,
        OLD_ADDRESS_1: req.body.OLD_ADDRESS_1,
        OLD_ADDRESS_2: req.body.OLD_ADDRESS_2,
        OLD_MOBILE_NO: req.body.OLD_MOBILE_NO,
        OLD_NAME: req.body.OLD_NAME,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        STATUS: req.body.STATUS,
        RE_ATTEMPT_DATE: req.body.RE_ATTEMPT_DATE,
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID', 'parameter missing').exists(),
        body('ADDRESS_1', 'parameter missing').exists(),
        body('AADHAR_FRONT', 'parameter missing').exists(),
        body('AADHAR_BACK', 'parameter missing').exists(),
        body('AADHAR_CARD_NO', 'parameter missing').exists(),
        body('PAN_CARD_NO', 'parameter missing').exists(),
        body('PAN_CARD_FRONT', 'parameter missing').exists(),
        body('GST_NO', 'parameter missing').exists(),
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

    let sortKey = req.body.sortKey ? req.body.sortKey : 'CREATED_MODIFIED_DATE';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    (req.body.ORDER_ID && (req.body.ORDER_ID).length > 0 ? filter += ` AND ORDER_ID IN(${req.body.ORDER_ID}) ` : '');
    // (req.body.IS_COMPLETED_KYC == 1 && req.body.IS_COMPLETED_KYC == 0 ? filter += ` AND IS_COMPLETED_KYC = ${req.body.IS_COMPLETED_KYC} ` : '');
    // (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND (CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR EMAIL_ID like '%${req.body.SEARCH_FILTER}%')` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewNdrOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewNdrOrderMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewNdrOrderMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewNdrOrderMaster information."
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
    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = mm.getSystemDate();
    var supportKey = req.headers["supportKey"];
    try {
        mm.executeQueryData('INSERT INTO ' + ndrOrderMaster + ' SET ?', data, supportKey, (error, results) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to save ndrOrderMaster information..."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "ndrOrderMaster information saved successfully...",
                });
            }
        });
    } catch (error) {
        console.log(error);

        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.update = (req, res) => {
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

    try {
        mm.executeQueryData(`UPDATE ` + ndrOrderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to update ndrOrderMaster information."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "ndrOrderMaster information updated successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}