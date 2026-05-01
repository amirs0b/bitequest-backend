import jwt from "jsonwebtoken";
import { catchAsync, HandleERROR } from "vanta-api";
import User from "../Models/UserMd.js";

export const protect = catchAsync(async (req, res, next) => {
    let token;

    // بررسی اینکه آیا هدرِ Authorization وجود دارد و با Bearer شروع می‌شود؟
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(
            new HandleERROR("You are not logged in! Please log in to get access.", 401)
        );
    }

    // رمزگشایی 토کن و تایید آن
    // نکته: چون 토کن محدودیت زمانی (Expiration) ندارد، نیازی به کَچ کردن خطای TokenExpiredError نیست.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // شما می‌توانید در اینجا مستقیماً یوزر رو دوباره از دیتابیس بگیرید یا به همین اطلاعات داخل 토کن اکتفا کنید.
    // اما چون در getMe (در Controller) دوباره یوزر رو می‌گیریم، اینجا فقط دیتای داخل 토کن رو پاس می‌دهیم:
    req.user = {
        id: decoded.id,
        role: decoded.role,
        restaurantId: decoded.restaurantId
    };

    next();
});

// این میدل‌ور دوم هم برای آینده است: برای محدود‌کردن روت‌ها بر اساس آرایه نقش‌ها
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new HandleERROR("You do not have permission to perform this action", 403)
            );
        }
        next();
    };
};