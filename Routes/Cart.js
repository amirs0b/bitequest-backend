import express from "express";
import { syncCart, getActiveCart, finalizeOrder } from "../Controllers/CartCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const cartRouter = express.Router();

// تمام عملیات سبد خرید نیاز به لاگین دارند
cartRouter.use(protect);

// -----------------------------------------------------------
// روت‌های یکپارچه و مشتری‌محور
// -----------------------------------------------------------
cartRouter.post("/sync", restrictTo("customer"), syncCart);
cartRouter.get("/my-active-cart", restrictTo("customer"), getActiveCart);

// مسیر کلیدی: مشتری خودش تایید نهایی را می‌زند
cartRouter.post("/finalize/:cartId", restrictTo("customer"), finalizeOrder);

export default cartRouter;