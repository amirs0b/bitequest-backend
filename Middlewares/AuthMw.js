import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";
import User from "../Models/UserMd.js";
import Customer from "../Models/CustomerMd.js";

// ------------------------------------------------------------------
// 1. Token Verification & User Identification
// ------------------------------------------------------------------
export const protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new HandleERROR("You are not logged in! Please log in to get access.", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return next(new HandleERROR("Invalid or expired token. Please log in again.", 401));
    }

    if (decoded.accountType === "user") {
        const currentUser = await User.findById(decoded.id).select("-password");
        if (!currentUser) return next(new HandleERROR("The user belonging to this token no longer exists.", 401));
        if (currentUser.isArchived) return next(new HandleERROR("This account has been deactivated.", 403));
        req.user = currentUser;

    } else if (decoded.accountType === "customer") {
        const currentCustomer = await Customer.findById(decoded.id);
        if (!currentCustomer) return next(new HandleERROR("The customer belonging to this token no longer exists.", 401));
        req.customer = currentCustomer;

    } else {
        return next(new HandleERROR("Invalid account type.", 401));
    }

    next();
});

// ------------------------------------------------------------------
// 2. Role-Based Access Control
// ------------------------------------------------------------------
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (req.customer) {
            if (!roles.includes("customer")) {
                return next(new HandleERROR("Access denied. This route is for staff only.", 403));
            }
            return next();
        }

        if (!req.user) {
            return next(new HandleERROR("You are not logged in.", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new HandleERROR("You do not have permission to perform this action", 403));
        }

        next();
    };
};

// ------------------------------------------------------------------
// 3. Force Password Change on First Login
// ------------------------------------------------------------------
export const requirePasswordChange = (req, res, next) => {
    if (req.user && req.user.forcePasswordChange) {
        if (req.originalUrl !== "/api/v1/users/change-password") {
            return next(new HandleERROR("Please change your default password to proceed.", 403));
        }
    }
    next();
};