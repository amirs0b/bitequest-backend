import User from "../Models/UserMd.js";
import bcryptjs from "bcryptjs";
import { catchAsync, HandleERROR } from "vanta-api";

// ----------------------------------------------------------------
// 1. Create User (تولید کاربر جدید با رمز موقت)
// ----------------------------------------------------------------
export const createUser = catchAsync(async (req, res, next) => {
    const { name, email, role, restaurantId, permissions } = req.body;

    // بررسی‌های امنیتی سطح دسترسی
    if (req.user.role !== "SUPER_ADMIN") {
        // مالکان رستوران فقط و فقط حق ساخت پرسنل برای رستوران خود را دارند
        if (req.user.role === "TENANT_OWNER" && role !== "TENANT_STAFF") {
            return next(new HandleERROR("You can only create TENANT_STAFF roles.", 403));
        }
        // کارمندان داخلی سیستم ما هم بسته به دسترسی‌ها باید هندل شوند (در میدل‌ور permission 체크 می‌شود)
    }

    // بررسی تکراری نبودن ایمیل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new HandleERROR("A user with this email already exists", 400));
    }

    // تولید رمز عبور موقت (یک کد 8 کاراکتری تصادفی یا رندوم)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashPassword = bcryptjs.hashSync(tempPassword, 10);

    const newUser = await User.create({
        name,
        email,
        password: hashPassword,
        role,
        restaurantId: req.body.restaurantId, // این فیلد می‌تونه توسط TenantScope بازنویسی شده باشه
        permissions: permissions || [],
        mustChangePassword: true // کاربر مجبور است رمز را عوض کند
    });

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            // ارسال رمز موقت به فرانت‌اند تا مدیر آن را ببیند و به کاربر بدهد
            // (در سیستم‌های Enterprise معمولا این رمز به کاربر ایمیل می‌شود، اما برای نسخه فعلی نمایش می‌دهیم)
            temporaryPassword: tempPassword
        }
    });
});

// ----------------------------------------------------------------
// 2. Get All Users (لیست کاربران - ایمن شده توسط TenantScope)
// ----------------------------------------------------------------
export const getAllUsers = catchAsync(async (req, res, next) => {
    // چون TenantScope قبلاً req.query.restaurantId را تنظیم کرده،
    // اینجا نیازی به شرط‌های پیچیده نیست، به همین راحتی فیلتر می‌شود!
    const users = await User.find(req.query)
        .select("-password")
        .populate("restaurantId", "name");

    return res.status(200).json({
        success: true,
        count: users.length,
        data: { users }
    });
});

// ----------------------------------------------------------------
// 3. Update User (ویرایش مشخصات و نقش‌ها)
// ----------------------------------------------------------------
export const updateUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    let targetUser = await User.findById(userId);

    if (!targetUser) {
        return next(new HandleERROR("User not found", 404));
    }

    // امنیت: آیا مالک رستوران سعی دارد یوزر شخص دیگری را ویرایش کند؟
    if (req.user.role === "TENANT_OWNER" || req.user.role === "TENANT_STAFF") {
        if (targetUser.restaurantId?.toString() !== req.user.restaurantId?.toString()) {
            return next(new HandleERROR("You have no permission to edit this user", 403));
        }
    }

    // فیلتر کردن فیلدهایی که نباید مستقیم عوض شوند (مثل پسورد)
    const { name, role, permissions } = req.body;

    targetUser.name = name || targetUser.name;
    // تغییر نقش و پرمیشن (با رعایت امنیت که فقط سوپر ادمین یا ادمین داخلی مجاز به نقش‌های مهم هستند)
    if (role && req.user.role === "SUPER_ADMIN") targetUser.role = role;
    if (permissions) targetUser.permissions = permissions;

    await targetUser.save();

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
            user: targetUser
        }
    });
});

// ----------------------------------------------------------------
// 4. Toggle User Status (فعال / غیرفعال کردن اکانت به جای حذف دائم)
// ----------------------------------------------------------------
export const toggleUserStatus = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
        return next(new HandleERROR("User not found", 404));
    }

    // امنیت ایزوله‌سازی مانند بالا
    if (req.user.role === "TENANT_OWNER") {
        if (targetUser.restaurantId?.toString() !== req.user.restaurantId?.toString()) {
            return next(new HandleERROR("You cannot change the status of this user", 403));
        }
        if (targetUser._id.toString() === req.user.id.toString()) {
            return next(new HandleERROR("You cannot deactivate your own account", 400));
        }
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    return res.status(200).json({
        success: true,
        message: `User has been ${targetUser.isActive ? 'activated' : 'deactivated'}`,
        isActive: targetUser.isActive
    });
});

// ----------------------------------------------------------------
// 5. Change First Password (تعویض اجباری رمز عبور در ورود اول)
// ----------------------------------------------------------------
export const changeMyPassword = catchAsync(async (req, res, next) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return next(new HandleERROR("Password must be at least 6 characters long", 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) return next(new HandleERROR("User not found", 404));

    user.password = bcryptjs.hashSync(newPassword, 10);
    user.mustChangePassword = false; // این فلگ برداشته می‌شود تا دیگر محدود نشود
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password changed successfully. You can now use the system."
    });
});
