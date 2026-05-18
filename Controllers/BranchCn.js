import Branch from "../Models/BranchMd.js";
import Organization from "../Models/OrganizationMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. Create a new Branch under an Organization
// ------------------------------------------------------------------
export const createBranch = catchAsync(async (req, res, next) => {
    const { organizationId, name, slug, address, location, phone } = req.body;

    if (!organizationId || !name || !slug) {
        return next(new HandleERROR("Organization ID, branch name, and slug are required", 400));
    }

    // Verify the parent organization exists
    const org = await Organization.findOne({ _id: organizationId, isArchived: false });
    if (!org) {
        return next(new HandleERROR("Organization not found", 404));
    }

    const newBranchData = { organizationId, name, slug, address, location, phone };
    if (req.file) {
        newBranchData.media = { logo: `/uploads/${req.file.filename}` };
    }

    const newBranch = await Branch.create(newBranchData);

    return res.status(201).json({
        success: true,
        message: "Branch created successfully",
        data: { branch: newBranch }
    });
});

// ------------------------------------------------------------------
// 2. Get all Branches (with filtering, sorting, pagination)
// ------------------------------------------------------------------
export const getAllBranches = catchAsync(async (req, res, next) => {
    const role = req.user ? req.user.role : "guest";

    const features = new ApiFeatures(Branch, req.query, role)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    features.addManualFilters({ isArchived: false });

    // Public/customer view: only active branches with active org subscription
    if (role === "guest" || role === "customer") {
        features.addManualFilters({ isActive: true });
    }

    const result = await features.execute();

    return res.status(200).json({
        success: true,
        message: "Branches retrieved successfully",
        count: result.count,
        data: { branches: result.data }
    });
});

// ------------------------------------------------------------------
// 3. Get a single Branch by ID or slug
// ------------------------------------------------------------------
export const getBranchByIdOrSlug = catchAsync(async (req, res, next) => {
    const { identifier } = req.params;

    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const branch = await Branch.findOne({ ...query, isArchived: false })
        .populate("organizationId", "name slug subscription");

    if (!branch) {
        return next(new HandleERROR("Branch not found", 404));
    }

    return res.status(200).json({
        success: true,
        data: { branch }
    });
});

// ------------------------------------------------------------------
// 4. Find nearby Branches (Radius Search)
// ------------------------------------------------------------------
export const getBranchesWithinRadius = catchAsync(async (req, res, next) => {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng || !distance) {
        return next(new HandleERROR("Please provide latitude, longitude, and distance.", 400));
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(distance);

    const branches = await Branch.find({
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
        isArchived: false
    }).populate("organizationId", "name slug");

    return res.status(200).json({
        success: true,
        message: `Found ${branches.length} branches nearby`,
        count: branches.length,
        data: { branches }
    });
});

// ------------------------------------------------------------------
// 5. Update Branch details (SuperAdmin & Owner)
// ------------------------------------------------------------------
export const updateBranch = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const updates = { ...req.body };
    delete updates.organizationId;
    delete updates.isArchived;

    if (req.file) {
        updates["media.logo"] = `/uploads/${req.file.filename}`;
    }

    const targetId = req.user.role === "superAdmin" ? id : req.user.branchId;

    const branch = await Branch.findOneAndUpdate(
        { _id: targetId, isArchived: false },
        updates,
        { new: true, runValidators: true }
    );

    if (!branch) {
        return next(new HandleERROR("Branch not found or permission denied", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Branch updated successfully",
        data: { branch }
    });
});

// ------------------------------------------------------------------
// 6. Toggle Branch active status (SuperAdmin only)
// ------------------------------------------------------------------
export const toggleBranchStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const branch = await Branch.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!branch) return next(new HandleERROR("Branch not found", 404));

    return res.status(200).json({
        success: true,
        message: `Branch has been ${isActive ? "activated" : "suspended"} successfully.`,
        data: { branch }
    });
});

// ------------------------------------------------------------------
// 7. Archive Branch (SuperAdmin only)
// ------------------------------------------------------------------
export const archiveBranch = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const branch = await Branch.findByIdAndUpdate(
        id,
        { isArchived: true, isActive: false },
        { new: true }
    );

    if (!branch) {
        return next(new HandleERROR("Branch not found", 404));
    }

    return res.status(200).json({
        success: true,
        message: "Branch successfully archived"
    });
});
