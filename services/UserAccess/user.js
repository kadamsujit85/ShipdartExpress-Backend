const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const jwt = require('jsonwebtoken');
const md5 = require('md5')

var userMaster = "user_master";
var viewUserMaster = "view_" + userMaster;

function reqData(req) {
    var data = {

        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        MOBILE_NO: req.body.MOBILE_NO,
        IS_ACTIVE: req.body.IS_ACTIVE,
        PASSWORD: req.body.PASSWORD,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        READ_ONLY: req.body.READ_ONLY,
        ARCHIVE_FLAG: req.body.ARCHIVE_FLAG,
        CLIENT_ID: req.body.CLIENT_ID,
        CLOUD_ID: req.body.CLOUD_ID,
        LAST_LOGIN_DATETIME: req.body.LAST_LOGIN_DATETIME,

    }
    return data;
}

exports.validate = function () {
    return [
        // body('ROLE_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('PASSWORD', ' parameter missing').exists(),
        body('ID').optional()
    ]
}

exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    //console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        //console.log(start + " " + end);
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];
    try {

        mm.executeQuery('select count(*) as cnt from ' + viewUserMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get users count...",
                });
            } else {
                mm.executeQuery('select * from ' + viewUserMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get user information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
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
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    data.PASSWORD = md5(data.PASSWORD)

    if (!errors.isEmpty()) {
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection()
            mm.executeDML(`select ID from user_master where MOBILE_NO = ? OR EMAIL_ID = ? AND IS_ACTIVE = ?;`, [data.MOBILE_NO, data.EMAIL_ID, 1], supportKey, connection, (error, checkMobileAndMail) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                }
                else {
                    if (checkMobileAndMail.length > 0) {
                        mm.rollbackConnection(connection);
                        res.send({
                            "code": 403,
                            "message": "mobile no or email already registered..."
                        });
                    }
                    else {
                        mm.executeDML('INSERT INTO ' + userMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                mm.rollbackConnection(connection);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save user information..."
                                });
                            }
                            else {
                                mm.commitConnection(connection);
                                res.send({
                                    "code": 200,
                                    "message": "User information saved successfully...",
                                });
                            }
                        });
                    }
                }
            })

        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            console.log(error)
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var roleData = req.body.ROLE_DATA;
    data.ROLE_ID = roleData[0]
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

    if (!errors.isEmpty()) {
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection()
            mm.executeDML(`select ID from user_master where (MOBILE_NO = ? OR EMAIL_ID = ?) AND IS_ACTIVE = ? AND ID <> ?;`, [data.MOBILE_NO, data.EMAIL_ID, 1, criteria.ID], supportKey, connection, (error, checkMobileAndEmail) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update user information."
                    });
                }
                else {
                    if (checkMobileAndEmail.length > 0) {
                        mm.rollbackConnection(connection);
                        res.send({
                            "code": 403,
                            "message": "mobile or mail already registered."
                        });
                    }
                    else {
                        mm.executeDML(`UPDATE ` + userMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update user information."
                                });
                            }
                            else {
                                mm.commitConnection(connection);
                                res.send({
                                    "code": 200,
                                    "message": "User information updated successfully...",
                                });
                            }
                        });
                    }
                }
            })
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
            console.log(error);
        }
    }
}

