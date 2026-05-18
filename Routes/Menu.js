import express from "express";
import {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    archiveMenuItem
} from "../Controllers/MenuCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";
import { uploadSingleImage } from "../Middlewares/UploadMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";

const menuRouter = express.Router();

// -----------------------------------------------------------
// روت‌های عمومی (مشتریان و بازدیدکنندگان)
// -----------------------------------------------------------
menuRouter.get("/", getAllMenuItems);
menuRouter.get("/:id", getMenuItemById);

// -----------------------------------------------------------
// روت‌های مدیریتی (قفل‌گذاری شده با PBAC)
// -----------------------------------------------------------
menuRouter.use(protect);
menuRouter.use(applyBranchScope);

// دسترسی ساخت غذای جدید (MNU-102)
menuRouter.post("/", requirePermission(PERMISSIONS.MENU_CREATE), uploadSingleImage, createMenuItem);

// دسترسی ویرایش غذا (MNU-103)
menuRouter.patch("/:id", requirePermission(PERMISSIONS.MENU_EDIT), uploadSingleImage, updateMenuItem);

// دسترسی آرشیو کردن غذا (MNU-104)
menuRouter.delete("/:id", requirePermission(PERMISSIONS.MENU_ARCHIVE), archiveMenuItem);

export default menuRouter;