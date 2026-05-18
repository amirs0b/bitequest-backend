import Customer from "../Models/CustomerMd.js";
import Branch from "../Models/BranchMd.js";
import Organization from "../Models/OrganizationMd.js";
import { catchAsync, HandleERROR } from "vanta-api";
import jwt from "jsonwebtoken";

// ------------------------------------------------------------------
// Helper: Send SMS (placeholder for provider integration)
// ------------------------------------------------------------------
const sendSmsProvider = async (phone, message) => {
    console.log(`[SMS SENDER] Sending to ${phone}: ${message}`);
    return true;
};

// ------------------------------------------------------------------
// 1. Request OTP for Customer Login
// ------------------------------------------------------------------
export const requestOtp = catchAsync(async (req, res, next) => {
    const { phone, branchId } = req.body;

    if (!phone || !branchId) {
        return next(new HandleERROR("Phone number and Branch ID are required", 400));
    }

    // Find the branch and its parent organization (SMS wallet lives at org level)
    const branch = await Branch.findById(branchId);
    if (!branch) return next(new HandleERROR("Branch not found", 404));

    const org = await Organization.findById(branch.organizationId);
    if (!org) return next(new HandleERROR("Organization not found", 404));

    if (org.smsWalletBalance <= 0) {
        return next(new HandleERROR("SMS service is currently unavailable for this restaurant.", 403));
    }

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

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

    const message = `Welcome to BiteQuest!\nYour verification code is: ${otpCode}`;
    await sendSmsProvider(phone, message);

    org.smsWalletBalance -= 1;
    await org.save();

    return res.status(200).json({
        success: true,
        message: "OTP sent successfully"
    });
});

// ------------------------------------------------------------------
// 2. Verify OTP & Login Customer
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

    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    customer.isVerified = true;
    await customer.save();

    const token = jwt.sign(
        { id: customer._id, accountType: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { token, customer }
    });
});

// ------------------------------------------------------------------
// 3. Send Notification SMS
// ------------------------------------------------------------------
export const sendNotification = catchAsync(async (req, res, next) => {
    const { customerId, branchId, messageContent } = req.body;

    if (!customerId || !branchId || !messageContent) {
        return next(new HandleERROR("Customer ID, Branch ID, and Message Content are required", 400));
    }

    const customer = await Customer.findById(customerId);
    if (!customer || !customer.phone) {
        return next(new HandleERROR("Customer or phone number not found", 404));
    }

    const branch = await Branch.findById(branchId);
    if (!branch) return next(new HandleERROR("Branch not found", 404));

    const org = await Organization.findById(branch.organizationId);
    if (!org) return next(new HandleERROR("Organization not found", 404));

    if (org.smsWalletBalance <= 0) {
        return next(new HandleERROR("Insufficient SMS wallet balance.", 403));
    }

    await sendSmsProvider(customer.phone, messageContent);

    org.smsWalletBalance -= 1;
    await org.save();

    return res.status(200).json({
        success: true,
        message: "Notification sent successfully"
    });
});
