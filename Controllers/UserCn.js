import User from "../Models/UserMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import bcryptjs from "bcryptjs";

// ------------------------------------------------------------------
// 1. ساخت پرسنل جدید (دسترسی: superAdmin و owner)
// ------------------------------------------------------------------
export const createUser = catchAsync(async (req, res, next) => {
    const { username, password, role } = req.body;
    // نکته: req.body.tenantId توسط میدل‌ور applyTenantScope تنظیم شده است

    if (!username || !password || !role) {
        return next(new HandleERROR("Username, password, and role are required", 400));
    }

    // جلوگیری از اینکه صاحب رستوران بخواهد کاربر با دسترسی سوپرادمین بسازد
    if (req.user.role !== "superAdmin" && ["superAdmin", "analyst", "staff"].includes(role)) {
        return next(new HandleERROR("You do not have permission to create a user with this role.", 403));
    }

    const hashPassword = bcryptjs.hashSync(password, 10);
    const newUser = await User.create({
        username,
        password: hashPassword,
        role,
        tenantId: req.body.tenantId || null,
        forcePasswordChange: true // اجبار کاربر جدید به تغییر رمز در اولین ورود
    });

    // حذف پسورد از خروجی
    newUser.password = undefined;

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
            user: newUser
        }
    });
});

// ------------------------------------------------------------------
// 2. دریافت لیست تمام پرسنل (با قابلیت فیلتر و صفحه‌بندی)
// ------------------------------------------------------------------
export const getAllUsers = catchAsync(async (req, res, next) => {
    // کلاس vanta-api با استفاده از req.query که در میدل‌ور محدود شده، کوئری امن می‌سازد
    const features = new ApiFeatures(User, req.query, req.user.role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const result = await features.execute();

    // حذف فیلد پسورد از تمام رکوردهای خروجی
    result.data.forEach(user => user.password = undefined);

    return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        count: result.count,
        data: {
            users: result.data
        }
    });
});

// ------------------------------------------------------------------
// 3. ویرایش اطلاعات/نقش پرسنل (دسترسی: superAdmin و owner)
// ------------------------------------------------------------------
export const updateUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // کوئری امن: هم آیدی کاربر چک می‌شود و هم آیدی رستورانش (تا owner نتواند کارمند رستوران دیگری را آپدیت کند)
    const query = { _id: id };
    if (req.user.role !== "superAdmin") {
        query.tenantId = req.user.tenantId;
    }

    const userToUpdate = await User.findOne(query);
    if (!userToUpdate) {
        return next(new HandleERROR("User not found or you do not have permission to modify this user", 404));
    }

    // جلوگیری از تغییر نقش ادمین کل توسط صاحب رستوران
    if (req.user.role !== "superAdmin" && ["superAdmin", "analyst", "staff"].includes(req.body.role)) {
        return next(new HandleERROR("You cannot assign this role.", 403));
    }

    if (req.body.role) userToUpdate.role = req.body.role;
    if (req.body.username) userToUpdate.username = req.body.username;

    await userToUpdate.save();
    userToUpdate.password = undefined;

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
            user: userToUpdate
        }
    });
});

// ------------------------------------------------------------------
// 4. تغییر رمز عبور توسط خود پرسنل (و خروج از وضعیت اجبار تغییر رمز)
// ------------------------------------------------------------------
export const changeMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new HandleERROR("Please provide your current password and a new password", 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new HandleERROR("User not found", 404));
    }

    const isMatch = bcryptjs.compareSync(currentPassword, user.password);
    if (!isMatch) {
        return next(new HandleERROR("Your current password is incorrect", 401));
    }

    // بررسی استانداردهای امنیتی رمز عبور جدید
    const passReg = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/);
    if (!passReg.test(newPassword)) {
        return next(new HandleERROR("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character", 400));
    }

    // آپدیت رمز عبور و غیرفعال کردن forcePasswordChange
    user.password = bcryptjs.hashSync(newPassword, 10);
    user.forcePasswordChange = false;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password changed successfully. You can now access your dashboard."
    });
});