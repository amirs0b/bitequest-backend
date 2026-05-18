import express from "express";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    archiveCampaign,
    playCampaign,
    getMyVouchers
} from "../Controllers/CampaignCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";

const campaignRouter = express.Router();

// تمام این روت‌ها نیاز به لاگین دارند (چه مدیر، چه مشتری)
campaignRouter.use(protect);

// -----------------------------------------------------------
// 1. مسیرهای مخصوص مشتریان (بازی کردن و کیف پول)
// -----------------------------------------------------------
// 👈 رفع باگ: محدود کردن دسترسی کیف پول فقط به مشتری
campaignRouter.get("/my-vouchers", restrictTo("customer"), getMyVouchers);
campaignRouter.post("/:campaignId/play", playCampaign);

// مشتریان می‌توانند لیست کمپین‌ها را ببینند (فیلتر امنیتی درون کنترلر اعمال می‌شود)
campaignRouter.get("/", getAllCampaigns);
campaignRouter.get("/:id", getCampaignById);

// -----------------------------------------------------------
// 2. مسیرهای مدیریت کمپین (مخصوص ادمین‌ها و مدیران رستوران)
// -----------------------------------------------------------
campaignRouter.use(restrictTo("superAdmin", "owner", "manager"));
campaignRouter.use(applyBranchScope);

campaignRouter.post("/", createCampaign);
campaignRouter.patch("/:id", updateCampaign);
campaignRouter.delete("/:id", restrictTo("superAdmin", "owner"), archiveCampaign);

export default campaignRouter;