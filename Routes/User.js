import express from "express";
import {
    createUser,
    getAllUsers,
    updateUser,
    archiveUser,
    changeMyPassword
} from "../Controllers/UserCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const userRouter = express.Router();

// ------------------------------------------------------------------
// ۱. محافظت پایه (Authentication)
// ------------------------------------------------------------------
// تمامی روت‌های این فایل نیازمند داشتن توکن معتبر (لاگین بودن) هستند
userRouter.use(protect);

// ------------------------------------------------------------------
// ۲. عملیات شخصی (بدون نیاز به مجوز مدیریتی)
// ------------------------------------------------------------------
// این روت بالاتر از بقیه قرار می‌گیرد تا با /:id تداخل پیدا نکند
// هر کارمندی فارغ از سطح دسترسی، حق دارد رمز عبور خودش را تغییر دهد
userRouter.patch("/change-my-password", changeMyPassword);

// ------------------------------------------------------------------
// ۳. اعمال دیوارهای امنیتی مدیریتی (Authorization & Scope)
// ------------------------------------------------------------------
// جلوگیری از تداخل دیتای رستوران‌ها
userRouter.use(applyTenantScope);

// بررسی مجوز خرد (PBAC): فقط کارمندانی که کد USR-401 دارند عبور می‌کنند
userRouter.use(requirePermission(PERMISSIONS.USER_MANAGE));

// ------------------------------------------------------------------
// ۴. مسیرهای عملیاتی مدیریت منابع انسانی
// ------------------------------------------------------------------
userRouter.post("/", createUser);
userRouter.get("/", getAllUsers);
userRouter.patch("/:id", updateUser);
userRouter.delete("/:id", archiveUser); // بایگانی کردن به جای حذف فیزیکی

export default userRouter;