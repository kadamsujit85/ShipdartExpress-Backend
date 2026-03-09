const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require('../../utilities/logger')
const axios = require('axios');



var kycMaster = "kyc_master";
var viewKycMaster = "view_" + kycMaster;
var isAadharChanged = false;
async function reqData(req, action) { 
    var data = new Object();
    if(action == "create"){
        data = {
    
            CUSTOMER_ID: req.body.CUSTOMER_ID,
            AADHAR_CARD_NO: req.body.AADHAR_CARD_NO,
            AADHAR_FRONT: es(req.body.AADHAR_FRONT),
            AADHAR_BACK: es(req.body.AADHAR_BACK),
            PAN_CARD_NO: es(req.body.PAN_CARD_NO),
            PAN_CARD_FRONT: es(req.body.PAN_CARD_FRONT),
            GST_NO: es(req.body.GST_NO),
            GST_FRONT: es(req.body.GST_FRONT),
            IS_COMPLETED_KYC: 0,
        }
    }else{

        let existingKycStatus = 0;

        try {
        const q = `
            SELECT AADHAR_CARD_NO, IS_COMPLETED_KYC
            FROM kyc_master
            WHERE CUSTOMER_ID = ?
            LIMIT 1
        `;

        const rows = await mm.executeQueryDataAsync(
            q,
            [req.body.CUSTOMER_ID]
        );

        if (rows && rows.length > 0) {
            const existingAadhar = rows[0].AADHAR_CARD_NO;
            const incomingAadhar = req.body.AADHAR_CARD_NO;
            existingKycStatus = rows[0].IS_COMPLETED_KYC;

            if (
            existingAadhar &&
            incomingAadhar &&
            existingAadhar !== incomingAadhar
            ) {
            isAadharChanged = true;
            }
        }

        data = {
            AADHAR_CARD_NO: req.body.AADHAR_CARD_NO,
            AADHAR_FRONT: es(req.body.AADHAR_FRONT),
            AADHAR_BACK: es(req.body.AADHAR_BACK),
            PAN_CARD_NO: es(req.body.PAN_CARD_NO),
            PAN_CARD_FRONT: es(req.body.PAN_CARD_FRONT),
            GST_NO: es(req.body.GST_NO),
            GST_FRONT: es(req.body.GST_FRONT),
            IS_COMPLETED_KYC: isAadharChanged ? 0 : existingKycStatus
        };



        } catch (err) {
        logger.error(
            req.url,
            req.method,
            "KYC update: failed to fetch existing record",
            JSON.stringify(err),
            req.baseUrl + req.url
        ); 
    }
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

    let sortKey = req.body.sortKey ? req.body.sortKey : 'CREATED_MODIFIED_DATE';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND CUSTOMER_ID IN(${req.body.CUSTOMER_ID}) ` : '');
    (req.body.IS_COMPLETED_KYC == 1 && req.body.IS_COMPLETED_KYC == 0 ? filter += ` AND IS_COMPLETED_KYC = ${req.body.IS_COMPLETED_KYC} ` : '');
    (req.body.SEARCH_FILTER && req.body.SEARCH_FILTER != ' ' ? filter += ` AND (CUSTOMER_NAME like '%${req.body.SEARCH_FILTER}%' OR MOBILE_NO like '%${req.body.SEARCH_FILTER}%' OR EMAIL_ID like '%${req.body.SEARCH_FILTER}%')` : '');

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewKycMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get viewKycMaster count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewKycMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get viewKycMaster information."
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

exports.create = async (req, res) => {

    const errors = validationResult(req);
    var data = await reqData(req, "create");
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
            mm.executeQueryData('select ID from kyc_master where CUSTOMER_ID = ?', data.CUSTOMER_ID, supportKey, (error, getRecords) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get kycMaster information..."
                    });
                }
                else {
                    if (getRecords.length > 0) {
                        res.send({
                            "code": 304,
                            "message": "already kyc details updated"
                        })
                    }
                    else {
                        mm.executeQueryData('INSERT INTO ' + kycMaster + ' SET ?', data, supportKey, (error, results) => {
                            if (error) {
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to save kycMaster information..."
                                });
                            }

                            // --- START: OTP generation + Kyc_Otp insert ---
                            const masterInsertId = results.insertId || null;
                            const customerId = data.CUSTOMER_ID || data.customerId;
                            const aadhaar = data.AADHAR_CARD_NO  || null;

                            if (!aadhaar) {
                                // No Aadhaar provided — return KYC saved only
                                return res.send({
                                    "code": 200,
                                    "message": "kycMaster information saved successfully (no Aadhaar present to generate OTP).",
                                    "ourMasterId": masterInsertId
                                });
                            }

                            const generateUrl = (process.env.GENERATE_OTP_URL || '').replace(/\/$/, '');
                            const apiKey = process.env.OTP_API_KEY;
                            if (!generateUrl || !apiKey) {
                                logger.error(req.url, req.method, "OTP provider not configured", req.baseUrl + req.url);
                                return res.send({
                                    "code": 200,
                                    "message": "kycMaster information saved successfully. OTP not generated (provider not configured).",
                                });
                            }

                            // QuickeKYC Generate OTP payload: { key, id_number }
                            const providerPayload = {
                                key: apiKey,
                                id_number: String(aadhaar)
                            };

                            axios.post(generateUrl, providerPayload, {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: Number(process.env.OTP_REQUEST_TIMEOUT_MS || 10000)
                            }).then(providerResp => {
                                const resp = providerResp.data || {};

                                // QuickeKYC returns 'request_id' (map that to TransactionId)
                                const txnId = resp.request_id || (resp.data && resp.data.request_id) || resp.txnId || resp.transactionId || null;

                                if (!txnId) {
                                    logger.error(req.url, req.method, "Provider response missing request_id", req.baseUrl + req.url, resp);
                                    return res.send({
                                        "code": 200,
                                        "message": "kycMaster saved but OTP provider did not return request id.",
                                        //"provider": resp
                                    });
                                }

                                // Insert session into Kyc_Otp table
                                const insertQuery = 'INSERT INTO Kyc_Otp (CustomerId, TransactionId, Aadhaar) VALUES (?, ?, ?)';
                                const insertParams = [ customerId, String(txnId), String(aadhaar) ];

                                mm.executeQueryData(insertQuery, insertParams, supportKey, (dbErr, dbResults) => {
                                    if (dbErr) {
                                        logger.error(req.url, req.method, "Failed to insert Kyc_Otp", JSON.stringify(dbErr), req.baseUrl + req.url);
                                        return res.send({
                                            "code": 200,
                                            "message": "kycMaster saved and OTP sent, but failed to record OTP session on server.",
                                            //"provider": resp,
                                            "dbError": dbErr
                                        });
                                    }

                                    // Success: master saved, OTP generated by provider, session recorded
                                    return res.send({
                                        "code": 200,
                                        "message": "kycMaster information saved and OTP generated/sent to Aadhaar-linked mobile.",
                                        "data": {
                                            transactionId: String(txnId),
                                            provider: resp,
                                            ourRecordId: dbResults.insertId || null
                                        }
                                    });
                                });

                            }).catch(err => {
                                logger.error(req.url, req.method, JSON.stringify(err.response?.data || err.message), req.baseUrl + req.url);
                                return res.send({
                                    "code": 200,
                                    "message": "kycMaster information saved successfully, but failed to generate OTP.",
                                    "providerError": err.response?.data || err.message,
                                    "ourMasterId": masterInsertId
                                });
                            });

                        });
                    }
                }
            })

        } catch (error) {
            console.log(error);

            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}

exports.update = async(req, res) => {
    const errors = validationResult(req);
    var data = await reqData(req, "update");
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
            mm.executeQueryData(`UPDATE ` + kycMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where CUSTOMER_ID = ${req.body.CUSTOMER_ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to update kycMaster information."
                    });

                }
                else {
                    if (isAadharChanged || data.IS_COMPLETED_KYC === 0) {
                        // fetch the fresh row to get CUSTOMER_ID and Aadhaar
                        mm.executeQueryData(`SELECT ID,CUSTOMER_ID, AADHAR_CARD_NO FROM ${kycMaster} WHERE CUSTOMER_ID = ? LIMIT 1`, [req.body.CUSTOMER_ID], supportKey, (fetchErr, rows) => {
                            if (fetchErr) {
                                logger.error(req.url, req.method, "Failed to fetch updated kyc_master row for OTP generation", JSON.stringify(fetchErr), req.baseUrl + req.url);
                                return; // best-effort only
                            }
                            if (!rows || rows.length === 0) {
                                console.warn(req.url, req.method, "No kyc_master row found after update for OTP generation", req.baseUrl + req.url, { id: criteria.ID });
                                return;
                            }

                            const row = rows[0];
                            const customerId = row.CUSTOMER_ID;
                            const aadhaar = row.AADHAR_CARD_NO  || null;

                            if (!customerId || !aadhaar) {
                                logger.warn(req.url, req.method, "Missing CUSTOMER_ID or AADHAR_CARD_NO; skipping OTP generation", req.baseUrl + req.url, { id: criteria.ID });
                                return;
                            }

                            const generateUrl = (process.env.GENERATE_OTP_URL || '').replace(/\/$/, '');
                            const apiKey = process.env.OTP_API_KEY;
                            if (!generateUrl || !apiKey) {
                                logger.error(req.url, req.method, "OTP provider not configured; cannot generate OTP", req.baseUrl + req.url);
                                return;
                            }

                            const providerPayload = {
                                key: apiKey,
                                id_number: String(aadhaar)
                            };

                            axios.post(generateUrl, providerPayload, {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: Number(process.env.OTP_REQUEST_TIMEOUT_MS || 10000)
                            }).then(providerResp => {
                                const resp = providerResp.data || {};
                                const txnId = resp.request_id || (resp.data && resp.data.request_id) || resp.txnId || resp.transactionId || null;

                                if (!txnId) {
                                    logger.error(req.url, req.method, "OTP provider returned no request_id", req.baseUrl + req.url, resp);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to generate OTP.",
                                        "data": {
                                            transactionId: String(txnId),
                                            provider: resp,
                                        }
                                    });
                                    return;
                                }

                                if(resp?.status === 'error' || resp?.status_code === 500){
                                logger.error(req.url, req.method, resp?.message , req.baseUrl + req.url, resp);
                                    res.send({
                                        "code": 400,
                                        "message": resp?.message || "Failed to generate OTP.",
                                        "data": {
                                            transactionId: String(txnId),
                                            provider: resp,
                                        }
                                    });
                                    return;
                                }

                                const insertQuery = 'INSERT INTO Kyc_Otp (CustomerId, TransactionId, Aadhaar) VALUES (?, ?, ?)';
                                const insertParams = [ customerId, String(txnId), String(aadhaar) ];

                                mm.executeQueryData(insertQuery, insertParams, supportKey, (dbErr, dbResults) => {
                                    if (dbErr) {
                                        logger.error(req.url, req.method, "Failed to insert Kyc_Otp after Aadhaar change", JSON.stringify(dbErr), req.baseUrl + req.url, { customerId, txnId });
                                        return;
                                    }
                                    
                                    res.send({
                                        "code": 200,
                                        "message": "kycMaster information updated successfully and OTP generated/sent to Aadhaar-linked mobile.",
                                        "data": {
                                            transactionId: String(txnId),
                                            provider: resp,
                                            ourRecordId: dbResults.insertId || null
                                        }
                                    });

                                });
                            }).catch(err => {
                                logger.error(req.url, req.method, "Failed to call OTP provider after Aadhaar change", JSON.stringify(err.response?.data || err.message), req.baseUrl + req.url);
                                return;
                            });
                        });

  
                    }else{
                    res.send({
                        "code": 200,
                        "message": "kycMaster information updated successfully..."
                    });
                    }
                    isAadharChanged = false; 
                }
            });
        } catch (error) {
            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
        }
    }
}


/**
 * POST /kyc/generate
 * Expects: { customerId, aadhaar }
 * Dummy Payload
 * {
    "customerId":"1",
    "aadhaar":"410256060227"
    }
 * Stores provider transaction ID into Kyc_Otp.TransactionId
 */
exports.generate = (req, res) => {
    const errors = validationResult(req);
    var data = req.body;
    var supportKey = req.headers["supportKey"];

    if (!errors.isEmpty()) {
        logger.warn(req.url, req.method, "validation failed", req.baseUrl + req.url);
        return res.send({ code: 422, message: errors.errors });
    }

    if (!data.aadhaar) return res.send({ code: 422, message: "aadhaar is required" });

    try {
        const url = process.env.GENERATE_OTP_URL;
        const key = process.env.OTP_API_KEY;
        // QuickeKYC expects 'key' and 'id_number' in the JSON body (doc-accurate)
        const providerPayload = {
            key: key,
            id_number: data.aadhaar
        };

        axios.post(url, providerPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: Number(process.env.OTP_REQUEST_TIMEOUT_MS || 10000)
        }).then(providerResponse => {
            const resp = providerResponse.data || {};

            // QuickeKYC returns request_id (name in docs). Map it to TransactionId column.
            const txnId = resp.request_id || (resp.data && resp.data.request_id) || null;

            if (!txnId) {
                logger.error(req.url, req.method, "Provider response missing request_id", req.baseUrl + req.url, resp);
                return res.send({
                    code: 502,
                    message: resp.message || 'OTP provider did not return request_id',
                    //data: resp
                });
            }

            // Insert into Kyc_Otp (CustomerId, TransactionId, Aadhaar); CreatedAt/UpdatedAt auto
            const insertQuery = 'INSERT INTO Kyc_Otp (CustomerId, TransactionId, Aadhaar) VALUES (?, ?, ?)';
            const insertParams = [ data.customerId, String(txnId), data.aadhaar ];

            mm.executeQueryData(insertQuery, insertParams, supportKey, (dbErr, dbResults) => {
                if (dbErr) {
                    logger.error(req.url, req.method, "DB insert failed", JSON.stringify(dbErr), req.baseUrl + req.url);
                    // Provider succeeded, DB failed — return a descriptive message (you may choose retry logic)
                    return res.send({
                        code: 500,
                        message: "OTP generated but failed to record session on server",
                        //provider: resp,
                        dbError: dbErr
                    });
                }
                  
                // Success: return provider response with our record id and txnId
                return res.send({
                    code: 200,
                    message: resp.message || 'OTP sent',
                    data: {
                        provider: resp,
                        ourRecordId: dbResults.insertId || null
                    }
                });
            });

        }).catch(error => {
            logger.error(req.url, req.method, JSON.stringify(error.response?.data || error.message), req.baseUrl + req.url);
            return res.send({
                code: error.response?.status || 400,
                message: error.response?.data?.message || 'Failed to generate OTP',
                providerError: error.response?.data || undefined
            });
        });

    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        return res.send({ code: 500, message: "Internal error while generating OTP" });
    }
};


/**
 * POST /kyc/submit
 * Expects: { otp , customerId? }
 * Behavior:
 *  - Find session (prefer transactionId; else latest by customerId)
 *  - Send { key, request_id, otp } to QuickeKYC SUBMIT_OTP_URL (doc-accurate)
 *  - Update Kyc_Otp.UpdatedAt (audit) and return provider response
 */
exports.submit = (req, res) => {
    const errors = validationResult(req);
    var data = req.body;                        
    var supportKey = req.headers["supportKey"];

    if (!errors.isEmpty()) {
        logger.warn(req.url, req.method, "validation failed", req.baseUrl + req.url);
        return res.send({ code: 422, message: errors.errors });
    }

    // require customerId and otp
    if (!data.customerId) return res.send({ code: 422, message: "customerId is required" });
    if (!data.otp) return res.send({ code: 422, message: "otp is required" });

    try {
        // find latest transaction ID for this customerId
        const q = 'SELECT * FROM Kyc_Otp WHERE CustomerId = ? ORDER BY CreatedAt DESC LIMIT 1';
        mm.executeQueryData(q, [data.customerId], supportKey, (findErr, rows) => {
            if (findErr) {
                logger.error(req.url, req.method, "DB lookup failed", JSON.stringify(findErr), req.baseUrl + req.url);
                return res.send({ code: 500, message: "Failed to lookup OTP session" });
            }

            if (!rows || rows.length === 0) {
                return res.send({ code: 404, message: "OTP session not found for this customerId" });
            }

            const session = rows[0];
            const txnId = session.TransactionId;

            if (!txnId) {
                logger.error(req.url, req.method, "Stored session missing TransactionId", req.baseUrl + req.url, { customerId: data.customerId });
                return res.send({ code: 502, message: "Stored OTP session missing transaction id" });
            }

            // Build provider payload (QuickeKYC doc-accurate): { key, request_id, otp }
            const providerPayload = {
                key: process.env.OTP_API_KEY,
                request_id: String(txnId),
                otp: data.otp
            };

            const url = (process.env.SUBMIT_OTP_URL || '').replace(/\/$/, '');
            const key = process.env.OTP_API_KEY;
            if (!url || !key) {
                logger.error(req.url, req.method, "OTP provider not configured", req.baseUrl + req.url);
                return res.send({ code: 500, message: "OTP service not configured" });
            }

            axios.post(url, providerPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: Number(process.env.OTP_REQUEST_TIMEOUT_MS || 10000)
            }).then(providerResp => {
                const resp = providerResp.data || {};

                    // Determine whether provider reports verification success
                    const verified = resp.status === 'success'

                    if (!verified) {
                        // Not verified: just return provider response (no change to kyc_master)
                        return res.send({
                            code: providerResp.status || 400,
                            message: resp.message || 'OTP verification failed',
                            // data: resp
                        });
                    }

                    // VERIFIED === true --> update kyc_master.IS_COMPLETED_KYC = 1 for this CustomerId
                    const updKycQuery = 'UPDATE kyc_master SET IS_COMPLETED_KYC = 1 WHERE CUSTOMER_ID = ?';
                    mm.executeQueryData(updKycQuery, [session.CustomerId], supportKey, (updKycErr, updKycRes) => {
                        if (updKycErr) {
                            // Log error but still return verification success to client
                            logger.error(req.url, req.method, "Failed to update kyc_master IS_COMPLETED_KYC", JSON.stringify(updKycErr), req.baseUrl + req.url);
                            return res.send({
                                code: 200,
                                message: resp.message || 'OTP verified',
                                data: {
                                    // provider: resp,
                                    kycUpdated: false,
                                    kycUpdateError: String(updKycErr)
                                }
                            });
                        }

                        // Success updating kyc_master
                        return res.send({
                            code: 200,
                            message: resp.message || 'OTP verified and KYC marked complete',
                            data: {
                                // provider: resp,
                                kycUpdated: true,
                                kycAffectedRows: updKycRes && updKycRes.affectedRows !== undefined ? updKycRes.affectedRows : null
                            }
                        });
                    }); 

            }).catch(error => {
                logger.error(req.url, req.method, JSON.stringify(error.response?.data || error.message), req.baseUrl + req.url);
                // try to update UpdatedAt (best-effort) to mark attempt, then return error
                const updAttemptQuery = 'UPDATE Kyc_Otp SET UpdatedAt = NOW() WHERE Id = ?';
                mm.executeQueryData(updAttemptQuery, [session.Id], supportKey, () => {
                    return res.send({
                        code: error.response?.status || 400,
                        message: error.response?.data?.message || 'Failed to verify OTP',
                        providerError: error.response?.data || undefined
                    });
                });
            });
        }); // end executeQueryData select
    } catch (error) {
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        return res.send({ code: 500, message: "Internal error while verifying OTP" });
    }
};


const es = (v) =>
  v === undefined || v === null || v === ' ' ? '' : v;
