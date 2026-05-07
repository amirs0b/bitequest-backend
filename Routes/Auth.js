import express from "express";
import {
    staffLogin,
    customerSendOTP,
    customerVerifyOTP,
    getMe
} from "../Controllers/AuthCn.js";
import { protect } from "../Middlewares/AuthMw.js";

const authRouter = express.Router();

// مسیر ورود پرسنل و مدیران (با نام کاربری و رمز عبور)
authRouter.route("/staff-login").post(staffLogin);

// مسیرهای ورود مشتریان (با شماره موبایل و کد یک‌بار مصرف)
authRouter.route("/customer/send-otp").post(customerSendOTP);
authRouter.route("/customer/verify-otp").post(customerVerifyOTP);

// مسیر دریافت اطلاعات پروفایل (مشترک برای پرسنل و مشتریان - نیاز به توکن دارد)
authRouter.route("/me").get(protect, getMe);

export default authRouter;