const jwt = require('jsonwebtoken');
const mm = require('../utilities/globalModule');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const xlsx = require("xlsx");
const async = require("async");
const logger = require('../utilities/logger');
const axios = require('axios')
const request = require('request')
const wp = require('../utilities/whatsappMsgShoot.js')

exports.checkAuthorization = function (req, res, next) {
    try {
        var apikey = req.headers['apikey'];
        if (process.env.APIKEY == apikey) {
            next();
        }
        else {
            if (process.env.ADMIN_APIKEY == apikey) {
                next();
            }
            else {
                res.status(401).send({
                    "code": 401,
                    "message": "UnAutorizedddsss User."
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
}

exports.uploadAttachment = function (req, res) {

    fs.rename(req.files.Image.path, 'uploads/Attachments/' + req.files.Image.name,
        (error, result) => {
            if (error)
                res.send(error);
            else
                res.send({
                    "code": 200,
                    "message": "uploaded",
                });
        });
}

exports.checkToken = function (req, res, next) {

    try {
        if (req.headers['token']) {
            jwt.verify(req.headers['token'], process.env.SECRET, (error, data) => {
                if (error) {
                    res.status(403).send({
                        "code": 403,
                        "message": "Wrong Token."
                    });
                }
                else {
                    if (req.headers['apikey'] == process.env.APIKEY) {
                        if (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length == 1 && req.body.CUSTOMER_ID.toString() && data.data.CUSTOMER_ID == req.body.CUSTOMER_ID.toString()) {
                            next();
                        }
                        else {
                            if (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length == 1) {
                                res.status(403).send({
                                    "code": 403,
                                    "message": "Wrong Token."
                                });
                            }
                            else {
                                next();
                            }
                        }
                    }
                    else {
                        next();
                    }
                }
            });
        }
        else {
            res.send({
                "code": 403,
                "message": "No Token Provided."
            });
        }
    } catch (error) {
        console.log(error);
    }
}

exports.employeeProfile = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/employeeProfile') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.uploadFiles = function (req, res) {

    var folderName = req.params["folderName"];
    var form = new formidable.IncomingForm();
    var pathName = path.join(__dirname, "../uploads/", folderName, "/");
    form.parse(req, function (err, fields, files) {
        var oldPath = files.Image.filepath;
        var newPath = pathName + files.Image.originalFilename;
        var rawData = fs.readFileSync(oldPath);
        fs.writeFile(newPath, rawData, function (err) {
            if (err) {
                //console.log(err);
                res.send({
                    code: 400,
                    message: "failed to upload ",
                });
            } else {
                res.send({
                    code: 200,
                    message: "uploaded",
                });
            }
        });
    });
};

exports.removeFile = function (req, res) {
    // var fileUrl = `/uploads/` + req.body.FILE_URL;
    var fileUrl = path.join(__dirname, '../uploads/' + req.body.FILE_URL)
    try {
        if (req.body.FILE_URL && req.body.FILE_URL != '') {
            fs.unlink(fileUrl, (err) => {
                if (err) {
                    console.error(err);
                    res.send({
                        "code": 400,
                        "message": "fail to delete file."
                    })
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "file delete successful."
                    })
                }
            });
        }
        else {
            res.send({
                "code": 404,
                "message": "fileUrl missing."
            })
        }
    }
    catch (err) {
        //console.log(err);
    }
}

exports.franchiseProfile = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/franchiseProfile') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.adhaarImg = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/adhaarImg') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.panImg = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/panImg') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.carrierLogo = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/carrierLogo') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.dtdcExcelImport = function (req, res) {
    const supportKey = req.headers['supportKey']
    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/dtdcExcelImport') + '/' + mm.getTimeDate() + ".xlsx";
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, async function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    var jsonData = await importExcel(newPath);
                    mm.executeQuery(`select ID, STATE_NAME from state_master; select PINCODE from pincode_master`, supportKey, (error, getStateDetails) => {
                        if (error) {
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "fail to get state"
                            })
                        }
                        else {
                            const pincodeData = getStateDetails[1];
                            getStateDetails = getStateDetails[0];
                            const updatedPincodeData = jsonData.map(pincode => {
                                const stateData = getStateDetails.find(state => state.STATE_NAME == pincode.STATE);
                                return { ...pincode, STATE_ID: stateData ? stateData.ID : null };
                            });
                            const notInArray1 = updatedPincodeData.filter(item2 =>
                                !pincodeData.some(item1 => item1.PINCODE == item2.PINCODE)
                            );
                            var recordData = []
                            const systemDate = mm.getSystemDate();
                            for (let i = 0; i < updatedPincodeData.length; i++) {
                                const rec = [updatedPincodeData[i].PINCODE, updatedPincodeData[i].BR_CITY, updatedPincodeData[i].STATE_ID, systemDate];
                                recordData.push(rec)
                            }
                            var pincodeRecordData = []
                            for (let i = 0; i < notInArray1.length; i++) {
                                let pincodeRec = [notInArray1[i].PINCODE, notInArray1[i].BR_CITY, 1, systemDate, notInArray1[i].STATE_ID, 1, 0, 0]
                                pincodeRecordData.push(pincodeRec);
                            }
                            const connection = mm.openConnection();
                            mm.executeDML(`delete from dtdc_pincode_master; insert into dtdc_pincode_master(PINCODE, BR_CITY, STATE_ID, CREATED_MODIFIED_DATE) values ?`, [recordData], supportKey, connection, (error, insertPincodes) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to insert pincode data."
                                    })
                                }
                                else {
                                    if (pincodeRecordData.length > 0) {
                                        mm.executeDML(`insert into pincode_master(PINCODE, CITY_NAME, STATUS, CREATED_MODIFIED_DATE, STATE_ID, COUNTRY_ID, IS_SPECIAL_ZONE, ZONE_ID) values ?`, [pincodeRecordData], supportKey, connection, (error, insertPincodesInMasters) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "fail to insert pincode data in master."
                                                })
                                            }
                                            else {
                                                mm.commitConnection(connection)
                                                res.send({
                                                    "code": 200,
                                                    "message": "success",
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        mm.commitConnection(connection)
                                        res.send({
                                            "code": 200,
                                            "message": "success",
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        console.log(err);
    }
}

const importExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return sheetData;
};

exports.weightDiscrepanciesDocuments_old = function (req, res) {
    const supportKey = req.headers['supportKey']
    const systemDate = mm.getSystemDate()
    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            const convertedFilename = mm.getTimeDate() + ".csv"
            var newPath = path.join(__dirname, '../uploads/weightDiscrepanciesDocuments') + '/' + convertedFilename;
            var rawData = fs.readFileSync(oldPath)
            let uploadedRecords = 0;
            let totalRecords = 0;

            fs.writeFile(newPath, rawData, async function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    var jsonData = await importExcel(newPath);
                    if (jsonData.length > 0) {
                        totalRecords = jsonData.length;
                        const connection = mm.openConnection();
                        mm.executeDML(`insert into weight_descrepancies_file_master(FILE_NAME, TOTAL_RECORDS, UPLOADED_RECORDS, STATUS, CREATED_MODIFIED_DATE) values(?,?,?,?,?)`, [convertedFilename, totalRecords, uploadedRecords, 'C', systemDate], supportKey, connection, (error, createFileMaster) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "success"
                                })
                            }
                            else {
                                async.eachSeries(jsonData, function iteratorOverElems(orderData, callback) {
                                    mm.executeDML(`select ID, CUSTOMER_ID from order_master where AWB_NO = ? AND ORDER_STATUS NOT IN('P', 'C', 'S', 'PS', 'PA', 'PR', 'NP', 'BKD');`, orderData.AWB_NUMBER, supportKey, connection, (error, checkOrder) => {
                                        if (error) {
                                            callback(error)
                                        }
                                        else {
                                            if (checkOrder.length > 0) {
                                                inserttedRecords = inserttedRecords + 1;
                                                mm.executeDML(`select ID from weight_discrepancies where AWB_NO = ?`, orderData.AWB_NUMBER, supportKey, connection, (error, checkRecord) => {
                                                    if (error) {
                                                        callback(error)
                                                    }
                                                    else {
                                                        if (checkRecord.length > 0) {
                                                            callback()
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into weight_discrepancies(AWB_NO, HEIGHT, WIDTH, LENGTH, APPLICABLE_WEIGHT, DEAD_WEIGHT, VOLUMETRIC_WEIGHT, CHARGABLE_AMOUNT, CREATED_MODIFIED_DATE, CUSTOMER_ID, FILE_ID) values(?,?,?,?,?,?,?,?,?,?,?)`, [orderData.AWB_NUMBER, orderData.HEIGHT, orderData.WIDTH, orderData.LENGTH, orderData.APPLICABLE_WEIGHT, orderData.DEAD_WEIGHT, orderData.VOLUMETRIC_WEIGHT, orderData.CHARGABLE_AMOUNT, systemDate, checkOrder[0].CUSTOMER_ID, createFileMaster.insertId], supportKey, connection, (error, insertWeightDescripancies) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    uploadedRecords = uploadedRecords + 1;
                                                                    mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`, [orderData.CHARGABLE_AMOUNT, checkOrder[0].CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                                        if (error) {
                                                                            callback(error);
                                                                        }
                                                                        else {
                                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID ) values(?,?,?,?,?,?,?)`, [checkOrder[0].CUSTOMER_ID, 'WD', orderData.CHARGABLE_AMOUNT, 'D', systemDate, systemDate, checkOrder[0].ID], supportKey, connection, (error, insertTransactionDetails) => {
                                                                                if (error) {
                                                                                    callback(error)
                                                                                }
                                                                                else {
                                                                                    callback()
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
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
                                        if (inserttedRecords > 0) {
                                            mm.executeDML(`update weight_descrepancies_file_master set UPLOADED_RECORDS = ?, STATUS = ? where ID = ?`, [uploadedRecords, (uploadedRecords == totalRecords ? 'C' : 'PC'), createFileMaster.insertId], supportKey, connection, (error, updateValues) => {
                                                if (error) {
                                                    console.log(error);
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to Insert details..."
                                                    });
                                                }
                                                else {
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success",
                                                    });
                                                }
                                            })
                                        }
                                        else {
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                "code": 200,
                                                "message": "No Shipments found for payout",
                                            });
                                        }
                                    }
                                });
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "No data found"
                        })
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        console.log(err);
    }
}

exports.weightDiscrepanciesDocuments = function (req, res) {
    const supportKey = req.headers['supportKey']
    const systemDate = mm.getSystemDate()
    let errors = [];

    try {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            const convertedFilename = mm.getTimeDate() + ".csv"
            var newPath = path.join(__dirname, '../uploads/weightDiscrepanciesDocuments') + '/' + convertedFilename;
            var rawData = fs.readFileSync(oldPath)
            let uploadedRecords = 0;
            let totalRecords = 0;
            let inserttedRecords = 0;

            fs.writeFile(newPath, rawData, async function (err) {
                if (!err) {
                    var jsonData = await importExcel(newPath);
                    if (jsonData.length > 0) {
                        totalRecords = jsonData.length;
                        const connection = mm.openConnection();
                        mm.executeDML(`insert into weight_descrepancies_file_master(FILE_NAME, TOTAL_RECORDS, UPLOADED_RECORDS, STATUS, CREATED_MODIFIED_DATE) values(?,?,?,?,?)`, [convertedFilename, totalRecords, uploadedRecords, 'C', systemDate], supportKey, connection, (error, createFileMaster) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "success"
                                })
                            }
                            else {

                                async.eachSeries(jsonData, function iteratorOverElems(orderData, callback) {
                                    let awbNo = null;
                                    let weight = null;
                                    (orderData["AWB Number"] ? awbNo = orderData["AWB Number"] : (orderData['Tracking Number'] ? awbNo = orderData['Tracking Number'] : (orderData['Delhivery Updated Weight'] ? awbNo = orderData['AWB number'] : null)));
                                    if (awbNo && awbNo != ' ') {
                                        mm.executeDML(`select ID, CUSTOMER_ID, PRODUCT_ID, CARRIER_ID, SERVICE_ID, PICKUP_PINCODE_ID, PINCODE_ID, PAYMENT_MODE, COD_AMOUNT, CHARGABLE_WEIGHT, ORDER_AMOUNT, ORDER_AMOUNT from order_master where AWB_NO = ? AND ORDER_STATUS NOT IN('P', 'C');`, awbNo, supportKey, connection, (error, checkOrder) => {
                                            if (error) {
                                                callback(error)
                                            }
                                            else {

                                                if (checkOrder.length > 0) {

                                                    if (checkOrder[0].CARRIER_ID == 1) {
                                                        awbNo = orderData['Tracking Number'];
                                                        weight = parseFloat(orderData["Weight (In Kg)"]) > parseFloat(orderData["Volumetric Weight"]) ? parseFloat(orderData["Weight (In Kg)"]) : parseFloat(orderData["Volumetric Weight"]);
                                                    }
                                                    else if (checkOrder[0].CARRIER_ID == 2) {
                                                        awbNo = orderData['AWB Number'];
                                                        weight = orderData["APPLIED WGT(KG)"];
                                                    }
                                                    else if (checkOrder[0].CARRIER_ID == 3) {
                                                        awbNo = orderData['AWB number'];
                                                        weight = parseFloat(orderData["Delhivery Updated Weight"]) / 1000;
                                                    }
                                                    else if (checkOrder[0].CARRIER_ID == 6) {
                                                        awbNo = orderData['AWB Number'];
                                                        weight = parseFloat(orderData["Charge Weight (In KG)"]);
                                                    }
                                                    else {
                                                        callback()
                                                    }
                                                    weight = parseFloat(weight);
                                                    if (weight > checkOrder[0].CHARGABLE_WEIGHT && weight != checkOrder[0].CHARGABLE_WEIGHT) {
                                                        mm.executeDML(`select ID from weight_discrepancies where AWB_NO = ?`, awbNo, supportKey, connection, async (error, checkRecord) => {
                                                            if (error) {
                                                                callback(error)
                                                            }
                                                            else {
                                                                if (checkRecord.length > 0) {
                                                                    errors.push({
                                                                        awbNo: awbNo,
                                                                        error: "Descripancy Already Created."
                                                                    })
                                                                    callback()
                                                                }
                                                                else {

                                                                    let rateData = await calculateUniversalRateForWeightDescripancy(supportKey, weight, checkOrder[0].CUSTOMER_ID, checkOrder[0].PICKUP_PINCODE_ID, checkOrder[0].PINCODE_ID, checkOrder[0].PAYMENT_MODE, checkOrder[0].PRODUCT_ID, checkOrder[0].CARRIER_ID, checkOrder[0].SERVICE_ID, checkOrder[0].COD_AMOUNT);

                                                                    if (rateData.code == 200 || checkOrder[0].CARRIER_ID == 6) {
                                                                        let fileAmount = parseFloat(orderData['Final Amount Charged']);
                                                                        checkOrder[0].CARRIER_ID == 6 ? rateData.amount = fileAmount + (fileAmount * 0.40) : rateData.amount = rateData.amount;
                                                                        if (parseFloat(rateData.amount) > parseFloat(checkOrder[0].ORDER_AMOUNT)) {
                                                                            let finalAmt = parseFloat(rateData.amount) - parseFloat(checkOrder[0].ORDER_AMOUNT);
                                                                            inserttedRecords = inserttedRecords + 1;
                                                                            mm.executeDML(`update order_master set CHARGABLE_WEIGHT = ?, ORDER_AMOUNT = ? where AWB_NO = ?`, [weight, rateData.amount, awbNo.toString()], supportKey, connection, (error, updateOrderInformation) => {
                                                                                if (error) {
                                                                                    callback(error)
                                                                                }
                                                                                else {
                                                                                    mm.executeDML(`insert into weight_discrepancies(AWB_NO, APPLICABLE_WEIGHT, CHARGABLE_AMOUNT, CREATED_MODIFIED_DATE, CUSTOMER_ID, FILE_ID, PREVIOUS_WEIGHT, PREVIOUS_AMOUNT) values(?,?,?,?,?,?,?,?)`, [awbNo.toString(), weight, rateData.amount, systemDate, checkOrder[0].CUSTOMER_ID, createFileMaster.insertId, checkOrder[0].CHARGABLE_WEIGHT, checkOrder[0].ORDER_AMOUNT], supportKey, connection, (error, insertWeightDescripancies) => {
                                                                                        if (error) {
                                                                                            callback(error)
                                                                                        }
                                                                                        else {
                                                                                            uploadedRecords = uploadedRecords + 1;
                                                                                            mm.executeDML(`update wallet_master set BALANCE = (BALANCE - ?) where CUSTOMER_ID = ?`, [finalAmt, checkOrder[0].CUSTOMER_ID], supportKey, connection, (error, updateWallet) => {
                                                                                                if (error) {
                                                                                                    callback(error);
                                                                                                }
                                                                                                else {
                                                                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID ) values(?,?,?,?,?,?,?)`, [checkOrder[0].CUSTOMER_ID, 'WD', finalAmt, 'D', systemDate, systemDate, checkOrder[0].ID], supportKey, connection, (error, insertTransactionDetails) => {
                                                                                                        if (error) {
                                                                                                            callback(error)
                                                                                                        }
                                                                                                        else {
                                                                                                            callback()
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    })
                                                                                }
                                                                            })
                                                                        }
                                                                        else {
                                                                            errors.push({
                                                                                awbNo: awbNo,
                                                                                error: "Calculated Amount is Lower than Already applied Amount."
                                                                            })
                                                                            callback()
                                                                        }
                                                                    }
                                                                    else {
                                                                        errors.push({
                                                                            awbNo: awbNo,
                                                                            error: "Issue with rate calculation."
                                                                        })
                                                                        callback(rateData.message)
                                                                    }
                                                                }
                                                            }
                                                        })
                                                    }
                                                    else {
                                                        errors.push({
                                                            awbNo: awbNo,
                                                            error: "Applied weight is Low or Same. May be Weight descripancy already created."
                                                        })
                                                        callback()
                                                    }
                                                }
                                                else {
                                                    errors.push({
                                                        awbNo: awbNo,
                                                        error: "order not found."
                                                    })
                                                    callback()
                                                }
                                            }
                                        })
                                    }
                                    else {
                                        errors.push({
                                            awbNo: awbNo,
                                            error: "awbNo is Missing. Please check Sheet"
                                        })
                                        callback()
                                    }
                                }, function subCb(error) {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to Insert details...",
                                            "errors": errors
                                        });
                                    }
                                    else {
                                        if (inserttedRecords > 0) {
                                            mm.executeDML(`update weight_descrepancies_file_master set UPLOADED_RECORDS = ?, STATUS = ? where ID = ?`, [uploadedRecords, (uploadedRecords == totalRecords ? 'C' : 'PC'), createFileMaster.insertId], supportKey, connection, (error, updateValues) => {
                                                if (error) {
                                                    console.log(error);
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to Insert details..."
                                                    });
                                                }
                                                else {
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success",
                                                        "errors": errors
                                                    });
                                                }
                                            })
                                        }
                                        else {
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                "code": 200,
                                                "message": "No Shipments found for weight descripancy..",
                                                "errors": errors
                                            });
                                        }
                                    }
                                });
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "No data found in Sheet"
                        })
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        console.log(err);
    }
}

