import Customer from "../Models/CustomerMd.js"; // فرض بر این است که این مدل شامل فیلدهای phone, otp, otpExpiresAt است
import Tenant from "../Models/TenantMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import jwt from "jsonwebtoken";

// ------------------------------------------------------------------
// تابع کمکی (Utility) برای ارسال پیامک واقعی
// ------------------------------------------------------------------
const sendSmsProvider = async (phone, message) => {
    // 💡 در آینده کدهای اتصال به کاوه‌نگار یا ملی‌پيامک در اینجا قرار می‌گیرد
    console.log(`[SMS SENDER] Sending to ${phone}: ${message}`);
    return true;
};

// ------------------------------------------------------------------
// 1. درخواست کد تایید (OTP) برای ورود مشتری
// ------------------------------------------------------------------
export const requestOtp = catchAsync(async (req, res, next) => {
    const { phone, tenantId } = req.body;

    if (!phone || !tenantId) {
        return next(new HandleERROR("Phone number and Tenant ID are required", 400));
    }

    // بررسی موجودی کیف پول پیامکی رستوران
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return next(new HandleERROR("Tenant not found", 404));

    if (tenant.smsWalletBalance <= 0) {
        // رستوران شارژ ندارد! (می‌توانید اینجا ایمیل هشدار برای صاحب رستوران بفرستید)
        return next(new HandleERROR("SMS service is currently unavailable for this restaurant.", 403));
    }

    // تولید کد ۵ رقمی تصادفی
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // انقضا در 2 دقیقه

    // پیدا کردن مشتری یا ساخت مشتری جدید با این شماره
    let customer = await Customer.findOne({ phone });
    if (customer) {
        customer.otp = otpCode;
        customer.otpExpiresAt = otpExpiresAt;
        await customer.save();
    } else {
        customer = await Customer.create({
            phone,
            otp: otpCode,
            otpExpiresAt
        });
    }

    // ارسال پیامک
    const message = `Welcome to BiteQuest!\nYour verification code is: ${otpCode}`;
    await sendSmsProvider(phone, message);

    // کسر یک واحد از شارژ پیامکی رستوران
    tenant.smsWalletBalance -= 1;
    await tenant.save();

    return res.status(200).json({
        success: true,
        message: "OTP sent successfully"
    });
});

// ------------------------------------------------------------------
// 2. تایید کد (Verify OTP) و لاگین مشتری
// ------------------------------------------------------------------
export const verifyOtp = catchAsync(async (req, res, next) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return next(new HandleERROR("Phone number and OTP are required", 400));
    }

    const customer = await Customer.findOne({ phone, otp });

    if (!customer) {
        return next(new HandleERROR("Invalid verification code", 401));
    }

    if (new Date() > customer.otpExpiresAt) {
        return next(new HandleERROR("Verification code has expired. Please request a new one.", 401));
    }

    // پاک کردن کد OTP از دیتابیس برای جلوگیری از استفاده مجدد
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    await customer.save();

    // تولید توکن JWT برای مشتری
    const token = jwt.sign(
        { id: customer._id, accountType: 'customer' }, // فیلد accountType برای جداسازی از پرسنل
        process.env.JWT_SECRET || "your_super_secret_key_change_in_production",
        { expiresIn: "30d" }
    );

    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            token,
            customer
        }
    });
});

// ------------------------------------------------------------------
// 3. سرویس ارسال پیامک اطلاع‌رسانی (کد تخفیف، خوش‌آمدگویی و ...)
// ------------------------------------------------------------------
export const sendNotification = catchAsync(async (req, res, next) => {
    const {customerId, tenantId, messageContent} = req.body;

    if (!customerId || !tenantId || !messageContent) {
        return next(new HandleERROR("Customer ID, Tenant ID, and Message Content are required", 400));
    }

    const customer = await Customer.findById(customerId);
    if (!customer || !customer.phone) {
        return next(new HandleERROR("Customer or phone number not found", 404));
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return next(new HandleERROR("Tenant not found", 404));

    if (tenant.smsWalletBalance <= 0) {
        return next(new HandleERROR("Insufficient SMS wallet balance.", 403));
    }

    // ارسال پیامک
    await sendSmsProvider(customer.phone, messageContent);

    // کسر هزینه پیامک
    tenant.smsWalletBalance -= 1;
    await tenant.save();

    return res.status(200).json({
        success: true,
        message: "Notification"
    })
})


