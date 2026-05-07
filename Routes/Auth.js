import express from "express";
import {login, getMe} from "../../Controllers/AuthCn.js";
import {protect} from "../../Middlewares/Auth.js";

const authRouter = express.Router();

authRouter.route("/").post(login);
authRouter.route("/me").get(protect, getMe);

export default authRouter;