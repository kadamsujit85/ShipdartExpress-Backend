const mm = require('../../utilities/globalModule');
const { validationResult } = require('express-validator');
const logger = require('../../utilities/logger');
const { normalizeLabelData, prune,toBoolInt, safeString,safeInt  } = require('../../utilities/shared');

var printLabelMaster = "print_label_master";

// ---------- reqData (merge existing + normalized label fields) ----------

function reqData(req) {
  const existing = {
    IS_SHOW_MOBILE_NO: toBoolInt(req.body.IS_SHOW_MOBILE_NO),
    LOGO: safeString(req.body.LOGO),
    CUSTOMER_ID: safeInt(req.body.CUSTOMER_ID),
    CREATED_MODIFIED_DATE: safeString(req.body.CREATED_MODIFIED_DATE),
    SHOW_LOGO: toBoolInt(req.body.SHOW_LOGO),
    SHOW_SUPPORT_CONTACT: toBoolInt(req.body.SHOW_SUPPORT_CONTACT),
    HIDE_PICKUP_ADDRESS: toBoolInt(req.body.HIDE_PICKUP_ADDRESS),
    HIDE_PICKUP_MOBILE_NO: toBoolInt(req.body.HIDE_PICKUP_MOBILE_NO),
    HIDE_RTO_ADDRESS: toBoolInt(req.body.HIDE_RTO_ADDRESS),
    HIDE_RTO_MOBILE_NO: toBoolInt(req.body.HIDE_RTO_MOBILE_NO),
    SIZE_TYPE: safeString(req.body.SIZE_TYPE),
  };

  const labelFields = normalizeLabelData(req.body || {});
  const merged = Object.assign({}, existing, labelFields);

  return prune(merged); // remove null/undefined/'' but keep 0
}

