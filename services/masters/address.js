const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger');
const axios = require('axios');
var request = require('request');
var async = require('async');

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
        CREATE_BODY: req.body.CREATE_BODY,
        DISPLAY_NAME: req.body.DISPLAY_NAME,

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
    data.DISPLAY_NAME = data.CONTACT_PERSON;
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
                                data.CONTACT_PERSON = data.CONTACT_PERSON + `-${getCount[0].ID}`
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


                                        let loginData2 = JSON.stringify({
                                            "email": process.env.SHIPROCKET_EMAIL,
                                            "password": process.env.SHIPROCKET_PASSWORD
                                        });


                                        let config2 = {
                                            method: 'post',
                                            maxBodyLength: Infinity,
                                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            data: loginData2
                                        };

                                        axios.request(config2).then(async (shiprocketToken) => {

                                            var options = {
                                                'method': 'POST',
                                                'url': 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                                'headers': {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                                },
                                                body: JSON.stringify({
                                                    "pickup_location": data.CONTACT_PERSON,
                                                    "name": data.CONTACT_PERSON,
                                                    "email": data.EMAIL_ID,
                                                    "phone": data.MOBILE_NO,
                                                    "address": `${getCityName[0].LANDMARK ? getCityName[0].LANDMARK + ',' : ''} ${data.ADDRESS}`,
                                                    "city": getCityName[0].CITY_NAME,
                                                    "state": getCityName[0].STATE_NAME,
                                                    "country": getCityName[0].COUNTRY_NAME,
                                                    "pin_code": getCityName[0].PINCODE
                                                })
                                            };

                                            request(options, async (error, response, body) => {

                                                body = JSON.parse(body)
                                                const delResponse = await axios.post(process.env.DELHIVERY_ADDRESS_CREATE_API, {
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


                                            })
                                        })
                                    }
                                });
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
    console.log("Update Address daat", data)
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

                        console.log("Update Addrss bidy",req.body);

                        const data2 = {
                            "name": data.CONTACT_PERSON,
                            "pin" : getPincodeAndAddressData[0].PINCODE,
                            "address": `${data.LANDMARK ? data.LANDMARK + ',' : ''} ${data.ADDRESS} `,
                        }
                        
                        const response = await axios.post(process.env.DELHIVERY_ADDRESS_UPDATE_API, data2 , {
                            headers: {
                                "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            }
                        })
                        console.log("Address update",response.data)
                        if (response.data.success == true) {
                            const connection = mm.openConnection()
                            mm.executeDML(`UPDATE ` + addressMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    //console.log(error);
                                    mm.rollbackConnection(connection)
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to Update Address information."
                                    });
                                }
                                else {
                                    mm.commitConnection(connection)
                                    res.send({
                                        "code": 200,
                                        "message": "Warehouse updated successfully",
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
            return res.status(500).send({
                code: 500,
                message: "Internal Server Error while updating address."
            });
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

exports.addExistingAddress = (req, res) => {

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
            let errorIds = []
            mm.executeQueryData(`select * from view_address_master where LANDMARK is null`, '', supportKey, async (error, records) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get addressMaster information..."
                    });
                }
                else {
                    async.eachSeries(records, function iteratorOverElems(data, callback) {


                        let loginData2 = JSON.stringify({
                            "email": process.env.SHIPROCKET_EMAIL,
                            "password": process.env.SHIPROCKET_PASSWORD
                        });

                        let config2 = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: loginData2
                        };

                        axios.request(config2).then(async (shiprocketToken) => {
                            var options = {
                                'method': 'POST',
                                'url': 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                },
                                body: JSON.stringify({
                                    "pickup_location": data.CONTACT_PERSON,
                                    "name": data.CONTACT_PERSON,
                                    "email": data.EMAIL_ID,
                                    "phone": data.MOBILE_NO,
                                    "address": data.ADDRESS,
                                    "city": data.CITY_NAME,
                                    "state": data.STATE_NAME,
                                    "country": data.COUNTRY_NAME,
                                    "pin_code": data.PINCODE
                                })
                            };
                            request(options, async (error, response, body) => {
                                if (error) {
                                    errorIds.push(data.ID)
                                    callback()
                                }
                                else {
                                    console.log(JSON.parse(body));


                                    // const response = await axios.post(process.env.DELHIVERY_ADDRESS_CREATE_API, {
                                    //     "phone": data.MOBILE_NO,
                                    //     "city": data.CITY_NAME,
                                    //     "name": data.CONTACT_PERSON,
                                    //     "pin": data.PINCODE + '',
                                    //     "address": `${data.LANDMARK ? data.LANDMARK + ',' : ''} ${data.ADDRESS}`,
                                    //     "country": "India",
                                    //     "email": data.EMAIL_ID,
                                    //     "registered_name": data.CONTACT_PERSON,
                                    //     "return_address": `${data.LANDMARK ? data.LANDMARK + ',' : ''} ${data.ADDRESS}`,
                                    //     "return_pin": data.PINCODE + '',
                                    //     "return_city": data.CITY_NAME,
                                    //     "return_state": data.STATE_NAME,
                                    //     "return_country": data.COUNTRY_NAME
                                    // }, {
                                    //     headers: {
                                    //         "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                                    //         "Content-Type": "application/json"
                                    //     }
                                    // })
                                    if (!body.success) {
                                        errorIds.push(data.ID)
                                    }
                                    callback()

                                    // if (response.data.success == true) {
                                    //     console.log("Success", data.ID);

                                    //     callback()
                                    // }
                                    // else {
                                    //     errorIds.push(data.ID)
                                    //     callback()
                                    // }
                                }
                            });
                        })
                    }, function subCb(error) {
                        if (error) {
                            res.send({
                                "code": 400,
                                "message": "Failed to Insert Role details..."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "addressMaster information saved successfully...",
                                "errorIds": errorIds
                            });
                        }
                    });
                }
            })

        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}