import Organization from "../Models/OrganizationMd.js";
import Branch from "../Models/BranchMd.js";
import Transaction from "../Models/TransactionMd.js";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. Platform Global Stats (Overview)
// ------------------------------------------------------------------
export const getPlatformGlobalStats = catchAsync(async (req, res, next) => {
    const orgStats = await Organization.aggregate([
        {
            $group: {
                _id: null,
                totalSmsBalance: { $sum: "$smsWalletBalance" },
                activeOrgs: {
                    $sum: { $cond: [{ $eq: ["$subscription.status", "active"] }, 1, 0] }
                },
                totalOrgs: { $sum: 1 }
            }
        }
    ]);

    const branchCount = await Branch.countDocuments({ isArchived: false });
    const activeBranchCount = await Branch.countDocuments({ isActive: true, isArchived: false });

    const totalRevenue = await Transaction.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    return res.status(200).json({
        success: true,
        data: {
            overview: {
                ...(orgStats[0] || { totalSmsBalance: 0, activeOrgs: 0, totalOrgs: 0 }),
                totalBranches: branchCount,
                activeBranches: activeBranchCount
            },
            totalPlatformRevenue: totalRevenue[0]?.total || 0
        }
    });
});

// ------------------------------------------------------------------
// 2. Expiring Subscriptions Monitor
// ------------------------------------------------------------------
export const getExpiringSubscriptions = catchAsync(async (req, res, next) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringSoon = await Organization.find({
        "subscription.expiresAt": { $lte: nextWeek, $gte: new Date() },
        isArchived: false
    }).select("name slug subscription smsWalletBalance");

    return res.status(200).json({
        success: true,
        count: expiringSoon.length,
        data: { expiringSoon }
    });
});