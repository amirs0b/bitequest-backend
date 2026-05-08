import express from "express";
import {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    archiveMenuItem
} from "../Controllers/MenuCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";

const menuRouter = express.Router();

// -----------------------------------------------------------
// 1. مسیرهای عمومی (برای مشاهده منو توسط مشتریان)
// -----------------------------------------------------------
menuRouter.route("/").get(getAllMenuItems);
menuRouter.route("/:id").get(getMenuItemById);

// -----------------------------------------------------------
// 2. مسیرهای محافظت‌شده مدیریتی (نیاز به توکن و اعمال دیوار نامرئی دارند)
// -----------------------------------------------------------
menuRouter.use(protect);
menuRouter.use(applyTenantScope); // اعمال خودکار tenantId در بدنه درخواست‌های پرسنل

menuRouter.route("/")
    // افزودن غذا: فقط ادمین کل، صاحب رستوران و مدیر داخلی اجازه دارند
    .post(restrictTo("superAdmin", "owner", "manager"), createMenuItem);

menuRouter.route("/:id")
    // ویرایش قیمت، عکس یا ناموجود کردن موقت: ادمین کل، صاحب و مدیر داخلی
    .patch(restrictTo("superAdmin", "owner", "manager"), updateMenuItem)
    // حذف غذا از منو (بایگانی): فقط صاحب رستوران و ادمین کل اجازه دارند
    .delete(restrictTo("superAdmin", "owner"), archiveMenuItem);

export default menuRouter;