const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
var roleMaster = "role_master";
var viewRoleMaster = "view_" + roleMaster;

function reqData(req) {
    var data = {

        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? 1 : 0,
        CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
        DESCRIPTION: req.body.DESCRIPTION,

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        //body('PARENT_ID').isInt(),
        body('TYPE').optional(),
        body('DESCRIPTION').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    //console.log(req.body)

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
    var supportKey = req.headers['supportKey']
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewRoleMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get roles count...",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewRoleMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get role information..."
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
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        //console.log(error);
    }
}

exports.create = (req, res) => {

    var data = reqData(req);
    var supportKey = req.headers['supportKey']
    data.CREATED_MODIFIED_DATE = mm.getSystemDate()

    try {
        mm.executeQueryData('INSERT INTO ' + roleMaster + ' SET ?', data, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to save role information..."
                });

            }
            else {
                res.send({
                    "code": 200,
                    "message": "Role information saved successfully...",
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
        mm.executeQueryData(`UPDATE ` + roleMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to update role information..."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Role information updated successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        console.log(error);
    }
}

exports.getChildRoles = (req, res) => {

    //console.log(req.body)

    var parentId = req.body.parentId ? req.body.parentId : '';
    var employeeId = req.body.employeeId ? req.body.employeeId : '';

    // var pageSize = req.body.pageSize ? req.body.pageSize : '';
    // var start = 0;
    // var end = 0;

    // //console.log(pageIndex + " " + pageSize)
    // if (pageIndex != '' && pageSize != '') {
    //     start = (pageIndex - 1) * pageSize;
    //     end = pageSize;
    //     //console.log(start + " " + end);
    // }

    // let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    // let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    // let filter = req.body.filter ? req.body.filter : '';
    // let criteria = '';

    // if (pageIndex === '' && pageSize === '')
    //     criteria = filter + " order by " + sortKey + " " + sortValue;
    // else
    //     criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    // let countCriteria = filter;
    var deviceid = req.headers['deviceid'];
    try {
        //select  id,name,PARENT_ROLE_ID from (select * from view_role_master order by PARENT_ROLE_ID, id) roles, (select @pv := ${parentId}) initialisation where find_in_set(PARENT_ROLE_ID, @pv) and  length(@pv := concat(@pv, ',', id))
        mm.executeQueryData(`select * from (select * from role_master order by PARENT_ROLE_ID, id) roles, (select @pv := ?) initialisation where find_in_set(PARENT_ROLE_ID, @pv) and length(@pv := concat(@pv, ',', id)) and id not in(select role_id from employee_role_mapping where EMPLOYEE_ID = ?)`, [parentId, employeeId], (error, results) => {
            //mm.executeQuery('select * from role_master where (parent_role_id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')))) or id in (select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + '))))) and id not in(select role_id from employee_role_mapping where EMPLOYEE_ID = '+ employeeId +')', supportKey, (error, results) => {
            if (error) {
                //console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to get role information..."
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
    }
}

exports.getRoleEmpwise = (req, res) => {

    const EMP_ID = req.body.EMP_ID;
    try {
        if (EMP_ID && EMP_ID != ' ') {

            mm.executeQueryData('select ID , NAME, ifnull((SELECT STATUS from employee_role_mapping where ROLE_ID = role_master.ID AND EMP_ID = ?), 0) as STATUS from role_master where STATUS = 1 ', EMP_ID, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get role information..."
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
        }
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        //console.log(error);
    }
}