import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";
import User from "../Models/UserMd.js";
import Customer from "../Models/CustomerMd.js";

// ------------------------------------------------------------------
// 1. میدل‌ور اصلی: بررسی توکن و شناسایی نوع کاربر
// ------------------------------------------------------------------
export const protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new HandleERROR("You are not logged in! Please log in to get access.", 401));
    }

    // رمزگشایی توکن
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return next(new HandleERROR("Invalid or expired token. Please log in again.", 401));
    }

    // استراتژی دوگانه بر اساس فیلد accountType
    if (decoded.accountType === "user") {
        const currentUser = await User.findById(decoded.id).select("-password");
        if (!currentUser) {
            return next(new HandleERROR("The user belonging to this token no longer exists.", 401));
        }
        // ذخیره اطلاعات پرسنل در req.user
        req.user = currentUser;

    } else if (decoded.accountType === "customer") {
        const currentCustomer = await Customer.findById(decoded.id);
        if (!currentCustomer) {
            return next(new HandleERROR("The customer belonging to this token no longer exists.", 401));
        }
        // ذخیره اطلاعات مشتری در req.customer
        req.customer = currentCustomer;

    } else {
        return next(new HandleERROR("Invalid account type.", 401));
    }

    next();
});

// ------------------------------------------------------------------
// 2. میدل‌ور دسترسی‌ها (RBAC): مخصوص پرسنل
// ------------------------------------------------------------------
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // این میدل‌ور فقط برای User ها (پرسنل) کاربرد دارد، نه Customer ها
        if (!req.user) {
            return next(new HandleERROR("Access denied. This route is for staff only.", 403));
        }

        if (!roles.includes(req.user.role)) {
            return next(new HandleERROR("You do not have permission to perform this action", 403));
        }

        next();
    };
};

// ------------------------------------------------------------------
// 3. میدل‌ور امنیتی: اجبار به تغییر رمز عبور در اولین ورود
// ------------------------------------------------------------------
export const requirePasswordChange = (req, res, next) => {
    // اگر کاربر پرسنل است و فیلد forcePasswordChange فعال است
    if (req.user && req.user.forcePasswordChange) {
        // اگر روت درخواستی، روتِ تغییر پسورد نیست، بلاک شود
        if (req.originalUrl !== "/api/v1/users/change-password") {
            return next(new HandleERROR("Please change your default password to proceed.", 403));
        }
    }
    next();
};