const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger');
const async = require(`async`)
const axios = require(`axios`)
const { getSystemDate } = require('../../utilities/dateUtil');

var productMaster = "product_master";
var viewProductMaster = "view_" + productMaster;

function reqData(req) {

    var data = {

        PRODUCT_NAME: req.body.PRODUCT_NAME,
        START_RANGE: req.body.START_RANGE,
        END_RANGE: req.body.END_RANGE,
        ADD_WEIGHT: req.body.ADD_WEIGHT,
        MODE: req.body.MODE,
        PARCEL_TYPE: req.body.PARCEL_TYPE,
        CARRIER_ID: req.body.CARRIER_ID,
        WEIGHT_FOR_FORMULA: req.body.WEIGHT_FOR_FORMULA,
        COD_LIMIT: req.body.COD_LIMIT,
        COD_COMMISSION: req.body.COD_COMMISSION,
        COD_COMMISSION_AMOUNT: req.body.COD_COMMISSION_AMOUNT,
        MAX_WEIGHT: req.body.MAX_WEIGHT,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
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
        STATUS: req.body.STATUS ? 1 : 0,
        IS_AVAILABLE_COD: req.body.IS_AVAILABLE_COD

    }
    return data;
}

exports.validate = function () {
    return [
        body('PRODUCT_NAME', 'parameter missing').exists(),
        body('START_RANGE', 'parameter missing').exists(),
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
    (req.body.ID && (req.body.ID).length > 0 ? filter += ` AND ID IN(${req.body.ID})` : '');


    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewProductMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewProductMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewProductMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewProductMaster information."
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

exports.create_old = (req, res) => {

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
            mm.executeQueryData('INSERT INTO ' + productMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save productMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "productMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + productMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update productMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "productMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.getServiceMappingData = (req, res) => {

    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('SELECT a.ID, a.SERVICE_NAME, IFNULL((select STATUS from product_service_mapping where SERVICE_ID = a.ID),0) as STATUS FROM service_master a where a.STATUS = 1', supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewProductMaster information."
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
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.addServiceMappingData = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var mappingData = req.body.MAPPING_DATA && (req.body.MAPPING_DATA).length > 0 ? req.body.MAPPING_DATA : [];
    var systemDate = mm.getSystemDate()

    try {
        if (mappingData.length > 0) {
            var recordData = [];
            for (let i = 0; i < mappingData.length; i++) {
                let rec = [mappingData[i].SERVICE_ID, mappingData[i].PRODUCT_ID, systemDate, mappingData[i].STATUS]
                recordData.push(rec)
            }
            const connection = mm.openConnection();
            mm.executeDML(`delete from product_service_mapping where PRODUCT_ID = ?; insert into product_service_mapping(SERVICE_ID, PRODUCT_ID, CREATED_MODIFIED_DATE, STATUS) values ?`, [mappingData[0].PRODUCT_ID, recordData], supportKey, connection, (error, insertMappingData) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get insert information."
                    });
                }
                else {
                    mm.commitConnection(connection)
                    res.send({
                        "code": 200,
                        "message": "success"
                    })
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

exports.calculateRate_old = async (req, res) => {

    var supportKey = req.headers['supportkey'];
    var ORDER_ID = req.body.ORDER_ID;
    var rateDetails = [];
    const systemDate = getSystemDate()

    try {
        if (ORDER_ID && ORDER_ID != ' ') {
            mm.executeQueryData('SELECT * FROM view_order_master where ID = ?', [ORDER_ID], supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order information."
                    });
                }
                else {
                    if (results.length > 0) {
                        mm.executeQueryData(`select sum(PER_UNIT_PRICE * TOTAL_UNIT) as COD_AMOUNT from order_details where ORDER_ID = ? `, ORDER_ID, supportKey, (erro, getCodAmount) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get cod information."
                                });
                            }
                            else {
                                const CUSTOMER_ID = results[0].CUSTOMER_ID;
                                const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                                const PINCODE_ID = results[0].PINCODE_ID;
                                const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                                const LENGTH = results[0].LENGTH;
                                const WIDTH = results[0].WIDTH;
                                const HEIGHT = results[0].HEIGHT;
                                const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                                mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID,  PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get pincode information."
                                        });
                                    }
                                    else {
                                        const pickupPincodeData = getPincodeData[0];
                                        const deliverPincodeData = getPincodeData[1];

                                        if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                                            var ZONE_ID = 0;
                                            var query = ``;
                                            var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                                            var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                                            var pickupStateZone = pickupPincodeData[0].STATE_ID;
                                            var deliverStateZone = deliverPincodeData[0].STATE_ID;

                                            var pickupLocalZone = pickupPincodeData[0].ID;
                                            var deliverLocalZone = deliverPincodeData[0].ID;

                                            var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                                            var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                                            var pickupPincode = pickupPincodeData[0].PINCODE;
                                            var deliverPincode = deliverPincodeData[0].PINCODE;

                                            mm.executeQuery(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1; select ID from carrier_master where STATUS = 1`, supportKey, async (error, getServiceData) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get service mapping information."
                                                    });
                                                }
                                                else {
                                                    let serviceList = []
                                                    let apiCondition = 0;
                                                    let apiCondition2 = 0;
                                                    let apiCondition3 = 0;
                                                    let apiCondition4 = 0;
                                                    let zoneCondition = null;


                                                    let loginData = JSON.stringify({
                                                        "email": process.env.SHIPROCKET_EMAIL,
                                                        "password": process.env.SHIPROCKET_PASSWORD
                                                    });

                                                    let config = {
                                                        method: 'post',
                                                        maxBodyLength: Infinity,
                                                        url: process.env.SHIPROCKET_AUTH_BASEURL,
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        },
                                                        data: loginData
                                                    };

                                                    axios.request(config).then(async (shiprocketToken) => {
                                                        let shiprocketPincodeData = JSON.stringify({
                                                            "pickup_postcode": pickupPincode,
                                                            "delivery_postcode": deliverPincode,
                                                            "weight": volumetricWeight / 5000,
                                                            "cod": 1
                                                        });
                                                        let config2 = {
                                                            method: 'get',
                                                            maxBodyLength: Infinity,
                                                            url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${shiprocketToken.data.token}`
                                                            },
                                                            data: shiprocketPincodeData
                                                        };

                                                        axios.request(config2)
                                                            .then(async (shiprocketPincodeServicable) => {


                                                                if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                                    (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))
                                                                    for (let i = 0; i < getServiceData[1].length; i++) {
                                                                        var carrierId = getServiceData[1][i].ID;


                                                                        if (carrierId == 1) {
                                                                            var pincodeData = {
                                                                                "orgPincode": pickupPincode + "",
                                                                                "desPincode": deliverPincode + ""
                                                                            }
                                                                            const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                                            var message = response.data.ZIPCODE_RESP;
                                                                            serviceList = response.data.SERV_LIST_DTLS;


                                                                            (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO' ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                        }

                                                                        if (carrierId == 3) {
                                                                            const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                                            const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                                            ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                                        }

                                                                        if (carrierId == 2) {
                                                                            const bodyData = {
                                                                                "email": process.env.EXPRESSBEES_USERNAME,
                                                                                "password": process.env.EXPRESSBEES_PASSWORD
                                                                            }

                                                                            let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})

                                                                            if (expressbeesToken.data.status == true) {
                                                                                const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                                    "origin": pickupPincode,
                                                                                    "destination": deliverPincode,
                                                                                    "payment_type": "prepaid"
                                                                                }, {
                                                                                    headers: {
                                                                                        Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                                    }
                                                                                });

                                                                                (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                                            }
                                                                            else {
                                                                                apiCondition3 = 1
                                                                            }
                                                                        }

                                                                        // if (carrierId == 5) {
                                                                        //     var data = new FormData();
                                                                        //     data.append('username', process.env.EXPRESSBEES_USERNAME);
                                                                        //     data.append('password', process.env.EXPRESSBEES_PASSWORD);
                                                                        //     data.append('origin_pincode', pickupPincode);
                                                                        //     data.append('destination_pincode', deliverPincode);

                                                                        //     var config = {
                                                                        //         method: 'post',
                                                                        //         maxBodyLength: Infinity,
                                                                        //         url: process.env.ECOM_PINCODE_SERVICEABILITY_BASEURL,
                                                                        //         headers: {
                                                                        //             ...data.getHeaders()
                                                                        //         },
                                                                        //         data: data
                                                                        //     };
                                                                        //     const ecomPincodeData = await axios(config)
                                                                        //     console.log(ecomPincodeData.data);


                                                                        // }

                                                                        if (carrierId == 4) {

                                                                            const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                                headers: {
                                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                    Authorization: process.env.EKART_AUTHORIZATION
                                                                                }
                                                                            })

                                                                            const bodyData = {
                                                                                "request_id": results[0].ORDER_NO,
                                                                                "service_type": "FORWARD",
                                                                                "dispatch_date": systemDate,
                                                                                "customer_pincode": deliverPincode,
                                                                                "seller_pincode": pickupPincode,
                                                                                "rto_pincode": pickupPincode,
                                                                                "rc_pincode": pickupPincode,
                                                                                "weight": volumetricWeight / 5000,
                                                                                "height": HEIGHT,
                                                                                "breadth": WIDTH,
                                                                                "length": LENGTH,
                                                                                "delivery_type": "SMALL",
                                                                                "is_dangerous": false,
                                                                                "is_fragile": false
                                                                            }

                                                                            const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                                headers: {
                                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                    Authorization: token.data.Authorization
                                                                                }
                                                                            });
                                                                            (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                                        }
                                                                    }

                                                                    if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                                        async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                                            let carrierId = data2.ID;
                                                                            if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                                async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                                    let serviceId = data.ID;
                                                                                    let serviceName = data.SERVICE_NAME;
                                                                                    let serviceCondition = true;
                                                                                    let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;
                                                                                    (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)
                                                                                    if (serviceCondition) {
                                                                                        let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND PRODUCT_ID <> 2 '
                                                                                        if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                                            ZONE_ID = 5;
                                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                        }
                                                                                        if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                                            ZONE_ID = 3;
                                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                        }

                                                                                        if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                                            ZONE_ID = 4;
                                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                        }

                                                                                        if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                                            ZONE_ID = 1;
                                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                        }

                                                                                        if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                                            ZONE_ID = 2;
                                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                        }

                                                                                        if (ZONE_ID > 0 && ZONE_ID <= 5) {
                                                                                            mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId, CUSTOMER_ID], supportKey, (error, getProductData) => {
                                                                                                if (error) {
                                                                                                    callback(error)
                                                                                                }
                                                                                                else {
                                                                                                    if (getProductData.length > 0) {
                                                                                                        let codAmount = 0;
                                                                                                        if (results[0].PAYMENT_MODE == 'COD') {
                                                                                                            let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                                            codAmount = cod;
                                                                                                        }
                                                                                                        else {
                                                                                                            codAmount = 0;
                                                                                                        }
                                                                                                        // console.log("getProductData", getProductData);

                                                                                                        getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));

                                                                                                        // console.log("DEAD_WEIGHT", DEAD_WEIGHT);
                                                                                                        // console.log("vAmt",);
                                                                                                        var vAmt = (DEAD_WEIGHT > (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)) ? DEAD_WEIGHT : (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)))
                                                                                                        let productData = []
                                                                                                        if (parseFloat(getProductData[0].ADD_WEIGHT) == 0 || (vAmt <= parseFloat(getProductData[0].END_RANGE))) {
                                                                                                            var amount = getProductData[0].ZONE_AMOUNT;

                                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                                productData.push({
                                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                    "ID": getProductData[i].PRODUCT_ID,
                                                                                                                    "XPRESSBEES_ID": getProductData[i].XPRESSBEES_ID
                                                                                                                })
                                                                                                            }
                                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                            callback();
                                                                                                        }
                                                                                                        else {
                                                                                                            var vAmt = (DEAD_WEIGHT > (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)) ? DEAD_WEIGHT : (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)))
                                                                                                            var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                                            var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                                            var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;


                                                                                                            let productData = []
                                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                                productData.push({
                                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                    "ID": getProductData[i].PRODUCT_ID,
                                                                                                                    "XPRESSBEES_ID": getProductData[i].XPRESSBEES_ID
                                                                                                                })
                                                                                                            }
                                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                            callback();
                                                                                                        }
                                                                                                    }
                                                                                                    else {
                                                                                                        callback()
                                                                                                    }
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                        else {
                                                                                            callback()
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        callback()
                                                                                    }
                                                                                }, function subCb(error) {
                                                                                    if (error) {
                                                                                        callback1(error)
                                                                                    }
                                                                                    else {
                                                                                        callback1()
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {
                                                                                callback1()
                                                                            }
                                                                        }, function subCb(error) {
                                                                            if (error) {
                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                res.send({
                                                                                    "code": 400,
                                                                                    "message": error
                                                                                });
                                                                            }
                                                                            else {
                                                                                res.send({
                                                                                    "code": 200,
                                                                                    "message": "success",
                                                                                    "orderData": results,
                                                                                    "data": rateDetails.sort((a, b) => a.amount - b.amount)
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        res.send({
                                                                            "code": 306,
                                                                            "message": "service or carrier data not found."
                                                                        })
                                                                    }
                                                                }
                                                                else {
                                                                    res.send({
                                                                        "code": 308,
                                                                        "message": "zone not found."
                                                                    })
                                                                }
                                                            })
                                                            .catch((error) => {
                                                                console.log(error);
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Something went wrong"
                                                                })
                                                            });

                                                        // const shiprocketPincodeServicable = await axios.get(process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL, {
                                                        //     "pickup_postcode": pickupPincode,
                                                        //     "delivery_postcode": deliverPincode,
                                                        //     "weight": volumetricWeight / 5000
                                                        // }, {
                                                        //     headers: {
                                                        //         Authorization: `Bearer ${shiprocketToken.data.token}`
                                                        //     }
                                                        // });



                                                    }).catch((error) => {
                                                        console.log(error);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "something went wrpng."
                                                        })
                                                    });
                                                }
                                            })
                                        }
                                        else {
                                            res.send({
                                                "code": 304,
                                                "message": "Pincode not deliverable."
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Order not found."
                        })
                    }
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