// ---------- GET ----------
exports.get = (req, res) => {
  try {
    const rawPageIndex = req.body.pageIndex;
    const rawPageSize = req.body.pageSize;
    const pageIndex = rawPageIndex ? parseInt(rawPageIndex, 10) : '';
    const pageSize = rawPageSize ? parseInt(rawPageSize, 10) : '';
    let start = 0;
    let limit = 0;

    if (pageIndex !== '' && pageSize !== '' && Number.isInteger(pageIndex) && Number.isInteger(pageSize) && pageIndex > 0 && pageSize > 0) {
      start = (pageIndex - 1) * pageSize;
      limit = pageSize;
    }

    const sortKey = req.body.sortKey ? String(req.body.sortKey) : 'ID';
    const sortValue = req.body.sortValue ? String(req.body.sortValue) : 'DESC';

    let filter = '';
    if (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0) {
      filter = ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})`;
    }

    const criteria = (pageIndex === '' && pageSize === '')
      ? filter + " ORDER BY " + sortKey + " " + sortValue
      : filter + " ORDER BY " + sortKey + " " + sortValue + " LIMIT " + start + "," + limit;

    const countCriteria = filter;
    const supportKey = req.headers['supportkey'] || req.headers['supportKey'] || '';

    mm.executeQuery('SELECT COUNT(*) as cnt FROM ' + printLabelMaster + ' WHERE 1 ' + countCriteria, supportKey, (error, results1) => {
      if (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        return res.status(400).send({ code: 400, message: "Failed to get print_label_master count." });
      }

      mm.executeQuery('SELECT * FROM ' + printLabelMaster + ' WHERE 1 ' + criteria, supportKey, (error2, results) => {
        if (error2) {
          logger.error(req.url, req.method, JSON.stringify(error2), req.baseUrl + req.url);
          return res.status(400).send({ code: 400, message: "Failed to get print_label_master information." });
        }

        const totalCount = results1 && results1[0] && results1[0].cnt ? parseInt(results1[0].cnt, 10) : 0;
        const pages = (pageSize && pageSize > 0) ? Math.ceil(totalCount / pageSize) : 1;

        return res.send({
          code: 200,
          message: "success",
          pages: (pageIndex && pageSize ? pages : 1),
          count: totalCount,
          data: results
        });
      });
    });
  } catch (error) {
    console.log(error);
    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    return res.status(500).send({ code: 500, message: "Internal server error" });
  }
};

// ---------- CREATE ----------
exports.create = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).send({ code: 422, message: errors.errors });
  }

  try {
    const supportKey = req.headers['supportkey'] || req.headers['supportKey'] || '';
    const systemDate = mm.getSystemDate();

    const data = reqData(req);
    data.CREATED_MODIFIED_DATE = systemDate;

    mm.executeQueryData('INSERT INTO ' + printLabelMaster + ' SET ?', data, supportKey, (error, results) => {
      if (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        return res.status(400).send({ code: 400, message: "Failed to save print_label_master information..." });
      }
      return res.send({
        code: 200,
        message: "print_label_master information saved successfully...",
        insertId: results && results.insertId ? results.insertId : null
      });
    });
  } catch (error) {
    console.log(error);
    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    return res.status(500).send({ code: 500, message: "Internal server error" });
  }
};

// ---------- UPDATE ----------
exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).send({ code: 422, message: errors.errors });
  }

  try {
    const supportKey = req.headers['supportkey'] || req.headers['supportKey'] || '';
    const id = req.body.ID;
    if (!id) return res.status(400).send({ code: 400, message: "ID is required for update." });

    const systemDate = mm.getSystemDate();
    const normalized = reqData(req);

    const setParts = [];
    const params = [];

    Object.keys(normalized).forEach(key => {
      if (req.body.hasOwnProperty(key)) {
        setParts.push(`${key} = ?`);
        params.push(normalized[key]);
      }
    });

    setParts.push(`CREATED_MODIFIED_DATE = ?`);
    params.push(systemDate);

    const sql = `UPDATE ${printLabelMaster} SET ${setParts.join(', ')} WHERE ID = ?`;
    params.push(id);

mm.executeQueryData(sql, params, supportKey, (error, results) => {
  if (error) {
    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    return res.status(400).send({ code: 400, message: "Failed to update print_label_master information." });
  }

  const affected = results && (results.affectedRows || results.affected_rows || 0);

  if (affected > 0) {
    // updated at least one row
    return res.send({ code: 200, message: "print_label_master information updated successfully..." });
  }

    // affected === 0 -> could be "no values changed" or "no row found"
    // We only want to handle "record not found" as an error. Check existence.
    mm.executeQueryData('SELECT ID FROM ' + printLabelMaster + ' WHERE ID = ?', [id], supportKey, (selErr, selRows) => {
        if (selErr) {
        logger.error(req.url, req.method, JSON.stringify(selErr), req.baseUrl + req.url);
        // fallback error — couldn't verify; respond with generic failure
        return res.status(500).send({ code: 500, message: "Failed to verify update result." });
        }

        if (!Array.isArray(selRows) || selRows.length === 0) {
        // record truly does not exist
        return res.status(404).send({ code: 404, message: "Record not found." });
        }

        // record exists but nothing changed (values identical) — treat as success
        return res.send({ code: 200, message: "print_label_master information updated successfully..." });
    });
    });

  } catch (error) {
    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
    return res.status(500).send({ code: 500, message: "Internal server error" });
  }
};

// const mm = require('../../utilities/globalModule');
// const { validationResult, body } = require('express-validator');
// const logger = require('../../utilities/logger')

// var printLabelMaster = "print_label_master";
// var viewPrintLabelMaster = "view_" + printLabelMaster;

// function reqData(req) {

//     var data = {
//         IS_SHOW_MOBILE_NO: req.body.IS_SHOW_MOBILE_NO ? 1 : 0,
//         LOGO: req.body.LOGO,
//         CUSTOMER_ID: req.body.CUSTOMER_ID,
//         CREATED_MODIFIED_DATE: req.body.CREATED_MODIFIED_DATE,
//         SHOW_LOGO: req.body.SHOW_LOGO,
//         SHOW_SUPPORT_CONTACT: req.body.SHOW_SUPPORT_CONTACT,
//         HIDE_PICKUP_ADDRESS: req.body.HIDE_PICKUP_ADDRESS,
//         HIDE_PICKUP_MOBILE_NO: req.body.HIDE_PICKUP_MOBILE_NO,
//         HIDE_RTO_ADDRESS: req.body.HIDE_RTO_ADDRESS,
//         HIDE_RTO_MOBILE_NO: req.body.HIDE_RTO_MOBILE_NO,
//         HIDE_GST_NO: req.body.HIDE_GST_NO,
//         SIZE_TYPE: req.body.SIZE_TYPE,
//     }
//     return data;
// }

// exports.validate = function () {
//     return [
//         body('CUSTOMER_ID', 'parameter missing').exists(),
//         body('LOGO').optional(),
//         body('IS_SHOW_MOBILE_NO').optional(),
//         body('ID').optional(),
//     ]
// }

// exports.get = (req, res) => {

//     var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
//     var pageSize = req.body.pageSize ? req.body.pageSize : '';
//     var start = 0;
//     var end = 0;

//     if (pageIndex != '' && pageSize != '') {
//         start = (pageIndex - 1) * pageSize;
//         end = pageSize;
//     }

//     let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
//     let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
//     let filter = req.body.filter ? req.body.filter : '';
//     let criteria = '';

//     (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID})` : '')

