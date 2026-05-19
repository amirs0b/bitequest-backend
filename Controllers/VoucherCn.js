import Voucher from "../Models/VoucherMd.js";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. Get customer's vouchers for a branch (used + unused)
// ------------------------------------------------------------------
export const getMyVouchers = catchAsync(async (req, res, next) => {
    const customerId = req.customer._id;
    const { branchId } = req.query;

    if (!branchId) {
        return next(new HandleERROR("Branch ID (branchId) is required", 400));
    }

    const vouchers = await Voucher.find({
        customerId,
        branchId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: "Vouchers retrieved successfully",
        count: vouchers.length,
        data: {
            vouchers
        }
    });
});

// ------------------------------------------------------------------
// 2. Redeem a voucher (mark as used)
// ------------------------------------------------------------------
export const redeemVoucher = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const voucher = await Voucher.findById(id);

    if (!voucher) {
        return next(new HandleERROR("Voucher not found", 404));
    }

    // Validation: belongs to requesting customer
    if (voucher.customerId.toString() !== req.customer._id.toString()) {
        return next(new HandleERROR("This voucher does not belong to you", 403));
    }

    // Validation: not already used
    if (voucher.isUsed) {
        return next(new HandleERROR("This voucher has already been used", 400));
    }

    // Validation: not expired
    if (voucher.expiresAt < new Date()) {
        return next(new HandleERROR("This voucher has expired", 400));
    }

    voucher.isUsed = true;
    voucher.usedAt = new Date();
    await voucher.save();

    return res.status(200).json({
        success: true,
        message: "Voucher redeemed successfully",
        data: {
            voucher
        }
    });
});

// ------------------------------------------------------------------
// 3. Get voucher by code (for waiter/cashier verification)
// ------------------------------------------------------------------
export const getVoucherByCode = catchAsync(async (req, res, next) => {
    const { code } = req.params;

    const voucher = await Voucher.findOne({ code })
        .populate("customerId", "phone firstName lastName")
        .populate("campaignId", "title");

    if (!voucher) {
        return next(new HandleERROR("Voucher not found with this code", 404));
    }

    return res.status(200).json({
        success: true,
        data: {
            voucher
        }
    });
});
