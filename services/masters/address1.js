const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger');
const axios = require('axios');


var addressMaster = "address_master";
var viewAddressMaster = "view_" + addressMaster;

function reqData(req) {

    var data = {

        ADDRESS_TYPE: req.body.ADDRESS_TYPE,
        CONTACT_PERSON: req.body.CONTACT_PERSON,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ALT_MOBILE_NO: req.body.ALT_MOBILE_NO,
        ADDRESS: req.body.ADDRESS,
        LANDMARK: req.body.LANDMARK,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        PINCODE_ID: req.body.PINCODE_ID,
        STATUS: req.body.STATUS ? 1 : 0,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        DELHIVERY_CLIENT_ID: req.body.DELHIVERY_CLIENT_ID,
        CREATE_BODY: req.body.CREATE_BODY

    }
    return data;
}

exports.validate = function () {
    return [
        body('ADDRESS_TYPE', 'parameter missing').exists(),
        body('CONTACT_PERSON', 'parameter missing').exists(),
        body('MOBILE_NO', 'parameter missing').exists(),
        body('EMAIL_ID', 'parameter missing').exists(),
        body('ALT_MOBILE_NO', 'parameter missing').optional(),
        body('ADDRESS', 'parameter missing').exists(),
        body('LANDMARK', 'parameter missing').optional(),
        body('PINCODE_ID', 'parameter missing').exists(),
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

    (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND (CONTACT_PERSON like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR ALT_MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR ADDRESS like '%${req.body.SEARCH_FILTER}%' OR LANDMARK like '%${req.body.SEARCH_FILTER}%' OR PINCODE like '%${req.body.SEARCH_FILTER}%' OR CITY_NAME like '%${req.body.SEARCH_FILTER}%' ` : '')


    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewAddressMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewAddressMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewAddressMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewAddressMaster information."
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
            const connection = mm.openConnection();
            mm.executeDML(`select ID from address_master order by ID desc limit 1`, '', supportKey, connection, (error, getCount) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get addressMaster information..."
                    });
                }
                else {
                    mm.executeDML(`select CITY_NAME, PINCODE, STATE_NAME, COUNTRY_NAME from view_pincode_master where ID = ? AND STATUS = 1`, data.PINCODE_ID, supportKey, connection, async (error, getCityName) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to save addressMaster information..."
                            });
                        }
                        else {
                            if (getCityName.length > 0) {
                                data.CONTACT_PERSON = data.CONTACT_PERSON+`-${getCount[0].ID}`
                                const response = await axios.post(process.env.DELHIVERY_ADDRESS_CREATE_API, {
                                    "phone": data.MOBILE_NO,
                                    "city": getCityName[0].CITY_NAME,
                                    "name": data.CONTACT_PERSON,
                                    "pin": getCityName[0].PINCODE + '',
                                    "address": `${getCityName[0].LANDMARK ? getCityName[0].LANDMARK + ',' : ''} ${data.ADDRESS}`,
                                    "country": "India",
                                    "email": data.EMAIL_ID,
                                    "registered_name": data.CONTACT_PERSON,
                                    "return_address": `${getCityName[0].LANDMARK ? getCityName[0].LANDMARK + ',' : ''} ${data.ADDRESS}`,
                                    "return_pin": getCityName[0].PINCODE + '',
                                    "return_city": getCityName[0].CITY_NAME,
                                    "return_state": getCityName[0].STATE_NAME,
                                    "return_country": getCityName[0].COUNTRY_NAME
                                }, {
                                    headers: {
                                        "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                        "Content-Type": "application/json"
                                    }
                                })

                                if (response.data.success == true) {
                                    data.DELHIVERY_CLIENT_ID = response.data.data.client;
                                    data.CREATE_BODY = response.data;
                                    mm.executeDML('INSERT INTO ' + addressMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save addressMaster information..."
                                            });
                                        }
                                        else {
                                            mm.commitConnection(connection)
                                            res.send({
                                                "code": 200,
                                                "message": "addressMaster information saved successfully...",
                                            });
                                        }
                                    });
                                }
                                else {
                                    mm.rollbackConnection(connection)
                                    res.send({
                                        "code": 400,
                                        "message": "fail...",
                                    });
                                }
                            }
                            else {
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 304,
                                    "message": "pincode not valid...",
                                });
                            }
                        }
                    })
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
        data[key] != null ? setData += `${key} = ? , ` : true;
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
            mm.executeQueryData(`select * from view_pincode_master where ID = ? AND STATUS = 1; `, [data.PINCODE_ID], supportKey, async (error, getPincodeAndAddressData) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update addressMaster information."
                    });
                }
                else {
                    // const pincodeData = getPincodeAndAddressData[0];
                    // const addressData = getPincodeAndAddressData[1];
                    if (getPincodeAndAddressData.length > 0) {

                        console.log(req.body);

                        const data2 = {
                            "name": data.CONTACT_PERSON,
                            "registered_name": data.CONTACT_PERSON,
                            "address": `${data.LANDMARK ? data.LANDMARK + ',' : ''} ${data.ADDRESS} `,
                        }


                        const response = await axios.post(process.env.DELHIVERY_ADDRESS_UPDATE_API, { data2 }, {
                            headers: {
                                "Authorization": `Token ${process.env.DELHIVERY_TOKEN} `,
                                "Content-Type": "application/json"
                            }
                        })

                        if (response.data.success == true) {
                            const connection = mm.openConnection()
                            mm.executeDML(`UPDATE ` + addressMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update addressMaster information."
                                    });
                                }
                                else {
                                    mm.commitConnection(connection)
                                    res.send({
                                        "code": 200,
                                        "message": "addressMaster information updated successfully...",
                                    });
                                }
                            });
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "fail"
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "pincode not found"
                        })
                    }
                }
            })
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.update_old = (req, res) => {
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
        data[key] != null ? setData += `${key} = ? , ` : true;
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
            mm.executeQueryData(`select * from view_pincode_master where ID = ? AND STATUS = 1; `, [data.PINCODE_ID], supportKey, async (error, getPincodeAndAddressData) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update addressMaster information."
                    });
                }
                else {
                    if (getPincodeAndAddressData.length > 0) {
                        mm.executeDML(`UPDATE ` + addressMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update addressMaster information."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "addressMaster information updated successfully...",
                                });
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "pincode not found"
                        })
                    }
                }
            })
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.delete = (req, res) => {

    const ID = req.body.ID;
    var supportKey = req.headers["supportKey"];
    try {
        if (ID && ID != '') {
            mm.executeQueryData(`delete from address_master where ID = ?`, ID, supportKey, (error, deleteAddress) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save addressMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter missing..."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}