exports.calculateRate = async (req, res) => {

    var supportKey = req.headers['supportkey'];
    var ORDER_ID = req.body.ORDER_ID;
    var rateDetails = [];
    var shiprocketAvailable = 0;
    var ServicableProductIds = [];
    const systemDate = getSystemDate()

    try {
        if (ORDER_ID && ORDER_ID != ' ') {
            mm.executeQueryData('SELECT * FROM view_order_master where ID = ?', [ORDER_ID], supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order information."
                    });
                }
                else {
                    if (results.length > 0) {
                        mm.executeQueryData(`select sum(PER_UNIT_PRICE * TOTAL_UNIT) as COD_AMOUNT from order_details where ORDER_ID = ? `, ORDER_ID, supportKey, (error, getCodAmount) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get cod information."
                                });
                            }
                            else {
                                const CUSTOMER_ID = results[0].CUSTOMER_ID;
                                const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                                const PINCODE_ID = results[0].PINCODE_ID;
                                const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                                const LENGTH = results[0].LENGTH;
                                const WIDTH = results[0].WIDTH;
                                const HEIGHT = results[0].HEIGHT;
                                const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                                mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID,  PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get pincode information."
                                        });
                                    }
                                    else {
                                        const pickupPincodeData = getPincodeData[0];
                                        const deliverPincodeData = getPincodeData[1];

                                        if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                                            var ZONE_ID = 0;
                                            var query = ``;
                                            var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                                            var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                                            var pickupStateZone = pickupPincodeData[0].STATE_ID;
                                            var deliverStateZone = deliverPincodeData[0].STATE_ID;

                                            var pickupLocalZone = pickupPincodeData[0].ID;
                                            var deliverLocalZone = deliverPincodeData[0].ID;

                                            var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                                            var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                                            var pickupPincode = pickupPincodeData[0].PINCODE;
                                            var deliverPincode = deliverPincodeData[0].PINCODE;

                                            mm.executeQuery(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1; select ID from carrier_master where STATUS = 1`, supportKey, async (error, getServiceData) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get service mapping information."
                                                    });
                                                }
                                                else {
                                                    let serviceList = []
                                                    let apiCondition = 0;
                                                    let apiCondition2 = 0;
                                                    let apiCondition3 = 0;
                                                    let apiCondition4 = 0;
                                                    let zoneCondition = null;

                                                    let loginData = JSON.stringify({
                                                        "email": process.env.SHIPROCKET_EMAIL,
                                                        "password": process.env.SHIPROCKET_PASSWORD
                                                    });

                                                    let config = {
                                                        method: 'post',
                                                        maxBodyLength: Infinity,
                                                        url: process.env.SHIPROCKET_AUTH_BASEURL,
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        },
                                                        data: loginData
                                                    };

                                                    axios.request(config).then(async (shiprocketToken) => {
                                                        let shiprocketPincodeData = JSON.stringify({
                                                            "pickup_postcode": pickupPincode,
                                                            "delivery_postcode": deliverPincode,
                                                            "weight": DEAD_WEIGHT > (volumetricWeight / 5000) ? DEAD_WEIGHT : (volumetricWeight / 5000),
                                                            "cod": results[0].PAYMENT_MODE == 'COD' ? 1 : 0
                                                        });

                                                        let config2 = {
                                                            method: 'get',
                                                            maxBodyLength: Infinity,
                                                            url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${shiprocketToken.data.token}`
                                                            },
                                                            data: shiprocketPincodeData
                                                        };

                                                        axios.request(config2).then(async (shiprocketPincodeServicable) => {
                                                            if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                                (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))

                                                                for (let i = 0; i < getServiceData[1].length; i++) {
                                                                    let carrierId = getServiceData[1][i].ID;

                                                                    if (carrierId == 1) {
                                                                        var pincodeData = {
                                                                            "orgPincode": pickupPincode + "",
                                                                            "desPincode": deliverPincode + ""
                                                                        }
                                                                        const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                                        var message = response.data.ZIPCODE_RESP;
                                                                        serviceList = response.data.SERV_LIST_DTLS;

                                                                        results[0].PAYMENT_MODE == 'COD' ?

                                                                            (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO') ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                            :
                                                                            (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid") ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                    }

                                                                    if (carrierId == 3) {
                                                                        const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                                        const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                                        ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                                    }

                                                                    if (carrierId == 2) {
                                                                        const bodyData = {
                                                                            "email": process.env.EXPRESSBEES_USERNAME,
                                                                            "password": process.env.EXPRESSBEES_PASSWORD
                                                                        }
                                                                        let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})
                                                                        if (expressbeesToken.data.status == true) {
                                                                            const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                                "origin": pickupPincode,
                                                                                "destination": deliverPincode,
                                                                                "payment_type": "prepaid"
                                                                            }, {
                                                                                headers: {
                                                                                    Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                                }
                                                                            });

                                                                            (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                                        }
                                                                        else {
                                                                            apiCondition3 = 1
                                                                        }
                                                                    }

                                                                    // if (carrierId == 5) {
                                                                    //     var data = new FormData();
                                                                    //     data.append('username', process.env.EXPRESSBEES_USERNAME);
                                                                    //     data.append('password', process.env.EXPRESSBEES_PASSWORD);
                                                                    //     data.append('origin_pincode', pickupPincode);
                                                                    //     data.append('destination_pincode', deliverPincode);

                                                                    //     var config = {
                                                                    //         method: 'post',
                                                                    //         maxBodyLength: Infinity,
                                                                    //         url: process.env.ECOM_PINCODE_SERVICEABILITY_BASEURL,
                                                                    //         headers: {
                                                                    //             ...data.getHeaders()
                                                                    //         },
                                                                    //         data: data
                                                                    //     };
                                                                    //     const ecomPincodeData = await axios(config)
                                                                    //     console.log(ecomPincodeData.data);


                                                                    // }

                                                                    if (carrierId == 4) {

                                                                        const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                            headers: {
                                                                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                Authorization: process.env.EKART_AUTHORIZATION
                                                                            }
                                                                        })

                                                                        const bodyData = {
                                                                            "request_id": results[0].ORDER_NO,
                                                                            "service_type": "FORWARD",
                                                                            "dispatch_date": systemDate,
                                                                            "customer_pincode": deliverPincode,
                                                                            "seller_pincode": pickupPincode,
                                                                            "rto_pincode": pickupPincode,
                                                                            "rc_pincode": pickupPincode,
                                                                            "weight": volumetricWeight / 5000,
                                                                            "height": HEIGHT,
                                                                            "breadth": WIDTH,
                                                                            "length": LENGTH,
                                                                            "delivery_type": "SMALL",
                                                                            "is_dangerous": false,
                                                                            "is_fragile": false
                                                                        }

                                                                        const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                            headers: {
                                                                                HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                Authorization: token.data.Authorization
                                                                            }
                                                                        });
                                                                        (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                                    }
                                                                }
                                                                const filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                                    service.courier_name.toLowerCase().includes("blue")
                                                                );
                                                                if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                                    async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                                        let carrierId = data2.ID;
                                                                        if (carrierId == 6) {
                                                                            serviceCondition = false
                                                                            mm.executeQueryData(`select LOGO_URL from carrier_master where ID = ? `, carrierId, supportKey, (error, getLogo) => {
                                                                                if (error) {
                                                                                    callback1(error)
                                                                                }
                                                                                else {
                                                                                    for (let i = 0; i < filteredCompanies.length; i++) {
                                                                                        shiprocketAvailable = 1

                                                                                        let commisionAmount = (40 / 100) * (filteredCompanies[i].rate);
                                                                                        let codCommision = results[0].PAYMENT_MODE == 'COD' ? (2.36 / 100) * (getCodAmount[0].COD_AMOUNT) : 0;
                                                                                        let finalAmount = filteredCompanies[i].rate + commisionAmount + codCommision;


                                                                                        rateDetails.push({
                                                                                            "productData": [
                                                                                                {
                                                                                                    "CARRIER_NAME": "Shiprocket",
                                                                                                    "SERVICE_ID": filteredCompanies[i].courier_company_id,
                                                                                                    "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                                    "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                                    "MODE": "Domestic",
                                                                                                    "CARRIER_ID": carrierId,
                                                                                                    "LOGO_URL": getLogo[0].LOGO_URL,
                                                                                                    "ID": 0
                                                                                                }
                                                                                            ],
                                                                                            "amount": finalAmount,
                                                                                            "volumetricWeight": filteredCompanies[i].charge_weight,
                                                                                            "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                                        })
                                                                                    }
                                                                                    callback1()
                                                                                }
                                                                            })
                                                                        }


                                                                        else if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                            async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                                let serviceId = data.ID;
                                                                                let serviceName = data.SERVICE_NAME;
                                                                                let serviceCondition = true;
                                                                                let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;

                                                                                (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)



                                                                                if (serviceCondition) {
                                                                                    let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND PRODUCT_ID <> 2 ';
                                                                                    if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                                        ZONE_ID = 5;
                                                                                        query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                    }
                                                                                    if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                                        ZONE_ID = 3;
                                                                                        query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                    }

                                                                                    if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                                        ZONE_ID = 4;
                                                                                        query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                    }

                                                                                    if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                                        ZONE_ID = 1;
                                                                                        query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                    }

                                                                                    if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                                        ZONE_ID = 2;
                                                                                        query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                    }

                                                                                    if (ZONE_ID > 0 && ZONE_ID <= 5) {

                                                                                        // for (let i = 0; i < filteredCompanies.length; i++) {
                                                                                        //     productData.push({
                                                                                        //         "productData": [
                                                                                        //             {
                                                                                        //                 "CARRIER_NAME": "Blue Dart Express",
                                                                                        //                 "SERVICE_ID": 0,
                                                                                        //                 "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                        //                 "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                        //                 "MODE": "Domestic",
                                                                                        //                 "CARRIER_ID": 6,
                                                                                        //                 "LOGO_URL": "",
                                                                                        //                 "ID": 0
                                                                                        //             }
                                                                                        //         ],
                                                                                        //         "amount": filteredCompanies[i].rate,
                                                                                        //         "volumetricWeight": 1,
                                                                                        //         "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                                        //     })
                                                                                        // }
                                                                                        if (carrierId == 3) {
                                                                                            console.log("weight", DEAD_WEIGHT, volumetricWeight / 5000)
                                                                                        }

                                                                                        mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId, CUSTOMER_ID], supportKey, (error, getProductData) => {
                                                                                            if (error) {
                                                                                                callback(error)
                                                                                            }
                                                                                            else {
                                                                                                if (getProductData.length > 0) {
                                                                                                    let codAmount = 0;
                                                                                                    if (results[0].PAYMENT_MODE == 'COD') {
                                                                                                        let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                                        codAmount = cod;
                                                                                                    }
                                                                                                    else {
                                                                                                        codAmount = 0;
                                                                                                    }

                                                                                                    getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));

                                                                                                    if (getProductData[0].ADD_WEIGHT == 0 ) {
                                                                                                        var amount = getProductData[0].ZONE_AMOUNT;
                                                                                                        var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                                        let productData = []
                                                                                                        for (let i = 0; i < getProductData.length; i++) {
                                                                                                            ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                            productData.push({
                                                                                                                "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                "MODE": getProductData[i].MODE,
                                                                                                                "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                "ID": getProductData[i].PRODUCT_ID
                                                                                                            })
                                                                                                        }
                                                                                                        rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                        callback();
                                                                                                    }
                                                                                                    else {
                                                                                                        var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))

                                                                                                        // DEAD_WEIGHT = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA));

                                                                                                        var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                                        var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                                        var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;

                                                                                                        let productData = []
                                                                                                        for (let i = 0; i < getProductData.length; i++) {
                                                                                                            ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                            productData.push({
                                                                                                                "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                "MODE": getProductData[i].MODE,
                                                                                                                "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                "ID": getProductData[i].PRODUCT_ID
                                                                                                            })
                                                                                                        }
                                                                                                        rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                                        callback();
                                                                                                    }
                                                                                                }
                                                                                                else {
                                                                                                    callback()
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    else {
                                                                                        callback()
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    callback()
                                                                                }
                                                                            }, function subCb(error) {
                                                                                if (error) {
                                                                                    callback1(error)
                                                                                }
                                                                                else {
                                                                                    callback1()
                                                                                }
                                                                            });
                                                                        }
                                                                        else {
                                                                            callback1()
                                                                        }
                                                                    }, function subCb(error) {
                                                                        if (error) {
                                                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": error
                                                                            });
                                                                        }
                                                                        else {
                                                                            let query = ServicableProductIds.length > 0 ? `select DISTINCT(CARRIER_ID) as CARRIER_ID, CARRIER_NAME, LOGO_URL from view_product_master where ID NOT IN(${ServicableProductIds}) ` : `select DISTINCT(CARRIER_ID) as CARRIER_ID, CARRIER_NAME, LOGO_URL from view_product_master where ID IN(0) ;`

                                                                            mm.executeQuery(query, supportKey, (error, getCarrierData) => {
                                                                                if (error) {
                                                                                    console.log(error);
                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                    res.send({
                                                                                        "code": 400,
                                                                                        "message": error
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    if (shiprocketAvailable == 0) {
                                                                                        mm.executeQueryData(`select ID as CARRIER_ID, CARRIER_NAME, LOGO_URL from carrier_master where ID = ?`, 6, supportKey, (error, getBlueDartData) => {
                                                                                            if (error) {
                                                                                                console.log(error);
                                                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                                res.send({
                                                                                                    "code": 400,
                                                                                                    "message": error
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                getCarrierData.push(getBlueDartData[0])
                                                                                                res.send({
                                                                                                    "code": 200,
                                                                                                    "message": "success",
                                                                                                    "orderData": results,
                                                                                                    "data": rateDetails.sort((a, b) => a.amount - b.amount),
                                                                                                    "nonServicableCouriers": getCarrierData
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    else {
                                                                                        res.send({
                                                                                            "code": 200,
                                                                                            "message": "success",
                                                                                            "orderData": results,
                                                                                            "data": rateDetails.sort((a, b) => a.amount - b.amount),
                                                                                            "nonServicableCouriers": getCarrierData
                                                                                        });
                                                                                    }
                                                                                }
                                                                            })
                                                                        }
                                                                    });
                                                                }
                                                                else {
                                                                    res.send({
                                                                        "code": 306,
                                                                        "message": "service or carrier data not found."
                                                                    })
                                                                }
                                                            }
                                                            else {
                                                                res.send({
                                                                    "code": 308,
                                                                    "message": "zone not found."
                                                                })
                                                            }
                                                        })
                                                            .catch((error) => {
                                                                console.log(error);
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Something went wrong"
                                                                })
                                                            });

                                                        // const shiprocketPincodeServicable = await axios.get(process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL, {
                                                        //     "pickup_postcode": pickupPincode,
                                                        //     "delivery_postcode": deliverPincode,
                                                        //     "weight": volumetricWeight / 5000
                                                        // }, {
                                                        //     headers: {
                                                        //         Authorization: `Bearer ${shiprocketToken.data.token}`
                                                        //     }
                                                        // });



                                                    })
                                                        .catch((error) => {
                                                            console.log(error);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "something went wrpng."
                                                            })
                                                        });
                                                }
                                            })
                                        }
                                        else {
                                            res.send({
                                                "code": 304,
                                                "message": "Pincode not deliverable."
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Order not found."
                        })
                    }
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

