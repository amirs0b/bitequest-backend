import app from "./app.js";
import dotenv from "dotenv";
import { __dirname } from "./app.js";
import mongoose from "mongoose";

dotenv.config({ path: `${__dirname}/.config.env` });

mongoose
    .connect(process.env.DATA_BASE)
    .then(() => console.log("Database connected"))
    .catch((err) => console.log("Database not connected"));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));