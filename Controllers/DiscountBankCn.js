import CustomerVisit from "../Models/CustomerVisitMd.js";
import DiscountPool from "../Models/DiscountPoolMd.js";
import mongoose from "mongoose";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. Get all unused discount vouchers across all restaurants for this customer
// GET /api/v1/discount-bank/my
// ------------------------------------------------------------------
export const getMyDiscountBank = catchAsync(async (req, res, next) => {
    const customerId = req.customer._id;
    const now = new Date();

    const visits = await CustomerVisit.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
        { $unwind: "$discountBank" },
        { $match: { "discountBank.isUsed": false, "discountBank.expiresAt": { $gt: now } } },
        {
            $lookup: {
                from: "branches",
                localField: "branchId",
                foreignField: "_id",
                as: "branch"
            }
        },
        { $unwind: { path: "$branch", preserveNullAndEmpty: true } },
        {
            $project: {
                _id: 0,
                branchId: 1,
                branchName: "$branch.name",
                voucher: "$discountBank"
            }
        },
        { $sort: { "voucher.expiresAt": 1 } }
    ]);

    return res.status(200).json({
        success: true,
        count: visits.length,
        data: { discountBank: visits }
    });
});

// ------------------------------------------------------------------
// 2. Get vouchers for a specific branch (split into unused / used)
// GET /api/v1/discount-bank/branch/:branchId
// ------------------------------------------------------------------
export const getDiscountBankForBranch = catchAsync(async (req, res, next) => {
    const customerId = req.customer._id;
    const { branchId } = req.params;

    const visit = await CustomerVisit.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
        branchId: new mongoose.Types.ObjectId(branchId)
    });

    if (!visit) {
        return res.status(200).json({
            success: true,
            data: { unused: [], used: [] }
        });
    }

    const now = new Date();
    const unused = visit.discountBank.filter(d => !d.isUsed && d.expiresAt > now);
    const used = visit.discountBank.filter(d => d.isUsed);

    return res.status(200).json({
        success: true,
        data: { unused, used }
    });
});

// ------------------------------------------------------------------
// 3. Check if customer has an active urgency bonus (smart return)
// GET /api/v1/discount-bank/urgency/:branchId
// ------------------------------------------------------------------
export const checkUrgencyOffer = catchAsync(async (req, res, next) => {
    const customerId = req.customer._id;
    const { branchId } = req.params;

    const visit = await CustomerVisit.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
        branchId: new mongoose.Types.ObjectId(branchId)
    });

    if (!visit || !visit.lastVisit) {
        return res.status(200).json({
            success: true,
            data: { hasUrgency: false }
        });
    }

    // Find active smartReturn discount pool for this branch
    const pool = await DiscountPool.findOne({
        branchId: new mongoose.Types.ObjectId(branchId),
        type: "smartReturn",
        isActive: true,
        isArchived: false
    });

    if (!pool) {
        return res.status(200).json({
            success: true,
            data: { hasUrgency: false }
        });
    }

    const daysSinceLastVisit = Math.floor((Date.now() - visit.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    const { baseDiscount, urgencyDiscount, urgencyWindowHours, targetDaysSinceLastVisit } = pool.returnConfig;

    // Customer qualifies if they've been away long enough
    if (daysSinceLastVisit < targetDaysSinceLastVisit) {
        return res.status(200).json({
            success: true,
            data: { hasUrgency: false, baseDiscount, daysSinceLastVisit }
        });
    }

    // Check if still within urgency window (counted from when they became a target)
    const hoursIntoUrgency = (daysSinceLastVisit - targetDaysSinceLastVisit) * 24;
    const hasUrgency = hoursIntoUrgency <= urgencyWindowHours;

    return res.status(200).json({
        success: true,
        data: {
            hasUrgency,
            baseDiscount,
            urgencyDiscount: hasUrgency ? urgencyDiscount : null,
            urgencyWindowHours,
            daysSinceLastVisit,
            hoursRemainingInUrgency: hasUrgency ? Math.max(0, urgencyWindowHours - hoursIntoUrgency) : null
        }
    });
});
