import express from "express";
import {
    createTicket,
    getAllTickets,
    getTicketById,
    replyToTicket,
    updateTicketStatus
} from "../Controllers/TicketCn.js";
import { protect } from "../Middlewares/AuthMw.js";
import { applyBranchScope } from "../Middlewares/TenantScopeMw.js";
import { requirePermission, PERMISSIONS } from "../Middlewares/PermissionMw.js";
import { uploadMultipleImages } from "../Middlewares/UploadMw.js"; // 👈 استفاده از آپلود چندتایی برای پیوست‌ها

const ticketRouter = express.Router();

// ------------------------------------------------------------------
// 1. محافظت پایه و جلوگیری از نشت دیتا بین رستوران‌ها
// ------------------------------------------------------------------
ticketRouter.use(protect);
ticketRouter.use(applyBranchScope);

// ------------------------------------------------------------------
// 2. مسیرهای عملیاتی با قفل‌های امنیتی PBAC
// ------------------------------------------------------------------

// 👈 مشاهده لیست تیکت‌ها و جزئیات (نیاز به کد TKT-801)
ticketRouter.get("/", requirePermission(PERMISSIONS.TICKET_VIEW), getAllTickets);
ticketRouter.get("/:id", requirePermission(PERMISSIONS.TICKET_VIEW), getTicketById);

// 👈 باز کردن تیکت جدید به همراه آپلود مدارک (نیاز به کد TKT-802)
ticketRouter.post("/", requirePermission(PERMISSIONS.TICKET_CREATE), uploadMultipleImages, createTicket);

// 👈 ارسال پاسخ به یک تیکت خاص به همراه مدارک (نیاز به کد TKT-803)
ticketRouter.post("/:id/reply", requirePermission(PERMISSIONS.TICKET_REPLY), uploadMultipleImages, replyToTicket);

// 👈 بستن تیکت یا تغییر وضعیت آن (نیاز به کد TKT-804)
ticketRouter.patch("/:id/status", requirePermission(PERMISSIONS.TICKET_CLOSE), updateTicketStatus);

export default ticketRouter;