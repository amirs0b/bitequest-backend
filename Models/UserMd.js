import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username must be unique"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        enum: ["superAdmin", "staff", "analyst", "owner", "manager", "cashier"],
        default: "staff"
    },
    // 👈 اضافه شدن فیلد دسترسی‌های خرد (PBAC)
    permissions: [{
        type: String
    }],
    forcePasswordChange: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        default: null
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;