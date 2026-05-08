import express from "express";
import {
    createTenant,
    getAllTenants,
    getTenantByIdOrSlug,
    getTenantsWithinRadius,
    updateTenant,
    updateSubscription
} from "../Controllers/TenantCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const tenantRouter = express.Router();

// -----------------------------------------------------------
// 1. مسیرهای عمومی (مشتریان نیازی به لاگین برای دیدن لیست ندارند)
// -----------------------------------------------------------
// توجه: مسیرهای دارای مسیر ثابت (مثل /distances) باید بالاتر از مسیرهای داینامیک (مثل /:identifier) قرار بگیرند
tenantRouter.route("/distances").get(getTenantsWithinRadius);
tenantRouter.route("/").get(getAllTenants);
tenantRouter.route("/:identifier").get(getTenantByIdOrSlug);

// -----------------------------------------------------------
// 2. مسیرهای محافظت‌شده (نیاز به توکن لاگین دارند)
// -----------------------------------------------------------
tenantRouter.use(protect);

// فقط مدیرعامل شرکت می‌تواند رستوران جدید تعریف کند
tenantRouter.route("/").post(restrictTo("superAdmin"), createTenant);

// مدیرعامل و صاحب همان رستوران می‌توانند اطلاعات (مثل آدرس یا نام) را ویرایش کنند
tenantRouter.route("/:id").patch(restrictTo("superAdmin", "owner"), updateTenant);

// فقط مدیرعامل می‌تواند حق اشتراک رستوران را فعال/غیرفعال کند یا کیف پولش را شارژ کند
tenantRouter.route("/:id/subscription").patch(restrictTo("superAdmin"), updateSubscription);

export default tenantRouter;