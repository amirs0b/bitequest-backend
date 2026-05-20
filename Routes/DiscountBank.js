import express from "express";
import {
    getMyDiscountBank,
    getDiscountBankForBranch,
    checkUrgencyOffer
} from "../Controllers/DiscountBankCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const discountBankRouter = express.Router();

discountBankRouter.use(protect);

// All routes are customer-facing
discountBankRouter.get("/my", restrictTo("customer"), getMyDiscountBank);
discountBankRouter.get("/branch/:branchId", restrictTo("customer"), getDiscountBankForBranch);
discountBankRouter.get("/urgency/:branchId", restrictTo("customer"), checkUrgencyOffer);

export default discountBankRouter;
