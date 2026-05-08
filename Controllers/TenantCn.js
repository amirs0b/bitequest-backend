import Tenant from "../Models/TenantMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. ساخت رستوران جدید (فقط دسترسی برای superAdmin)
// ------------------------------------------------------------------
export const createTenant = catchAsync(async (req, res, next) => {
    const { name, slug, address, location, subscription } = req.body;

    if (!name || !slug) {
        return next(new HandleERROR("Tenant name and slug are required", 400));
    }

    const newTenant = await Tenant.create({
        name,
        slug,
        address,
        location,
        subscription
    });

    return res.status(201).json({
        success: true,
        message: "Tenant created successfully",
        data: {
            tenant: newTenant
        }
    });
});

// ------------------------------------------------------------------
// 2. دریافت لیست رستوران‌ها (با قابلیت جستجو، فیلتر و صفحه‌بندی)
// ------------------------------------------------------------------
export const getAllTenants = catchAsync(async (req, res, next) => {
    // از آنجا که این روت می‌تواند عمومی باشد، اگر توکنی نبود نقش guest در نظر گرفته می‌شود
    const role = req.user ? req.user.role : 'guest';

    const features = new ApiFeatures(Tenant, req.query, role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // اگر درخواست از سمت پرسنل مدیریتی سیستم نیست، فقط رستوران‌های فعال را نشان بده
    if (role === 'guest' || role === 'customer') {
        features.addManualFilters({
            isActive: true,
            "subscription.status": "active"
        });
    }

    const result = await features.execute();

    return res.status(200).json({
        success: true,
        message: "Tenants retrieved successfully",
        count: result.count,
        data: {
            tenants: result.data
        }
    });
});

// ------------------------------------------------------------------
// 3. دریافت اطلاعات یک رستوران خاص (با ID یا Slug)
// ------------------------------------------------------------------
export const getTenantByIdOrSlug = catchAsync(async (req, res, next) => {
    const { identifier } = req.params;

    // تشخیص اینکه آیا پارامتر ObjectId است یا Slug متنی
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };
    const tenant = await Tenant.findOne(query);

    if (!tenant) {
        return next(new HandleERROR("Tenant not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Tenant details retrieved",
        data: {
            tenant
        }
    });
});

// ------------------------------------------------------------------
// 4. جستجوی رستوران‌های اطراف (Radius/Geospatial Search)
// ------------------------------------------------------------------
export const getTenantsWithinRadius = catchAsync(async (req, res, next) => {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng || !distance) {
        return next(new HandleERROR("Please provide latitude (lat), longitude (lng), and distance in meters.", 400));
    }

    // تبدیل مقادیر به عدد
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(distance);

    // استفاده از اپراتور $near برای پیدا کردن و مرتب‌سازی خودکار از نزدیک‌ترین به دورترین
    const tenants = await Tenant.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude] // در MongoDB همیشه اول طول سپس عرض جغرافیایی قرار می‌گیرد
                },
                $maxDistance: radiusInMeters
            }
        },
        isActive: true, // فقط رستوران‌هایی که ما فعال کرده‌ایم
        "subscription.status": "active" // فقط رستوران‌هایی که اشتراکشان تمام نشده است
    });

    return res.status(200).json({
        success: true,
        message: `Found ${tenants.length} tenants within ${radiusInMeters} meters`,
        count: tenants.length,
        data: {
            tenants
        }
    });
});

// ------------------------------------------------------------------
// 5. ویرایش اطلاعات عمومی رستوران (دسترسی: superAdmin و owner)
// ------------------------------------------------------------------
export const updateTenant = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // جلوگیری از تغییر وضعیت اشتراک و مالی توسط خود صاحب رستوران
    const updates = { ...req.body };
    delete updates.subscription;
    delete updates.smsWalletBalance;

    const tenant = await Tenant.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    });

    if (!tenant) {
        return next(new HandleERROR("Tenant not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Tenant updated successfully",
        data: {
            tenant
        }
    });
});

// ------------------------------------------------------------------
// 6. تمدید و مدیریت اشتراک رستوران (بخش مالی - فقط superAdmin)
// ------------------------------------------------------------------
export const updateSubscription = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, plan, expiresAt, smsWalletCharge } = req.body;

    const tenant = await Tenant.findById(id);

    if (!tenant) {
        return next(new HandleERROR("Tenant not found", 404));
    }

    if (status) tenant.subscription.status = status;
    if (plan) tenant.subscription.plan = plan;
    if (expiresAt) tenant.subscription.expiresAt = expiresAt;

    // شارژ کیف پول پیامک (اگر عددی ارسال شده بود به موجودی قبلی اضافه می‌شود)
    if (smsWalletCharge && typeof smsWalletCharge === 'number') {
        tenant.smsWalletBalance += smsWalletCharge;
    }

    await tenant.save();

    return res.status(200).json({
        success: true,
        message: "Tenant subscription and billing updated",
        data: {
            subscription: tenant.subscription,
            smsWalletBalance: tenant.smsWalletBalance
        }
    });
});