import express from "express";
import { requestOtp, verifyOtp, sendNotification } from "../Controllers/CustomerAuthCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const customerAuthRouter = express.Router();

// -----------------------------------------------------------
// مسیرهای عمومی (بدون نیاز به لاگین)
// -----------------------------------------------------------
// درخواست و تایید رمز یکبار مصرف
customerAuthRouter.post("/request-otp", requestOtp);
customerAuthRouter.post("/verify-otp", verifyOtp);

// -----------------------------------------------------------
// مسیرهای محافظت‌شده (نیاز به توکن مدیریتی یا سیستمی)
// -----------------------------------------------------------
customerAuthRouter.use(protect);

// ارسال پیامک تبلیغاتی/تخفیف به مشتری (فقط توسط پرسنل رستوران)
customerAuthRouter.post("/notify", restrictTo("superAdmin", "owner", "manager"), sendNotification);

export default customerAuthRouter;