exports.calculateUniversalRate = async (req, res) => {

    var supportKey = req.headers['supportkey'];
    var rateDetails = [];
    const systemDate = mm.getSystemDate();
    var shiprocketAvailable = 0;
    var ServicableProductIds = [];
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        PICKUP_PINCODE_ID = req.body.PICKUP_PINCODE_ID,
        PINCODE_ID = req.body.PINCODE_ID,
        DEAD_WEIGHT = parseFloat(req.body.DEAD_WEIGHT),
        LENGTH = parseInt(req.body.LENGTH),
        WIDTH = parseInt(req.body.WIDTH),
        HEIGHT = parseInt(req.body.HEIGHT),
        ORDER_NO = 'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2],
        PAYMENT_MODE = req.body.PAYMENT_MODE;

    try {

        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && PICKUP_PINCODE_ID && PICKUP_PINCODE_ID != ' ' && PINCODE_ID && PINCODE_ID != ' ' && DEAD_WEIGHT && DEAD_WEIGHT != ' ' && LENGTH && LENGTH != " " && WIDTH && WIDTH != " " && HEIGHT && HEIGHT != ' ') {

            const results = [
                {
                    "CUSTOMER_ID": CUSTOMER_ID,
                    "PICKUP_PINCODE_ID": PICKUP_PINCODE_ID,
                    "PINCODE_ID": PINCODE_ID,
                    "DEAD_WEIGHT": DEAD_WEIGHT,
                    "LENGTH": LENGTH,
                    "WIDTH": WIDTH,
                    "HEIGHT": HEIGHT,
                    "ORDER_NO": ORDER_NO,
                    "PAYMENT_MODE": PAYMENT_MODE
                }
            ]

            let getCodAmount = [
                {
                    "COD_AMOUNT": req.body.COD_AMOUNT
                }
            ]

            if (results.length > 0) {
                const CUSTOMER_ID = results[0].CUSTOMER_ID;
                const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                const PINCODE_ID = results[0].PINCODE_ID;
                const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                const LENGTH = results[0].LENGTH;
                const WIDTH = results[0].WIDTH;
                const HEIGHT = results[0].HEIGHT;
                const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                // console.log("volumetricWeight", volumetricWeight);


                mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID,  PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get pincode information."
                        });
                    }
                    else {
                        const pickupPincodeData = getPincodeData[0];
                        const deliverPincodeData = getPincodeData[1];

                        if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                            var ZONE_ID = 0;
                            var query = ``;
                            var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                            var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                            var pickupStateZone = pickupPincodeData[0].STATE_ID;
                            var deliverStateZone = deliverPincodeData[0].STATE_ID;

                            var pickupLocalZone = pickupPincodeData[0].ID;
                            var deliverLocalZone = deliverPincodeData[0].ID;

                            var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                            var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                            var pickupPincode = pickupPincodeData[0].PINCODE;
                            var deliverPincode = deliverPincodeData[0].PINCODE;

                            mm.executeQuery(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1; select ID from carrier_master where STATUS = 1`, supportKey, async (error, getServiceData) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get service mapping information."
                                    });
                                }
                                else {
                                    let serviceList = []
                                    let apiCondition = 0;
                                    let apiCondition2 = 0;
                                    let apiCondition3 = 0;
                                    let apiCondition4 = 0;
                                    let zoneCondition = null;


                                    let loginData = JSON.stringify({
                                        "email": process.env.SHIPROCKET_EMAIL,
                                        "password": process.env.SHIPROCKET_PASSWORD
                                    });

                                    let config = {
                                        method: 'post',
                                        maxBodyLength: Infinity,
                                        url: process.env.SHIPROCKET_AUTH_BASEURL,
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        data: loginData
                                    };

                                    axios.request(config).then(async (shiprocketToken) => {
                                        let shiprocketPincodeData = JSON.stringify({
                                            "pickup_postcode": pickupPincode,
                                            "delivery_postcode": deliverPincode,
                                            "weight": DEAD_WEIGHT > (volumetricWeight / 5000) ? DEAD_WEIGHT : volumetricWeight / 5000,
                                            "cod": results[0].PAYMENT_MODE == 'COD' ? 1 : 0
                                        });
                                        let config2 = {
                                            method: 'get',
                                            maxBodyLength: Infinity,
                                            url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${shiprocketToken.data.token}`
                                            },
                                            data: shiprocketPincodeData
                                        };

                                        axios.request(config2)
                                            .then(async (shiprocketPincodeServicable) => {


                                                if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                    (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))
                                                    for (let i = 0; i < getServiceData[1].length; i++) {
                                                        var carrierId = getServiceData[1][i].ID;


                                                        if (carrierId == 1) {
                                                            var pincodeData = {
                                                                "orgPincode": pickupPincode + "",
                                                                "desPincode": deliverPincode + ""
                                                            }
                                                            const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                            var message = response.data.ZIPCODE_RESP;
                                                            serviceList = response.data.SERV_LIST_DTLS;

                                                            results[0].PAYMENT_MODE == 'COD' ?

                                                                (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO') ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                :
                                                                (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid") ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                        }

                                                        if (carrierId == 3) {
                                                            const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                            const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                            ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                        }

                                                        if (carrierId == 2) {
                                                            const bodyData = {
                                                                "email": process.env.EXPRESSBEES_USERNAME,
                                                                "password": process.env.EXPRESSBEES_PASSWORD
                                                            }

                                                            let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})

                                                            if (expressbeesToken.data.status == true) {
                                                                const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                    "origin": pickupPincode,
                                                                    "destination": deliverPincode,
                                                                    "payment_type": "prepaid"
                                                                }, {
                                                                    headers: {
                                                                        Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                    }
                                                                });

                                                                (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                            }
                                                            else {
                                                                apiCondition3 = 1
                                                            }
                                                        }

                                                        // if (carrierId == 5) {
                                                        //     var data = new FormData();
                                                        //     data.append('username', process.env.EXPRESSBEES_USERNAME);
                                                        //     data.append('password', process.env.EXPRESSBEES_PASSWORD);
                                                        //     data.append('origin_pincode', pickupPincode);
                                                        //     data.append('destination_pincode', deliverPincode);

                                                        //     var config = {
                                                        //         method: 'post',
                                                        //         maxBodyLength: Infinity,
                                                        //         url: process.env.ECOM_PINCODE_SERVICEABILITY_BASEURL,
                                                        //         headers: {
                                                        //             ...data.getHeaders()
                                                        //         },
                                                        //         data: data
                                                        //     };
                                                        //     const ecomPincodeData = await axios(config)
                                                        //     console.log(ecomPincodeData.data);


                                                        // }

                                                        if (carrierId == 4) {

                                                            const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                headers: {
                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                    Authorization: process.env.EKART_AUTHORIZATION
                                                                }
                                                            })

                                                            const bodyData = {
                                                                "request_id": results[0].ORDER_NO,
                                                                "service_type": "FORWARD",
                                                                "dispatch_date": systemDate,
                                                                "customer_pincode": deliverPincode,
                                                                "seller_pincode": pickupPincode,
                                                                "rto_pincode": pickupPincode,
                                                                "rc_pincode": pickupPincode,
                                                                "weight": volumetricWeight / 5000,
                                                                "height": HEIGHT,
                                                                "breadth": WIDTH,
                                                                "length": LENGTH,
                                                                "delivery_type": "SMALL",
                                                                "is_dangerous": false,
                                                                "is_fragile": false
                                                            }

                                                            const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                headers: {
                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                    Authorization: token.data.Authorization
                                                                }
                                                            });
                                                            (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                        }
                                                    }

                                                    const filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                        service.courier_name.toLowerCase().includes("blue")
                                                    );

                                                    if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                        async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                            let carrierId = data2.ID;

                                                            if (carrierId == 6) {
                                                                serviceCondition = false
                                                                mm.executeQueryData(`select LOGO_URL from carrier_master where ID = ? `, carrierId, supportKey, (error, getLogo) => {
                                                                    if (error) {
                                                                        callback1(error)
                                                                    }
                                                                    else {
                                                                        for (let i = 0; i < filteredCompanies.length; i++) {
                                                                            shiprocketAvailable = 1

                                                                            let commisionAmount = (40 / 100) * (filteredCompanies[i].rate);
                                                                            let codCommision = results[0].PAYMENT_MODE == 'COD' ? (2.36 / 100) * (getCodAmount[0].COD_AMOUNT) : 0;
                                                                            let finalAmount = filteredCompanies[i].rate + commisionAmount + codCommision;


                                                                            rateDetails.push({
                                                                                "productData": [
                                                                                    {
                                                                                        "CARRIER_NAME": "Shiprocket",
                                                                                        "SERVICE_ID": filteredCompanies[i].courier_company_id,
                                                                                        "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                        "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                        "MODE": "Domestic",
                                                                                        "CARRIER_ID": carrierId,
                                                                                        "LOGO_URL": getLogo[0].LOGO_URL,
                                                                                        "ID": 0
                                                                                    }
                                                                                ],
                                                                                "amount": finalAmount,
                                                                                "volumetricWeight": filteredCompanies[i].charge_weight,
                                                                                "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                            })
                                                                        }
                                                                        callback1()
                                                                    }
                                                                })
                                                            }

                                                            else if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                    let serviceId = data.ID;
                                                                    let serviceName = data.SERVICE_NAME;
                                                                    let serviceCondition = true;
                                                                    let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;

                                                                    (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)

                                                                    if (serviceCondition) {
                                                                        let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND PRODUCT_ID <> 2 ';
                                                                        if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                            ZONE_ID = 5;
                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }
                                                                        if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                            ZONE_ID = 3;
                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                            ZONE_ID = 4;
                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                            ZONE_ID = 1;
                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                            ZONE_ID = 2;
                                                                            query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (ZONE_ID > 0 && ZONE_ID <= 5) {

                                                                            // for (let i = 0; i < filteredCompanies.length; i++) {
                                                                            //     productData.push({
                                                                            //         "productData": [
                                                                            //             {
                                                                            //                 "CARRIER_NAME": "Blue Dart Express",
                                                                            //                 "SERVICE_ID": 0,
                                                                            //                 "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                            //                 "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                            //                 "MODE": "Domestic",
                                                                            //                 "CARRIER_ID": 6,
                                                                            //                 "LOGO_URL": "",
                                                                            //                 "ID": 0
                                                                            //             }
                                                                            //         ],
                                                                            //         "amount": filteredCompanies[i].rate,
                                                                            //         "volumetricWeight": 1,
                                                                            //         "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                            //     })
                                                                            // }


                                                                            mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId, CUSTOMER_ID], supportKey, (error, getProductData) => {
                                                                                if (error) {
                                                                                    callback(error)
                                                                                }
                                                                                else {
                                                                                    if (getProductData.length > 0) {
                                                                                        let codAmount = 0;
                                                                                        if (results[0].PAYMENT_MODE == 'COD') {
                                                                                            let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                            codAmount = cod;
                                                                                        }
                                                                                        else {
                                                                                            codAmount = 0;
                                                                                        }

                                                                                        getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));

                                                                                        if (getProductData[0].ADD_WEIGHT == 0) {
                                                                                            var amount = getProductData[0].ZONE_AMOUNT;
                                                                                            var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            let productData = []
                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                productData.push({
                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                    "ID": getProductData[i].PRODUCT_ID
                                                                                                })
                                                                                            }
                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                            callback();
                                                                                        }
                                                                                        else {
                                                                                            var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                            var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                            var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;

                                                                                            let productData = []
                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                ServicableProductIds.push(getProductData[i].PRODUCT_ID)
                                                                                                productData.push({
                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                    "ID": getProductData[i].PRODUCT_ID
                                                                                                })
                                                                                            }
                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                            callback();
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        callback()
                                                                                    }
                                                                                }
                                                                            })
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    }
                                                                    else {
                                                                        callback()
                                                                    }
                                                                }, function subCb(error) {
                                                                    if (error) {
                                                                        callback1(error)
                                                                    }
                                                                    else {
                                                                        callback1()
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                callback1()
                                                            }
                                                        }, function subCb(error) {
                                                            if (error) {
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": error
                                                                });
                                                            }
                                                            else {
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "success",
                                                                    "orderData": results,
                                                                    "data": rateDetails.sort((a, b) => a.amount - b.amount)
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        res.send({
                                                            "code": 306,
                                                            "message": "service or carrier data not found."
                                                        })
                                                    }
                                                }
                                                else {
                                                    res.send({
                                                        "code": 308,
                                                        "message": "zone not found."
                                                    })
                                                }
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Something went wrong"
                                                })
                                            });

                                        // const shiprocketPincodeServicable = await axios.get(process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL, {
                                        //     "pickup_postcode": pickupPincode,
                                        //     "delivery_postcode": deliverPincode,
                                        //     "weight": volumetricWeight / 5000
                                        // }, {
                                        //     headers: {
                                        //         Authorization: `Bearer ${shiprocketToken.data.token}`
                                        //     }
                                        // });



                                    }).catch((error) => {
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "something went wrpng."
                                        })
                                    });
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "Pincode not deliverable."
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Order not found."
                })
            }
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

