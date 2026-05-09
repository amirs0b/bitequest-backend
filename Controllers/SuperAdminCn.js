import Tenant from "../Models/TenantMd.js";
import Transaction from "../Models/TransactionMd.js"; // فرض بر وجود مدل تراکنش برای لاگ‌های مالی
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// ۱. آمار کلان پلتفرم (Platform Overview)
// ------------------------------------------------------------------
export const getPlatformGlobalStats = catchAsync(async (req, res, next) => {
    // محاسبه مجموع درآمدهای حاصل از اشتراک و شارژ کیف پول
    const financialStats = await Tenant.aggregate([
        {
            $group: {
                _id: null,
                totalSmsBalance: { $sum: "$smsWalletBalance" },
                activeTenants: {
                    $sum: { $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0] }
                },
                totalTenants: { $sum: 1 }
            }
        }
    ]);

    // اگر مدلی برای تراکنش‌ها دارید، مجموع درآمدهای واقعی را از آنجا می‌گیریم
    const totalRevenue = await Transaction.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    return res.status(200).json({
        success: true,
        data: {
            overview: financialStats[0] || { totalSmsBalance: 0, activeTenants: 0, totalTenants: 0 },
            totalPlatformRevenue: totalRevenue[0]?.total || 0
        }
    });
});

// ------------------------------------------------------------------
// ۲. رصد رستوران‌های در آستانه انقضا (Retention Monitor)
// ------------------------------------------------------------------
export const getExpiringSubscriptions = catchAsync(async (req, res, next) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // پیدا کردن رستوران‌هایی که کمتر از ۷ روز به پایان اشتراکشان مانده
    const expiringSoon = await Tenant.find({
        "subscription.expiresAt": { $lte: nextWeek, $gte: new Date() },
        isArchived: false
    }).select("name slug subscription smsWalletBalance");

    return res.status(200).json({
        success: true,
        count: expiringSoon.length,
        data: { expiringSoon }
    });
});

// ------------------------------------------------------------------
// ۳. لیست سیاه و تعلیق (Tenant Management)
// ------------------------------------------------------------------
export const toggleTenantStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body; // true یا false

    const tenant = await Tenant.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!tenant) return next(new HandleERROR("Tenant not found", 404));

    return res.status(200).json({
        success: true,
        message: `Tenant has been ${isActive ? 'Activated' : 'Suspended'} successfully.`,
        data: { tenant }
    });
});