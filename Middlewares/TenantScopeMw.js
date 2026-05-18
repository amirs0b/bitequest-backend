import { catchAsync } from "vanta-api";

/**
 * Branch Scope Middleware
 * Ensures branch-level staff can only access their own branch's data.
 * SuperAdmin and analyst roles bypass scoping (platform-wide access).
 */
export const applyBranchScope = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next();
    }

    // Platform-level roles have unrestricted access
    if (req.user.role === "superAdmin" || req.user.role === "analyst") {
        return next();
    }

    // Branch staff: scope all queries to their assigned branch
    if (req.method === "GET") {
        req.query.branchId = req.user.branchId;
    } else {
        req.body.branchId = req.user.branchId;
    }

    next();
});