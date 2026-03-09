const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger');

var customerProductMaster = "customer_product_mapping";
var viewCustomerProductMaster = "view_" + customerProductMaster;

function reqData(req) {

    var data = {

        LOCAL_ZONE_AMOUNT: req.body.LOCAL_ZONE_AMOUNT,
        LOCAL_ZONE_ADDITIONAL_AMOUNT: req.body.LOCAL_ZONE_ADDITIONAL_AMOUNT,
        STATE_ZONE_AMOUNT: req.body.STATE_ZONE_AMOUNT,
        STATE_ZONE_ADDITIONAL_AMOUNT: req.body.STATE_ZONE_ADDITIONAL_AMOUNT,
        ROI_ZONE_AMOUNT: req.body.ROI_ZONE_AMOUNT,
        ROI_ZONE_ADDITIONAL_AMOUNT: req.body.ROI_ZONE_ADDITIONAL_AMOUNT,
        METRO_ZONE_AMOUNT: req.body.METRO_ZONE_AMOUNT,
        METRO_ZONE_ADDITION_AMOUNT: req.body.METRO_ZONE_ADDITION_AMOUNT,
        SPECIAL_ZONE_AMOUNT: req.body.SPECIAL_ZONE_AMOUNT,
        SPECIAL_ZONE_ADDITIONAL_AMOUNT: req.body.SPECIAL_ZONE_ADDITIONAL_AMOUNT,
        SERVICE_ID: req.body.SERVICE_ID,
        PRODUCT_ID: req.body.PRODUCT_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        STATUS: req.body.STATUS ? 1 : 0,
        IS_CUSTOM: req.body.IS_CUSTOM,
        COD_COMMISSION: req.body.COD_COMMISSION,
        COD_COMMISSION_AMOUNT: req.body.COD_COMMISSION_AMOUNT,

    }
    return data;
}

exports.validate = function () {
    return [
        body('PRODUCT_NAME', 'parameter missing').exists(),
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
    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '');


    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewCustomerProductMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewCustomerProductMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewCustomerProductMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewCustomerProductMaster information."
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
            mm.executeQueryData('INSERT INTO ' + customerProductMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerProductMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "customerProductMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + customerProductMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update customerProductMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "customerProductMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.referProductMapping = (req, res) => {

    let systemDate = mm.getSystemDate();
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        REFERAL_CUSTOMER_ID = req.body.REFERAL_CUSTOMER_ID;
    var supportKey = req.headers["supportKey"];
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && REFERAL_CUSTOMER_ID && REFERAL_CUSTOMER_ID != ' ') {
            const connection = mm.openConnection();
            mm.executeDML('delete from customer_product_mapping where CUSTOMER_ID = ?', CUSTOMER_ID, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error)
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to delete previous information..."
                    });
                }
                else {
                    let query = `INSERT INTO customer_product_mapping(CUSTOMER_ID, PRODUCT_ID, LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, CREATED_MODIFIED_DATE, IS_CUSTOM) select ?, PRODUCT_ID, LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, 1, SERVICE_ID, ?, IS_CUSTOM from customer_product_mapping where CUSTOMER_ID = ?`
                    let queryData = [CUSTOMER_ID, systemDate, REFERAL_CUSTOMER_ID]

                    mm.executeDML(query, queryData, supportKey, connection, (error, mapData) => {
                        if (error) {
                            console.log(error)
                            mm.rollbackConnection(connection)
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to save mapping information..."
                            });
                        }
                        else {
                            mm.commitConnection(connection)
                            res.send({
                                "code": 200,
                                "message": "Mapping information saved successfully...",
                            });
                        }
                    })
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