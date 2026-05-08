import Tenant from "../Models/TenantMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. ساخت رستوران جدید (دسترسی: فقط superAdmin)
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
    const role = req.user ? req.user.role : 'guest';

    const features = new ApiFeatures(Tenant, req.query, role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // فیلتر اصلی: هرگز رستوران‌های بایگانی شده را نشان نده
    features.addManualFilters({ isArchived: false });

    // فیلتر برای مشتریان: فقط رستوران‌های فعال با اشتراک معتبر
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

    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    // جستجو با شرط عدم بایگانی
    const tenant = await Tenant.findOne({ ...query, isArchived: false });

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
// 4. جستجوی رستوران‌های اطراف (Radius Search)
// ------------------------------------------------------------------
export const getTenantsWithinRadius = catchAsync(async (req, res, next) => {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng || !distance) {
        return next(new HandleERROR("Please provide latitude, longitude, and distance.", 400));
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(distance);

    const tenants = await Tenant.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: radiusInMeters
            }
        },
        isActive: true,
        isArchived: false,
        "subscription.status": "active"
    });

    return res.status(200).json({
        success: true,
        message: `Found ${tenants.length} restaurants nearby`,
        count: tenants.length,
        data: {
            tenants
        }
    });
});

// ------------------------------------------------------------------
// 5. ویرایش اطلاعات رستوران (دسترسی: superAdmin و owner)
// ------------------------------------------------------------------
export const updateTenant = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const updates = { ...req.body };
    delete updates.subscription;
    delete updates.smsWalletBalance;
    delete updates.isArchived;

    const tenant = await Tenant.findOneAndUpdate(
        { _id: id, isArchived: false },
        updates,
        { new: true, runValidators: true }
    );

    if (!tenant) {
        return next(new HandleERROR("Tenant not found or permission denied", 404));
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
// 6. مدیریت اشتراک و شارژ مالی (فقط superAdmin)
// ------------------------------------------------------------------
export const updateSubscription = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, plan, expiresAt, smsWalletCharge } = req.body;

    const tenant = await Tenant.findOne({ _id: id, isArchived: false });

    if (!tenant) {
        return next(new HandleERROR("Tenant not found", 404));
    }

    if (status) tenant.subscription.status = status;
    if (plan) tenant.subscription.plan = plan;
    if (expiresAt) tenant.subscription.expiresAt = expiresAt;

    if (smsWalletCharge && typeof smsWalletCharge === 'number') {
        tenant.smsWalletBalance += smsWalletCharge;
    }

    await tenant.save();

    return res.status(200).json({
        success: true,
        message: "Subscription updated",
        data: {
            subscription: tenant.subscription,
            smsWalletBalance: tenant.smsWalletBalance
        }
    });
});

// ------------------------------------------------------------------
// 7. بایگانی رستوران - جایگزین حذف (فقط superAdmin)
// ------------------------------------------------------------------
export const archiveTenant = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const tenant = await Tenant.findByIdAndUpdate(
        id,
        { isArchived: true },
        { new: true }
    );

    if (!tenant) {
        return next(new HandleERROR("Tenant not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Tenant successfully archived"
    });
});