import express from "express";
import { getEventTimeline, getEventOverview } from "../Controllers/EventCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const eventRouter = express.Router();

eventRouter.use(protect);
eventRouter.use(applyBranchScope);

// Support: full timeline for a specific actor (superAdmin, owner, manager only)
eventRouter.get(
    "/timeline/:actorId",
    restrictTo("superAdmin", "owner", "manager"),
    getEventTimeline
);

// Manager: aggregated overview with counts and error rates
eventRouter.get(
    "/overview",
    requirePermission(PERMISSIONS.CRM_VIEW),
    getEventOverview
);

export default eventRouter;
