import express from 'express';
import cors from 'cors';
import {fileURLToPath} from "url";
import path from "path";
import morgan from "morgan";
import {catchError, HandleERROR} from "vanta-api";
import authRouter from "./Routes/Auth.js";
import tenantRouter from "./Routes/Tenant.js";




const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json())
app.use(cors())
app.use(morgan("dev"))
app.use(express.static('Public'))

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tenants", tenantRouter);







app.use(( req,res, next) => {
    return next(new HandleERROR("Not found", 404))
})
app.use(catchError)
export default app;