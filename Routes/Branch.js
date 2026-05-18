import express from "express";
import {
    createBranch,
    getAllBranches,
    getBranchByIdOrSlug,
    getBranchesWithinRadius,
    updateBranch,
    toggleBranchStatus,
    archiveBranch
} from "../Controllers/BranchCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { uploadSingleImage } from "../Middlewares/UploadMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const branchRouter = express.Router();

// Public routes
branchRouter.get("/", getAllBranches);
branchRouter.get("/search/nearby", getBranchesWithinRadius);
branchRouter.get("/:identifier", getBranchByIdOrSlug);

// Authenticated routes
branchRouter.use(protect);

branchRouter.patch("/:id", requirePermission(PERMISSIONS.BRANCH_EDIT), uploadSingleImage, updateBranch);

// SuperAdmin only
branchRouter.use(restrictTo("superAdmin"));
branchRouter.post("/", uploadSingleImage, createBranch);
branchRouter.patch("/:id/status", toggleBranchStatus);
branchRouter.delete("/:id", archiveBranch);

export default branchRouter;