function generateToken(userId, res, resultsUser) {

    try {

        var data = {
            "USER_ID": userId,
        }
        var expiresIn = '2h'

        jwt.sign({ data }, process.env.SECRET, { expiresIn }, (error, token) => {
            if (error) {
                console.log("token error", error);
                res.send({
                    "code": 400,
                    "message": "Fail to generate token"
                })
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Logged in successfully...",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.logout = (req, res) => {
    try {

        var systemDate = mm.getSystemDate();
        var USER_ID = req.body.USER_ID;
        var supportKey = req.headers['supportkey'];

        if (!USER_ID || USER_ID == ' ') {
            res.send({
                "code": 400,
                "message": "userId parameter missing.",
            });
        }
        else {
            mm.executeQueryData(`update user_master set FIREBASE_REG_TOKEN = ?, CREATED_MODIFIED_DATE = ?, LOGOUT_DATE_TIME = ? where ID = ?`, [null, systemDate, systemDate, USER_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to logout.",
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Logout sucessfully.",
                    });
                }
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.changeUserPassword = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var USER_ID = req.body.USER_ID;
        var supportKey = req.headers['supportkey'];
        var OLD_PASSWORD = req.body.OLD_PASSWORD;
        var NEW_PASSWORD = req.body.NEW_PASSWORD;

        if (USER_ID && OLD_PASSWORD && NEW_PASSWORD) {
            mm.executeQueryData(`select ID, PASSWORD from user_master where ID = ?;`, USER_ID, supportKey, (error, getData) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get data..."
                    })
                }
                else {
                    if (getData.length > 0) {
                        if (getData[0].PASSWORD === OLD_PASSWORD) {
                            mm.executeQueryData(`update user_master set PASSWORD = ? where ID = ?;`, [NEW_PASSWORD, USER_ID], supportKey, (error, updatePassword) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to update password..."
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 200,
                                        "message": "success."
                                    })
                                }
                            })
                        }
                        else {
                            res.send({
                                "code": 402,
                                "message": "wrong old password."
                            })
                        }
                    }
                    else {
                        res.send({
                            "code": 403,
                            "message": "User not found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "parameter missing"
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getForms = (req, res) => {

    try {
        var ROLE_ID = req.body.ROLE_ID;
        var supportKey = req.headers['supportkey'];

        if (ROLE_ID) {

            var query = `SET SESSION group_concat_max_len = 4294967290;SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',1,'title',m.FORM_NAME,'icon',m.ICON,'link',m.LINK,'SEQ_NO',m.SEQ_NO,'children',( IFNULL((SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',2,'title',FORM_NAME,'icon',ICON,'link',link,'SEQ_NO',SEQ_NO)),']')),'"[','['),']"',']') FROM view_role_details WHERE PARENT_ID = m.FORM_ID AND ROLE_ID = m.ROLE_ID  and IS_ALLOWED=1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC),'[]') )
            )),']')),'"[','['),']"',']') AS data FROM view_role_details m WHERE PARENT_ID = 0 AND ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC`

            // var query = `SET SESSION group_concat_max_len = 4294967290;
            // select replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK,'subforms',(IFNULL((SELECT replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK)),']'),'"[','['),']"',']') FROM view_role_details WHERE ROLE_ID = m.ROLE_ID and  IS_ALLOWED = 1 AND PARENT_ID = m.FORM_ID   order by SEQ_NO asc),'[]'))
            // )),']'),'"[','['),']"',']') as data FROM
            // view_role_details m Where ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND PARENT_ID = 0 order by SEQ_NO asc`

            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get Record."
                    });
                }
                else {
                    if (results.length > 0) {
                        ////console.log(results);
                        var json = results[1][0].data
                        if (json) {
                            json = json.replace(/\\/g, '');
                            json = JSON.parse(json);
                        }
                        ////console.log("res : ", json);
                        res.send({
                            "code": 200,
                            "message": "SUCCESS",
                            "data": json
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "No Data",
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter missing - ROLE_ID "
            });
            return
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.login = (req, res) => {

    var systemDate = mm.getSystemDate();
    var username = req.body.username;
    var password = md5(req.body.password);

    var cloudId = req.body.CLOUD_ID ? req.body.CLOUD_ID : '';
    var supportKey = req.headers['supportkey'];
    try {
        if ((!username && username == ' ' && username == undefined) && (!password && password == '' && password == undefined)) {
            res.send({
                "code": 404,
                "message": "username or password parameter missing...",
            });
        }
        else {
            mm.executeQueryData(`SELECT * FROM view_user_master  WHERE  (MOBILE_NO = ? or EMAIL_ID = ?) and PASSWORD = ? and IS_ACTIVE = 1`, [username, username, password], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get record...",
                    });
                }
                else {
                    if (results1.length > 0) {
                        mm.executeQueryData(`update user_master set CLOUD_ID = ?, LAST_LOGIN_DATETIME = ? where ID = ?;`, [cloudId, systemDate, results1[0].ID], supportKey, (error, updateLoginTime) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update time...",
                                });
                            }
                            else {

                                mm.executeQuery(`SELECT ROLE_ID,ROLE_NAME FROM view_user_role_mapping where USER_ID = ${results1[0].ID}`, supportKey, (error, resultRole) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get record",
                                        });
                                    }
                                    else {
                                        var userDetails = [{
                                            USER_ID: results1[0].ID,
                                            CLIENT_ID: results1[0].CLIENT_ID,
                                            ROLE_ID: results1[0].ROLE_ID,
                                            ROLE_NAME: results1[0].ROLE_NAME,
                                            NAME: results1[0].NAME,
                                            EMAIL_ID: results1[0].EMAIL_ID,
                                            MOBILE_NO: results1[0].MOBILE_NO,
                                            LAST_LOGIN_DATETIME: results1[0].LAST_LOGIN_DATETIME,
                                            ROLE_DETAILS: resultRole
                                        }]
                                        generateToken(results1[0].ID, res, userDetails);
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Incorrect username or password..."
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error); logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}