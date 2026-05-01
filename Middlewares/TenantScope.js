import { catchAsync, HandleERROR } from "vanta-api";

export const applyTenantScope = catchAsync(async (req, res, next) => {
    const userRole = req.user.role;
    const userRestaurantId = req.user.restaurantId;

    // اگر کاربر کادر اصلی ما (سوپر ادمین یا استاف داخلی) بود، نیازی به محدودیت اجباری نیست
    if (userRole === "SUPER_ADMIN" || userRole === "INTERNAL_STAFF") {
        return next();
    }

    // اگر کاربر پرسنل یا ادمینِ یک رستوران بود:
    if (userRole === "TENANT_OWNER" || userRole === "TENANT_STAFF") {

        // 1. در متدهای گرفتن لیست (GET)، فیلتر مربوط به رستوران خودش رو به زور به سرچ اضافه می‌کنیم
        if (req.method === "GET") {
            req.query.restaurantId = userRestaurantId;
        }

        // 2. در متدهای ساختن یا ویرایش، آیدی رستورانِ خودش رو به بدنه تزریق می‌کنیم،
        // تا اگر آیدی رستوران دیگه‌ای رو فرستاده بود، سیستم بازنویسی (Overwrite) کنه!
        if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
            req.body.restaurantId = userRestaurantId;
        }

        return next();
    }

    // اگر نقش ناشناخته بود
    return next(new HandleERROR("Role is not authorized for scoping", 403));
});