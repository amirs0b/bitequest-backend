import Order from "../Models/OrderMd.js";
import Customer from "../Models/CustomerMd.js";
import Branch from "../Models/BranchMd.js";
import Organization from "../Models/OrganizationMd.js";
import CustomerVisit from "../Models/CustomerVisitMd.js";
import mongoose from "mongoose";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. دریافت لیست تمام مشتریان یک رستوران (با RFM و LTV)
// ------------------------------------------------------------------
export const getRestaurantCustomers = catchAsync(async (req, res, next) => {
    const branchId = new mongoose.Types.ObjectId(req.query.branchId || req.user.branchId);
    const now = new Date();

    // Primary source: CustomerVisit (has pre-calculated RFM)
    const visitCustomers = await CustomerVisit.aggregate([
        { $match: { branchId } },
        { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerInfo" } },
        { $unwind: "$customerInfo" },
        {
            $project: {
                _id: "$customerId",
                phone: "$customerInfo.phone",
                firstName: "$customerInfo.firstName",
                lastName: "$customerInfo.lastName",
                totalOrders: "$totalVisits",
                totalSpent: 1,
                averageOrderValue: 1,
                lastVisit: 1,
                firstVisit: 1,
                // RFM: Recency in days
                recency: {
                    $floor: {
                        $divide: [
                            { $subtract: [now, "$lastVisit"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                },
                frequency: "$totalVisits",
                monetary: "$totalSpent"
            }
        },
        { $sort: { lastVisit: -1 } }
    ]);

    if (visitCustomers.length > 0) {
        return res.status(200).json({
            success: true,
            count: visitCustomers.length,
            data: { customers: visitCustomers }
        });
    }

    // Fallback: aggregate from Orders if CustomerVisit is empty
    const customers = await Order.aggregate([
        { $match: { branchId } },
        {
            $group: {
                _id: "$customerId",
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: "$finalAmount" },
                totalDiscountsEarned: { $sum: "$discountAmount" },
                lastVisit: { $max: "$createdAt" },
                firstVisit: { $min: "$createdAt" }
            }
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerInfo" } },
        { $unwind: "$customerInfo" },
        {
            $addFields: {
                recency: {
                    $floor: {
                        $divide: [
                            { $subtract: [now, "$lastVisit"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                },
                frequency: "$totalOrders",
                monetary: "$totalSpent"
            }
        },
        {
            $project: {
                _id: 1,
                phone: "$customerInfo.phone",
                totalOrders: 1,
                totalSpent: 1,
                totalDiscountsEarned: 1,
                lastVisit: 1,
                firstVisit: 1,
                recency: 1,
                frequency: 1,
                monetary: 1
            }
        },
        { $sort: { lastVisit: -1 } }
    ]);

    return res.status(200).json({
        success: true,
        count: customers.length,
        data: { customers }
    });
});

// ------------------------------------------------------------------
// 2. دریافت پرونده و تاریخچه یک مشتری خاص
// ------------------------------------------------------------------
export const getCustomerProfile = catchAsync(async (req, res, next) => {
    const { customerId } = req.params;
    const branchId = req.query.branchId || req.user.branchId;

    const customerInfo = await Customer.findById(customerId).select("-otp -otpExpiresAt");
    if (!customerInfo) return next(new HandleERROR("Customer not found", 404));

    // استخراج تاریخچه سفارشات این مشتری در این رستوران خاص
    const orderHistory = await Order.find({ customerId, branchId })
        .populate("voucherId", "code discountPercentage posCode")
        .sort("-createdAt");

    // استخراج غذاهای مورد علاقه (Most Ordered Items)
    const favoriteItems = await Order.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(customerId), branchId: new mongoose.Types.ObjectId(branchId) } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.menuItemId",
                name: { $first: "$items.name" },
                timesOrdered: { $sum: "$items.quantity" }
            }
        },
        { $sort: { timesOrdered: -1 } },
        { $limit: 3 }
    ]);

    return res.status(200).json({
        success: true,
        data: {
            customer: customerInfo,
            stats: {
                totalVisits: orderHistory.length,
                favoriteItems
            },
            orderHistory
        }
    });
});

// ------------------------------------------------------------------
// 3. بخش‌بندی هوشمند مشتریان (Segmentation)
// ------------------------------------------------------------------
export const getCustomerSegments = catchAsync(async (req, res, next) => {
    const branchId = new mongoose.Types.ObjectId(req.query.branchId || req.user.branchId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const segments = await Order.aggregate([
        { $match: { branchId } },
        {
            $group: {
                _id: "$customerId",
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: "$finalAmount" },
                lastVisit: { $max: "$createdAt" }
            }
        },
        {
            $facet: {
                // مشتریان VIP: بیش از ۵ بار مراجعه کرده‌اند
                vipCustomers: [
                    { $match: { totalOrders: { $gte: 5 } } },
                    { $count: "count" }
                ],
                // در معرض ریزش: بیش از ۳۰ روز است که نیامده‌اند
                atRiskCustomers: [
                    { $match: { lastVisit: { $lt: thirtyDaysAgo } } },
                    { $count: "count" }
                ],
                // مشتریان وفادار جدید: اخیراً آمده‌اند و بیش از ۱ بار مراجعه داشته‌اند
                newLoyals: [
                    { $match: { lastVisit: { $gte: thirtyDaysAgo }, totalOrders: { $gt: 1, $lt: 5 } } },
                    { $count: "count" }
                ]
            }
        }
    ]);

    // فرمت کردن خروجی برای فرانت‌اند
    const formatCount = (arr) => arr.length > 0 ? arr[0].count : 0;

    return res.status(200).json({
        success: true,
        data: {
            vipCount: formatCount(segments[0].vipCustomers),
            atRiskCount: formatCount(segments[0].atRiskCustomers),
            newLoyalCount: formatCount(segments[0].newLoyals)
        }
    });
});

export const sendBulkSms = catchAsync(async (req, res, next) => {
    const { targetCustomerIds, message } = req.body;

    if (!targetCustomerIds || !Array.isArray(targetCustomerIds) || targetCustomerIds.length === 0) {
        return next(new HandleERROR("Please provide a list of customers to message.", 400));
    }

    if (!message) {
        return next(new HandleERROR("Message content cannot be empty.", 400));
    }

    // SMS wallet lives at organization level
    const branch = await Branch.findById(req.user.branchId);
    if (!branch) return next(new HandleERROR("Branch not found", 404));

    const org = await Organization.findById(branch.organizationId);
    if (!org) return next(new HandleERROR("Organization not found", 404));

    if (org.smsWalletBalance < targetCustomerIds.length) {
        return next(new HandleERROR(`Insufficient SMS wallet balance. You need ${targetCustomerIds.length} SMS charges, but have only ${org.smsWalletBalance}.`, 403));
    }

    const customers = await Customer.find({ _id: { $in: targetCustomerIds } });

    const sendSmsProvider = async (phone, msg) => {
        console.log(`[BULK SMS] -> Sending to ${phone}: ${msg}`);
        return true;
    };

    let successCount = 0;
    for (const customer of customers) {
        if (customer.phone) {
            await sendSmsProvider(customer.phone, message);
            successCount++;
        }
    }

    org.smsWalletBalance -= successCount;
    await org.save();

    return res.status(200).json({
        success: true,
        message: `Successfully sent SMS to ${successCount} customers.`,
        data: {
            remainingSmsBalance: org.smsWalletBalance
        }
    });
});

// ------------------------------------------------------------------
// 5. Customers who haven't visited in X days (at-risk / churn)
// GET /api/v1/crm/at-risk?daysSinceLastVisit=30
// ------------------------------------------------------------------
export const getAtRiskCustomers = catchAsync(async (req, res, next) => {
    const branchId = new mongoose.Types.ObjectId(req.query.branchId || req.user.branchId);
    const days = parseInt(req.query.daysSinceLastVisit) || 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const now = new Date();

    const atRisk = await CustomerVisit.aggregate([
        { $match: { branchId, lastVisit: { $lt: cutoff } } },
        { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerInfo" } },
        { $unwind: "$customerInfo" },
        {
            $project: {
                _id: "$customerId",
                phone: "$customerInfo.phone",
                firstName: "$customerInfo.firstName",
                lastName: "$customerInfo.lastName",
                isSubscribedToSMS: 1,
                lastVisit: 1,
                totalVisits: 1,
                totalSpent: 1,
                recency: {
                    $floor: {
                        $divide: [
                            { $subtract: [now, "$lastVisit"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        },
        { $sort: { lastVisit: 1 } }
    ]);

    return res.status(200).json({
        success: true,
        count: atRisk.length,
        data: { customers: atRisk, daysSinceLastVisit: days }
    });
});

// ------------------------------------------------------------------
// 6. Top customers by spending or frequency
// GET /api/v1/crm/top-customers?sortBy=spending&limit=10
// ------------------------------------------------------------------
export const getTopCustomers = catchAsync(async (req, res, next) => {
    const branchId = new mongoose.Types.ObjectId(req.query.branchId || req.user.branchId);
    const sortBy = req.query.sortBy === "frequency" ? "totalVisits" : "totalSpent";
    const limit = parseInt(req.query.limit) || 10;

    const top = await CustomerVisit.aggregate([
        { $match: { branchId } },
        { $sort: { [sortBy]: -1 } },
        { $limit: limit },
        { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerInfo" } },
        { $unwind: "$customerInfo" },
        {
            $project: {
                _id: "$customerId",
                phone: "$customerInfo.phone",
                firstName: "$customerInfo.firstName",
                lastName: "$customerInfo.lastName",
                totalVisits: 1,
                totalSpent: 1,
                averageOrderValue: 1,
                lastVisit: 1,
                firstVisit: 1
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        count: top.length,
        data: { customers: top, sortedBy: sortBy }
    });
});