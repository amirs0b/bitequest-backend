import express from "express";
import {
    getPlatformGlobalStats,
    getExpiringSubscriptions
} from "../Controllers/SuperAdminCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const superAdminRouter = express.Router();

superAdminRouter.use(protect);
superAdminRouter.use(restrictTo("superAdmin"));

superAdminRouter.get("/stats/global", getPlatformGlobalStats);
superAdminRouter.get("/reports/expiring", getExpiringSubscriptions);

export default superAdminRouter;