import MenuItem from "../Models/MenuMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. افزودن غذای جدید به منو (دسترسی: superAdmin, owner, manager)
// ------------------------------------------------------------------
export const createMenuItem = catchAsync(async (req, res, next) => {
    const { name, price, category } = req.body;
    // نکته: req.body.tenantId توسط میدل‌ور applyTenantScope به صورت خودکار اضافه شده است

    if (!name || !price || !category) {
        return next(new HandleERROR("Name, price, and category are required", 400));
    }

    // 👈 مدیریت آپلود عکس در زمان ایجاد غذای جدید
    if (req.file) {
        req.body.image = `/uploads/${req.file.filename}`;
    }

    const newMenuItem = await MenuItem.create({
        tenantId: req.body.tenantId,
        name,
        price,
        category,
        image: req.body.image // آدرسی که از ریکوئست یا آپلودر آمده است ثبت می‌شود
    });

    return res.status(201).json({
        success: true,
        message: "Menu item created successfully",
        data: {
            item: newMenuItem
        }
    });
});

// ------------------------------------------------------------------
// 2. دریافت لیست غذاهای منو (با قابلیت فیلتر و جستجو)
// ------------------------------------------------------------------
export const getAllMenuItems = catchAsync(async (req, res, next) => {
    const role = req.user ? req.user.role : 'guest';

    const features = new ApiFeatures(MenuItem, req.query, role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // قانون اول: هرگز غذاهای آرشیو شده (حذف شده) را در هیچ لیستی نشان نده
    features.addManualFilters({ isArchived: false });

    // قانون دوم: اگر درخواست از طرف مشتری (یا مهمان) است
    if (role === 'guest' || role === 'customer') {
        // الف) فقط غذاهای موجود را نشان بده
        features.addManualFilters({ isAvailable: true });

        // ب) حتما باید مشخص کند منوی کدام رستوران را می‌خواهد
        if (!req.query.tenantId) {
            return next(new HandleERROR("Restaurant ID (tenantId) is required to view the menu.", 400));
        }
    }

    const result = await features.execute();

    return res.status(200).json({
        success: true,
        message: "Menu items retrieved successfully",
        count: result.count,
        data: {
            items: result.data
        }
    });
});

// ------------------------------------------------------------------
// 3. دریافت اطلاعات تکمیلی یک غذا (با ID)
// ------------------------------------------------------------------
export const getMenuItemById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // غذای آرشیو شده نباید به صورت مستقیم هم پیدا شود
    const item = await MenuItem.findOne({ _id: id, isArchived: false });

    if (!item) {
        return next(new HandleERROR("Menu item not found", 404));
    }

    return res.status(200).json({
        success: true,
        data: {
            item
        }
    });
});

// ------------------------------------------------------------------
// 4. ویرایش مشخصات غذا (دسترسی: superAdmin, owner, manager)
// ------------------------------------------------------------------
export const updateMenuItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // 👈 مدیریت آپدیت عکس (اگر فایل جدیدی ارسال شده باشد، جایگزین می‌شود)
    if (req.file) {
        req.body.image = `/uploads/${req.file.filename}`;
    }

    // کوئری امن: هم آیدی غذا چک می‌شود، هم آرشیو نبودن، و هم دسترسی صاحب رستوران
    const query = { _id: id, isArchived: false };
    if (req.user.role !== "superAdmin") {
        query.tenantId = req.user.tenantId; // تا owner نتواند غذای رستوران رقیب را ویرایش کند
    }

    const item = await MenuItem.findOneAndUpdate(query, req.body, {
        new: true,
        runValidators: true
    });

    if (!item) {
        return next(new HandleERROR("Item not found or you do not have permission to modify it", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Menu item updated successfully",
        data: {
            item
        }
    });
});

// ------------------------------------------------------------------
// 5. آرشیو کردن غذا - جایگزین Soft Delete (دسترسی: superAdmin, owner)
// ------------------------------------------------------------------
export const archiveMenuItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const query = { _id: id, isArchived: false };
    if (req.user.role !== "superAdmin") {
        query.tenantId = req.user.tenantId;
    }

    // به جای حذف فیزیکی، فقط فیلد بایگانی را فعال می‌کنیم
    const item = await MenuItem.findOneAndUpdate(query, { isArchived: true }, { new: true });

    if (!item) {
        return next(new HandleERROR("Item not found or permission denied", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Menu item successfully removed from active menu (Archived)"
    });
});