import express from "express";
import { getAuditLogs } from "../Controllers/AuditLogCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const auditLogRouter = express.Router();

// تمام مسیرهای لاگ نیاز به لاگین دارند
auditLogRouter.use(protect);

// 👈 فقط مالک رستوران و سوپرادمین حق دیدن لاگ‌ها را دارند
auditLogRouter.use(restrictTo("superAdmin", "owner"));

auditLogRouter.route("/").get(getAuditLogs);

export default auditLogRouter;