async function productList(ORDER_ID, req) {

    var supportKey = 1234;
    var rateDetails = [];
    const systemDate = getSystemDate()
    return new Promise((resolve, reject) => {
        try {
            if (ORDER_ID && ORDER_ID != ' ') {
                mm.executeQueryData('SELECT * FROM view_order_master where ID = ?', [ORDER_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        reject({
                            "code": 400,
                            "message": "Failed to get order information."
                        });
                    }
                    else {
                        if (results.length > 0) {
                            mm.executeQueryData(`select sum(PER_UNIT_PRICE * TOTAL_UNIT) as COD_AMOUNT from order_details where ORDER_ID = ? `, ORDER_ID, supportKey, (erro, getCodAmount) => {
                                if (error) {
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    reject({
                                        "code": 400,
                                        "message": "Failed to get cod information."
                                    });
                                }
                                else {
                                    const CUSTOMER_ID = results[0].CUSTOMER_ID;
                                    const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                                    const PINCODE_ID = results[0].PINCODE_ID;
                                    const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                                    const LENGTH = results[0].LENGTH;
                                    const WIDTH = results[0].WIDTH;
                                    const HEIGHT = results[0].HEIGHT;
                                    const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                                    mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID,  PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            reject({
                                                "code": 400,
                                                "message": "Failed to get pincode information."
                                            });
                                        }
                                        else {
                                            const pickupPincodeData = getPincodeData[0];
                                            const deliverPincodeData = getPincodeData[1];

                                            if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                                                var ZONE_ID = 0;
                                                var query = ``;
                                                var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                                                var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                                                var pickupStateZone = pickupPincodeData[0].STATE_ID;
                                                var deliverStateZone = deliverPincodeData[0].STATE_ID;

                                                var pickupLocalZone = pickupPincodeData[0].ID;
                                                var deliverLocalZone = deliverPincodeData[0].ID;

                                                var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                                                var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                                                var pickupPincode = pickupPincodeData[0].PINCODE;
                                                var deliverPincode = deliverPincodeData[0].PINCODE;

                                                mm.executeQuery(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1; select ID from carrier_master where STATUS = 1`, supportKey, async (error, getServiceData) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        reject({
                                                            "code": 400,
                                                            "message": "Failed to get service mapping information."
                                                        });
                                                    }
                                                    else {
                                                        let serviceList = []
                                                        let apiCondition = 0;
                                                        let apiCondition2 = 0;
                                                        let apiCondition3 = 0;
                                                        let apiCondition4 = 0;
                                                        let zoneCondition = null;


                                                        let loginData = JSON.stringify({
                                                            "email": process.env.SHIPROCKET_EMAIL,
                                                            "password": process.env.SHIPROCKET_PASSWORD
                                                        });

                                                        let config = {
                                                            method: 'post',
                                                            maxBodyLength: Infinity,
                                                            url: process.env.SHIPROCKET_AUTH_BASEURL,
                                                            headers: {
                                                                'Content-Type': 'application/json'
                                                            },
                                                            data: loginData
                                                        };

                                                        axios.request(config).then(async (shiprocketToken) => {
                                                            let shiprocketPincodeData = JSON.stringify({
                                                                "pickup_postcode": pickupPincode,
                                                                "delivery_postcode": deliverPincode,
                                                                "weight": volumetricWeight / 5000,
                                                                "cod": 1
                                                            });
                                                            let config2 = {
                                                                method: 'get',
                                                                maxBodyLength: Infinity,
                                                                url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${shiprocketToken.data.token}`
                                                                },
                                                                data: shiprocketPincodeData
                                                            };

                                                            axios.request(config2)
                                                                .then(async (shiprocketPincodeServicable) => {


                                                                    if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                                        (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))
                                                                        for (let i = 0; i < getServiceData[1].length; i++) {
                                                                            var carrierId = getServiceData[1][i].ID;


                                                                            if (carrierId == 1) {
                                                                                var pincodeData = {
                                                                                    "orgPincode": pickupPincode + "",
                                                                                    "desPincode": deliverPincode + ""
                                                                                }
                                                                                const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                                                var message = response.data.ZIPCODE_RESP;
                                                                                serviceList = response.data.SERV_LIST_DTLS;


                                                                                (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO' ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                            }

                                                                            if (carrierId == 3) {
                                                                                const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                                                const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                                                ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                                            }

                                                                            if (carrierId == 2) {
                                                                                const bodyData = {
                                                                                    "email": process.env.EXPRESSBEES_USERNAME,
                                                                                    "password": process.env.EXPRESSBEES_PASSWORD
                                                                                }

                                                                                let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})

                                                                                if (expressbeesToken.data.status == true) {
                                                                                    const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                                        "origin": pickupPincode,
                                                                                        "destination": deliverPincode,
                                                                                        "payment_type": "prepaid"
                                                                                    }, {
                                                                                        headers: {
                                                                                            Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                                        }
                                                                                    });

                                                                                    (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                                                }
                                                                                else {
                                                                                    apiCondition3 = 1
                                                                                }
                                                                            }

                                                                            if (carrierId == 4) {

                                                                                const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                                    headers: {
                                                                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                        Authorization: process.env.EKART_AUTHORIZATION
                                                                                    }
                                                                                })

                                                                                const bodyData = {
                                                                                    "request_id": results[0].ORDER_NO,
                                                                                    "service_type": "FORWARD",
                                                                                    "dispatch_date": systemDate,
                                                                                    "customer_pincode": deliverPincode,
                                                                                    "seller_pincode": pickupPincode,
                                                                                    "rto_pincode": pickupPincode,
                                                                                    "rc_pincode": pickupPincode,
                                                                                    "weight": volumetricWeight / 5000,
                                                                                    "height": HEIGHT,
                                                                                    "breadth": WIDTH,
                                                                                    "length": LENGTH,
                                                                                    "delivery_type": "SMALL",
                                                                                    "is_dangerous": false,
                                                                                    "is_fragile": false
                                                                                }

                                                                                const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                                    headers: {
                                                                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                                        Authorization: token.data.Authorization
                                                                                    }
                                                                                });
                                                                                (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                                            }
                                                                        }

                                                                        if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                                            async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                                                let carrierId = data2.ID;
                                                                                if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                                    async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                                        let serviceId = data.ID;
                                                                                        let serviceName = data.SERVICE_NAME;
                                                                                        let serviceCondition = true;
                                                                                        let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;
                                                                                        (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)
                                                                                        if (serviceCondition) {
                                                                                            let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND PRODUCT_ID <> 2 '
                                                                                            if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                                                ZONE_ID = 5;
                                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                            }
                                                                                            if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                                                ZONE_ID = 3;
                                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                            }

                                                                                            if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                                                ZONE_ID = 4;
                                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                            }

                                                                                            if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                                                ZONE_ID = 1;
                                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                            }

                                                                                            if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                                                ZONE_ID = 2;
                                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL, XPRESSBEES_ID from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                                            }

                                                                                            if (ZONE_ID > 0 && ZONE_ID <= 5) {
                                                                                                mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId, CUSTOMER_ID], supportKey, (error, getProductData) => {
                                                                                                    if (error) {
                                                                                                        callback(error)
                                                                                                    }
                                                                                                    else {
                                                                                                        if (getProductData.length > 0) {
                                                                                                            if (results[0].PAYMENT_MODE == 'COD') {
                                                                                                                let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                                                codAmount = cod;
                                                                                                            }
                                                                                                            else {
                                                                                                                codAmount = 0;
                                                                                                            }

                                                                                                            getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));

                                                                                                            var vAmt = (DEAD_WEIGHT > (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)) ? DEAD_WEIGHT : (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)))
                                                                                                            let productData = []
                                                                                                            if (parseFloat(getProductData[0].ADD_WEIGHT) == 0 || (vAmt <= parseFloat(getProductData[0].END_RANGE))) {

                                                                                                                for (let i = 0; i < getProductData.length; i++) {
                                                                                                                    productData.push({
                                                                                                                        "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                        "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                        "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                        "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                        "MODE": getProductData[i].MODE,
                                                                                                                        "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                        "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                        "ID": getProductData[i].PRODUCT_ID,
                                                                                                                        "XPRESSBEES_ID": getProductData[i].XPRESSBEES_ID
                                                                                                                    })
                                                                                                                }
                                                                                                                rateDetails.push({
                                                                                                                    "productData": productData,
                                                                                                                    "ORDER_ID": ORDER_ID
                                                                                                                });
                                                                                                                callback();
                                                                                                            }
                                                                                                            else {
                                                                                                                var vAmt = (DEAD_WEIGHT > (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)) ? DEAD_WEIGHT : (parseFloat(volumetricWeight) / parseFloat(getProductData[0].WEIGHT_FOR_FORMULA)))
                                                                                                                var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                                                var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                                                var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;


                                                                                                                let productData = []
                                                                                                                for (let i = 0; i < getProductData.length; i++) {
                                                                                                                    productData.push({
                                                                                                                        "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                                        "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                                        "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                                        "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                                        "MODE": getProductData[i].MODE,
                                                                                                                        "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                                        "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                                        "ID": getProductData[i].PRODUCT_ID,
                                                                                                                        "XPRESSBEES_ID": getProductData[i].XPRESSBEES_ID
                                                                                                                    })
                                                                                                                }
                                                                                                                rateDetails.push({
                                                                                                                    "productData": productData,
                                                                                                                    "ORDER_ID": ORDER_ID
                                                                                                                });
                                                                                                                callback();
                                                                                                            }
                                                                                                        }
                                                                                                        else {
                                                                                                            callback()
                                                                                                        }
                                                                                                    }
                                                                                                })
                                                                                            }
                                                                                            else {
                                                                                                callback()
                                                                                            }
                                                                                        }
                                                                                        else {
                                                                                            callback()
                                                                                        }
                                                                                    }, function subCb(error) {
                                                                                        if (error) {
                                                                                            callback1(error)
                                                                                        }
                                                                                        else {
                                                                                            callback1()
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    callback1()
                                                                                }
                                                                            }, function subCb(error) {
                                                                                if (error) {
                                                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                                    reject({
                                                                                        "code": 400,
                                                                                        "message": error
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    resolve({
                                                                                        "code": 200,
                                                                                        "message": "success",
                                                                                        "data": rateDetails
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                        else {
                                                                            reject({
                                                                                "code": 306,
                                                                                "message": "service or carrier data not found."
                                                                            })
                                                                        }
                                                                    }
                                                                    else {
                                                                        reject({
                                                                            "code": 308,
                                                                            "message": "zone not found."
                                                                        })
                                                                    }
                                                                })
                                                                .catch((error) => {
                                                                    console.log(error);
                                                                    reject({
                                                                        "code": 400,
                                                                        "message": "Something went wrong"
                                                                    })
                                                                });
                                                        }).catch((error) => {
                                                            console.log(error);
                                                            reject({
                                                                "code": 400,
                                                                "message": "something went wrpng."
                                                            })
                                                        });
                                                    }
                                                })
                                            }
                                            else {
                                                reject({
                                                    "code": 304,
                                                    "message": "Pincode not deliverable."
                                                })
                                            }
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            reject({
                                "code": 404,
                                "message": "Order not found."
                            })
                        }
                    }
                });
            }
            else {
                reject({
                    "code": 404,
                    "message": "Parameter Missing"
                })
            }
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            reject({
                "code": 400,
                "message": "Something went wronge.."
            })
        }
    })
}

