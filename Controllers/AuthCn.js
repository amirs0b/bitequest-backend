import User from "../Models/UserMd.js";
import Branch from "../Models/BranchMd.js";
import Organization from "../Models/OrganizationMd.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";
import { logEvent } from "./EventCn.js";

// ------------------------------------------------------------------
// 1. Staff & Admin Login
// ------------------------------------------------------------------
export const staffLogin = catchAsync(async (req, res, next) => {
    const { username = null, password = null } = req.body;

    if (!username || !password) {
        return next(new HandleERROR("Username and password are required", 400));
    }

    const user = await User.findOne({ username, isArchived: false });
    if (!user) {
        return next(new HandleERROR("User not found", 404));
    }

    const confirmPass = bcryptjs.compareSync(password, user.password);
    if (!confirmPass) {
        return next(new HandleERROR("Password is incorrect", 401));
    }

    // Check branch status and organization subscription for branch staff
    if (user.branchId) {
        const branch = await Branch.findById(user.branchId);
        if (!branch || !branch.isActive) {
            return next(new HandleERROR("Your branch account is disabled", 403));
        }

        const org = await Organization.findById(branch.organizationId);
        if (!org || org.subscription.status !== "active") {
            return next(new HandleERROR("Organization subscription is inactive. Please contact support.", 403));
        }
        if (org.subscription.expiresAt && new Date(org.subscription.expiresAt) < new Date()) {
            return next(new HandleERROR("Subscription expired. Please contact support.", 403));
        }
    }

    const token = jwt.sign(
        {
            id: user._id,
            accountType: "user",
            role: user.role,
            organizationId: user.organizationId,
            branchId: user.branchId,
            forcePasswordChange: user.forcePasswordChange
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    logEvent({
        branchId: user.branchId || null,
        actorId: user._id,
        actorType: "User",
        action: "staff_login",
        resource: "Auth",
        metadata: { role: user.role, username: user.username },
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
        success: true,
        message: "Staff login successful",
        data: {
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                organizationId: user.organizationId,
                branchId: user.branchId,
                forcePasswordChange: user.forcePasswordChange
            }
        }
    });
});

// ------------------------------------------------------------------
// 2. Get Current Logged-In User Profile
// ------------------------------------------------------------------
export const getMe = catchAsync(async (req, res, next) => {
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