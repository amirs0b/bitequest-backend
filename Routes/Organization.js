import express from "express";
import {
    createOrganization,
    getAllOrganizations,
    getOrganizationByIdOrSlug,
    updateOrganization,
    updateSubscription,
    archiveOrganization
} from "../Controllers/OrganizationCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const organizationRouter = express.Router();

// Public routes
organizationRouter.get("/", getAllOrganizations);
organizationRouter.get("/:identifier", getOrganizationByIdOrSlug);

// Authenticated routes
organizationRouter.use(protect);

organizationRouter.patch("/:id", requirePermission(PERMISSIONS.ORG_EDIT), updateOrganization);

// SuperAdmin only
organizationRouter.use(restrictTo("superAdmin"));
organizationRouter.post("/", createOrganization);
organizationRouter.patch("/:id/subscription", updateSubscription);
organizationRouter.delete("/:id", archiveOrganization);

export default organizationRouter;