exports.gst = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/gst') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.cheque = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/cheque') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.printLabel = function (req, res) {

    try {

        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            var newPath = path.join(__dirname, '../uploads/printLabel') + '/' + files.Image.originalFilename;
            var rawData = fs.readFileSync(oldPath)

            fs.writeFile(newPath, rawData, function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    res.send({
                        "code": 200,
                        "message": "success",
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        //console.log(err);
    }
}

exports.uploadPayout = function (req, res) {
    const supportKey = req.headers['supportKey']
    const systemDate = mm.getSystemDate()
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            const PAYOUT_ID = fields.PAYOUT_ID;
            if (PAYOUT_ID && PAYOUT_ID != ' ') {
                mm.executeQueryData(`select ID from payout_master where ID = ?`, PAYOUT_ID, supportKey, (error, checkPayoutId) => {
                    if (error) {
                        console.log();
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "fail to get payout id details"
                        })
                    }
                    else {
                        if (checkPayoutId.length > 0) {
                            const convertedFilename = mm.getTimeDate() + ".csv"
                            var newPath = path.join(__dirname, '../uploads/payout') + '/' + convertedFilename;
                            var rawData = fs.readFileSync(oldPath)
                            let totalRecords = 0;
                            let totalAmount = 0;
                            fs.writeFile(newPath, rawData, async function (err) {
                                if (!err) {
                                    console.log('uploaded successfully..');
                                    var jsonData = await importExcel(newPath);
                                    if (jsonData.length > 0) {
                                        const connection = mm.openConnection();
                                        async.eachSeries(jsonData, function iteratorOverElems(payoutData, callback) {
                                            let AWB_NO = payoutData.TRANSACTION_ID;
                                            let UTR_ID = payoutData.UTR_ID;
                                            const excelEpoch = new Date(1899, 11, 30);
                                            const msPerDay = 24 * 60 * 60 * 1000;
                                            const jsDate = new Date(excelEpoch.getTime() + payoutData.PAID_DATE * msPerDay);
                                            const pad = (n) => n.toString().padStart(2, '0');
                                            const yyyy = jsDate.getFullYear();
                                            const md = pad(jsDate.getMonth() + 1);
                                            const dd = pad(jsDate.getDate());
                                            const hh = pad(jsDate.getHours());
                                            const mi = pad(jsDate.getMinutes());
                                            const ss = pad(jsDate.getSeconds());
                                            let PAID_DATE = ((payoutData.PAID_DATE.split('-')).length == 3 ? payoutData.PAID_DATE.split('-')[2] + '-' + payoutData.PAID_DATE.split('-')[1] + '-' + payoutData.PAID_DATE.split('-')[0] : `${yyyy}-${md}-${dd} ${hh}:${mi}:${ss}`);

                                            mm.executeDML(`select ID from payout_details where AWB_NO = ?`, AWB_NO, supportKey, connection, (error, getAwbNo) => {
                                                if (error) {
                                                    callback(error)
                                                }
                                                else {
                                                    if (getAwbNo.length > 0) {
                                                        callback()
                                                    }
                                                    else {
                                                        mm.executeDML(`select ORDER_AMOUNT from order_master where AWB_NO = ?`, AWB_NO, supportKey, connection, (error, getOrderData) => {
                                                            if (error) {
                                                                callback(error)
                                                            }
                                                            else {
                                                                if (getOrderData.length > 0) {
                                                                    mm.executeDML(`insert into payout_details(AWB_NO, AMOUNT, UTR, STATUS, CREATED_MODIFIED_DATE, PAID_DATE, PAYOUT_ID) values(?,?,?,?,?,?,?)`, [AWB_NO, getOrderData[0].ORDER_AMOUNT, UTR_ID, 'C', systemDate, PAID_DATE, PAYOUT_ID], supportKey, connection, (error, insertDetails) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            totalAmount = totalAmount + getOrderData[0].ORDER_AMOUNT;
                                                                            totalRecords = totalRecords + 1;
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            }
                                                        })
                                                    }
                                                }
                                            })
                                        }, function subCb(error) {
                                            if (error) {
                                                console.log(error);
                                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                mm.rollbackConnection(connection);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to Insert details..."
                                                });
                                            }
                                            else {
                                                mm.executeDML(`update payout_master set TOTAL_ORDER = ?, TOTAL_AMOUNT = ?, STATUS = ?, FILE_URL = ? where ID = ?`, [totalRecords, totalAmount, 'C', convertedFilename, PAYOUT_ID], supportKey, connection, (error, updateValues) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        mm.rollbackConnection(connection);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to update payout information..."
                                                        });
                                                    }
                                                    else {
                                                        mm.commitConnection(connection);
                                                        res.send({
                                                            "code": 200,
                                                            "message": "success",
                                                        });
                                                    }
                                                })
                                            }
                                        });
                                    }
                                    else {
                                        res.send({
                                            "code": 404,
                                            "message": "Parameter or no data in file"
                                        })
                                    }
                                }
                                else {
                                    res.send({
                                        "code": 400,
                                        "message": "failed to upload.."
                                    });
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 404,
                                "message": "Invalid Payout ID"
                            })
                        }
                    }
                })
            }
            else {
                res.send({
                    "code": 404,
                    "message": "Parameter or no data in file"
                })
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}

