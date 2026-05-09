import Order from "../Models/OrderMd.js";
import mongoose from "mongoose";
import { catchAsync, HandleERROR } from "vanta-api"; // 👈 HandleERROR اضافه شد

// ------------------------------------------------------------------
// 1. دریافت شاخص‌های کلیدی عملکرد (KPIs)
// ------------------------------------------------------------------
export const getDashboardKPIs = catchAsync(async (req, res, next) => {
    // 👈 جلوگیری از Crash کردن سرور در صورت نبود tenantId
    if (!req.query.tenantId) {
        return next(new HandleERROR("Tenant ID is required for analytics processing.", 400));
    }

    const { start, end } = req.query;
    const tenantId = new mongoose.Types.ObjectId(req.query.tenantId);

    const dateFilter = {
        tenantId,
        createdAt: {
            $gte: start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30)),
            $lte: end ? new Date(end) : new Date()
        }
    };

    const stats = await Order.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalDiscounts: { $sum: "$discountAmount" },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: "$finalAmount" }
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        data: stats[0] || { totalRevenue: 0, totalDiscounts: 0, totalOrders: 0, averageOrderValue: 0 }
    });
});

// ------------------------------------------------------------------
// 2. تحلیل سودآوری گیمیفیکیشن (Campaign ROI)
// ------------------------------------------------------------------
export const getCampaignROI = catchAsync(async (req, res, next) => {
    // 👈 لایه امنیتی
    if (!req.query.tenantId) {
        return next(new HandleERROR("Tenant ID is required for analytics processing.", 400));
    }

    const tenantId = new mongoose.Types.ObjectId(req.query.tenantId);

    const roiStats = await Order.aggregate([
        { $match: { tenantId } },
        {
            $group: {
                _id: { hasVoucher: { $gt: ["$voucherId", null] } },
                count: { $sum: 1 },
                avgSpend: { $avg: "$finalAmount" },
                totalRevenue: { $sum: "$finalAmount" }
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        message: "Gamification vs Standard sales analysis",
        data: roiStats
    });
});

// ------------------------------------------------------------------
// 3. پرفروش‌ترین آیتم‌های منو
// ------------------------------------------------------------------
export const getTopSellingItems = catchAsync(async (req, res, next) => {
    // 👈 لایه امنیتی
    if (!req.query.tenantId) {
        return next(new HandleERROR("Tenant ID is required for analytics processing.", 400));
    }

    const tenantId = new mongoose.Types.ObjectId(req.query.tenantId);

    const topItems = await Order.aggregate([
        { $match: { tenantId } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.menuItemId",
                itemName: { $first: "$items.name" },
                totalQty: { $sum: "$items.quantity" },
                totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }
        },
        { $sort: { totalQty: -1 } },
        { $limit: 10 }
    ]);

    return res.status(200).json({
        success: true,
        data: topItems
    });
});

// ------------------------------------------------------------------
// 4. دیتای نمودار فروش (Daily Sales Chart)
// ------------------------------------------------------------------
export const getSalesChartData = catchAsync(async (req, res, next) => {
    // 👈 لایه امنیتی
    if (!req.query.tenantId) {
        return next(new HandleERROR("Tenant ID is required for analytics processing.", 400));
    }

    const tenantId = new mongoose.Types.ObjectId(req.query.tenantId);

    const chartData = await Order.aggregate([
        { $match: { tenantId } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailyRevenue: { $sum: "$finalAmount" },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } },
        { $limit: 30 }
    ]);

    return res.status(200).json({
        success: true,
        data: chartData
    });
});