import User from "../Models/UserMd.js";
import Customer from "../Models/CustomerMd.js";
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
// 2. درخواست ارسال کد تایید (OTP) برای مشتریان نهایی
// ------------------------------------------------------------------
export const customerSendOTP = catchAsync(async (req, res, next) => {
    const { phone = null } = req.body;

    if (!phone) {
        return next(new HandleERROR("Phone number is required", 400));
    }

    // جستجوی مشتری یا ساخت مشتری جدید به صورت ناشناس
    let customer = await Customer.findOne({ phone });
    if (!customer) {
        customer = await Customer.create({ phone, isVerified: false });
    }

    // تولید کد تصادفی 5 رقمی
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000); // انقضا: 3 دقیقه

    // ذخیره موقت کد در دیتابیس (با استفاده از Mongoose)
    await Customer.updateOne(
        { _id: customer._id },
        { $set: { otpCode, otpExpires } },
        { strict: false } // برای اجازه دادن به فیلدهای موقتی که در اسکیما نیستند
    );

    // TODO: اینجا باید تابع سرویس ارسال پیامک (SmsSrv) را فراخوانی کنید
    console.log(`[SMS SIMULATION] OTP for ${phone} is: ${otpCode}`);

    return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
            expiresIn: "3 minutes"
        }
    });
});

// ------------------------------------------------------------------
// 3. تایید کد (OTP) و ورود مشتری
// ------------------------------------------------------------------
export const customerVerifyOTP = catchAsync(async (req, res, next) => {
    const { phone = null, otpCode = null } = req.body;

    if (!phone || !otpCode) {
        return next(new HandleERROR("Phone number and OTP code are required", 400));
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) {
        return next(new HandleERROR("Customer not found", 404));
    }

    // بررسی صحت کد و انقضای آن (به صورت خام از دیتابیس می‌خوانیم تا فیلدهای strict را بگیریم)
    const customerDoc = await Customer.findOne({ phone }).lean();
    if (!customerDoc.otpCode || customerDoc.otpCode !== otpCode) {
        return next(new HandleERROR("Invalid OTP code", 400));
    }
    if (new Date(customerDoc.otpExpires) < new Date()) {
        return next(new HandleERROR("OTP code has expired", 400));
    }

    // تایید موفقیت‌آمیز، پاک کردن کد موقت و وریفای کردن کاربر
    customer.isVerified = true;
    await customer.save();

    await Customer.updateOne(
        { _id: customer._id },
        { $unset: { otpCode: "", otpExpires: "" } },
        { strict: false }
    );

    // تولید توکن مخصوص مشتری
    const token = jwt.sign(
        {
            id: customer._id,
            accountType: "customer", // تعیین نوع اکانت
            isVerified: customer.isVerified
        },
        process.env.JWT_SECRET,
        { expiresIn: "90d" }
    );

    return res.status(200).json({
        success: true,
        message: "Customer verified successfully",
        data: {
            token,
            customer: {
                id: customer._id,
                phone: customer.phone,
                firstName: customer.firstName,
                lastName: customer.lastName
            }
        }
    });
});

// ------------------------------------------------------------------
// 4. دریافت اطلاعات پروفایل کاربری که لاگین کرده است (مشترک)
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