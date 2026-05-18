import AuditLog from "../Models/AuditLogMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// دریافت لیست لاگ‌های سیستم (ردگیری فعالیت‌ها)
// ------------------------------------------------------------------
export const getAuditLogs = catchAsync(async (req, res, next) => {
    // 1. ساخت کوئری پایه و اعمال فیلتر، مرتب‌سازی و صفحه‌بندی
    const features = new ApiFeatures(AuditLog, req.query, req.user.role)
        .filter()
        .sort() // فرانت‌اند می‌تواند با ?sort=-createdAt لاگ‌های جدید را اول بگیرد
        .limitFields()
        .paginate();

    // 2. ایزوله‌سازی داده‌ها: مدیر رستوران فقط لاگ‌های خودش را می‌بیند
    if (req.user.role !== "superAdmin") {
        features.addManualFilters({ branchId: req.user.branchId });
    }

    // 3. اجرای کوئری
    const result = await features.execute();

    // 4. پر کردن (Populate) اطلاعات کاربری که این کار را انجام داده است
    // تا فرانت‌اند بتواند به جای یک آیدی نامفهوم، نام کاربری یا شماره موبایل شخص را نشان دهد
    await AuditLog.populate(result.data, {
        path: "actorId",
        select: "username firstName lastName phone role" // فیلدهای مدل User و Customer
    });

    return res.status(200).json({
        success: true,
        count: result.count,
        data: { logs: result.data }
    });
});