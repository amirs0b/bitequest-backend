import express from "express";
import {
    getRestaurantCustomers,
    getCustomerProfile,
    getCustomerSegments,
    sendBulkSms,
    getAtRiskCustomers,
    getTopCustomers
} from "../Controllers/CrmCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const crmRouter = express.Router();

crmRouter.use(protect);
crmRouter.use(applyBranchScope);

// -----------------------------------------------------------
// دسترسی مشاهده مشتریان (CRM-501)
// -----------------------------------------------------------
crmRouter.get("/customers", requirePermission(PERMISSIONS.CRM_VIEW), getRestaurantCustomers);
crmRouter.get("/segments", requirePermission(PERMISSIONS.CRM_VIEW), getCustomerSegments);
crmRouter.get("/customers/:customerId", requirePermission(PERMISSIONS.CRM_VIEW), getCustomerProfile);

// -----------------------------------------------------------
// دسترسی ارسال پیامک گروهی (CRM-502)
// -----------------------------------------------------------
crmRouter.post("/send-bulk-sms", requirePermission(PERMISSIONS.CRM_SMS), sendBulkSms);

// -----------------------------------------------------------
// RFM-based insights
// -----------------------------------------------------------
crmRouter.get("/at-risk", requirePermission(PERMISSIONS.CRM_VIEW), getAtRiskCustomers);
crmRouter.get("/top-customers", requirePermission(PERMISSIONS.CRM_VIEW), getTopCustomers);

export default crmRouter;