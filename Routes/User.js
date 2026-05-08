import express from "express";
import { createUser, getAllUsers, updateUser, archiveUser, changeMyPassword } from "../Controllers/UserCn.js";
import { protect, restrictTo } from "../Middlewares/AuthMw.js";
import { applyTenantScope } from "../Middlewares/TenantScopeMw.js";

const userRouter = express.Router();
userRouter.use(protect);

userRouter.patch("/change-password", changeMyPassword);

userRouter.use(restrictTo("superAdmin", "owner"));
userRouter.use(applyTenantScope);

userRouter.route("/")
    .post(createUser)
    .get(getAllUsers);

userRouter.route("/:id")
    .patch(updateUser)
    .delete(archiveUser); // استفاده از تابع بایگانی

export default userRouter;