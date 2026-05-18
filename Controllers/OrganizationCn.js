import Organization from "../Models/OrganizationMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. Create a new Organization (SuperAdmin only)
// ------------------------------------------------------------------
export const createOrganization = catchAsync(async (req, res, next) => {
    const { name, slug, subscription } = req.body;

    if (!name || !slug) {
        return next(new HandleERROR("Organization name and slug are required", 400));
    }

    const newOrg = await Organization.create({ name, slug, subscription });

    return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: { organization: newOrg }
    });
});

// ------------------------------------------------------------------
// 2. Get all Organizations (with filtering, sorting, pagination)
// ------------------------------------------------------------------
export const getAllOrganizations = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(Organization, req.query, req.user.role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    features.addManualFilters({ isArchived: false });

    const result = await features.execute();

    return res.status(200).json({
        success: true,
        message: "Organizations retrieved successfully",
        count: result.count,
        data: { organizations: result.data }
    });
});

// ------------------------------------------------------------------
// 3. Get a single Organization by ID or slug
// ------------------------------------------------------------------
export const getOrganizationByIdOrSlug = catchAsync(async (req, res, next) => {
    const { identifier } = req.params;

    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const organization = await Organization.findOne({ ...query, isArchived: false });

    if (!organization) {
        return next(new HandleERROR("Organization not found", 404));
    }

    return res.status(200).json({
        success: true,
        data: { organization }
    });
});

// ------------------------------------------------------------------
// 4. Update Organization details (SuperAdmin & Owner)
// ------------------------------------------------------------------
export const updateOrganization = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const updates = { ...req.body };
    delete updates.subscription;
    delete updates.smsWalletBalance;
    delete updates.isArchived;

    const targetId = req.user.role === "superAdmin" ? id : req.user.organizationId;

    const organization = await Organization.findOneAndUpdate(
        { _id: targetId, isArchived: false },
        updates,
        { new: true, runValidators: true }
    );

    if (!organization) {
        return next(new HandleERROR("Organization not found or permission denied", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Organization updated successfully",
        data: { organization }
    });
});

// ------------------------------------------------------------------
// 5. Manage subscription & SMS wallet (SuperAdmin only)
// ------------------------------------------------------------------
export const updateSubscription = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, plan, expiresAt, smsWalletCharge } = req.body;

    const organization = await Organization.findOne({ _id: id, isArchived: false });

    if (!organization) {
        return next(new HandleERROR("Organization not found", 404));
    }

    if (status) organization.subscription.status = status;
    if (plan) organization.subscription.plan = plan;
    if (expiresAt) organization.subscription.expiresAt = expiresAt;

    if (smsWalletCharge && typeof smsWalletCharge === "number") {
        organization.smsWalletBalance += smsWalletCharge;
    }

    await organization.save();

    return res.status(200).json({
        success: true,
        message: "Subscription updated",
        data: {
            subscription: organization.subscription,
            smsWalletBalance: organization.smsWalletBalance
        }
    });
});

// ------------------------------------------------------------------
// 6. Archive Organization (SuperAdmin only)
// ------------------------------------------------------------------
export const archiveOrganization = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const organization = await Organization.findByIdAndUpdate(
        id,
        { isArchived: true },
        { new: true }
    );

    if (!organization) {
        return next(new HandleERROR("Organization not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Organization successfully archived"
    });
});
