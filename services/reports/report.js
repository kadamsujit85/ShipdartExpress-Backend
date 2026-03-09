const mm = require('../../utilities/globalModule');
const logger = require('../../utilities/logger')
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xlsx = require('xlsx');

exports.getCustomerShipmentSummary = (req, res) => {

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

    (req.body.CUSTOMER_ID && (req.body.CUSTOMER_ID).length > 0 ? filter += ` AND ID IN(${req.body.CUSTOMER_ID})` : '');
    let filter2 = (req.body.FROM_DATE && req.body.FROM_DATE != ' ' && req.body.TO_DATE && req.body.TO_DATE != ' ' ? ` and date(SHIPPING_DATETIME) between '${req.body.FROM_DATE}' AND '${req.body.TO_DATE}'` : '')

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from customer_master where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "Failed to get customer count.",
                });
            }
            else {
                mm.executeQuery(`SELECT ID, NAME as CUSTOMER_NAME, FIRM_NAME, (select count(ID) from order_master where CUSTOMER_ID =  customer_master.ID AND IS_SHIPPED = 1 AND ORDER_STATUS <> 'C' ` + filter2 + `) as TOTAL_ORDERS, ifnull((select sum(ORDER_AMOUNT) from order_master where CUSTOMER_ID =  customer_master.ID AND IS_SHIPPED = 1 AND ORDER_STATUS <> 'C' ` + filter2 + `),0) as TOTAL_AMOUNT from customer_master where 1 ` + criteria, supportKey, (error, results) => {
                    if (error) {
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "Failed to get orderSummary information."
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

exports.getCustomerInvoiceReport = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const MONTH = req.body.MONTH;
    const YEAR = req.body.YEAR;
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ' && MONTH && MONTH != ' ' && YEAR && YEAR != ' ') {
            mm.executeQueryData(`select GST_NO from kyc_master where CUSTOMER_ID = ?`, [CUSTOMER_ID], supportKey, (error, gstNo) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order amount.",
                    });
                }
                else {
                    if (gstNo.length > 0) {
                        mm.executeQueryData(`select FIRM_NAME, NAME from customer_master where ID = ? `, CUSTOMER_ID, supportKey, (error, getCustomerInfo) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get order amount.",
                                });
                            }
                            else {
                                if (getCustomerInfo.length > 0) {
                                    mm.executeQueryData(`select GROUP_CONCAT(ID) as ID, ifnull(sum(ORDER_AMOUNT),0) as ORDER_AMOUNT from order_master where CUSTOMER_ID = ? AND month(SHIPPING_DATETIME) = ? AND year(SHIPPING_DATETIME) = ? AND ORDER_STATUS IN('PU', 'SVD', 'RD', 'OD', 'D')`, [CUSTOMER_ID, MONTH, YEAR], supportKey, (error, getOrderDetails) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get order amount.",
                                            });
                                        }
                                        else {
                                            if (getOrderDetails.length > 0) {

                                                let orderIds = getOrderDetails[0].ID;
                                                let orderAmount = getOrderDetails[0].ORDER_AMOUNT;
                                                let query = `select IFNULL(sum(AMOUNT),0) as AMOUNT from transaction_master where ORDER_ID IN(${orderIds}) AND CUSTOMER_ID = ? AND TRASACTION_TYPE IN('WD') AND EFFECT = 'D' `

                                                mm.executeQueryData(query, CUSTOMER_ID, supportKey, (error, getWeightDescripancyAmount) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to get order amount.",
                                                        });
                                                    }
                                                    else {
                                                        if (getWeightDescripancyAmount.length > 0) {
                                                            orderAmount = orderAmount + getWeightDescripancyAmount[0].AMOUNT;
                                                        }
                                                        else {
                                                            orderAmount = orderAmount;
                                                        }
                                                        let gstAmount = (orderAmount / 118) * 18;
                                                        let withoutGstAmount = orderAmount - gstAmount;
                                                        const data = {
                                                            "gstAmount": gstAmount,
                                                            "withoutGstAmount": withoutGstAmount,
                                                            "totalAmount": orderAmount,
                                                            "gstNumber": gstNo[0].GST_NO,
                                                            "FIRM_NAME": getCustomerInfo[0].FIRM_NAME,
                                                            "CUSTOMER_NAME": getCustomerInfo[0].NAME,
                                                            "month": MONTH,
                                                            "year": YEAR,
                                                            "invoiceNo": "INV" + YEAR + MONTH + CUSTOMER_ID
                                                        }
                                                        res.send({
                                                            "code": 200,
                                                            "message": "success",
                                                            "data": data
                                                        })

                                                    }
                                                })
                                            }
                                            else {
                                                res.send({
                                                    "code": 304,
                                                    "message": "order not found."
                                                })
                                            }
                                        }
                                    })
                                }
                                else {
                                    res.send({
                                        "code": 304,
                                        "message": "Customer Details not found"
                                    })
                                }
                            }
                        })

                    }
                    else {
                        res.send({
                            "code": 304,
                            "message": "Gst Details not found."
                        })
                    }
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.dashboardReport = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const MONTH = req.body.MONTH ? req.body.MONTH : (systemDate.split(' ')[0]).split('-')[1];
    const YEAR = req.body.YEAR ? req.body.YEAR : (systemDate.split(' ')[0]).split('-')[0];
    try {
        let filter = (CUSTOMER_ID && CUSTOMER_ID != ' ' ? `  AND CUSTOMER_ID = ${CUSTOMER_ID}` : ``);
        if (MONTH && MONTH != ' ' && YEAR && YEAR != ' ') {
            mm.executeQueryData(`select count(if(date(ORDER_DATETIME) = CURRENT_DATE AND IS_SHIPPED = 0, 1, null )) as TOTAL_ORDERS, count(if(date(SHIPPING_DATETIME) = CURRENT_DATE AND ORDER_STATUS <> 'C' AND IS_SHIPPED = 1, 1, null)) as TOTAL_SHIPPED, IFNULL(sum(if(date(SHIPPING_DATETIME) = CURRENT_DATE AND ORDER_STATUS <> 'C', ORDER_AMOUNT, null)),0) as TODAYS_SPENT from order_master where ( date(ORDER_DATETIME) = CURRENT_DATE OR date(SHIPPING_DATETIME) = CURRENT_DATE) ` + filter + `; select IFNULL(sum(ORDER_AMOUNT),0) as ORDER_AMOUNT from order_master where (date(SHIPPING_DATETIME) = CURRENT_DATE) AND ORDER_STATUS <> 'C'` + filter, [], supportKey, (error, getTodaysCount) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "Failed to get order summary data.",
                    });
                }
                else {
                    let summaryData = getTodaysCount[0];
                    let amountData = getTodaysCount[1];
                    let avgAmount = (amountData[0].ORDER_AMOUNT == 0 || summaryData[0].TOTAL_SHIPPED == 0 ? 0 : amountData[0].ORDER_AMOUNT / summaryData[0].TOTAL_SHIPPED);

                    mm.executeQueryData(`select count(if(IS_SHIPPED = 1 , 1, null)) as TOTAL_SHIPMENT,
                         count(if(ORDER_STATUS IN('S','PS','PA','PR','NP'), 1, NULL)) as PENDING_PICKUP, 
                         count(if(ORDER_STATUS = 'I' AND month(ORDER_STATUS_UPDATED_DATETIME) = ? AND year(ORDER_STATUS_UPDATED_DATETIME) = ?, 1, null)) as IN_TRANSIT_SHIPMENT, 
                         count(if(ORDER_STATUS = 'OD'  AND month(ORDER_STATUS_UPDATED_DATETIME) = ? AND year(ORDER_STATUS_UPDATED_DATETIME) = ?, 1, null)) as OUT_FOR_DELIVERY, 
                         count(if(ORDER_STATUS = 'D' AND month(ORDER_STATUS_UPDATED_DATETIME) = ? AND year(ORDER_STATUS_UPDATED_DATETIME) = ?, 1, null)) as DELIVERED_ORDER from order_master where month(SHIPPING_DATETIME) = ? AND year(SHIPPING_DATETIME) = ?`+ filter, [MONTH, YEAR, MONTH, YEAR, MONTH, YEAR, MONTH, YEAR], supportKey, (error, getShipmentDetails) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "Failed to get shipment summary data.",
                            });
                        }
                        else {
                            mm.executeQueryData(`select count(IF(STATUS = 1, 1, null)) as total_send, count(if(STATUS = 0, 1, null)) as total_fail, count(IF(STATUS = 1 AND month(CREATED_MODIFIED_DATE) = MONTH(CURRENT_DATE), 1, null)) as this_month from whatsapp_messages_history where 1  ` + filter, CUSTOMER_ID, supportKey, (error, getWhatsappSummaryInformation) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get whatsapp summary data.",
                                    });
                                }
                                else {
                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "orderDetails": {
                                            "avgAmount": avgAmount,
                                            "totalOrders": summaryData[0].TOTAL_ORDERS,
                                            "totalShipped": summaryData[0].TOTAL_SHIPPED,
                                            "totalSpent": summaryData[0].TODAYS_SPENT,
                                        },
                                        "shipmentDetails": getShipmentDetails,
                                        "whatsappDetails": getWhatsappSummaryInformation
                                    })
                                }
                            })

                        }
                    })
                }
            })
        }
        else {
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.codSummaryReport = (req, res) => {
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        supportKey = req.headers['supportKey'];
    const MONTH = req.body.MONTH,
        YEAR = req.body.YEAR;
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ') {
            let filter1 = ''
            let filter2 = ''
            if (YEAR && YEAR != ' ' && MONTH && MONTH != ' ') {
                filter1 = ` AND month(ORDER_STATUS_UPDATED_DATETIME) = '${MONTH}' AND year(ORDER_STATUS_UPDATED_DATETIME) =  '${YEAR}' `;
                filter2 = ` AND month(PAYOUT_DATETIME) = '${MONTH}' AND  year(PAYOUT_DATETIME) = '${YEAR}' `;
            }
            mm.executeQueryData(`select IFNULL(sum(COD_AMOUNT), 0) as COD_AMOUNT_TO_BE_REMITTED from order_master where ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND COD_PAID_AMOUNT = 0 AND CUSTOMER_ID = ?  `, [CUSTOMER_ID], supportKey, (error, getPendingCodAmount) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order information."
                    })
                }
                else {
                    mm.executeQueryData(`SELECT ifnull(ACTUAL_PAYOUT_PAID_AMOUNT, 0) as LAST_COD_REMITTED from payout_master where CUSTOMER_ID = ? ORDER BY PAYOUT_DATETIME DESC LIMIT 1; `, CUSTOMER_ID, supportKey, (error, getLastCodRemitted) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "fail to get last cod remitted information."
                            })
                        }
                        else {
                            mm.executeQueryData(`SELECT ifnull(sum(ACTUAL_PAYOUT_PAID_AMOUNT), 0) as TOTAL_COD_REMITTED from payout_master where CUSTOMER_ID = ? ` + filter2, CUSTOMER_ID, supportKey, (error, getTotalCodRemitted) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to get total cod remitted information."
                                    })
                                }
                                else {
                                    mm.executeQueryData(`SELECT ifnull((sum(TOTAL_AMOUNT) * 0.02), 0) as TOTAL_DEDUCTION_AMOUNT from payout_master where CUSTOMER_ID = ? ` + filter2, CUSTOMER_ID, supportKey, (error, totalDeduction) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "fail to get total deducted information."
                                            })
                                        }
                                        else {
                                            mm.executeQueryData(`SELECT ifnull(sum(ACTUAL_PAYOUT_PAID_AMOUNT),0) as TOTAL from payout_master where date(PAYOUT_DATETIME) >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND CUSTOMER_ID = ?`, [CUSTOMER_ID], supportKey, (error, getLastSixMonthData) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                                    res.send({
                                                        "code": 400,
                                                        "message": "fail to get 6 month information."
                                                    })
                                                }
                                                else {
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success",
                                                        "data": {
                                                            "pendingCodAmount": getPendingCodAmount[0].COD_AMOUNT_TO_BE_REMITTED,
                                                            "lastCodRemitted": getLastCodRemitted.length > 0 && getLastCodRemitted[0].LAST_COD_REMITTED ? getLastCodRemitted[0].LAST_COD_REMITTED : 0,
                                                            "totalCodRemitted": getTotalCodRemitted[0].TOTAL_COD_REMITTED,
                                                            "totalDeduction": totalDeduction[0].TOTAL_DEDUCTION_AMOUNT,
                                                            "backSixMonthTotal": getLastSixMonthData[0].TOTAL
                                                        }
                                                    })
                                                }
                                            })
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
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.whatsappSummaryReport = (req, res) => {
    const CUSTOMER_ID = req.body.CUSTOMER_ID,
        supportKey = req.headers['supportKey'];
    try {
        if (CUSTOMER_ID && CUSTOMER_ID != ' ') {
            mm.executeQueryData(`select count(IF(STATUS = 1), 1, null) as total_send, count(if (STATUS = 0), 1, null) as total_fail from whatsapp_messages_history where 1 AND CUSTOMER_ID = ?; `, [CUSTOMER_ID], supportKey, (error, getPendingCodAmount) => {
                if (error) {
                    console.log(error);
                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                    res.send({
                        "code": 400,
                        "message": "fail to get order information."
                    })
                }
                else {
                    mm.executeQueryData(`SELECT ifnull(ACTUAL_PAYOUT_PAID_AMOUNT, 0) as LAST_COD_REMITTED from payout_master where CUSTOMER_ID = ? ORDER BY PAYOUT_DATETIME DESC LIMIT 1; `, CUSTOMER_ID, supportKey, (error, getLastCodRemitted) => {
                        if (error) {
                            console.log(error);
                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                            res.send({
                                "code": 400,
                                "message": "fail to get last cod remitted information."
                            })
                        }
                        else {
                            mm.executeQueryData(`SELECT ifnull(sum(ACTUAL_PAYOUT_PAID_AMOUNT), 0) as TOTAL_COD_REMITTED from payout_master where CUSTOMER_ID = ?; `, CUSTOMER_ID, supportKey, (error, getTotalCodRemitted) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                    res.send({
                                        "code": 400,
                                        "message": "fail to get total cod remitted information."
                                    })
                                }
                                else {
                                    mm.executeQueryData(`SELECT ifnull((sum(TOTAL_AMOUNT) * 0.02), 0) as TOTAL_DEDUCTION_AMOUNT from payout_master where CUSTOMER_ID = ?; `, CUSTOMER_ID, supportKey, (error, totalDeduction) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                            res.send({
                                                "code": 400,
                                                "message": "fail to get total deducted information."
                                            })
                                        }
                                        else {
                                            res.send({
                                                "code": 200,
                                                "message": "success",
                                                "data": {
                                                    "pendingCodAmount": getPendingCodAmount[0].COD_AMOUNT_TO_BE_REMITTED,
                                                    "lastCodRemitted": getLastCodRemitted[0].LAST_COD_REMITTED,
                                                    "totalCodRemitted": getTotalCodRemitted[0].TOTAL_COD_REMITTED,
                                                    "totalDeduction": totalDeduction[0].TOTAL_DEDUCTION_AMOUNT
                                                }
                                            })
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
            res.send({
                "code": 404,
                "message": "Parameter Missing.."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.adminCodSummaryReport = (req, res) => {
    const supportKey = req.headers['supportKey'];
    const MONTH = req.body.MONTH,
        YEAR = req.body.YEAR;
    try {
        let filter1 = ''
        let filter2 = ''
        if (YEAR && YEAR != ' ' && MONTH && MONTH != ' ') {
            filter1 = ` AND month(ORDER_STATUS_UPDATED_DATETIME) = '${MONTH}' AND year(ORDER_STATUS_UPDATED_DATETIME) =  '${YEAR}' `;
            filter2 = ` AND month(PAYOUT_DATETIME) = '${MONTH}' AND  year(PAYOUT_DATETIME) = '${YEAR}' `;
        }
        mm.executeQueryData(`select IFNULL(sum(COD_AMOUNT), 0) as COD_AMOUNT_TO_BE_REMITTED from order_master where ORDER_STATUS = 'D' AND PAYMENT_MODE = 'COD' AND COD_PAID_AMOUNT = 0  ` + filter1, [], supportKey, (error, getPendingCodAmount) => {
            if (error) {
                console.log(error);
                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                res.send({
                    "code": 400,
                    "message": "fail to get order information."
                })
            }
            else {
                mm.executeQueryData(`SELECT ifnull(ACTUAL_PAYOUT_PAID_AMOUNT, 0) as LAST_COD_REMITTED from payout_master where 1 ORDER BY PAYOUT_DATETIME DESC LIMIT 1; `, [], supportKey, (error, getLastCodRemitted) => {
                    if (error) {
                        console.log(error);
                        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                        res.send({
                            "code": 400,
                            "message": "fail to get last cod remitted information."
                        })
                    }
                    else {
                        mm.executeQueryData(`SELECT ifnull(sum(ACTUAL_PAYOUT_PAID_AMOUNT), 0) as TOTAL_COD_REMITTED from payout_master where 1 ` + filter2, [], supportKey, (error, getTotalCodRemitted) => {
                            if (error) {
                                console.log(error);
                                logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
                                res.send({
                                    "code": 400,
                                    "message": "fail to get total cod remitted information."
                                })
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "success",
                                    "data": {
                                        "pendingCodAmount": getPendingCodAmount[0].COD_AMOUNT_TO_BE_REMITTED,
                                        "lastCodRemitted": getLastCodRemitted[0].LAST_COD_REMITTED,
                                        "totalCodRemitted": getTotalCodRemitted[0].TOTAL_COD_REMITTED,
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
        console.log(error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url)
    }
}

exports.carrierChartData = async (req, res) => {
    try {
        const { FROM_DATE, TO_DATE, CUSTOMER_ID } = req.body;
        console.log("chartsData", req.body);

        let sql = `
            SELECT
                T1.CARRIER_NAME,
                T1.TotalOrders AS CarrierOrders,
                (T1.TotalOrders * 100.0 / T2.GrandTotalOrders) AS MarketSharePercentage
            FROM
                (
                    -- Subquery T1: Calculates Total Orders per Carrier
                    SELECT
                        CARRIER_NAME,
                        COUNT(*) AS TotalOrders
                    FROM
                        view_order_master
                    WHERE
                        CARRIER_NAME IS NOT NULL
        `;

        const params = [];
        const date_filter = ` AND ORDER_DATETIME BETWEEN LEAST(?, ?) AND GREATEST(?, ?)`;
        const customer_filter = ` AND CUSTOMER_ID = ?`;

        if (CUSTOMER_ID && CUSTOMER_ID !== '') {
            sql += customer_filter;
            params.push(CUSTOMER_ID);
        }

        if (FROM_DATE && TO_DATE) {
            sql += date_filter;
            // Pushing the four required parameters for T1 date range
            params.push(FROM_DATE, TO_DATE, FROM_DATE, TO_DATE);
        }

        sql += `
                    GROUP BY
                        CARRIER_NAME
                ) AS T1
            CROSS JOIN
                (
                    -- Subquery T2: Calculates the Grand Total Orders for the entire period/customer
                    SELECT
                        COUNT(*) AS GrandTotalOrders
                    FROM
                        view_order_master
                    WHERE
                        CARRIER_NAME IS NOT NULL
        `;

        if (CUSTOMER_ID && CUSTOMER_ID !== '') {
            sql += customer_filter;
            params.push(CUSTOMER_ID); 
        }

        if (FROM_DATE && TO_DATE) {
            sql += date_filter;
            params.push(FROM_DATE, TO_DATE, FROM_DATE, TO_DATE);
        }

        sql += `
                ) AS T2
            ORDER BY
                MarketSharePercentage DESC;
        `;
        const supportKey = req.headers['supportkey'] || '';

        const dataRow = await mm.executeQueryDataAsync(sql, params, supportKey);

        res.send({
            code: 200,
            success: true,
            results: dataRow,
        });

    } catch (error) {
        console.error("chartsData error:", error);
        res.send({
            code: 422,
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.orderStatusChartData = async (req, res) => {
    try {
        const { FROM_DATE, TO_DATE, CUSTOMER_ID } = req.body;
        console.log("orderStatusShare request body:", req.body);
        let sql = `
            SELECT
                T1.ORDER_STATUS,
                T1.TotalOrders AS StatusOrders,
                (T1.TotalOrders * 100.0 / T2.GrandTotalOrders) AS StatusSharePercentage
            FROM
                (
                    -- Subquery T1: Calculates Total Orders per Status
                    SELECT
                        ORDER_STATUS,
                        COUNT(*) AS TotalOrders
                    FROM
                        view_order_master
                    WHERE
                        ORDER_STATUS IS NOT NULL
        `;


        const params = [];
        const date_filter = ` AND ORDER_DATETIME BETWEEN LEAST(?, ?) AND GREATEST(?, ?)`;
        const customer_filter = ` AND CUSTOMER_ID = ?`;
        if (CUSTOMER_ID && CUSTOMER_ID !== '') {
            sql += customer_filter;
            params.push(CUSTOMER_ID);
        }

        if (FROM_DATE && TO_DATE) {
            sql += date_filter;
            params.push(FROM_DATE, TO_DATE, FROM_DATE, TO_DATE);
        }
        sql += `
                    GROUP BY
                        ORDER_STATUS
                ) AS T1
            CROSS JOIN
                (
                    -- Subquery T2: Calculates the Grand Total Orders for the entire period/customer
                    SELECT
                        COUNT(*) AS GrandTotalOrders
                    FROM
                        view_order_master
                    WHERE
                        ORDER_STATUS IS NOT NULL
        `;
        if (CUSTOMER_ID && CUSTOMER_ID !== '') {
            sql += customer_filter;
            params.push(CUSTOMER_ID);
        }
        if (FROM_DATE && TO_DATE) {
            sql += date_filter;
            params.push(FROM_DATE, TO_DATE, FROM_DATE, TO_DATE);
        }

        // --- Finalize SQL ---
        sql += `
                ) AS T2
            ORDER BY
                StatusSharePercentage DESC;
        `;
        const supportKey = req.headers['supportkey'] || '';
        const dataRow = await mm.executeQueryDataAsync(sql, params, supportKey);
        res.send({
            code: 200,
            success: true,
            results: dataRow,
        });

    } catch (error) {
        console.error("orderStatusShare error:", error);
        res.send({
            code: 422,
            success: false,
            message: "Internal Server Error"
        });
    }
};


const processAllCustomerInvoices = async (MONTH, YEAR, supportKey) => {
    const getRelevantCustomersSql = `
        SELECT DISTINCT
            CUSTOMER_ID
        FROM
            order_master
        WHERE
            MONTH(SHIPPING_DATETIME) = ?
            AND YEAR(SHIPPING_DATETIME) = ?
            AND ORDER_STATUS IN('PU', 'SVD', 'RD', 'OD', 'D')
            AND CUSTOMER_ID IS NOT NULL
    `;
    const customerList = await mm.executeQueryDataAsync(getRelevantCustomersSql, [MONTH, YEAR], supportKey);

    if (!customerList || customerList.length === 0) {
        return [];
    }

    const allInvoices = [];

    for (const customer of customerList) {
        const CUSTOMER_ID = customer.CUSTOMER_ID;
        
        // --- A. Get Customer Info and GST ---
        const [customerInfo, gstNoResult] = await Promise.all([
            mm.executeQueryDataAsync(`SELECT FIRM_NAME, NAME FROM customer_master WHERE ID = ?`, [CUSTOMER_ID], supportKey),
            mm.executeQueryDataAsync(`SELECT GST_NO FROM kyc_master WHERE CUSTOMER_ID = ?`, [CUSTOMER_ID], supportKey)
        ]);
        
        const hasGst = gstNoResult && gstNoResult.length > 0 && gstNoResult[0].GST_NO;
        const customerName = customerInfo[0]?.NAME || 'N/A';
        const firmName = customerInfo[0]?.FIRM_NAME || 'N/A';
        const gstNumber = hasGst ? gstNoResult[0].GST_NO : null;

        if (!customerInfo || customerInfo.length === 0) {
             console.warn(`Customer details not found for ID: ${CUSTOMER_ID}. Skipping.`);
             continue;
        }

        // --- B. Get Total Order Amount and Order IDs ---
        const getOrderDetailsSql = `
            SELECT 
                GROUP_CONCAT(ID) as ID, 
                IFNULL(SUM(ORDER_AMOUNT), 0) as ORDER_AMOUNT 
            FROM 
                order_master 
            WHERE 
                CUSTOMER_ID = ? 
                AND MONTH(SHIPPING_DATETIME) = ? 
                AND YEAR(SHIPPING_DATETIME) = ? 
                AND ORDER_STATUS IN('PU', 'SVD', 'RD', 'OD', 'D')
        `;
        const getOrderDetails = await mm.executeQueryDataAsync(getOrderDetailsSql, [CUSTOMER_ID, MONTH, YEAR], supportKey);

        let orderAmount = getOrderDetails[0]?.ORDER_AMOUNT || 0;
        const orderIds = getOrderDetails[0]?.ID;
        
        if (orderAmount === 0 || !orderIds) {
            continue;
        }

        // --- C. Get Weight Discrepancy Amount ---
        let weightDiscrepancyAmount = 0;
        if (orderIds) {
            const getWeightDescripancySql = `
                SELECT 
                    IFNULL(SUM(AMOUNT), 0) as AMOUNT 
                FROM 
                    transaction_master 
                WHERE 
                    ORDER_ID IN(${orderIds}) 
                    AND CUSTOMER_ID = ? 
                    AND TRASACTION_TYPE IN('WD') 
                    AND EFFECT = 'D'
            `;
            const result = await mm.executeQueryDataAsync(getWeightDescripancySql, [CUSTOMER_ID], supportKey);
            weightDiscrepancyAmount = result[0]?.AMOUNT || 0;
        }

        // --- D. Calculate Final Amounts ---
        let totalAmount = orderAmount + weightDiscrepancyAmount;
        
        if (totalAmount <= 0) {
            continue;
        }

        let gstAmount = 0;
        let withoutGstAmount = totalAmount; 

        if (hasGst) {
            // Assume 18% GST inclusive
            gstAmount = (totalAmount / 118) * 18;
            withoutGstAmount = totalAmount - gstAmount;
        }
        
        // --- E. Build Final Data Object ---
        const finalData = {
            "CUSTOMER_ID": CUSTOMER_ID,
            "hasGst": !!hasGst, // Boolean flag for easy filtering
            "gstAmount": parseFloat(gstAmount).toFixed(2),
            "withoutGstAmount": parseFloat(withoutGstAmount).toFixed(2),
            "totalAmount": parseFloat(totalAmount).toFixed(2),
            "gstNumber": gstNumber,
            "FIRM_NAME": firmName,
            "CUSTOMER_NAME": customerName,
            "month": MONTH,
            "year": YEAR,
            "invoiceNo": "INV" + YEAR + MONTH + CUSTOMER_ID
        };

        allInvoices.push(finalData);
    }
    
    return allInvoices;
};

exports.getAdminInvoiceReportWithGST = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const { MONTH, YEAR } = req.body;
    
    try {
        if (!MONTH || MONTH.trim() === '' || !YEAR || YEAR.trim() === '') {
            return res.send({
                "code": 404,
                "message": "MONTH and YEAR parameters are required."
            });
        }
        
        const allInvoices = await processAllCustomerInvoices(MONTH, YEAR, supportKey);

        const gstCustomers = allInvoices.filter(invoice => invoice.hasGst);

        if (gstCustomers.length === 0) {
            return res.send({
                "code": 304,
                "message": "No customers with GST found with billable orders for the given month/year."
            });
        }

        res.send({
            "code": 200,
            "message": "success",
            "data": gstCustomers
        });

    } catch (error) {
        console.error("getAdminInvoiceReportWithGST error:", error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        res.send({
            "code": 500,
            "message": "Internal Server Error",
            "error": error.message
        });
    }
};

exports.getAdminInvoiceReportWithoutGST = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const { MONTH, YEAR } = req.body;
    
    try {
        if (!MONTH || MONTH.trim() === '' || !YEAR || YEAR.trim() === '') {
            return res.send({
                "code": 422,
                "message": "MONTH and YEAR parameters are required."
            });
        }

        const allInvoices = await processAllCustomerInvoices(MONTH, YEAR, supportKey);
        const nonGstCustomers = allInvoices.filter(invoice => !invoice.hasGst);
        if (nonGstCustomers.length === 0) {
            return res.send({
                "code": 304,
                "message": "No customers without GST found with billable orders for the given month/year."
            });
        }

        // 3. Send segregated response
        res.send({
            "code": 200,
            "message": "success",
            "data": nonGstCustomers
        });

    } catch (error) {
        console.error("getAdminInvoiceReportWithoutGST error:", error);
        logger.error(req.url, req.method, JSON.stringify(error), req.baseUrl + req.url);
        res.send({
            "code": 500,
            "message": "Internal Server Error",
            "error": error.message
        });
    }
};

exports.readChannelOrdersProductsFile = (req, res) => {
    const connection = mm.openConnection();
    const custId = req.body.CUSTOMER_ID
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
      return res.status(422).send({
        code: 422,
        message: "Excel file has headers but no data rows"
      });
    }
  
    
    const requiredColumns = ["Name", "Length", "Width", "Height", "Weight(gms)", "Price"];
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
  
      const processRow = (index) => {
        if (index >= jsonData.length) {
          // Commit transaction when all rows processed
          return connection.commit(err => {
            fs.unlinkSync(filePath);
            connection.end();
            if (err) {
              return res.status(500).send({ code: 500, message: "Commit failed", error: err });
            }
            res.send({ code: 200, message: "Products processed successfully", total: processedCount });
          });
        }
  
        const row = jsonData[index];
        const name = row["Name"].trim();
        const length = parseFloat(row["Length"]) || 0;
        const width = parseFloat(row["Width"]) || 0;
        const height = parseFloat(row["Height"]) || 0;
        const weight = parseFloat(row["Weight(gms)"]) || 0;
        const price = parseFloat(row["Price"]) || 0;
  
        if (!name) {
          processRow(index + 1);
          return;
        }
  
        
        connection.query(
          "SELECT id FROM channel_order_products WHERE NAME = ? AND CUSTOMER_ID = ? LIMIT 1",
          [name, custId],
          (err, results) => {
            if (err) {
              return connection.rollback(() => {
                fs.unlinkSync(filePath);
                connection.end();
                res.status(500).send({ code: 500, message: "DB query error", error: err });
              });
            }
  
            if (results.length > 0) {
              // Update existing product
              connection.query(
                `UPDATE channel_order_products
                 SET LENGTH=?, WIDTH=?, HEIGHT=?, WEIGHT=?, PRICE=?, CREATED_DATE_TIME=NOW()
                 WHERE ID=? AND CUSTOMER_ID = ?`,
                [length, width, height, weight, price, results[0].id, custId],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      fs.unlinkSync(filePath);
                      connection.end();
                      res.send({ code: 500, message: "DB update error", error: err });
                    });
                  }
                  processedCount++;
                  processRow(index + 1);
                }
              );
            } else {
              // Insert new product
              connection.query(
                `INSERT INTO channel_order_products (NAME, LENGTH, WIDTH, HEIGHT, WEIGHT, PRICE, CREATED_DATE_TIME,CUSTOMER_ID)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(),?)`,
                [name, length, width, height, weight, price, custId],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      fs.unlinkSync(filePath);
                      connection.end();
                      res.status(500).send({ code: 500, message: "DB insert error", error: err });
                    });
                  }
                  processedCount++;
                  processRow(index + 1);
                }
              );
            }
          }
        );
      };
  
      // Start processing rows
      processRow(0);
    });
};
  