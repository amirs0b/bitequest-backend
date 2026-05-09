import express from 'express';
import cors from 'cors';
import { fileURLToPath } from "url";
import path from "path";
import morgan from "morgan";
import { catchError, HandleERROR } from "vanta-api";

// 1. وارد کردن روت‌ها
import authRouter from "./Routes/Auth.js";
import tenantRouter from "./Routes/Tenant.js";
import userRouter from "./Routes/User.js";
import menuRouter from "./Routes/Menu.js";
import campaignRouter from "./Routes/Campaign.js";
import cartRouter from "./Routes/Cart.js";
import analyticsRouter from "./Routes/Analytics.js";
import customerAuthRouter from "./Routes/CustomerAuth.js";
import qrRouter from "./Routes/QrCode.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();

// 2. میدل‌ورهای پایه
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// 3. تنظیم پوشه‌های عمومی برای عکس‌ها (استاندارد لینوکس - تماماً با حروف کوچک)
app.use(express.static(path.join(process.cwd(), 'public')));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// 4. اتصال مسیرها (Routes)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tenants", tenantRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/customers/auth", customerAuthRouter);
app.use("/api/v1/qrcode", qrRouter);


// 5. مدیریت مسیرهای پیدا نشده (404)
app.use((req, res, next) => {
    return next(new HandleERROR("Not found", 404));
});

// 6. استفاده از مدیریت خطای استاندارد پکیج شما
app.use(catchError);

export default app;