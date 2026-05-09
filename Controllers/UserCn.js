import User from "../Models/UserMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import bcryptjs from "bcryptjs";

// ------------------------------------------------------------------
// 1. ساخت پرسنل جدید (با پشتیبانی از هش پسورد، نقش‌ها و مجوزهای PBAC)
// ------------------------------------------------------------------
export const createUser = catchAsync(async (req, res, next) => {
    const { username, password, role, permissions } = req.body;

    if (!username || !password || !role) {
        return next(new HandleERROR("Username, password, and role are required", 400));
    }

    if (req.user.role !== "superAdmin" && ["superAdmin", "analyst", "staff"].includes(role)) {
        return next(new HandleERROR("You do not have permission to create a user with this role.", 403));
    }

    const hashPassword = bcryptjs.hashSync(password, 10);

    const newUser = await User.create({
        username,
        password: hashPassword,
        role,
        permissions: permissions || [],
        tenantId: req.body.tenantId || null,
        forcePasswordChange: true
    });

    newUser.password = undefined;
    return res.status(201).json({ success: true, data: { user: newUser } });
});

// ------------------------------------------------------------------
// 2. دریافت لیست پرسنل (بدون نمایش پسوردها)
// ------------------------------------------------------------------
export const getAllUsers = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(User, req.query, req.user.role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    features.addManualFilters({ isArchived: false });

    const result = await features.execute();

    result.data.forEach(user => user.password = undefined);

    return res.status(200).json({
        success: true,
        count: result.count,
        data: { users: result.data }
    });
});

// ------------------------------------------------------------------
// 3. ویرایش اطلاعات پرسنل (از جمله تغییر کدهای دسترسی)
// ------------------------------------------------------------------
export const updateUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const query = { _id: id, isArchived: false };
    if (req.user.role !== "superAdmin") query.tenantId = req.user.tenantId;

    const userToUpdate = await User.findOne(query);
    if (!userToUpdate) return next(new HandleERROR("User not found or permission denied", 404));

    if (req.user.role !== "superAdmin" && ["superAdmin", "analyst", "staff"].includes(req.body.role)) {
        return next(new HandleERROR("You cannot assign this role.", 403));
    }

    if (req.body.role) userToUpdate.role = req.body.role;
    if (req.body.username) userToUpdate.username = req.body.username;

    // 👈 رفع باگ امنیتی: فقط مالک رستوران یا سوپرادمین حق تغییر کدهای دسترسی را دارد
    if (req.body.permissions && Array.isArray(req.body.permissions)) {
        if (req.user.role === "superAdmin" || req.user.role === "owner") {
            userToUpdate.permissions = req.body.permissions;
        } else {
            return next(new HandleERROR("Only the Owner can modify access permissions.", 403));
        }
    }

    await userToUpdate.save();
    userToUpdate.password = undefined;

    return res.status(200).json({ success: true, data: { user: userToUpdate } });
});

// ------------------------------------------------------------------
// 4. بایگانی کردن کاربر به جای حذف
// ------------------------------------------------------------------
export const archiveUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const query = { _id: id, isArchived: false };

    if (req.user.role !== "superAdmin") query.tenantId = req.user.tenantId;

    const user = await User.findOneAndUpdate(query, { isArchived: true }, { new: true });

    if (!user) return next(new HandleERROR("User not found or permission denied", 404));

    return res.status(200).json({
        success: true,
        message: "User successfully archived"
    });
});

// ------------------------------------------------------------------
// 5. تغییر رمز عبور شخصی (با بررسی امنیتی و Regex)
// ------------------------------------------------------------------
export const changeMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!bcryptjs.compareSync(currentPassword, user.password)) {
        return next(new HandleERROR("Your current password is incorrect", 401));
    }

    const passReg = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/);
    if (!passReg.test(newPassword)) {
        return next(new HandleERROR("Password requirements not met", 400));
    }

    user.password = bcryptjs.hashSync(newPassword, 10);
    user.forcePasswordChange = false;
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
});