const mm = require('../../utilities/globalModule');
const logger = require('../../utilities/logger')
var formMaster = "form_master";
var viewFormMaster = "view_" + formMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        PARENT_ID: req.body.PARENT_ID,
        LINK: req.body.LINK,
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID,
        STATUS: req.body.STATUS
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        body('PARENT_ID').isInt(),
        body('LINK', ' parameter missing').exists(),
        body('ICON').optional(),
        body('ID').optional(),
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
    const supportKey = req.headers['supportKey']
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewFormMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                //console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to get forms count...",
                });
            }
            else {
                //console.log(results1);
                mm.executeQuery('select * from ' + viewFormMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        //console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get form information..."
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
        //logger.error('APIK:' + req.headers['apikey'] +' '+supportKey+ ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
        // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        //console.log(error);
    }
}

exports.create = (req, res) => {

    var data = reqData(req);
    var supportKey = req.headers['supportKey']

    try {
        mm.executeQueryData('INSERT INTO ' + formMaster + ' SET ?', data, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to save form information..."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Form information saved successfully...",
                });
            }
        });
    } catch (error) {
        console.log(error)
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
    var supportKey = req.headers['supportKey']
    try {
        mm.executeQueryData(`UPDATE ` + formMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to update form information..."
                });
            }
            else {
                console.log(results);
                res.send({
                    "code": 200,
                    "message": "Form information updated successfully...",
                });
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.getForms = (req, res) => {

    try {
        var ROLE_ID = req.body.ROLE_ID;
        var EMP_ID = req.body.EMP_ID;
        console.log(req.body);

        //var filter = req.body.filter ? (' AND ' + req.body.filter) : ''
        var supportKey = req.headers['supportKey']
        if (ROLE_ID) {

            var query = `SET SESSION group_concat_max_len = 4294967290;select JSON_ARRAYAGG(JSON_OBJECT('key',a.FORM_ID ,'icon', a.ICON, 'link',a.LINK, 'level',1, 'title', a.FORM_NAME, 'SEQ_NO',a.SEQ_NO,'is_allowed',a.IS_ALLOWED,'show_in_menu', a.SHOW_IN_MENU, 'children', (SELECT JSON_ARRAYAGG(JSON_OBJECT('key',b.FORM_ID ,'icon', b.ICON, 'link',b.LINK, 'level',1, 'title', b.FORM_NAME, 'SEQ_NO',b.SEQ_NO,'is_allowed',b.IS_ALLOWED,'show_in_menu', b.SHOW_IN_MENU )) from view_role_details b where 1 AND b.PARENT_ID = a.FORM_ID and b.ROLE_ID = ? AND b.STATUS = 1 AND (b.IS_ALLOWED = 1 OR b.SHOW_IN_MENU = 1 ) ORDER BY b.SEQ_NO asc )))  as data from view_role_details a where a.ROLE_ID = ? AND a.PARENT_ID = 0 AND a.STATUS = 1 AND (a.IS_ALLOWED = 1 OR a.SHOW_IN_MENU = 1 ) ORDER BY a.SEQ_NO asc`

            // var query = `SET SESSION group_concat_max_len = 4294967290;
            // select replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK,'subforms',(IFNULL((SELECT replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK)),']'),'"[','['),']"',']') FROM view_role_details WHERE ROLE_ID = m.ROLE_ID and  IS_ALLOWED = 1 AND PARENT_ID = m.FORM_ID   order by SEQ_NO asc),'[]'))
            // )),']'),'"[','['),']"',']') as data FROM
            // view_role_details m Where ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND PARENT_ID = 0 order by SEQ_NO asc`

            mm.executeQueryData(query, [ROLE_ID, ROLE_ID], supportKey, (error, results) => {
                if (error) {
                    //console.log(error);
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
                            "data": JSON.parse(results[1][0].data)
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
    }
}