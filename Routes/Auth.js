import express from "express";
import {
    staffLogin,
    getMe // 👈 توابع مشتریان از اینجا حذف شدند
} from "../Controllers/AuthCn.js";
import { protect } from "../Middlewares/AuthMw.js";

const authRouter = express.Router();

// مسیر ورود پرسنل و مدیران (با نام کاربری و رمز عبور)
authRouter.route("/staff-login").post(staffLogin);

// مسیر دریافت اطلاعات پروفایل (مشترک برای پرسنل و مشتریان - نیاز به توکن دارد)
authRouter.route("/me").get(protect, getMe);

export default authRouter;