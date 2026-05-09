import express from "express";
import {
    getPlatformGlobalStats,
    getExpiringSubscriptions,
    toggleTenantStatus
} from "../Controllers/SuperAdminCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const superAdminRouter = express.Router();

// 🔒 امنیت ۱۰۰٪: فقط و فقط سوپرادمین
superAdminRouter.use(protect);
superAdminRouter.use(restrictTo("superAdmin"));

// رصد درآمدهای کل پلتفرم
superAdminRouter.get("/stats/global", getPlatformGlobalStats);

// مانیتورینگ رستوران‌های در حال انقضا برای بازاریابی مجدد
superAdminRouter.get("/reports/expiring", getExpiringSubscriptions);

// مدیریت وضعیت فعالیت (تعلیق/فعال‌سازی)
superAdminRouter.patch("/tenants/:id/status", toggleTenantStatus);

export default superAdminRouter;