import Tenant from "../Models/TenantMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ... توابع createTenant و بقیه همان است، فقط در getAll و findها فیلتر آرشیو اعمال می‌شود

export const getAllTenants = catchAsync(async (req, res, next) => {
    const role = req.user ? req.user.role : 'guest';
    const features = new ApiFeatures(Tenant, req.query, role)
        .filter().sort().limitFields().paginate();

    // فیلتر رستوران‌های بایگانی شده
    features.addManualFilters({ isArchived: false });

    if (role === 'guest' || role === 'customer') {
        features.addManualFilters({ isActive: true, "subscription.status": "active" });
    }

    const result = await features.execute();
    return res.status(200).json({ success: true, count: result.count, data: { tenants: result.data } });
});

// تابع جدید برای بایگانی رستوران
export const archiveTenant = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndUpdate(id, { isArchived: true }, { new: true });

    if (!tenant) return next(new HandleERROR("Tenant not found", 404));

    return res.status(200).json({
        success: true,
        message: "Tenant successfully archived"
    });
});