exports.getProductsForBulkOrder = async (req, res) => {
    const supportKey = req.headers["supportKey"];
    const orderIds = req.body.ORDER_ID && (req.body.ORDER_ID).length > 0 ? req.body.ORDER_ID : [];
    var productListData = [];
    try {
        if (orderIds.length > 0) {

            async.eachSeries(orderIds, function iteratorOverElems(ORDER_ID, callback) {
                mm.executeQueryData(`select ID from order_master where ID = ?`, ORDER_ID, supportKey, async (error, getOrder) => {
                    if (error) {
                        callback(error)
                    }
                    else {
                        let productData = await productList(ORDER_ID, req);
                        if (productData.code == 200) {
                            productListData.push(productData.data)
                            callback()
                        }
                        else {
                            callback(error)
                        }
                    }
                })
            }, function subCb(error) {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get details..."
                    });
                }
                else {

                    const filteredOrders = productListData.filter(orderArray =>
                        orderArray.length && orderIds.includes(orderArray[0].ORDER_ID)
                    );

                    const productsPerOrder = filteredOrders.map(orderArray =>
                        orderArray.map(item => item.productData[0])
                    );

                    const getProductIds = (products) => new Set(products.map(p => p.ID));
                    let commonIds = getProductIds(productsPerOrder[0]);

                    for (let i = 1; i < productsPerOrder.length; i++) {
                        const ids = getProductIds(productsPerOrder[i]);
                        commonIds = new Set([...commonIds].filter(id => ids.has(id)));
                    }

                    const commonProducts = productsPerOrder[0].filter(p => commonIds.has(p.ID));
                    let remainingProductIds = []
                    for (let i = 0; i < commonProducts.length; i++) {
                        remainingProductIds.push(commonProducts[i].CARRIER_ID)
                    }
                    if (remainingProductIds.length > 0) {
                        mm.executeQuery(`select ID as CARRIER_ID, CARRIER_NAME, LOGO_URL from carrier_master where ID NOT IN(${remainingProductIds}) AND STATUS = 1`, supportKey, (error, getNonServicableCarriers) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get details..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "success...",
                                    "data": commonProducts,
                                    "nonServicableCouriers": getNonServicableCarriers
                                });
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success...",
                            "data": commonProducts,
                            "nonServicableCouriers": []
                        });
                    }

                }
            });

        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.calculateGlobalRate = async (req, res) => {

    var supportKey = req.headers['supportkey'];
    var rateDetails = [];
    const systemDate = mm.getSystemDate();
    var shiprocketAvailable = 0;
    var ServicableProductIds = [];
    const PICKUP_PINCODE_ID = req.body.PICKUP_PINCODE_ID,
        PINCODE_ID = req.body.PINCODE_ID,
        DEAD_WEIGHT = parseFloat(req.body.DEAD_WEIGHT),
        LENGTH = parseInt(req.body.LENGTH),
        WIDTH = parseInt(req.body.WIDTH),
        HEIGHT = parseInt(req.body.HEIGHT),
        ORDER_NO = 'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2],
        PAYMENT_MODE = req.body.PAYMENT_MODE;

    try {

        if (PICKUP_PINCODE_ID && PICKUP_PINCODE_ID != ' ' && PINCODE_ID && PINCODE_ID != ' ' && DEAD_WEIGHT && DEAD_WEIGHT != ' ' && LENGTH && LENGTH != " " && WIDTH && WIDTH != " " && HEIGHT && HEIGHT != ' ') {

            const results = [
                {
                    "PICKUP_PINCODE_ID": PICKUP_PINCODE_ID,
                    "PINCODE_ID": PINCODE_ID,
                    "DEAD_WEIGHT": DEAD_WEIGHT,
                    "LENGTH": LENGTH,
                    "WIDTH": WIDTH,
                    "HEIGHT": HEIGHT,
                    "ORDER_NO": ORDER_NO,
                    "PAYMENT_MODE": PAYMENT_MODE
                }
            ]

            let getCodAmount = [
                {
                    "COD_AMOUNT": req.body.COD_AMOUNT
                }
            ]

            if (results.length > 0) {
                const PICKUP_PINCODE_ID = results[0].PICKUP_PINCODE_ID;
                const PINCODE_ID = results[0].PINCODE_ID;
                const DEAD_WEIGHT = results[0].DEAD_WEIGHT;
                const LENGTH = results[0].LENGTH;
                const WIDTH = results[0].WIDTH;
                const HEIGHT = results[0].HEIGHT;
                const volumetricWeight = LENGTH * WIDTH * HEIGHT;

                // console.log("volumetricWeight", volumetricWeight);


                mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID,  PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get pincode information."
                        });
                    }
                    else {
                        const pickupPincodeData = getPincodeData[0];
                        const deliverPincodeData = getPincodeData[1];

                        if (pickupPincodeData.length > 0 && deliverPincodeData.length > 0) {
                            var ZONE_ID = 0;
                            var query = ``;
                            var pickupSpecialZone = pickupPincodeData[0].IS_SPECIAL_ZONE;
                            var deliverSpecialZone = deliverPincodeData[0].IS_SPECIAL_ZONE;

                            var pickupStateZone = pickupPincodeData[0].STATE_ID;
                            var deliverStateZone = deliverPincodeData[0].STATE_ID;

                            var pickupLocalZone = pickupPincodeData[0].ID;
                            var deliverLocalZone = deliverPincodeData[0].ID;

                            var pickupMetroZone = pickupPincodeData[0].IS_METRO_CITY;
                            var deliverMetroZone = deliverPincodeData[0].IS_METRO_CITY;

                            var pickupPincode = pickupPincodeData[0].PINCODE;
                            var deliverPincode = deliverPincodeData[0].PINCODE;

                            mm.executeQuery(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1; select ID from carrier_master where STATUS = 1`, supportKey, async (error, getServiceData) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get service mapping information."
                                    });
                                }
                                else {
                                    let serviceList = []
                                    let apiCondition = 0;
                                    let apiCondition2 = 0;
                                    let apiCondition3 = 0;
                                    let apiCondition4 = 0;
                                    let zoneCondition = null;


                                    let loginData = JSON.stringify({
                                        "email": process.env.SHIPROCKET_EMAIL,
                                        "password": process.env.SHIPROCKET_PASSWORD
                                    });

                                    let config = {
                                        method: 'post',
                                        maxBodyLength: Infinity,
                                        url: process.env.SHIPROCKET_AUTH_BASEURL,
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        data: loginData
                                    };

                                    axios.request(config).then(async (shiprocketToken) => {
                                        let shiprocketPincodeData = JSON.stringify({
                                            "pickup_postcode": pickupPincode,
                                            "delivery_postcode": deliverPincode,
                                            "weight": DEAD_WEIGHT > (volumetricWeight / 5000) ? DEAD_WEIGHT : volumetricWeight / 5000,
                                            "cod": 1
                                        });
                                        let config2 = {
                                            method: 'get',
                                            maxBodyLength: Infinity,
                                            url: process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL,
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${shiprocketToken.data.token}`
                                            },
                                            data: shiprocketPincodeData
                                        };

                                        axios.request(config2)
                                            .then(async (shiprocketPincodeServicable) => {


                                                if ((shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {
                                                    (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_c' ? zoneCondition = 'M' : (shiprocketPincodeServicable.data.data.available_courier_companies[0].zone == 'z_e' ? zoneCondition = 'S' : null))
                                                    for (let i = 0; i < getServiceData[1].length; i++) {
                                                        var carrierId = getServiceData[1][i].ID;


                                                        if (carrierId == 1) {
                                                            var pincodeData = {
                                                                "orgPincode": pickupPincode + "",
                                                                "desPincode": deliverPincode + ""
                                                            }
                                                            const response = await axios.post(process.env.DTDC_PINCODE_API, pincodeData, {});
                                                            var message = response.data.ZIPCODE_RESP;
                                                            serviceList = response.data.SERV_LIST_DTLS;

                                                            results[0].PAYMENT_MODE == 'COD' ?

                                                                (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid" || response.data.SERV_LIST[0].COD_Serviceable == 'NO') ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                                :
                                                                (message[0].MESSAGE != "SUCCESS" && (message[0].MESSAGE == "ORGPIN is not valid" || message[0].MESSAGE == "Pincode is not Valid" || message[0].MESSAGE == "DESTPIN is not valid") ? apiCondition = message[0].MESSAGE : apiCondition = 0)
                                                        }

                                                        if (carrierId == 3) {
                                                            const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                            const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                            ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                        }

                                                        if (carrierId == 2) {
                                                            const bodyData = {
                                                                "email": process.env.EXPRESSBEES_USERNAME,
                                                                "password": process.env.EXPRESSBEES_PASSWORD
                                                            }

                                                            let expressbeesToken = await axios.post(process.env.EXPRESSBEES_LOGIN_BASEURL, bodyData, {})

                                                            if (expressbeesToken.data.status == true) {
                                                                const expressbeesPincodeDetails = await axios.post(process.env.EXPRESSBEES_PINCODE_SERVICABILITY_BASEURL, {
                                                                    "origin": pickupPincode,
                                                                    "destination": deliverPincode,
                                                                    "payment_type": "prepaid"
                                                                }, {
                                                                    headers: {
                                                                        Authorization: `Bearer ${expressbeesToken.data.data}`
                                                                    }
                                                                });

                                                                (expressbeesPincodeDetails.data.status ? apiCondition3 = 0 : apiCondition3 = 1)
                                                            }
                                                            else {
                                                                apiCondition3 = 1
                                                            }
                                                        }

                                                        // if (carrierId == 5) {
                                                        //     var data = new FormData();
                                                        //     data.append('username', process.env.EXPRESSBEES_USERNAME);
                                                        //     data.append('password', process.env.EXPRESSBEES_PASSWORD);
                                                        //     data.append('origin_pincode', pickupPincode);
                                                        //     data.append('destination_pincode', deliverPincode);

                                                        //     var config = {
                                                        //         method: 'post',
                                                        //         maxBodyLength: Infinity,
                                                        //         url: process.env.ECOM_PINCODE_SERVICEABILITY_BASEURL,
                                                        //         headers: {
                                                        //             ...data.getHeaders()
                                                        //         },
                                                        //         data: data
                                                        //     };
                                                        //     const ecomPincodeData = await axios(config)
                                                        //     console.log(ecomPincodeData.data);


                                                        // }

                                                        if (carrierId == 4) {

                                                            const token = await axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                                                headers: {
                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                    Authorization: process.env.EKART_AUTHORIZATION
                                                                }
                                                            })

                                                            const bodyData = {
                                                                "request_id": results[0].ORDER_NO,
                                                                "service_type": "FORWARD",
                                                                "dispatch_date": systemDate,
                                                                "customer_pincode": deliverPincode,
                                                                "seller_pincode": pickupPincode,
                                                                "rto_pincode": pickupPincode,
                                                                "rc_pincode": pickupPincode,
                                                                "weight": volumetricWeight / 5000,
                                                                "height": HEIGHT,
                                                                "breadth": WIDTH,
                                                                "length": LENGTH,
                                                                "delivery_type": "SMALL",
                                                                "is_dangerous": false,
                                                                "is_fragile": false
                                                            }

                                                            const response = await axios.post(process.env.EKART_BASEURL + process.env.EKART_PINCODE_SERVICIABILITY, bodyData, {
                                                                headers: {
                                                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                                                    Authorization: token.data.Authorization
                                                                }
                                                            });
                                                            (response.data.serviceable ? apiCondition4 = 0 : apiCondition4 = 1)
                                                        }
                                                    }

                                                    const filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                        service.courier_name.toLowerCase().includes("blue")
                                                    );

                                                    if (getServiceData[0].length > 0 && getServiceData[1].length > 0) {
                                                        async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                            let carrierId = data2.ID;

                                                            if (carrierId == 6) {
                                                                serviceCondition = false
                                                                mm.executeQueryData(`select LOGO_URL from carrier_master where ID = ? `, carrierId, supportKey, (error, getLogo) => {
                                                                    if (error) {
                                                                        callback1(error)
                                                                    }
                                                                    else {
                                                                        for (let i = 0; i < filteredCompanies.length; i++) {
                                                                            shiprocketAvailable = 1

                                                                            let commisionAmount = (40 / 100) * (filteredCompanies[i].rate);
                                                                            let codCommision = results[0].PAYMENT_MODE == 'COD' ? (2.36 / 100) * (getCodAmount[0].COD_AMOUNT) : 0;
                                                                            let finalAmount = filteredCompanies[i].rate + commisionAmount + codCommision;


                                                                            rateDetails.push({
                                                                                "productData": [
                                                                                    {
                                                                                        "CARRIER_NAME": "Shiprocket",
                                                                                        "SERVICE_ID": filteredCompanies[i].courier_company_id,
                                                                                        "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                                        "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                                        "MODE": "Domestic",
                                                                                        "CARRIER_ID": carrierId,
                                                                                        "LOGO_URL": getLogo[0].LOGO_URL,
                                                                                        "ID": 0
                                                                                    }
                                                                                ],
                                                                                "amount": finalAmount,
                                                                                "volumetricWeight": filteredCompanies[i].charge_weight,
                                                                                "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                            })
                                                                        }
                                                                        callback1()
                                                                    }
                                                                })
                                                            }

                                                            else if ((carrierId == 1 && apiCondition == 0) || (carrierId == 3 && apiCondition2 == 0) || (carrierId == 2 && apiCondition3 == 0) || (carrierId == 4 && apiCondition4 == 0)) {

                                                                async.eachSeries(getServiceData[0], function iteratorOverElems(data, callback) {
                                                                    let serviceId = data.ID;
                                                                    let serviceName = data.SERVICE_NAME;
                                                                    let serviceCondition = true;
                                                                    let serviceDetails = carrierId == 1 ? serviceList.filter((item) => item.NAME == serviceName) : null;

                                                                    (carrierId == 1 && serviceList.filter((item) => item.NAME == serviceName).length <= 0 ? serviceCondition = false : serviceCondition = true)

                                                                    if (serviceCondition) {
                                                                        let filter = results[0].PAYMENT_MODE == 'COD' ? ` AND IS_AVAILABLE_COD = 1 AND ${getCodAmount[0].COD_AMOUNT} <= COD_LIMIT ` : ' AND ID <> 2 ';
                                                                        if (zoneCondition == 'S' || (pickupSpecialZone == 1 || deliverSpecialZone == 1)) {
                                                                            ZONE_ID = 5;
                                                                            query = `select ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, SPECIAL_ZONE_AMOUNT as ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT,LOGO_URL from view_product_master where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }
                                                                        if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                            ZONE_ID = 3;
                                                                            query = `select ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_product_master where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                            ZONE_ID = 4;
                                                                            query = `select ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_product_master where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                            ZONE_ID = 1;
                                                                            query = `select ID,  WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_product_master where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                            ZONE_ID = 2;
                                                                            query = `select ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_product_master where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                        }

                                                                        if (ZONE_ID > 0 && ZONE_ID <= 5) {

                                                                            // for (let i = 0; i < filteredCompanies.length; i++) {
                                                                            //     productData.push({
                                                                            //         "productData": [
                                                                            //             {
                                                                            //                 "CARRIER_NAME": "Blue Dart Express",
                                                                            //                 "SERVICE_ID": 0,
                                                                            //                 "SERVICE_NAME": filteredCompanies[i].courier_name,
                                                                            //                 "PRODUCT_NAME": filteredCompanies[i].courier_name,
                                                                            //                 "MODE": "Domestic",
                                                                            //                 "CARRIER_ID": 6,
                                                                            //                 "LOGO_URL": "",
                                                                            //                 "ID": 0
                                                                            //             }
                                                                            //         ],
                                                                            //         "amount": filteredCompanies[i].rate,
                                                                            //         "volumetricWeight": 1,
                                                                            //         "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null)))))
                                                                            //     })
                                                                            // }


                                                                            mm.executeQueryData(query, [serviceId, DEAD_WEIGHT, volumetricWeight, DEAD_WEIGHT, volumetricWeight, carrierId], supportKey, (error, getProductData) => {
                                                                                if (error) {
                                                                                    callback(error)
                                                                                }
                                                                                else {
                                                                                    if (getProductData.length > 0) {
                                                                                        let codAmount = 0;
                                                                                        if (results[0].PAYMENT_MODE == 'COD') {
                                                                                            let cod = ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) > getProductData[0].COD_COMMISSION_AMOUNT ? ((getCodAmount[0].COD_AMOUNT / 100) * getProductData[0].COD_COMMISSION) : getProductData[0].COD_COMMISSION_AMOUNT;
                                                                                            codAmount = cod;
                                                                                        }
                                                                                        else {
                                                                                            codAmount = 0;
                                                                                        }

                                                                                        getProductData[0].EXPECTED_DELIVERY_DAYS = ((carrierId == 1 && serviceDetails[0].TAT ? serviceDetails[0].TAT : 0));

                                                                                        if (getProductData[0].ADD_WEIGHT == 0) {
                                                                                            var amount = getProductData[0].ZONE_AMOUNT;
                                                                                            var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            let productData = []
                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                ServicableProductIds.push(getProductData[i].ID)
                                                                                                productData.push({
                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                    "ID": getProductData[i].ID
                                                                                                })
                                                                                            }
                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                            callback();
                                                                                        }
                                                                                        else {
                                                                                            var vAmt = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            var remainingWeight = vAmt - getProductData[0].END_RANGE;
                                                                                            var remainingWeightAmount = Math.ceil(remainingWeight / getProductData[0].ADD_WEIGHT) * getProductData[0].ADDITIONAL_ZONE_AMOUNT;
                                                                                            var amount = remainingWeightAmount + getProductData[0].ZONE_AMOUNT;

                                                                                            let productData = []
                                                                                            for (let i = 0; i < getProductData.length; i++) {
                                                                                                ServicableProductIds.push(getProductData[i].ID)
                                                                                                productData.push({
                                                                                                    "CARRIER_NAME": getProductData[i].CARRIER_NAME,
                                                                                                    "SERVICE_ID": getProductData[i].SERVICE_ID,
                                                                                                    "SERVICE_NAME": getProductData[i].SERVICE_NAME,
                                                                                                    "PRODUCT_NAME": getProductData[i].PRODUCT_NAME,
                                                                                                    "MODE": getProductData[i].MODE,
                                                                                                    "CARRIER_ID": getProductData[i].CARRIER_ID,
                                                                                                    "LOGO_URL": getProductData[i].LOGO_URL,
                                                                                                    "ID": getProductData[i].ID
                                                                                                })
                                                                                            }
                                                                                            rateDetails.push({ "productData": productData, "amount": amount + codAmount, "volumetricWeight": (Math.round(vAmt * 100) / 100), "zone": (ZONE_ID == 1 ? 'LOCAL_ZONE' : (ZONE_ID == 2 || zoneCondition == 'M' ? `METRO_ZONE` : (ZONE_ID == 3 ? `STATE_ZONE` : (ZONE_ID == 4 ? `ROI_ZONE` : (ZONE_ID == 5 || zoneCondition == 'S' ? `SPECIAL_ZONE` : null))))) });
                                                                                            callback();
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        callback()
                                                                                    }
                                                                                }
                                                                            })
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    }
                                                                    else {
                                                                        callback()
                                                                    }
                                                                }, function subCb(error) {
                                                                    if (error) {
                                                                        callback1(error)
                                                                    }
                                                                    else {
                                                                        callback1()
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                callback1()
                                                            }
                                                        }, function subCb(error) {
                                                            if (error) {
                                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": error
                                                                });
                                                            }
                                                            else {
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "success",
                                                                    "orderData": results,
                                                                    "data": rateDetails.sort((a, b) => a.amount - b.amount)
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        res.send({
                                                            "code": 306,
                                                            "message": "service or carrier data not found."
                                                        })
                                                    }
                                                }
                                                else {
                                                    res.send({
                                                        "code": 308,
                                                        "message": "zone not found."
                                                    })
                                                }
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Something went wrong"
                                                })
                                            });

                                        // const shiprocketPincodeServicable = await axios.get(process.env.SHIPROCKET_PINCODE_SERVICABLE_BASEURL, {
                                        //     "pickup_postcode": pickupPincode,
                                        //     "delivery_postcode": deliverPincode,
                                        //     "weight": volumetricWeight / 5000
                                        // }, {
                                        //     headers: {
                                        //         Authorization: `Bearer ${shiprocketToken.data.token}`
                                        //     }
                                        // });



                                    }).catch((error) => {
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "something went wrpng."
                                        })
                                    });
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 304,
                                "message": "Pincode not deliverable."
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Order not found."
                })
            }
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
            mm.executeDML('INSERT INTO ' + productMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to save productMaster information..."
                    });
                }
                else {
                    let query = `INSERT INTO customer_product_mapping (CUSTOMER_ID, PRODUCT_ID, LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, CREATED_MODIFIED_DATE, IS_CUSTOM)  SELECT ID,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM customer_master;`

                    let queryData = [results.insertId, data.LOCAL_ZONE_AMOUNT, data.LOCAL_ZONE_ADDITIONAL_AMOUNT, data.STATE_ZONE_AMOUNT, data.STATE_ZONE_ADDITIONAL_AMOUNT, data.ROI_ZONE_AMOUNT, data.ROI_ZONE_ADDITIONAL_AMOUNT, data.METRO_ZONE_AMOUNT, data.METRO_ZONE_ADDITION_AMOUNT, data.SPECIAL_ZONE_AMOUNT, data.SPECIAL_ZONE_ADDITIONAL_AMOUNT, 1, data.SERVICE_ID, data.CREATED_MODIFIED_DATE, 0];

                    mm.executeDML(query, queryData, supportKey, connection, (error, insertMappingData) => {
                        if (error) {
                            console.log(error);
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
                                "message": "productMaster information saved successfully...",
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
            const connection = mm.openConnection();
            mm.executeDML(`UPDATE ` + productMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update productMaster information."
                    });
                }
                else {
                    mm.executeDML(`update customer_product_mapping set LOCAL_ZONE_AMOUNT = ?, LOCAL_ZONE_ADDITIONAL_AMOUNT = ?, STATE_ZONE_AMOUNT = ?, STATE_ZONE_ADDITIONAL_AMOUNT = ?, ROI_ZONE_AMOUNT = ?, ROI_ZONE_ADDITIONAL_AMOUNT = ?, METRO_ZONE_AMOUNT = ?, METRO_ZONE_ADDITION_AMOUNT = ?, SPECIAL_ZONE_AMOUNT = ?, SPECIAL_ZONE_ADDITIONAL_AMOUNT = ?, SERVICE_ID = ?, CREATED_MODIFIED_DATE = ? where PRODUCT_ID = ? AND IS_CUSTOM = 0`, [data.LOCAL_ZONE_AMOUNT, data.LOCAL_ZONE_ADDITIONAL_AMOUNT, data.STATE_ZONE_AMOUNT, data.STATE_ZONE_ADDITIONAL_AMOUNT, data.ROI_ZONE_AMOUNT, data.ROI_ZONE_ADDITIONAL_AMOUNT, data.METRO_ZONE_AMOUNT, data.METRO_ZONE_ADDITION_AMOUNT, data.SPECIAL_ZONE_AMOUNT, data.SPECIAL_ZONE_ADDITIONAL_AMOUNT, data.SERVICE_ID, systemDate, criteria.ID], supportKey, connection, (error, updateRates) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to update productMapping information."
                            });
                        }
                        else {
                            mm.commitConnection(connection)
                            res.send({
                                "code": 200,
                                "message": "productMaster information updated successfully...",
                            });
                        }
                    })
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.updateremainingProducts = (req, res) => {
    var supportKey = 68
    try {
        const connection = mm.openConnection();
        mm.executeDML(`select count(ID)as cnt, CUSTOMER_ID from customer_product_mapping where 1 GROUP BY CUSTOMER_ID having cnt < 22`, '', supportKey, connection, (error, results) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection)
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get productMaster information..."
                });
            }
            else {


                async.eachSeries(results, function iteratorOverElems(data, callback) {
                    mm.executeDML(`select GROUP_CONCAT(PRODUCT_ID) as IDS from customer_product_mapping where CUSTOMER_ID = ?`, data.CUSTOMER_ID, supportKey, connection, (error, getResult) => {
                        if (error) {
                            callback(error)
                        }
                        else {
                            if (getResult.length > 0) {
                                let query2 = `insert into customer_product_mapping(LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, CUSTOMER_ID, PRODUCT_ID, IS_CUSTOM) select LOCAL_ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT, STATE_ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT, ROI_ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT, METRO_ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT, SPECIAL_ZONE_AMOUNT, SPECIAL_ZONE_ADDITIONAL_AMOUNT, STATUS, SERVICE_ID, ?, ID, 0 from product_master where ID not in(${getResult[0].IDS})`;

                                mm.executeDML(query2, data.CUSTOMER_ID, supportKey, connection, (error, getRemaingProducts) => {
                                    if (error) {
                                        callback(error)
                                    }
                                    else {
                                        callback();
                                    }
                                })
                            }
                            else {
                                callback()
                            }
                        }
                    })
                }, function subCb(error) {
                    if (error) {
                        console.log(error);
                        mm.rollbackConnection(connection);
                        res.send({
                            "code": 400,
                            "message": "Failed to Insert details..."
                        });
                    }
                    else {
                        mm.commitConnection(connection)
                        res.send({
                            "code": 200,
                            "message": "success..."
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