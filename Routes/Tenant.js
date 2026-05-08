import express from "express";
import { createTenant, getAllTenants, getTenantByIdOrSlug, getTenantsWithinRadius, updateTenant, updateSubscription, archiveTenant } from "../Controllers/TenantCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const tenantRouter = express.Router();

tenantRouter.get("/distances", getTenantsWithinRadius);
tenantRouter.get("/", getAllTenants);
tenantRouter.get("/:identifier", getTenantByIdOrSlug);

tenantRouter.use(protect);
tenantRouter.post("/", restrictTo("superAdmin"), createTenant);
tenantRouter.patch("/:id", restrictTo("superAdmin", "owner"), updateTenant);
tenantRouter.patch("/:id/subscription", restrictTo("superAdmin"), updateSubscription);
tenantRouter.delete("/:id", restrictTo("superAdmin"), archiveTenant); // بایگانی رستوران فقط توسط سوپرادمین

export default tenantRouter;