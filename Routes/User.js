import express from "express";
import {
    createUser,
    getAllUsers,
    updateUser,
    changeMyPassword
} from "../Controllers/UserCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";

const userRouter = express.Router();

// -----------------------------------------------------------
// تمام مسیرهای پرسنل نیاز به لاگین دارند
// -----------------------------------------------------------
userRouter.use(protect);

// -----------------------------------------------------------
// 1. مسیر مربوط به خود کاربر لاگین‌شده
// -----------------------------------------------------------
userRouter.route("/change-password").patch(changeMyPassword);

// -----------------------------------------------------------
// 2. مسیرهای مدیریتی پرسنل (دسترسی برای مدیران کل و صاحبان رستوران)
// -----------------------------------------------------------
userRouter.use(restrictTo("superAdmin", "owner"));
userRouter.use(applyTenantScope); // اعمال دیوار نامرئی جداسازی رستوران‌ها

userRouter.route("/")
    .post(createUser)    // ساخت پرسنل جدید
    .get(getAllUsers);   // دریافت لیست پرسنل (superAdmin همه را می‌بیند، owner فقط پرسنل خودش را)

userRouter.route("/:id")
    .patch(updateUser);  // تغییر نقش یا نام کاربری پرسنل

export default userRouter;