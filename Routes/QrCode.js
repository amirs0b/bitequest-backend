import express from "express";
import { generateTableQrCodes } from "../Controllers/QrCodeCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const qrRouter = express.Router();

qrRouter.use(protect);
qrRouter.use(applyTenantScope);

// دسترسی تولید بارکد میزها (QRC-701)
qrRouter.post("/generate", requirePermission(PERMISSIONS.QR_GENERATE), generateTableQrCodes);

export default qrRouter;