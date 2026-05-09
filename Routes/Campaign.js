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
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js"; // 👈 اضافه شد

const campaignRouter = express.Router();

campaignRouter.use(protect);

// مسیرهای مخصوص مشتریان
campaignRouter.get("/my-vouchers", getMyVouchers);
campaignRouter.post("/:campaignId/play", playCampaign);

// مشاهده لیست کمپین‌ها
campaignRouter.get("/", getAllCampaigns);
campaignRouter.get("/:id", getCampaignById);

// -----------------------------------------------------------
// مسیرهای مدیریت کمپین (اعمال PBAC)
// -----------------------------------------------------------
campaignRouter.use(applyTenantScope);

// فقط کارمندانی که مجوز ساخت/ویرایش کمپین را دارند
campaignRouter.post("/", requirePermission(PERMISSIONS.CAMP_CREATE), createCampaign);
campaignRouter.patch("/:id", requirePermission(PERMISSIONS.CAMP_CREATE), updateCampaign);

// بایگانی کردن معمولاً دسترسی بالاتری می‌خواهد، لذا علاوه بر PBAC، سطح نقش را هم چک می‌کنیم (ترکیبی)
campaignRouter.delete("/:id", restrictTo("superAdmin", "owner"), archiveCampaign);

export default campaignRouter;