import express from "express";
import { syncCart, getActiveCart, finalizeOrder } from "../Controllers/CartCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const cartRouter = express.Router();

// تمام عملیات سبد خرید نیاز به احراز هویت دارد
cartRouter.use(protect);

// 1. روت‌های مخصوص مشتری (ثبت رفتار و مشاهده سبد خودش)
cartRouter.post("/sync", restrictTo("customer"), syncCart);
cartRouter.get("/my-active-cart", getActiveCart);

// 2. روت‌های مخصوص گارسون و مدیر رستوران (مشاهده سبد مشتری و نهایی‌سازی)
// گارسون با داشتن آیدی مشتری یا آیدی سبد، سفارش را نهایی می‌کند
cartRouter.get("/view-customer-cart", restrictTo("owner", "manager", "cashier", "staff"), getActiveCart);
cartRouter.post("/finalize/:cartId", restrictTo("owner", "manager", "cashier", "staff"), finalizeOrder);

export default cartRouter;