async function trackOnExpressbees(awb) {
    try {
        const token = await generateExpressbeesToken()
        const response = await axios.get(`${process.env.EXPRESSBEES_TRACKING_URL}` + awb, {
            headers: {
                'Content-Type': "application/json",
                'Authorization': "Bearer " + token
            },
        });

        return response.data;

    } catch (error) {
        throw { message: error.message, status: 305 }
    }
}

async function generateExpressbeesToken() {
    userData = { email: process.env.EXPRESSBEES_USER, password: process.env.EXPRESSBEES_PASSWORD }
    const response = await axios.post(process.env.EXPRESSBEES_TOKEN_URL, userData, {
        headers: {
            'Content-Type': "application/json"
        },
    });
    if (response.status != 200)
        throw { message: "Erorr while authenticating with expressbees" }
    return response.data.data;
}

exports.updateTrackingDetails_old = function () {
    const supportKey = "1234789";
    const systemDate = mm.getSystemDate();
    try {
        mm.executeQueryData(`select ID, AWB_NO, CARRIER_ID, ORDER_STATUS, COURIER_API_DATA, CUSTOMER_ID, ORDER_AMOUNT, RTO_AMOUNT from order_master where ORDER_STATUS NOT IN('D','C','P','RTD') and IS_SHIPPED = 1`, [], supportKey, (error, getOrders) => {
            if (error) {
                console.log(error);
            }
            else {
                if (getOrders.length > 0) {
                    const connection = mm.openConnection();
                    async.eachSeries(getOrders, function iteratorOverElems(orderData, callback) {
                        let carrierId = orderData.CARRIER_ID;
                        let awbNo = orderData.AWB_NO;
                        let ID = orderData.ID;
                        let courierData = JSON.parse(orderData.COURIER_API_DATA);

                        if (carrierId == 1 && awbNo && awbNo != ' ') {
                            const bodyData = {
                                "trkType": "cnno",
                                "strcnno": awbNo,
                                "addtnlDtl": "Y"
                            }
                            axios.get(`https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate?username=${process.env.DTDC_TRACKING_USERNAME}&password=${process.env.DTDC_TRACKING_PASSWORD}`).then(async (loginToken) => {

                                const response = loginToken ? await axios.post(`${process.env.DTDC_TRACKING_URL}`, bodyData, {
                                    headers: {
                                        "X-Access-Token": loginToken.data,
                                        'Content-Type': "application/json"
                                    },
                                }) : null;

                                if (response.data.statusFlag == true && response.data.statusCode == 200) {
                                    let latestTrackingObj = (response.data.trackDetails).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (latestTrackingObj[0].strAction == "Pickup Scheduled") {
                                        ORDER_STATUS = 'PS'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Awaited") {
                                        ORDER_STATUS = 'PA'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Reassigned") {
                                        ORDER_STATUS = 'PR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Picked") {
                                        ORDER_STATUS = 'NP'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Picked Up") {
                                        ORDER_STATUS = 'PU'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Booked") {
                                        ORDER_STATUS = 'BKD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "In Transit") {
                                        ORDER_STATUS = 'I'
                                    }
                                    else if (latestTrackingObj[0].strAction == "SHIPMENT RECEIVED SHORT") {
                                        ORDER_STATUS = 'SVD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Reached At Destination") {
                                        ORDER_STATUS = 'RD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Out For Delivery") {
                                        ORDER_STATUS = 'OD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Delivered") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Return as per client instruction.") {
                                        ORDER_STATUS = 'C'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Delivered") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = latestTrackingObj[0].sTrRemarks ? latestTrackingObj[0].sTrRemarks : null
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Processed & Forwarded") {
                                        ORDER_STATUS = 'RPR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO In Transit") {
                                        ORDER_STATUS = 'RI'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Out For Delivery") {
                                        ORDER_STATUS = 'RTOD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Delivered") {
                                        ORDER_STATUS = 'RTD'
                                    }
                                    else if (latestTrackingObj[0].strCode == "DLV") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strCode == "RTOBKD") {
                                        ORDER_STATUS = 'RTBK'
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const strActionDate = latestTrackingObj[0].strActionDate;
                                        const strActionTime = latestTrackingObj[0].strActionTime;
                                        const day = strActionDate.substring(0, 2);
                                        const month = strActionDate.substring(2, 4);
                                        const year = strActionDate.substring(4, 8);
                                        const hours = strActionTime.substring(0, 2);
                                        const minutes = strActionTime.substring(2, 4);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDate = `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:00`;

                                        let query = ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ? AND RTO_AMOUNT = 0` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);
                                        if (ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }

                                        mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS = 'ND') {
                                                        insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                callback()
                            })
                        }
                        else if (carrierId == 2 && awbNo && awbNo != ' ') {

                            trackOnExpressbees(awbNo).then((xpressbeesTrackingDetails) => {
                                if (xpressbeesTrackingDetails.status) {
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "DL") {
                                        ORDER_STATUS = "D"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "OFD") {
                                        ORDER_STATUS = "OD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RAD") {
                                        ORDER_STATUS = "RD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "IT") {
                                        ORDER_STATUS = "I"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Out for Pickup") {
                                        ORDER_STATUS = "PA"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "RTO") {
                                        ORDER_STATUS = "RPR"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-IT") {
                                        ORDER_STATUS = "RI"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-DL") {
                                        ORDER_STATUS = "RTD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "EX") {
                                        ORDER_STATUS = "ND"
                                        ORDER_MESSAGE = xpressbeesTrackingDetails.data.history[0].message
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        let query = (ORDER_STATUS == "ND" ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }
                                        if (ORDER_STATUS == 'RPR') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ?`;
                                        }


                                        mm.executeQueryData(query, [ORDER_STATUS, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ID], supportKey, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if (ORDER_STATUS == 'RPR' && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 3 && awbNo && awbNo != ' ') {
                            axios.get(`https://track.delhivery.com/api/v1/packages/json?waybill=${awbNo}&token=${process.env.DELHIVERY_TOKEN}`).then((response) => {

                                if (response.data.ShipmentData && (response.data.ShipmentData).length > 0) {
                                    response = (response.data.ShipmentData[0].Shipment.Scans).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (response[0].ScanDetail.Scan == 'Delivered') {
                                        ORDER_STATUS = 'D'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Not Picked') {
                                        ORDER_STATUS = 'C'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Manifested') {
                                        ORDER_STATUS = 'PA'
                                    }
                                    if (response[0].ScanDetail.Scan == 'In Transit') {
                                        ORDER_STATUS = 'I'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Dispatched') {
                                        ORDER_STATUS = 'OD'
                                    }
                                    if (response[0].ScanDetail.StatusCode == 'EOD-6' || response[0].ScanDetail.StatusCode == 'EOD-74' || response[0].ScanDetail.StatusCode == "EOD-15" || response[0].ScanDetail.StatusCode == "EOD-104" || response[0].ScanDetail.StatusCode == "EOD-43" || response[0].ScanDetail.StatusCode == "EOD-86" || response[0].ScanDetail.StatusCode == "EOD-11" || response[0].ScanDetail.StatusCode == "EOD-69") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = response[0].ScanDetail.Instructions
                                    }
                                    if (response[0].ScanDetail.ScanType == 'RT') {
                                        ORDER_STATUS = 'RPR'
                                    }


                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const isoString = response[0].ScanDetail.StatusDateTime;
                                        const date = new Date(isoString);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

                                        let query = (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '' ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        mm.executeQueryData(query, [ORDER_STATUS, formattedDateTime, ID], supportKey, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`update order_master set RTO_AMOUNT = ORDER_AMOUNT where ID = ?`, [ID], supportKey, connection, (error, updateOrderAmount) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, formattedDateTime, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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


                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 4 && awbNo && awbNo != ' ' && courierData) {
                            let bodyData = {
                                "request_id": courierData.request_id,
                                "tracking_ids": [
                                    courierData.response[0].tracking_id
                                ]
                            }
                            axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                headers: {
                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                    Authorization: process.env.EKART_AUTHORIZATION
                                }
                            }).then((token) => {
                                axios.post(process.env.EKART_BASEURL + process.env.EKART_TRACK, bodyData, {
                                    headers: {
                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                        Authorization: token.data.Authorization
                                    },
                                }).then((response) => {
                                    if (!response.data.error_code && response.data[awbNo]) {
                                        response.data[awbNo].history = response.data[awbNo].history.sort((a, b) => new Date(b.event_date_iso8601) - new Date(a.event_date_iso8601));
                                        let currentStatus = response.data[awbNo].history[0].status;
                                        let ORDER_STATUS = null;
                                        if (currentStatus == 'delivered') {
                                            ORDER_STATUS = 'D'
                                        }
                                        if (currentStatus == 'pickup_complete') {
                                            ORDER_STATUS = 'PU'
                                        }
                                        if (currentStatus == 'out_for_pickup') {
                                            ORDER_STATUS = 'PA'
                                        }
                                        if (currentStatus == 'pickup_scheduled') {
                                            ORDER_STATUS = 'PS'
                                        }
                                        if (currentStatus == 'pickup_cancelled') {
                                            ORDER_STATUS = 'C'
                                        }
                                        if (currentStatus == 'in_transit') {
                                            ORDER_STATUS = 'I'
                                        }
                                        if (currentStatus == 'out_for_delivery') {
                                            ORDER_STATUS = 'OD'
                                        }
                                        if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                            const isoString = response.data[awbNo].history[0].event_date;
                                            const date = new Date(isoString);
                                            const pad = (n) => n.toString().padStart(2, '0');
                                            const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                                            mm.executeQueryData(`update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`, [ORDER_STATUS, formattedDateTime, ID], supportKey, (error, updateTransactionDetails) => {
                                                if (error) {
                                                    console.log(error);
                                                    callback()
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
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
                                }).catch((error) => {
                                    console.log(error);
                                    callback()
                                })
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 6 && awbNo && awbNo != ' ') {
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
                                var options = {
                                    'method': 'GET',
                                    'url': 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + awbNo,
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${shiprocketToken.data.token}`
                                    }
                                };

                                request(options, function (error, response, body) {
                                    if (error) {
                                        console.log(error);
                                        callback()
                                    }
                                    else {
                                        let ORDER_STATUS = null;
                                        let ORDER_MESSAGE = null;
                                        body = JSON.parse(body);
                                        if (body.tracking_data) {
                                            if (body.tracking_data.shipment_status == 27) {
                                                ORDER_STATUS = 'PS'
                                            }
                                            else if (body.tracking_data.shipment_status == 19) {
                                                ORDER_STATUS = 'PA'
                                            }
                                            else if (body.tracking_data.shipment_status == 15) {
                                                ORDER_STATUS = 'PR'
                                            }
                                            else if (body.tracking_data.shipment_status == 13) {
                                                ORDER_STATUS = 'NP'
                                            }
                                            else if (body.tracking_data.shipment_status == 42) {
                                                ORDER_STATUS = 'PU'
                                            }
                                            else if (body.tracking_data.shipment_status == 52) {
                                                ORDER_STATUS = 'BKD'
                                            }
                                            else if (body.tracking_data.shipment_status == 18) {
                                                ORDER_STATUS = 'I'
                                            }
                                            else if (body.tracking_data.shipment_status == "SHIPMENT RECEIVED SHORT") {
                                                ORDER_STATUS = 'SVD'
                                            }
                                            else if (body.tracking_data.shipment_status == 38) {
                                                ORDER_STATUS = 'RD'
                                            }
                                            else if (body.tracking_data.shipment_status == 17) {
                                                ORDER_STATUS = 'OD'
                                            }
                                            else if (body.tracking_data.shipment_status == 7) {
                                                ORDER_STATUS = 'D'
                                            }
                                            else if (body.tracking_data.shipment_status == 8) {
                                                ORDER_STATUS = 'C'
                                            }
                                            else if (body.tracking_data.shipment_status == 21) {
                                                ORDER_STATUS = 'ND'
                                                ORDER_MESSAGE = body.tracking_data.shipment_track_activities[0].activity;
                                            }
                                            else if (body.tracking_data.shipment_status == 14) {
                                                ORDER_STATUS = 'RPR'
                                            }
                                            else if (body.tracking_data.shipment_status == 46) {
                                                ORDER_STATUS = 'RI'
                                            }
                                            else if (body.tracking_data.shipment_status == "RTO Out For Delivery") {
                                                ORDER_STATUS = 'RTOD'
                                            }
                                            else if (body.tracking_data.shipment_status == 48) {
                                                ORDER_STATUS = 'RTD'
                                            }



                                            if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                                const formattedDate = body.tracking_data.shipment_track[0].updated_time_stamp && body.tracking_data.shipment_track[0].updated_time_stamp != '' ? body.tracking_data.shipment_track[0].updated_time_stamp : null;

                                                let query = (((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT  where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);

                                                if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                                    query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                                }

                                                mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback()
                                                    }
                                                    else {
                                                        if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            if (ORDER_STATUS == 'D') {
                                                                wp.sendDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'OD') {
                                                                wp.sendOutOfDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'I') {
                                                                wp.sendInTransitMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'ND') {
                                                                insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                                callback()
                                                            }
                                                            else {
                                                                callback()
                                                            }
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
                                    }
                                })
                            })
                        }
                        else {
                            callback()
                        }
                    }, function subCb(error) {
                        if (error) {
                            mm.rollbackConnection(connection)
                            console.log(error);
                        }
                        else {
                            mm.commitConnection(connection)
                            console.log("success");
                        }
                    });
                }
                else {
                    console.log("no order found");
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.scheduleDelhiveryOrders = function () {
    const supportKey = "1234789";
    const systemDate = mm.getSystemDate();
    try {
        mm.executeQueryData(`select * from delhivery_pickup_schedule where STATUS = 'P' AND date(CREATED_DATETIME) = CURDATE() - INTERVAL 1 DAY`, [], supportKey, (error, getOrders) => {
            if (error) {
                console.log(error);
            }
            else {
                // const connection = mm.openConnection();
                async.eachSeries(getOrders, function iteratorOverElems(scheduleData, callback) {
                    let PACKAGE_COUNT = scheduleData.PACKAGE_COUNT,
                        PICKUP_ADDRESS = scheduleData.PICKUP_ADDRESS,
                        ID = scheduleData.ID;
                    scheduleData.PICKUP_DATETIME = systemDate.split(" ")[0] + ' ' + "10:30:00";

                    const bodyData = {
                        "pickup_time": "10:30:00",
                        "pickup_date": systemDate.split(" ")[0],
                        "pickup_location": PICKUP_ADDRESS,
                        "expected_package_count": PACKAGE_COUNT
                    }
                    const options = {
                        uri: process.env.DELHIVERY_PICKUP_SCHEDULE_RECORD,
                        method: 'POST',
                        headers: {
                            "Authorization": `Token ${process.env.DELHIVERY_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bodyData)
                    };

                    request(options, (error, response, body) => {
                        if (error) {
                            console.log("Error creating order:", error);
                            // res.send({
                            //     "code": 400,
                            //     "message": "wrong with delhivery server"
                            // })
                        }
                        else {
                            body = JSON.parse(body);
                            if (body.pickup_date) {
                                mm.executeQueryData(`update delhivery_pickup_schedule set PICKUP_DATETIME = ?, STATUS = 'C', DELHIVERY_PAYLOAD = ? where ID = ?`, [scheduleData.PICKUP_DATETIME, JSON.stringify(body), ID], supportKey, (error, insertRecord) => {
                                    if (error) {
                                        console.log(error);
                                        callback(error)
                                    }
                                    else {
                                        callback()
                                    }
                                })
                            }
                            else {
                                callback(body)
                            }
                        }
                    });
                }, function subCb(error) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log("success");
                    }
                });
            }
        })
    } catch (error) {
        console.log(error);
    }
}

// this.updateTrackingDetails();

exports.orderDetails = function (req, res) {
    const supportKey = req.headers['supportKey']
    const systemDate = mm.getSystemDate()
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldPath = files.Image.filepath;
            const convertedFilename = mm.getTimeDate() + ".xlsx"
            var newPath = path.join(__dirname, '../uploads/orderDetails') + '/' + convertedFilename;
            var rawData = fs.readFileSync(oldPath)
            fs.writeFile(newPath, rawData, async function (err) {
                if (!err) {
                    console.log('uploaded successfully..');
                    var jsonData = await importExcel(newPath);
                    if (jsonData.length > 0) {
                        const connection = mm.openConnection();
                        async.eachSeries(jsonData, function iteratorOverElems(payoutData, callback) {
                            let AWB_NO = payoutData.AWB_NO;
                            let RECEIVERS_NAME = payoutData.RECEIVERS_NAME;
                            let PICKUP_CONTACT_PERSON = payoutData.PICKUP_CONTACT_PERSON;
                            mm.executeDML(`update order_master set DELIVER_TO = ?, PICKUP_CONTACT_PERSON = ? where AWB_NO = ?`, [RECEIVERS_NAME, PICKUP_CONTACT_PERSON, AWB_NO], supportKey, connection, (error, updateOrder) => {
                                if (error) {
                                    callback(error)
                                }
                                else {
                                    callback()
                                }
                            })
                        }, function subCb(error) {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
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
                                    "message": "success"
                                });
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Parameter or no data in file"
                        })
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "failed to upload.."
                    });
                }
            })
        })
    }
    catch (err) {
        console.log(err);
    }
}

exports.fetchTrackingDetails = function (req, res) {
    require('./global.js').updateTrackingDetails();
    res.send({
        "code": 200,
        "message": "success"
    })
}

async function calculateUniversalRateForWeightDescripancy(supportKey, DEAD_WEIGHT, CUSTOMER_ID, PICKUP_PINCODE_ID, PINCODE_ID, PAYMENT_MODE, PRODUCT_ID, CARRIER_ID, SERVICE_ID, COD_AMOUNT, LENGTH, WIDTH, HEIGHT, ORDER_NO) {

    var rateDetails = [];
    const systemDate = mm.getSystemDate();

    DEAD_WEIGHT = parseFloat(DEAD_WEIGHT);
    LENGTH = parseInt(0);
    WIDTH = parseInt(0);
    HEIGHT = parseInt(0);
    ORDER_NO = 'SDP/' + (systemDate.split(' ')[0]).split('-')[0] + (systemDate.split(' ')[0]).split('-')[1] + (systemDate.split(' ')[0]).split('-')[2] + (systemDate.split(' ')[1]).split(':')[0] + (systemDate.split(' ')[1]).split(':')[1] + (systemDate.split(' ')[1]).split(':')[2];
    var ServicableProductIds = [];
    return new Promise((resolve, reject) => {
        try {


            if (CUSTOMER_ID && CUSTOMER_ID != ' ' && PICKUP_PINCODE_ID && PICKUP_PINCODE_ID != ' ' && PINCODE_ID && PINCODE_ID != ' ' && DEAD_WEIGHT && DEAD_WEIGHT != ' ' && PRODUCT_ID && PRODUCT_ID != ' ') {

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
                        "COD_AMOUNT": COD_AMOUNT
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

                    mm.executeQueryData(`select ID, PINCODE, STATE_ID, IS_METRO_CITY, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1; select ID, PINCODE, STATE_ID, IS_SPECIAL_ZONE from pincode_master where ID = ? AND STATUS = 1;`, [PICKUP_PINCODE_ID, PINCODE_ID], supportKey, (error, getPincodeData) => {
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

                                mm.executeQueryData(`select ID, SERVICE_NAME, KEYWORD from service_master where STATUS = 1 AND ID = ?; select ID from carrier_master where STATUS = 1 AND ID = ?`, [SERVICE_ID, CARRIER_ID], supportKey, async (error, getServiceData) => {
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
                                                "weight": CARRIER_ID == 6 ? DEAD_WEIGHT : 0.5,
                                                "cod": CARRIER_ID == 6 && results[0].PAYMENT_MODE == 'COD' ? 1 : 0
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
                                                    if ((shiprocketPincodeServicable.data.status != 400 || shiprocketPincodeServicable.data.status != 404) && (shiprocketPincodeServicable.data.data.available_courier_companies).length > 0) {

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

                                                            else if (carrierId == 3) {
                                                                const delhiveryPickupPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + pickupPincode);
                                                                const delhiveryDeliveryPincode = await axios.get(process.env.PINCODE_SERVICEABILITY + deliverPincode);

                                                                ((delhiveryPickupPincode.data.delivery_codes).length > 0 && (delhiveryDeliveryPincode.data.delivery_codes).length > 0 ? apiCondition2 = 0 : apiCondition2 = 1)
                                                            }

                                                            else if (carrierId == 2) {
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

                                                            else if (carrierId == 4) {

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


                                                        let filteredCompanies = []


                                                        if (carrierId == 6 && PRODUCT_ID == 19) {
                                                            filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                                service.courier_name.toLowerCase().includes("blue dart surface")
                                                            );
                                                        }
                                                        else if (carrierId == 6 && PRODUCT_ID == 20) {
                                                            filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                                service.courier_name.toLowerCase().includes("blue dart air")
                                                            );
                                                        }
                                                        else {
                                                            filteredCompanies = (shiprocketPincodeServicable.data.data.available_courier_companies).filter(service =>
                                                                service.courier_name.toLowerCase().includes("blue")
                                                            );
                                                        }



                                                        console.log("PRODUCT_ID", PRODUCT_ID);


                                                        if ((carrierId == 6) || (getServiceData[0].length > 0 && getServiceData[1].length > 0)) {

                                                            async.eachSeries(getServiceData[1], function iteratorOverElems(data2, callback1) {
                                                                let carrierId = data2.ID;

                                                                if (carrierId == 6) {
                                                                    serviceCondition = false;
                                                                    callback1()
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
                                                                            else if (zoneCondition != 'S' && (pickupLocalZone !== deliverLocalZone) && pickupStateZone === deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1)) {
                                                                                ZONE_ID = 3;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID, KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, STATE_ZONE_AMOUNT as ZONE_AMOUNT, STATE_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;

                                                                            }

                                                                            else if (zoneCondition != 'S' && pickupStateZone !== deliverStateZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone) {
                                                                                ZONE_ID = 4;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, ROI_ZONE_AMOUNT as ZONE_AMOUNT, ROI_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT) AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            else if (zoneCondition != 'S' && pickupLocalZone === deliverLocalZone && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupStateZone == deliverStateZone) {
                                                                                ZONE_ID = 1;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, LOCAL_ZONE_AMOUNT as ZONE_AMOUNT, LOCAL_ZONE_ADDITIONAL_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)  AND CARRIER_ID = ?  AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }

                                                                            else if (zoneCondition != 'S' && zoneCondition == 'M' || (pickupMetroZone == 1 && deliverMetroZone == 1 && (pickupSpecialZone != 1 && deliverSpecialZone != 1) && pickupLocalZone != deliverLocalZone)) {
                                                                                ZONE_ID = 2;
                                                                                query = `select ID, PRODUCT_ID, WEIGHT_FOR_FORMULA, PARCEL_TYPE, CARRIER_NAME, SERVICE_ID,KEYWORD as SERVICE_NAME, PRODUCT_NAME, START_RANGE, END_RANGE, ADD_WEIGHT, MODE, CARRIER_ID, COD_LIMIT, COD_COMMISSION, COD_COMMISSION_AMOUNT, MAX_WEIGHT, METRO_ZONE_AMOUNT as ZONE_AMOUNT, METRO_ZONE_ADDITION_AMOUNT as ADDITIONAL_ZONE_AMOUNT, LOGO_URL from view_customer_product_mapping where STATUS = 1 AND SERVICE_ID = ? AND (CASE WHEN ? > (? / WEIGHT_FOR_FORMULA) THEN ? ELSE (? / WEIGHT_FOR_FORMULA) END BETWEEN START_RANGE AND MAX_WEIGHT)   AND CARRIER_ID = ? AND CUSTOMER_ID = ? ${filter} order by MAX_WEIGHT asc limit 1`;
                                                                            }
                                                                            else {
                                                                                callback1()
                                                                            }
                                                                            console.log("query", query, ZONE_ID);

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
                                                                                            let conditionWeight = (DEAD_WEIGHT > (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA) ? DEAD_WEIGHT : (volumetricWeight / getProductData[0].WEIGHT_FOR_FORMULA))
                                                                                            if (getProductData[0].ADD_WEIGHT == 0 || (conditionWeight <= getProductData[0].END_RANGE)) {
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
                                                                    console.log("error", error);
                                                                    reject(error);
                                                                }
                                                                else {
                                                                    resolve({
                                                                        "code": 200,
                                                                        "message": "success",
                                                                        "amount": CARRIER_ID == 6 || rateDetails.length <= 0 ? 0 : rateDetails[0].amount,
                                                                        "chargableWeight": CARRIER_ID == 6 || rateDetails.length <= 0 ? 0 : rateDetails[0].volumetricWeight,
                                                                        "productData": CARRIER_ID == 6 || rateDetails.length <= 0 ? null : rateDetails[0].productData
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
                else {

                    reject({
                        "code": 404,
                        "message": "Order not found."
                    })
                }
            }
            else {
                reject({
                    "code": 404,
                    "message": "Parameter Missing"
                });
            }
        } catch (error) {
            console.log(error);
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            reject(error);
        }
    })
}

function insertNdrLogs(orderId, date, reason) {
    const supportKey = 123231;
    try {
        if (orderId && date && reason) {
            mm.executeQueryData(`select ID from ndr_order_master where ORDER_ID = ? AND RE_ATTEMPT_DATE = ? AND REASON = ?`, [orderId, date, reason], supportKey, (error, getNdrDetails) => {
                if (error) {
                    console.log(error);
                }
                else {
                    if (getNdrDetails.length > 0) {
                        console.log("Already Exist");
                    }
                    else {
                        mm.executeQueryData(`insert into ndr_order_master(ORDER_ID, STATUS, RE_ATTEMPT_DATE, REASON) values(?, ?, ?, ?)`, [orderId, 'C', date, reason], supportKey, (error, insertDetails) => {
                            if (error) {
                                console.log(error);
                            }
                            else {
                                mm.executeQueryData(`update order_master set REATTEMPT_COUNT = REATTEMPT_COUNT + 1 where ID = ?;`, orderId, supportKey, (error, updateAttemptCount) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                    else {
                                        console.log("success");
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
        else {
            console.log("Parameter Missing");
        }
    } catch (error) {
        console.log(error);
    }
}


exports.uploadPincodeFile = (req, res) => {
    const connection = mm.openConnection();
    const systemDate = mm.getSystemDate();

    if (!req.file) {
        return res.send({
            code: 422,
            message: "No file uploaded"
        });
    }

    const filePath = req.file.path;
    let workbook;

    try {
        workbook = xlsx.readFile(filePath);
    } catch (err) {
        fs.unlinkSync(filePath);
        return res.send({
            code: 500,
            message: "Error reading Excel file",
            error: err.message
        });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!jsonData.length) {
        fs.unlinkSync(filePath);
        return res.send({
            code: 422,
            message: "Excel file has headers but no data rows"
        });
    }

    const requiredColumns = ["PINCODE", "CITY", "STATE"];
    const firstRow = jsonData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
        fs.unlinkSync(filePath);
        return res.send({
            code: 422,
            message: "Missing columns: " + missingColumns.join(", ")
        });
    }

    connection.beginTransaction(err => {
        if (err) {
            fs.unlinkSync(filePath);
            connection.end();
            return res.send({ code: 500, message: "DB transaction error", error: err });
        }

        let processedCount = 0;
        let skippedCount = 0;

        const processRow = (index) => {
            if (index >= jsonData.length) {
                return connection.commit(err => {
                    fs.unlinkSync(filePath);
                    connection.end();
                    if (err) {
                        return res.status(500).send({ code: 500, message: "Commit failed", error: err });
                    }
                    res.send({
                        code: 200,
                        message: "Pincode upload completed",
                        totalProcessed: processedCount,
                        skipped: skippedCount
                    });
                });
            }

            const row = jsonData[index];
            const pincode = parseInt(row["PINCODE"]);
            const city = row["CITY"].trim();
            const stateName = row["STATE"].trim();

            if (!pincode || !city || !stateName) {
                skippedCount++;
                processRow(index + 1);
                return;
            }

            connection.query(
                "SELECT ID FROM state_master WHERE STATE_NAME = ? AND STATUS = 1 LIMIT 1",
                [stateName],
                (err, stateResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            fs.unlinkSync(filePath);
                            connection.end();
                            res.status(500).send({ code: 500, message: "State query error", error: err });
                        });
                    }

                    if (stateResult.length === 0) {
                        skippedCount++;
                        processRow(index + 1);
                        return;
                    }

                    const stateId = stateResult[0].ID;
                    connection.query(
                        "SELECT ID FROM pincode_master WHERE PINCODE = ? LIMIT 1",
                        [pincode],
                        (err, pinResult) => {
                            if (err) {
                                return connection.rollback(() => {
                                    fs.unlinkSync(filePath);
                                    connection.end();
                                    res.status(500).send({ code: 500, message: "Pincode select error", error: err });
                                });
                            }

                            if (pinResult.length > 0) {
                                connection.query(
                                    `UPDATE pincode_master 
                   SET CITY_NAME=?, STATE_ID=?, COUNTRY_ID=1, CREATED_MODIFIED_DATE=?
                   WHERE ID=?`,
                                    [city, stateId, systemDate, pinResult[0].ID],
                                    (err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                fs.unlinkSync(filePath);
                                                connection.end();
                                                res.status(500).send({ code: 500, message: "Update error", error: err });
                                            });
                                        }
                                        processedCount++;
                                        processRow(index + 1);
                                    }
                                );
                            } else {
                                connection.query(
                                    `INSERT INTO pincode_master 
                   (PINCODE, CITY_NAME, STATUS, CREATED_MODIFIED_DATE, STATE_ID, COUNTRY_ID, IS_SPECIAL_ZONE, IS_METRO_CITY)
                   VALUES (?, ?, 1, ?, ?, 1, 0, 0)`,
                                    [pincode, systemDate, city, stateId],
                                    (err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                fs.unlinkSync(filePath);
                                                connection.end();
                                                res.status(500).send({ code: 500, message: "Insert error", error: err });
                                            });
                                        }
                                        processedCount++;
                                        processRow(index + 1);
                                    }
                                );
                            }
                        }
                    );
                }
            );
        };


        processRow(0);
    });
};

exports.uploadProductsCatalouge = (req, res) => {
    const connection = mm.openConnection();
    const systemDate = mm.getSystemDate();

    // 1️⃣ Validate file
    if (!req.file) {
        return res.send({ code: 422, message: "No file uploaded" });
    }

    const custId = req.body.custId || req.custId;
    if (!custId) {
        fs.unlink(req.file.path, () => {});
        return res.send({ code: 422, message: "Missing Parameter" });
    }

    // 2️⃣ Read Excel
    let workbook;
    try {
        workbook = xlsx.readFile(req.file.path);
    } catch (err) {
        fs.unlink(req.file.path, () => {});
        return res.send({ code: 500, message: "Error reading Excel file", error: err.message });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!jsonData.length) {
        fs.unlink(req.file.path, () => {});
        return res.send({
            code: 422,
            message: "Excel file has headers but no data rows"
        });
    }

    // 3️⃣ Validate required columns
    const requiredColumns = ["Name", "Weight(gms)", "Length(cms)", "Width(cms)", "Height(cms)", "Price", "Warehouse Name"];
    const missingColumns = requiredColumns.filter(col => !(col in jsonData[0]));

    if (missingColumns.length > 0) {
        fs.unlink(req.file.path, () => {});
        return res.send({
            code: 422,
            message: "Missing columns: " + missingColumns.join(", ")
        });
    }

    // 4️⃣ Fetch warehouse list
    connection.query(
        `SELECT CONTACT_PERSON FROM address_master WHERE ADDRESS_TYPE = 'WH' AND CUSTOMER_ID = ?`,
        [custId],
        (err, addressRows) => {
            if (err) {
                connection.end();
                fs.unlink(req.file.path, () => {});
                return res.send({ code: 500, message: "Error fetching warehouse data", error: err.message });
            }

            const mismatchRows = [];
            jsonData.forEach((row, index) => {
                const warehouseName = (row["Warehouse Name"] || "").trim();
                const match = addressRows.some(addr => addr.CONTACT_PERSON?.trim() === warehouseName);
                if (!match) mismatchRows.push(index + 2);
            });

            if (mismatchRows.length > 0) {
                connection.end();
                fs.unlink(req.file.path, () => {});
                return res.send({
                    code: 422,
                    message: `Warehouse name mismatch at Excel rows: ${mismatchRows.join(", ")}`
                });
            }

            // 5️⃣ Get existing products
            connection.query(
                `SELECT ID, NAME FROM product_catalouge WHERE CUSTOMER_ID = ?`,
                [custId],
                (err, existingRows) => {
                    if (err) {
                        connection.end();
                        fs.unlink(req.file.path, () => {});
                        return res.send({ code: 500, message: "Error fetching existing products", error: err.message });
                    }

                    const existingMap = new Map();
                    existingRows.forEach(r => {
                        if (r.NAME) {
                            existingMap.set(r.NAME.trim().toLowerCase(), r.ID);
                        }
                    });

                    let insertedCount = 0;
                    let updatedCount = 0;

                    // 🔁 Sequential processing
                    const processRow = (index) => {
                        if (index >= jsonData.length) {
                            fs.unlink(req.file.path, () => {});
                            connection.commit(() => {
                                connection.end();
                                return res.send({
                                    code: 200,
                                    message: `Upload complete. Inserted: ${insertedCount}, Updated: ${updatedCount}`
                                });
                            });
                            return;
                        }

                        const row = jsonData[index];
                        const name = (row["Name"] || "").trim();
                        if (!name) return processRow(index + 1);

                        const payload = {
                            weight: row["Weight(gms)"],
                            length: row["Length(cms)"],
                            width: row["Width(cms)"],
                            height: row["Height(cms)"],
                            price: row["Price"],
                            warehouse: row["Warehouse Name"]
                        };

                        const existingId = existingMap.get(name.toLowerCase());

                        if (existingId) {
                            // 🔄 Update
                            connection.query(
                                `UPDATE product_catalouge 
                                 SET WEIGHT=?, LENGTH=?, WIDTH=?, HEIGHT=?, PRICE=?, WAREHOUSE_NAME=?, CREATED_MODIFIED_DATE_TIME=? 
                                 WHERE ID=?`,
                                [
                                    payload.weight,
                                    payload.length,
                                    payload.width,
                                    payload.height,
                                    payload.price,
                                    payload.warehouse,
                                    systemDate,
                                    existingId
                                ],
                                (err2) => {
                                    if (err2) {
                                        console.error("Update error:", err2.message);
                                        connection.rollback(() => connection.end());
                                        return res.send({ code: 500, message: "Error updating record" });
                                    }
                                    updatedCount++;
                                    processRow(index + 1);
                                }
                            );
                        } else {
                            // 🟢 Insert
                            connection.query(
                                `INSERT INTO product_catalouge
                                 (CUSTOMER_ID, NAME, WEIGHT, LENGTH, WIDTH, HEIGHT, PRICE, WAREHOUSE_NAME, CREATED_MODIFIED_DATE_TIME)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    custId,
                                    name,
                                    payload.weight,
                                    payload.length,
                                    payload.width,
                                    payload.height,
                                    payload.price,
                                    payload.warehouse,
                                    systemDate
                                ],
                                (err3) => {
                                    if (err3) {
                                        console.error("Insert error:", err3.message);
                                        connection.rollback(() => connection.end());
                                        return res.send({ code: 500, message: "Error inserting record" });
                                    }
                                    insertedCount++;
                                    processRow(index + 1);
                                }
                            );
                        }
                    };

                    connection.beginTransaction((errTx) => {
                        if (errTx) {
                            connection.end();
                            return res.send({ code: 500, message: "Failed to start DB transaction" });
                        }
                        processRow(0);
                    });
                }
            );
        }
    );
};

exports.updateTrackingDetails_old = function () {
    const supportKey = "1234789";
    const systemDate = mm.getSystemDate();
    try {
        mm.executeQueryData(`select ID, AWB_NO, CARRIER_ID, ORDER_STATUS, COURIER_API_DATA, CUSTOMER_ID, ORDER_AMOUNT, RTO_AMOUNT from order_master where ORDER_STATUS NOT IN('D','C','P','RTD') and IS_SHIPPED = 1`, [], supportKey, (error, getOrders) => {
            if (error) {
                console.log(error);
            }
            else {
                if (getOrders.length > 0) {
                    const connection = mm.openConnection();
                    async.eachSeries(getOrders, function iteratorOverElems(orderData, callback) {
                        let carrierId = orderData.CARRIER_ID;
                        let awbNo = orderData.AWB_NO;
                        let ID = orderData.ID;
                        let courierData = JSON.parse(orderData.COURIER_API_DATA);

                        if (carrierId == 1 && awbNo && awbNo != ' ') {
                            const bodyData = {
                                "trkType": "cnno",
                                "strcnno": awbNo,
                                "addtnlDtl": "Y"
                            }
                            axios.get(`https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate?username=${process.env.DTDC_TRACKING_USERNAME}&password=${process.env.DTDC_TRACKING_PASSWORD}`).then(async (loginToken) => {

                                const response = loginToken ? await axios.post(`${process.env.DTDC_TRACKING_URL}`, bodyData, {
                                    headers: {
                                        "X-Access-Token": loginToken.data,
                                        'Content-Type': "application/json"
                                    },
                                }) : null;

                                if (response.data.statusFlag == true && response.data.statusCode == 200) {
                                    let latestTrackingObj = (response.data.trackDetails).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (latestTrackingObj[0].strAction == "Pickup Scheduled") {
                                        ORDER_STATUS = 'PS'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Awaited") {
                                        ORDER_STATUS = 'PA'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Reassigned") {
                                        ORDER_STATUS = 'PR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Picked") {
                                        ORDER_STATUS = 'NP'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Picked Up") {
                                        ORDER_STATUS = 'PU'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Booked") {
                                        ORDER_STATUS = 'BKD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "In Transit") {
                                        ORDER_STATUS = 'I'
                                    }
                                    else if (latestTrackingObj[0].strAction == "SHIPMENT RECEIVED SHORT") {
                                        ORDER_STATUS = 'SVD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Reached At Destination") {
                                        ORDER_STATUS = 'RD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Out For Delivery") {
                                        ORDER_STATUS = 'OD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Delivered") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Return as per client instruction.") {
                                        ORDER_STATUS = 'C'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Delivered") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = latestTrackingObj[0].sTrRemarks ? latestTrackingObj[0].sTrRemarks : null
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Processed & Forwarded") {
                                        ORDER_STATUS = 'RPR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO In Transit") {
                                        ORDER_STATUS = 'RI'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Out For Delivery") {
                                        ORDER_STATUS = 'RTOD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Delivered") {
                                        ORDER_STATUS = 'RTD'
                                    }
                                    else if (latestTrackingObj[0].strCode == "DLV") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strCode == "RTOBKD") {
                                        ORDER_STATUS = 'RTBK'
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const strActionDate = latestTrackingObj[0].strActionDate;
                                        const strActionTime = latestTrackingObj[0].strActionTime;
                                        const day = strActionDate.substring(0, 2);
                                        const month = strActionDate.substring(2, 4);
                                        const year = strActionDate.substring(4, 8);
                                        const hours = strActionTime.substring(0, 2);
                                        const minutes = strActionTime.substring(2, 4);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDate = `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:00`;

                                        let query = ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ? AND RTO_AMOUNT = 0` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);
                                        if (ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }

                                        mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS = 'ND') {
                                                        insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                callback()
                            })
                        }
                        else if (carrierId == 2 && awbNo && awbNo != ' ') {

                            trackOnExpressbees(awbNo).then((xpressbeesTrackingDetails) => {
                                if (xpressbeesTrackingDetails.status) {
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "DL") {
                                        ORDER_STATUS = "D"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "OFD") {
                                        ORDER_STATUS = "OD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RAD") {
                                        ORDER_STATUS = "RD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "IT") {
                                        ORDER_STATUS = "I"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Out for Pickup") {
                                        ORDER_STATUS = "PA"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "RTO") {
                                        ORDER_STATUS = "RPR"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-IT") {
                                        ORDER_STATUS = "RI"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-DL") {
                                        ORDER_STATUS = "RTD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "EX") {
                                        ORDER_STATUS = "ND"
                                        ORDER_MESSAGE = xpressbeesTrackingDetails.data.history[0].message
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        let query = (ORDER_STATUS == "ND" ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }
                                        if (ORDER_STATUS == 'RPR') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ?`;
                                        }


                                        mm.executeDML(query, [ORDER_STATUS, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if (ORDER_STATUS == 'RPR' && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 3 && awbNo && awbNo != ' ') {
                            axios.get(`https://track.delhivery.com/api/v1/packages/json?waybill=${awbNo}&token=${process.env.DELHIVERY_TOKEN}`).then((response) => {

                                if (response.data.ShipmentData && (response.data.ShipmentData).length > 0) {
                                    response = (response.data.ShipmentData[0].Shipment.Scans).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (response[0].ScanDetail.Scan == 'Delivered') {
                                        ORDER_STATUS = 'D'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Not Picked') {
                                        ORDER_STATUS = 'C'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Manifested') {
                                        ORDER_STATUS = 'PA'
                                    }
                                    if (response[0].ScanDetail.Scan == 'In Transit') {
                                        ORDER_STATUS = 'I'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Dispatched') {
                                        ORDER_STATUS = 'OD'
                                    }
                                    if (response[0].ScanDetail.StatusCode == 'EOD-6' || response[0].ScanDetail.StatusCode == 'EOD-74' || response[0].ScanDetail.StatusCode == "EOD-15" || response[0].ScanDetail.StatusCode == "EOD-104" || response[0].ScanDetail.StatusCode == "EOD-43" || response[0].ScanDetail.StatusCode == "EOD-86" || response[0].ScanDetail.StatusCode == "EOD-11" || response[0].ScanDetail.StatusCode == "EOD-69") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = response[0].ScanDetail.Instructions
                                    }
                                    if (response[0].ScanDetail.ScanType == 'RT') {
                                        ORDER_STATUS = 'RPR'
                                    }


                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const isoString = response[0].ScanDetail.StatusDateTime;
                                        const date = new Date(isoString);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

                                        let query = (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '' ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        mm.executeDML(query, [ORDER_STATUS, formattedDateTime, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`update order_master set RTO_AMOUNT = ORDER_AMOUNT where ID = ?`, [ID], supportKey, connection, (error, updateOrderAmount) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, formattedDateTime, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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


                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 4 && awbNo && awbNo != ' ' && courierData) {
                            let bodyData = {
                                "request_id": courierData.request_id,
                                "tracking_ids": [
                                    courierData.response[0].tracking_id
                                ]
                            }
                            axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                headers: {
                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                    Authorization: process.env.EKART_AUTHORIZATION
                                }
                            }).then((token) => {
                                axios.post(process.env.EKART_BASEURL + process.env.EKART_TRACK, bodyData, {
                                    headers: {
                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                        Authorization: token.data.Authorization
                                    },
                                }).then((response) => {
                                    if (!response.data.error_code && response.data[awbNo]) {
                                        response.data[awbNo].history = response.data[awbNo].history.sort((a, b) => new Date(b.event_date_iso8601) - new Date(a.event_date_iso8601));
                                        let currentStatus = response.data[awbNo].history[0].status;
                                        let ORDER_STATUS = null;
                                        if (currentStatus == 'delivered') {
                                            ORDER_STATUS = 'D'
                                        }
                                        if (currentStatus == 'pickup_complete') {
                                            ORDER_STATUS = 'PU'
                                        }
                                        if (currentStatus == 'out_for_pickup') {
                                            ORDER_STATUS = 'PA'
                                        }
                                        if (currentStatus == 'pickup_scheduled') {
                                            ORDER_STATUS = 'PS'
                                        }
                                        if (currentStatus == 'pickup_cancelled') {
                                            ORDER_STATUS = 'C'
                                        }
                                        if (currentStatus == 'in_transit') {
                                            ORDER_STATUS = 'I'
                                        }
                                        if (currentStatus == 'out_for_delivery') {
                                            ORDER_STATUS = 'OD'
                                        }
                                        if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                            const isoString = response.data[awbNo].history[0].event_date;
                                            const date = new Date(isoString);
                                            const pad = (n) => n.toString().padStart(2, '0');
                                            const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                                            mm.executeDML(`update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`, [ORDER_STATUS, formattedDateTime, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                                if (error) {
                                                    console.log(error);
                                                    callback()
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
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
                                }).catch((error) => {
                                    console.log(error);
                                    callback()
                                })
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 6 && awbNo && awbNo != ' ') {
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
                                var options = {
                                    'method': 'GET',
                                    'url': 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + awbNo,
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${shiprocketToken.data.token}`
                                    }
                                };

                                request(options, function (error, response, body) {
                                    if (error) {
                                        console.log(error);
                                        callback()
                                    }
                                    else {
                                        let ORDER_STATUS = null;
                                        let ORDER_MESSAGE = null;
                                        body = JSON.parse(body);
                                        if (body.tracking_data) {
                                            if (body.tracking_data.shipment_status == 27) {
                                                ORDER_STATUS = 'PS'
                                            }
                                            else if (body.tracking_data.shipment_status == 19) {
                                                ORDER_STATUS = 'PA'
                                            }
                                            else if (body.tracking_data.shipment_status == 15) {
                                                ORDER_STATUS = 'PR'
                                            }
                                            else if (body.tracking_data.shipment_status == 13) {
                                                ORDER_STATUS = 'NP'
                                            }
                                            else if (body.tracking_data.shipment_status == 42) {
                                                ORDER_STATUS = 'PU'
                                            }
                                            else if (body.tracking_data.shipment_status == 52) {
                                                ORDER_STATUS = 'BKD'
                                            }
                                            else if (body.tracking_data.shipment_status == 18) {
                                                ORDER_STATUS = 'I'
                                            }
                                            else if (body.tracking_data.shipment_status == "SHIPMENT RECEIVED SHORT") {
                                                ORDER_STATUS = 'SVD'
                                            }
                                            else if (body.tracking_data.shipment_status == 38) {
                                                ORDER_STATUS = 'RD'
                                            }
                                            else if (body.tracking_data.shipment_status == 17) {
                                                ORDER_STATUS = 'OD'
                                            }
                                            else if (body.tracking_data.shipment_status == 7) {
                                                ORDER_STATUS = 'D'
                                            }
                                            else if (body.tracking_data.shipment_status == 8) {
                                                ORDER_STATUS = 'C'
                                            }
                                            else if (body.tracking_data.shipment_status == 21) {
                                                ORDER_STATUS = 'ND'
                                                ORDER_MESSAGE = body.tracking_data.shipment_track_activities[0].activity;
                                            }
                                            else if (body.tracking_data.shipment_status == 14) {
                                                ORDER_STATUS = 'RPR'
                                            }
                                            else if (body.tracking_data.shipment_status == 46) {
                                                ORDER_STATUS = 'RI'
                                            }
                                            else if (body.tracking_data.shipment_status == "RTO Out For Delivery") {
                                                ORDER_STATUS = 'RTOD'
                                            }
                                            else if (body.tracking_data.shipment_status == 48) {
                                                ORDER_STATUS = 'RTD'
                                            }



                                            if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                                const formattedDate = body.tracking_data.shipment_track[0].updated_time_stamp && body.tracking_data.shipment_track[0].updated_time_stamp != '' ? body.tracking_data.shipment_track[0].updated_time_stamp : null;

                                                let query = (((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT  where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);

                                                if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                                    query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                                }

                                                mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback()
                                                    }
                                                    else {
                                                        if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            if (ORDER_STATUS == 'D') {
                                                                wp.sendDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'OD') {
                                                                wp.sendOutOfDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'I') {
                                                                wp.sendInTransitMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'ND') {
                                                                insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                                callback()
                                                            }
                                                            else {
                                                                callback()
                                                            }
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
                                    }
                                })
                            })
                        }
                        else {
                            callback()
                        }
                    }, function subCb(error) {
                        if (error) {
                            mm.rollbackConnection(connection)
                            console.log(error);
                        }
                        else {
                            mm.commitConnection(connection)
                            console.log("success");
                        }
                    });
                }
                else {
                    console.log("no order found");
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.updateTrackingDetails = function () {
    const supportKey = "1234789";
    const systemDate = mm.getSystemDate();
    try {
        mm.executeQueryData(`select ID, AWB_NO, CARRIER_ID, ORDER_STATUS, COURIER_API_DATA, CUSTOMER_ID, ORDER_AMOUNT, RTO_AMOUNT from order_master where ORDER_STATUS NOT IN('D','C','P','RTD') and IS_SHIPPED = 1`, [], supportKey, (error, getOrders) => {
            if (error) {
                console.log(error);
            }
            else {
                if (getOrders.length > 0) {
                    const connection = mm.openConnection();
                    async.eachSeries(getOrders, function iteratorOverElems(orderData, callback) {
                        let carrierId = orderData.CARRIER_ID;
                        let awbNo = orderData.AWB_NO;
                        let ID = orderData.ID;
                        let courierData = JSON.parse(orderData.COURIER_API_DATA);

                        if (carrierId == 1 && awbNo && awbNo != ' ') {
                            const bodyData = {
                                "trkType": "cnno",
                                "strcnno": awbNo,
                                "addtnlDtl": "Y"
                            }
                            axios.get(`https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate?username=${process.env.DTDC_TRACKING_USERNAME}&password=${process.env.DTDC_TRACKING_PASSWORD}`).then(async (loginToken) => {

                                const response = loginToken ? await axios.post(`${process.env.DTDC_TRACKING_URL}`, bodyData, {
                                    headers: {
                                        "X-Access-Token": loginToken.data,
                                        'Content-Type': "application/json"
                                    },
                                }) : null;

                                if (response.data.statusFlag == true && response.data.statusCode == 200) {
                                    let latestTrackingObj = (response.data.trackDetails).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (latestTrackingObj[0].strAction == "Pickup Scheduled") {
                                        ORDER_STATUS = 'PS'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Awaited") {
                                        ORDER_STATUS = 'PA'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Pickup Reassigned") {
                                        ORDER_STATUS = 'PR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Picked") {
                                        ORDER_STATUS = 'NP'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Picked Up") {
                                        ORDER_STATUS = 'PU'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Booked") {
                                        ORDER_STATUS = 'BKD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "In Transit") {
                                        ORDER_STATUS = 'I'
                                    }
                                    else if (latestTrackingObj[0].strAction == "SHIPMENT RECEIVED SHORT") {
                                        ORDER_STATUS = 'SVD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Reached At Destination") {
                                        ORDER_STATUS = 'RD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Out For Delivery") {
                                        ORDER_STATUS = 'OD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Delivered") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Return as per client instruction.") {
                                        ORDER_STATUS = 'C'
                                    }
                                    else if (latestTrackingObj[0].strAction == "Not Delivered") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = latestTrackingObj[0].sTrRemarks ? latestTrackingObj[0].sTrRemarks : null
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Processed & Forwarded") {
                                        ORDER_STATUS = 'RPR'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO In Transit") {
                                        ORDER_STATUS = 'RI'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Out For Delivery") {
                                        ORDER_STATUS = 'RTOD'
                                    }
                                    else if (latestTrackingObj[0].strAction == "RTO Delivered") {
                                        ORDER_STATUS = 'RTD'
                                    }
                                    else if (latestTrackingObj[0].strCode == "DLV") {
                                        ORDER_STATUS = 'D'
                                    }
                                    else if (latestTrackingObj[0].strCode == "RTOBKD") {
                                        ORDER_STATUS = 'RTBK'
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const strActionDate = latestTrackingObj[0].strActionDate;
                                        const strActionTime = latestTrackingObj[0].strActionTime;
                                        const day = strActionDate.substring(0, 2);
                                        const month = strActionDate.substring(2, 4);
                                        const year = strActionDate.substring(4, 8);
                                        const hours = strActionTime.substring(0, 2);
                                        const minutes = strActionTime.substring(2, 4);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDate = `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:00`;

                                        let query = ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ? AND RTO_AMOUNT = 0` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);
                                        if (ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }

                                        mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK" || ORDER_STATUS == "RTD" || ORDER_STATUS == "RTOD" || ORDER_STATUS == "RI") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS = 'ND') {
                                                        insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                callback()
                            })
                        }
                        else if (carrierId == 2 && awbNo && awbNo != ' ') {

                            trackOnExpressbees(awbNo).then((xpressbeesTrackingDetails) => {
                                if (xpressbeesTrackingDetails.status) {
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "DL") {
                                        ORDER_STATUS = "D"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "OFD") {
                                        ORDER_STATUS = "OD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RAD") {
                                        ORDER_STATUS = "RD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "IT") {
                                        ORDER_STATUS = "I"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Out for Pickup") {
                                        ORDER_STATUS = "PA"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "Pick up done") {
                                        ORDER_STATUS = "PU"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].message == "RTO") {
                                        ORDER_STATUS = "RPR"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-IT") {
                                        ORDER_STATUS = "RI"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "RT-DL") {
                                        ORDER_STATUS = "RTD"
                                    }
                                    if (xpressbeesTrackingDetails.data.history[0].status_code == "EX") {
                                        ORDER_STATUS = "ND"
                                        ORDER_MESSAGE = xpressbeesTrackingDetails.data.history[0].message
                                    }

                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        let query = (ORDER_STATUS == "ND" ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                        }
                                        if (ORDER_STATUS == 'RPR'|| ORDER_STATUS == "RTD" || ORDER_STATUS == "RI") {
                                            query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT where ID = ?`;
                                        }


                                        mm.executeDML(query, [ORDER_STATUS, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTD" || ORDER_STATUS == "RI") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    callback()
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, xpressbeesTrackingDetails.data.history[0].event_time + ":00", ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 3 && awbNo && awbNo != ' ') {
                            axios.get(`https://track.delhivery.com/api/v1/packages/json?waybill=${awbNo}&token=${process.env.DELHIVERY_TOKEN}`).then((response) => {

                                if (response.data.ShipmentData && (response.data.ShipmentData).length > 0) {
                                    response = (response.data.ShipmentData[0].Shipment.Scans).reverse();
                                    let ORDER_STATUS = null;
                                    let ORDER_MESSAGE = null;
                                    if (response[0].ScanDetail.Scan == 'Delivered') {
                                        ORDER_STATUS = 'D'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Not Picked') {
                                        ORDER_STATUS = 'C'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Manifested') {
                                        ORDER_STATUS = 'PA'
                                    }
                                    if (response[0].ScanDetail.Scan == 'In Transit') {
                                        ORDER_STATUS = 'I'
                                    }
                                    if (response[0].ScanDetail.Scan == 'Dispatched') {
                                        ORDER_STATUS = 'OD'
                                    }
                                    if (response[0].ScanDetail.StatusCode == 'EOD-6' || response[0].ScanDetail.StatusCode == 'EOD-74' || response[0].ScanDetail.StatusCode == "EOD-15" || response[0].ScanDetail.StatusCode == "EOD-104" || response[0].ScanDetail.StatusCode == "EOD-43" || response[0].ScanDetail.StatusCode == "EOD-86" || response[0].ScanDetail.StatusCode == "EOD-11" || response[0].ScanDetail.StatusCode == "EOD-69") {
                                        ORDER_STATUS = 'ND'
                                        ORDER_MESSAGE = response[0].ScanDetail.Instructions
                                    }
                                    if (response[0].ScanDetail.ScanType == 'RT') {
                                        ORDER_STATUS = 'RPR'
                                    }


                                    if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                        const isoString = response[0].ScanDetail.StatusDateTime;
                                        const date = new Date(isoString);
                                        const pad = (n) => n.toString().padStart(2, '0');
                                        const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

                                        let query = (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '' ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`)
                                        mm.executeDML(query, [ORDER_STATUS, formattedDateTime, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                            if (error) {
                                                console.log(error);
                                                callback()
                                            }
                                            else {
                                                if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == "RTBK") && orderData.RTO_AMOUNT == 0) {
                                                    mm.executeDML(`update order_master set RTO_AMOUNT = ORDER_AMOUNT where ID = ?`, [ID], supportKey, connection, (error, updateOrderAmount) => {
                                                        if (error) {
                                                            callback(error)
                                                        }
                                                        else {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'ND') {
                                                        insertNdrLogs(ID, formattedDateTime, ORDER_MESSAGE);
                                                        callback()
                                                    }
                                                    else {
                                                        callback()
                                                    }
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


                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 4 && awbNo && awbNo != ' ' && courierData) {
                            let bodyData = {
                                "request_id": courierData.request_id,
                                "tracking_ids": [
                                    courierData.response[0].tracking_id
                                ]
                            }
                            axios.post(process.env.EKART_BASEURL + process.env.EKART_LOGIN, {}, {
                                headers: {
                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                    Authorization: process.env.EKART_AUTHORIZATION
                                }
                            }).then((token) => {
                                axios.post(process.env.EKART_BASEURL + process.env.EKART_TRACK, bodyData, {
                                    headers: {
                                        HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                        Authorization: token.data.Authorization
                                    },
                                }).then((response) => {
                                    if (!response.data.error_code && response.data[awbNo]) {
                                        response.data[awbNo].history = response.data[awbNo].history.sort((a, b) => new Date(b.event_date_iso8601) - new Date(a.event_date_iso8601));
                                        let currentStatus = response.data[awbNo].history[0].status;
                                        let ORDER_STATUS = null;
                                        if (currentStatus == 'delivered') {
                                            ORDER_STATUS = 'D'
                                        }
                                        if (currentStatus == 'pickup_complete') {
                                            ORDER_STATUS = 'PU'
                                        }
                                        if (currentStatus == 'out_for_pickup') {
                                            ORDER_STATUS = 'PA'
                                        }
                                        if (currentStatus == 'pickup_scheduled') {
                                            ORDER_STATUS = 'PS'
                                        }
                                        if (currentStatus == 'pickup_cancelled') {
                                            ORDER_STATUS = 'C'
                                        }
                                        if (currentStatus == 'in_transit') {
                                            ORDER_STATUS = 'I'
                                        }
                                        if (currentStatus == 'out_for_delivery') {
                                            ORDER_STATUS = 'OD'
                                        }
                                        if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                            const isoString = response.data[awbNo].history[0].event_date;
                                            const date = new Date(isoString);
                                            const pad = (n) => n.toString().padStart(2, '0');
                                            const formattedDateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                                            mm.executeDML(`update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`, [ORDER_STATUS, formattedDateTime, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                                if (error) {
                                                    console.log(error);
                                                    callback()
                                                }
                                                else {
                                                    if (ORDER_STATUS == 'D') {
                                                        wp.sendDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'OD') {
                                                        wp.sendOutOfDeliveredMessage(ID);
                                                        callback()
                                                    }
                                                    else if (ORDER_STATUS == 'I') {
                                                        wp.sendInTransitMessage(ID);
                                                        callback()
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
                                }).catch((error) => {
                                    console.log(error);
                                    callback()
                                })
                            }).catch((error) => {
                                console.log(error);
                                callback()
                            })
                        }
                        else if (carrierId == 6 && awbNo && awbNo != ' ') {
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
                                var options = {
                                    'method': 'GET',
                                    'url': 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + awbNo,
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${shiprocketToken.data.token}`
                                    }
                                };

                                request(options, function (error, response, body) {
                                    if (error) {
                                        console.log(error);
                                        callback()
                                    }
                                    else {
                                        let ORDER_STATUS = null;
                                        let ORDER_MESSAGE = null;
                                        body = JSON.parse(body);
                                        if (body.tracking_data) {
                                            if (body.tracking_data.shipment_status == 27) {
                                                ORDER_STATUS = 'PS'
                                            }
                                            else if (body.tracking_data.shipment_status == 19) {
                                                ORDER_STATUS = 'PA'
                                            }
                                            else if (body.tracking_data.shipment_status == 15) {
                                                ORDER_STATUS = 'PR'
                                            }
                                            else if (body.tracking_data.shipment_status == 13) {
                                                ORDER_STATUS = 'NP'
                                            }
                                            else if (body.tracking_data.shipment_status == 42) {
                                                ORDER_STATUS = 'PU'
                                            }
                                            else if (body.tracking_data.shipment_status == 52) {
                                                ORDER_STATUS = 'BKD'
                                            }
                                            else if (body.tracking_data.shipment_status == 18) {
                                                ORDER_STATUS = 'I'
                                            }
                                            else if (body.tracking_data.shipment_status == "SHIPMENT RECEIVED SHORT") {
                                                ORDER_STATUS = 'SVD'
                                            }
                                            else if (body.tracking_data.shipment_status == 38) {
                                                ORDER_STATUS = 'RD'
                                            }
                                            else if (body.tracking_data.shipment_status == 17) {
                                                ORDER_STATUS = 'OD'
                                            }
                                            else if (body.tracking_data.shipment_status == 7) {
                                                ORDER_STATUS = 'D'
                                            }
                                            else if (body.tracking_data.shipment_status == 8) {
                                                ORDER_STATUS = 'C'
                                            }
                                            else if (body.tracking_data.shipment_status == 21) {
                                                ORDER_STATUS = 'ND'
                                                ORDER_MESSAGE = body.tracking_data.shipment_track_activities[0].activity;
                                            }
                                            else if (body.tracking_data.shipment_status == 14) {
                                                ORDER_STATUS = 'RPR'
                                            }
                                            else if (body.tracking_data.shipment_status == 46) {
                                                ORDER_STATUS = 'RI'
                                            }
                                            else if (body.tracking_data.shipment_status == "RTO Out For Delivery") {
                                                ORDER_STATUS = 'RTOD'
                                            }
                                            else if (body.tracking_data.shipment_status == 48 || body.tracking_data.shipment_status == 10) {
                                                ORDER_STATUS = 'RTD'
                                            }



                                            if (ID && ID != ' ' && ORDER_STATUS && ORDER_STATUS != orderData.ORDER_STATUS) {
                                                const formattedDate = body.tracking_data.shipment_track[0].updated_time_stamp && body.tracking_data.shipment_track[0].updated_time_stamp != '' ? body.tracking_data.shipment_track[0].updated_time_stamp : null;

                                                let query = (((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) ? `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, RTO_AMOUNT = ORDER_AMOUNT  where ID = ?` : `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ? where ID = ?`);

                                                if (ORDER_STATUS == 'ND' && ORDER_MESSAGE && ORDER_MESSAGE != '') {
                                                    query = `update order_master set ORDER_STATUS = ?, ORDER_STATUS_UPDATED_DATETIME = ?, NOT_DELIVERED_REASON = '${ORDER_MESSAGE}', IS_NDR = 1 where ID = ?`
                                                }

                                                mm.executeDML(query, [ORDER_STATUS, formattedDate, ID], supportKey, connection, (error, updateTransactionDetails) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback()
                                                    }
                                                    else {
                                                        if ((ORDER_STATUS == 'RPR' || ORDER_STATUS == 'RI' || ORDER_STATUS == 'RTOD' || ORDER_STATUS == 'RTD') && orderData.RTO_AMOUNT == 0) {
                                                            mm.executeDML(`insert into transaction_master(CUSTOMER_ID, TRASACTION_TYPE, AMOUNT, EFFECT, TRANSACTION_DATETIME, CREATED_MODIFIED_DATE, ORDER_ID) values(?,?,?,?,?,?,?)`, [orderData.CUSTOMER_ID, 'O', orderData.ORDER_AMOUNT, 'D', systemDate, systemDate, ID], supportKey, connection, (error, insertTransaction) => {
                                                                if (error) {
                                                                    callback(error)
                                                                }
                                                                else {
                                                                    mm.executeDML(`update wallet_master set BALANCE = BALANCE - ? where CUSTOMER_ID = ?`, [orderData.ORDER_AMOUNT, orderData.CUSTOMER_ID], supportKey, connection, (error, updateWalletBalance) => {
                                                                        if (error) {
                                                                            callback(error)
                                                                        }
                                                                        else {
                                                                            callback()
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            if (ORDER_STATUS == 'D') {
                                                                wp.sendDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'OD') {
                                                                wp.sendOutOfDeliveredMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'I') {
                                                                wp.sendInTransitMessage(ID);
                                                                callback()
                                                            }
                                                            else if (ORDER_STATUS == 'ND') {
                                                                insertNdrLogs(ID, formattedDate, ORDER_MESSAGE);
                                                                callback()
                                                            }
                                                            else {
                                                                callback()
                                                            }
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
                                    }
                                })
                            })
                        }
                        else {
                            callback()
                        }
                    }, function subCb(error) {
                        if (error) {
                            mm.rollbackConnection(connection)
                            console.log(error);
                        }
                        else {
                            mm.commitConnection(connection)
                            console.log("success");
                        }
                    });
                }
                else {
                    console.log("no order found");
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
}

this.updateTrackingDetails();