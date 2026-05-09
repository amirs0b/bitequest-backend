import express from "express";
import {
    getDashboardKPIs,
    getTopSellingItems,
    getCampaignROI,
    getSalesChartData
} from "../Controllers/AnalyticsCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js"; //
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js"; //

const analyticsRouter = express.Router();

// -----------------------------------------------------------
// تمام گزارش‌ها نیاز به احراز هویت و دسترسی مدیریتی دارند
// -----------------------------------------------------------
analyticsRouter.use(protect);
analyticsRouter.use(restrictTo("superAdmin", "owner", "manager"));

// اعمال دیوار نامرئی برای جداسازی دیتای رستوران‌ها
analyticsRouter.use(applyTenantScope);

analyticsRouter.get("/kpi", getDashboardKPIs);
analyticsRouter.get("/top-items", getTopSellingItems);
analyticsRouter.get("/roi", getCampaignROI);
analyticsRouter.get("/sales-chart", getSalesChartData);

export default analyticsRouter;