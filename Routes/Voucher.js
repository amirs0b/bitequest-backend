import express from "express";
import {
    getMyVouchers,
    redeemVoucher,
    getVoucherByCode
} from "../Controllers/VoucherCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";

const voucherRouter = express.Router();

// All voucher routes require authentication
voucherRouter.use(protect);

// -----------------------------------------------------------
// Customer routes
// -----------------------------------------------------------
voucherRouter.get("/my", restrictTo("customer"), getMyVouchers);
voucherRouter.patch("/:id/redeem", restrictTo("customer"), redeemVoucher);

// -----------------------------------------------------------
// Staff routes (waiter/cashier verification)
// -----------------------------------------------------------
voucherRouter.get(
    "/code/:code",
    restrictTo("superAdmin", "owner", "manager", "cashier", "staff"),
    applyBranchScope,
    getVoucherByCode
);

export default voucherRouter;
