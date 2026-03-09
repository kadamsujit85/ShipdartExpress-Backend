const mm = require('../../utilities/globalModule');
const logger = require('../../utilities/logger');

var pincodeMaster = "pincode_master";
var viewPincodeMaster = "view_" + pincodeMaster;

function reqData(req) {

    var data = {

        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        STATUS: req.body.STATUS ? 1 : 0,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IS_SPECIAL_ZONE: req.body.IS_SPECIAL_ZONE ? 1 : 0,
        IS_METRO_CITY: req.body.IS_METRO_CITY ? 1 : 0,

    }
    return data;
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

    (req.body.IS_SPECIAL_ZONE == 1 ? filter += ` AND IS_SPECIAL_ZONE = 1 ` : '');
    (req.body.IS_METRO_CITY == 1 ? filter += ` AND IS_METRO_CITY = 1 ` : '');
    
    (req.body.searchFilter && req.body.searchFilter != ' ' ? filter += ` AND (PINCODE like '%${req.body.searchFilter}%' OR CITY_NAME like '%${req.body.searchFilter}%' OR STATE_NAME like '%${req.body.searchFilter}%'  OR COUNTRY_NAME like '%${req.body.searchFilter}%')` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewPincodeMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewPincodeMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewPincodeMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewPincodeMaster information."
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
    data.CREATED_MODIFIED_DATE = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData('INSERT INTO ' + pincodeMaster + ' SET ?', data, supportKey, (error, results) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to save pincodeMaster information..."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "pincodeMaster information saved successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.update = (req, res) => {

    var data = reqData(req);
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] != null ? setData += `${key}= ? , ` : true;
        data[key] != null ? recordData.push(data[key]) : true;
    });

    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(`UPDATE ` + pincodeMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to update pincodeMaster information."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "pincodeMaster information updated successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.createPincode = (req, res) => {

    var data = reqData(req);
    data.CREATED_MODIFIED_DATE = mm.getSystemDate()

    try {
        mm.executeQueryData(`select ID from pincode_master where PINCODE = ? AND STATUS = ?;`, [data.PINCODE, 1], supportKey, (error, checkPincode) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "fail to check pincode."
                })
            }
            else {
                if (checkPincode.length > 0) {
                    res.send({
                        "code": 403,
                        "message": "Already Found."
                    })
                }
                else {
                    mm.executeQueryData('INSERT INTO ' + pincodeMaster + ' SET ?', data, supportKey, (error, results) => {
                        if (error) {
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to save pincodeMaster information..."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "pincodeMaster information saved successfully...",
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

exports.updatePincode = (req, res) => {

    var data = reqData(req);
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] != null ? setData += `${key}= ? , ` : true;
        data[key] != null ? recordData.push(data[key]) : true;
    });

    try {
        mm.executeQueryData(`select ID from pincode_master where STATUS = ? AND PINCODE = ? AND ID <> ?`, [1, data.PINCODE, criteria.ID], supportKey, (error, checkPincode) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to check pincodeMaster information."
                });
            }
            else {
                if (checkPincode.length > 0) {
                    res.send({
                        "code": 403,
                        "message": "Already Found."
                    })
                }
                else {
                    mm.executeQueryData(`UPDATE ` + pincodeMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to update pincodeMaster information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "pincodeMaster information updated successfully...",
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

exports.getPincodeDataForDropdown = (req, res) => {

    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';
    criteria = filter + " AND STATUS = 1 order by CITY_NAME asc";

    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery('select ID, PINCODE, CITY_NAME, COUNTRY_NAME, STATE_NAME from ' + viewPincodeMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewPincodeMaster information."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": results
                });
            }
        });
    } catch (error) {
        //console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}