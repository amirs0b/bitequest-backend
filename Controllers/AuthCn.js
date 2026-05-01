import User from "../Models/UserMd.js";
import Restaurant from "../Models/RestaurantMd.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";

// ----------------------------------------------------------------
// 1. Login Function (B2B & SaaS Admin)
// ----------------------------------------------------------------
export const login = catchAsync(async (req, res, next) => {
    // از مدل طراحی شده ما 'email' است، اما اگر شما username مدنظرتان بود در مدل تغییر میدهیم
    const { email = null, password = null } = req.body;

    if (!email || !password) {
        return next(new HandleERROR("Email and password are required", 400));
    }

    const user = await User.findOne({ email }).populate("restaurantId", "subscriptionStatus isActive name");

    if (!user) {
        return next(new HandleERROR("Invalid credentials", 400));
    }

    // 1.1 بررسی فعال بودن خود کاربر (کارمند یا ادمین)
    if (!user.isActive) {
        return next(new HandleERROR("Your account has been deactivated. Contact support.", 403));
    }

    // 1.2 بررسی وضعیت رستوران (اگر کاربر مربوط به رستوران است، نه ادمین خودمان)
    if (user.restaurantId) {
        const restaurant = user.restaurantId;
        if (!restaurant.isActive || restaurant.subscriptionStatus === "SUSPENDED") {
            return next(new HandleERROR("Your restaurant's account is currently suspended.", 403));
        }
    }

    // 1.3 بررسی رمز عبور
    const confirmPass = bcryptjs.compareSync(password, user.password);
    if (!confirmPass) {
        return next(new HandleERROR("Invalid credentials", 400));
    }

    // 1.4 تولید توکن (بدون محدودیت زمانی طبق دستور شما - no expiresIn configuration)
    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
            // اگر رستوران بود ID رستوران را هم در توکن میگذاریم تا در بقیه کنترلرها راحت دسترسی داشته باشیم
            restaurantId: user.restaurantId ? user.restaurantId._id : null
        },
        process.env.JWT_SECRET
    );

    // پاسخ ارسالی (توکن در Body)
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions, // آرایه دسترسی‌های داینامیک که در مدل ساختیم
                restaurant: user.restaurantId ? {
                    id: user.restaurantId._id,
                    name: user.restaurantId.name
                } : null
            },
        },
    });
});

// ----------------------------------------------------------------
// 2. Fetch Current User Data (Me)
// ----------------------------------------------------------------
export const getMe = catchAsync(async (req, res, next) => {
    // در فایل‌های Middleware باید توکن استخراج شده و req.user ست شود،
    // اما ما در اینجا یوزر را مجدد از دیتابیس میخوانیم تا جدیدترین دسترسی‌ها را بگیریم
    const userId = req.user.id; // این فرض بر این است که middleware توکن را باز کرده و اینجا گذاشته است

    const user = await User.findById(userId).populate("restaurantId", "subscriptionStatus isActive name logoUrl");

    if (!user) {
        return next(new HandleERROR("User not found", 404));
    }

    if (!user.isActive) {
        return next(new HandleERROR("Your account has been deactivated.", 403));
    }

    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                restaurant: user.restaurantId ? {
                    id: user.restaurantId._id,
                    name: user.restaurantId.name,
                    status: user.restaurantId.subscriptionStatus
                } : null
            }
        },
    });
});