import express from 'express';
import cors from 'cors';
import { fileURLToPath } from "url";
import path from "path";
import morgan from "morgan";
import { catchError, HandleERROR } from "vanta-api";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { detectLanguage } from "./Middlewares/LangMw.js";

// 1. Import Routes
import authRouter from "./Routes/Auth.js";
import organizationRouter from "./Routes/Organization.js";
import branchRouter from "./Routes/Branch.js";
import userRouter from "./Routes/User.js";
import menuRouter from "./Routes/Menu.js";
import campaignRouter from "./Routes/Campaign.js";
import cartRouter from "./Routes/Cart.js";
import analyticsRouter from "./Routes/Analytics.js";
import customerAuthRouter from "./Routes/CustomerAuth.js";
import qrRouter from "./Routes/QrCode.js";
import superAdminRouter from "./Routes/SuperAdmin.js";
import ticketRouter from "./Routes/Ticket.js";
import crmRouter from "./Routes/Crm.js";
import auditLogRouter from "./Routes/AuditLog.js";
import voucherRouter from "./Routes/Voucher.js";
import eventRouter from "./Routes/Event.js";
import discountBankRouter from "./Routes/DiscountBank.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();

// 2. میدل‌ورهای پایه
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(detectLanguage);

// 3. تنظیم پوشه‌های عمومی برای عکس‌ها (استاندارد لینوکس - تماماً با حروف کوچک)
app.use(express.static(path.join(process.cwd(), 'public')));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// 4. Mount Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/branches", branchRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/customers/auth", customerAuthRouter);
app.use("/api/v1/crm", crmRouter);
app.use("/api/v1/qrcode", qrRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/superadmin", superAdminRouter);
app.use("/api/v1/audit-logs", auditLogRouter);
app.use("/api/v1/vouchers", voucherRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/discount-bank", discountBankRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// 5. مدیریت مسیرهای پیدا نشده (404)
app.use((req, res, next) => {
    return next(new HandleERROR("Not found", 404));
});

// 6. استفاده از مدیریت خطای استاندارد پکیج شما
app.use(catchError);

export default app;