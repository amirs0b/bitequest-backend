import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        default: null // اگر null باشد یعنی کارمند SaaS خودمان است
    },
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ["SUPER_ADMIN", "INTERNAL_STAFF", "TENANT_OWNER", "TENANT_STAFF"]
    },
    permissions: [{
        type: String // آرایه دسترسی‌های داینامیک
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const User = mongoose.model("User", userSchema)
export default User