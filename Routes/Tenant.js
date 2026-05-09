import express from "express";
import {
    createTenant,
    getAllTenants,
    getTenantByIdOrSlug,
    getTenantsWithinRadius,
    updateTenant,
    updateSubscription,
    archiveTenant
} from "../Controllers/TenantCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { uploadSingleImage } from "../Middlewares/UploadMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const tenantRouter = express.Router();

// -----------------------------------------------------------
// روت‌های عمومی و جستجو (بدون نیاز به لاگین)
// -----------------------------------------------------------
tenantRouter.get("/", getAllTenants);
tenantRouter.get("/search/nearby", getTenantsWithinRadius);
tenantRouter.get("/:identifier", getTenantByIdOrSlug);

// -----------------------------------------------------------
// روت‌های مدیریتی پرسنل و مالک رستوران
// -----------------------------------------------------------
tenantRouter.use(protect);

// ویرایش پروفایل و لوگوی رستوران (نیاز به کد TNT-601)
// سوپر ادمین و مالک (owner) به صورت خودکار از این گیت عبور می‌کنند
tenantRouter.patch("/:id", requirePermission(PERMISSIONS.TENANT_EDIT), uploadSingleImage, updateTenant);

// -----------------------------------------------------------
// هسته مدیریت پلتفرم (فقط Super Admin)
// -----------------------------------------------------------
tenantRouter.use(restrictTo("superAdmin"));
tenantRouter.post("/", uploadSingleImage, createTenant);
tenantRouter.patch("/:id/subscription", updateSubscription);
tenantRouter.delete("/:id", archiveTenant);

export default tenantRouter;