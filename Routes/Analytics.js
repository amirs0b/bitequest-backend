import express from "express";
import {
    getDashboardKPIs,
    getTopSellingItems,
    getCampaignROI,
    getSalesChartData
} from "../Controllers/AnalyticsCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js"; // 👈 اضافه شد

const analyticsRouter = express.Router();

analyticsRouter.use(protect);
analyticsRouter.use(applyTenantScope);

// 👈 نصب قفل امنیتی PBAC برای دسترسی به آمار مالی
analyticsRouter.use(requirePermission(PERMISSIONS.FINANCE_VIEW));

analyticsRouter.get("/kpi", getDashboardKPIs);
analyticsRouter.get("/top-items", getTopSellingItems);
analyticsRouter.get("/roi", getCampaignROI);
analyticsRouter.get("/sales-chart", getSalesChartData);

export default analyticsRouter;