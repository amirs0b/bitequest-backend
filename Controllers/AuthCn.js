import User from "../Models/UserMd.js";
import Tenant from "../Models/TenantMd.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. ورود پرسنل و مدیران (کاربران دارای نام کاربری و رمز عبور)
// ------------------------------------------------------------------
export const staffLogin = catchAsync(async (req, res, next) => {
    const { username = null, password = null } = req.body;

    if (!username || !password) {
        return next(new HandleERROR("Username and password are required", 400));
    }

    const user = await User.findOne({ username });
    if (!user) {
        return next(new HandleERROR("User not found", 404));
    }

    const confirmPass = bcryptjs.compareSync(password, user.password);
    if (!confirmPass) {
        return next(new HandleERROR("Password is incorrect", 401));
    }

    // بررسی وضعیت اشتراک رستوران (اگر کاربر پرسنل رستوران است)
    if (user.tenantId) {
        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant || !tenant.isActive) {
            return next(new HandleERROR("Your restaurant account is disabled", 403));
        }
        if (tenant.subscription && new Date(tenant.subscription.expiresAt) < new Date()) {
            return next(new HandleERROR("Subscription expired. Please contact support.", 403));
        }
    }

    // تولید توکن مخصوص پرسنل
    const token = jwt.sign(
        {
            id: user._id,
            accountType: "user", // تعیین نوع اکانت برای میدل‌ور
            role: user.role,
            tenantId: user.tenantId,
            forcePasswordChange: user.forcePasswordChange
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" } // تاریخ انقضای توکن
    );

    return res.status(200).json({
        success: true,
        message: "Staff login successful",
        data: {
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                tenantId: user.tenantId,
                forcePasswordChange: user.forcePasswordChange
            }
        }
    });
});

// ------------------------------------------------------------------
// 2. دریافت اطلاعات پروفایل کاربری که لاگین کرده است (مشترک)
// ------------------------------------------------------------------
export const getMe = catchAsync(async (req, res, next) => {
    // اطلاعات کاربر یا مشتری توسط میدل‌ور protect در req ذخیره شده است
    if (req.user) {
        return res.status(200).json({
            success: true,
            data: { user: req.user }
        });
    }

    if (req.customer) {
        return res.status(200).json({
            success: true,
            data: { customer: req.customer }
        });
    }

    return next(new HandleERROR("Account data not found", 404));
});