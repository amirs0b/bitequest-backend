import { catchAsync } from "vanta-api";

export const applyTenantScope = catchAsync(async (req, res, next) => {
    // 1. اگر کاربری لاگین نکرده باشد، نیازی به این میدل‌ور نیست
    if (!req.user) {
        return next();
    }

    // 2. ادمین کل (superAdmin) و تحلیل‌گر دیتا (analyst) به همه رستوران‌ها دسترسی دارند
    if (req.user.role === "superAdmin" || req.user.role === "analyst") {
        return next();
    }

    // 3. برای پرسنل رستوران (owner, manager, cashier):
    // الف) در درخواست‌های GET، فقط اجازه دارند دیتای رستوران خودشان را ببینند
    if (req.method === "GET") {
        req.query.tenantId = req.user.tenantId;
    }
    // ب) در درخواست‌های POST/PATCH، نمی‌توانند دیتایی برای رستوران دیگری بسازند
    else {
        req.body.tenantId = req.user.tenantId;
    }

    next();
});