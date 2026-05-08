import express from "express";
import { syncCart, getActiveCart, finalizeOrder } from "../Controllers/CartCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const cartRouter = express.Router();

// تمام عملیات سبد خرید نیاز به لاگین دارند
cartRouter.use(protect);

// -----------------------------------------------------------
// روت‌های مخصوص مشتری (ثبت رفتار و نهایی‌سازی شخصی)
// -----------------------------------------------------------
cartRouter.post("/sync", restrictTo("customer"), syncCart);
cartRouter.get("/my-active-cart", restrictTo("customer"), getActiveCart);
cartRouter.post("/finalize/:cartId", restrictTo("customer"), finalizeOrder); // 👈 مشتری خودش تایید می‌کند

export default cartRouter;