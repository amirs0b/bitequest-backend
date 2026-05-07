import express from "express";
import {
    createUser,
    getAllUsers,
    updateUser,
    toggleUserStatus,
    changeMyPassword
} from "../../Controllers/UserCn.js";
import { protect, restrictTo } from "../../Middlewares/Auth.js";
import { applyTenantScope } from "../../Middlewares/TenantScope.js"; // میدل‌ور جادویی جداسازی رستوران‌ها

const userRouter = express.Router();

// ------------------------------------------------------------------------------------------
// تمامی روت‌های لیست پایین نیاز به لاگین بودن (توکن) دارند، پس در ابتدای مسیر `protect` را می‌نویسیم
// ------------------------------------------------------------------------------------------
userRouter.use(protect);

// روت اختصاصی کارمندان برای تغییر رمز عبور اولیه (نیاز به هیج نقش خاصی ندارد، همه می‌توانند)
userRouter.route("/change-password").patch(changeMyPassword);

// ------------------------------------------------------------------------------------------
// از اینجا به بعد، فقط نقش‌های مدیریتی حق دسترسی دارند و باید میدل‌ور Scope هم اعمال شود
// ------------------------------------------------------------------------------------------
userRouter.use(restrictTo("SUPER_ADMIN", "INTERNAL_STAFF", "TENANT_OWNER"));
userRouter.use(applyTenantScope); // اعمال خودکار Scope برای محدود شدن به رستوران‌ها

// مسیرهای لیست‌گیری و ثبت‌نام کاربر
userRouter.route("/")
    .get(getAllUsers)
    .post(createUser);

// مسیرهای مدیریت (آپدیت و تغییر وضعیت فعال/غیرفعال) مربوط به یک کاربر خاص
userRouter.route("/:id")
    .patch(updateUser);

userRouter.route("/:id/toggle-status")
    .patch(toggleUserStatus);

export default userRouter;