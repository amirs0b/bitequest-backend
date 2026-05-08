import express from "express";
import { syncCart, getActiveCart, finalizeOrder } from "../Controllers/CartCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";

const cartRouter = express.Router();

cartRouter.use(protect);

cartRouter.post("/sync", restrictTo("customer"), syncCart);
cartRouter.get("/my-active-cart", restrictTo("customer"), getActiveCart);
cartRouter.post("/finalize/:cartId", restrictTo("customer"), finalizeOrder);

export default cartRouter;