//     if (pageIndex === '' && pageSize === '')
//         criteria = filter + " order by " + sortKey + " " + sortValue;
//     else
//         criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

//     let countCriteria = filter;
//     var supportKey = req.headers['supportkey'];

//     try {
//         mm.executeQuery('select count(*) as cnt from ' + viewPrintLabelMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
//             if (error) {
//                 logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//                 res.send({
//                     "code": 400,
//                     "message": "Failed to get viewPrintLabelMaster count.",
//                 });
//             }
//             else {
//                 mm.executeQuery('select * from ' + viewPrintLabelMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
//                     if (error) {
//                         logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//                         res.send({
//                             "code": 400,
//                             "message": "Failed to get viewPrintLabelMaster information."
//                         });
//                     }
//                     else {
//                         const roundSize = Math.ceil(results1[0].cnt / pageSize);
//                         res.send({
//                             "code": 200,
//                             "message": "success",
//                             "pages": (pageIndex && pageSize ? roundSize : 1),
//                             "count": results1[0].cnt,
//                             "data": results
//                         });
//                     }
//                 });
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//     }
// }

// exports.create = (req, res) => {

//     const errors = validationResult(req);
//     var data = reqData(req);
//     data.CREATED_MODIFIED_DATE = mm.getSystemDate();
//     var supportKey = req.headers["supportKey"];
//     if (!errors.isEmpty()) {
//         console.log(errors);
//         res.send({
//             "code": 422,
//             "message": errors.errors
//         });
//     }
//     else {
//         try {
//             mm.executeQueryData('INSERT INTO ' + printLabelMaster + ' SET ?', data, supportKey, (error, results) => {
//                 if (error) {
//                     logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//                     res.send({
//                         "code": 400,
//                         "message": "Failed to save printLabelMaster information..."
//                     });
//                 }
//                 else {
//                     res.send({
//                         "code": 200,
//                         "message": "printLabelMaster information saved successfully...",
//                     });
//                 }
//             });
//         } catch (error) {
//             console.log(error);

//             logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//         }
//     }
// }

// exports.update = (req, res) => {
//     const errors = validationResult(req);
//     var data = reqData(req);
//     var criteria = {
//         ID: req.body.ID,
//     };
//     var supportKey = req.headers["supportKey"];
//     var systemDate = mm.getSystemDate();
//     var setData = "";
//     var recordData = [];
//     Object.keys(data).forEach(key => {
//         data[key] != null ? setData += `${key}= ? , ` : true;
//         data[key] != null ? recordData.push(data[key]) : true;
//     });

//     if (!errors.isEmpty()) {
//         console.log(errors);
//         res.send({
//             "code": 422,
//             "message": errors.errors
//         });
//     }
//     else {
//         try {
//             mm.executeQueryData(`UPDATE ` + printLabelMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
//                 if (error) {
//                     logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//                     res.send({
//                         "code": 400,
//                         "message": "Failed to update printLabelMaster information."
//                     });
//                 }
//                 else {
//                     res.send({
//                         "code": 200,
//                         "message": "printLabelMaster information updated successfully...",
//                     });
//                 }
//             });
//         } catch (error) {
//             logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
//         }
//     }
// }