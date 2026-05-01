import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        default: null // اگر null باشد یعنی اکانت مربوط به شرکت خودمان است (سوپراِدمین یا کارمندان داخلی)
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
        // نقش‌ها: مدیرعامل، پرسنل داخلی شرکت، مالک رستوران، کارمند رستوران
        enum: ["SUPER_ADMIN", "INTERNAL_STAFF", "TENANT_OWNER", "TENANT_STAFF"]
    },
    permissions: [{
        type: String
        // آرایه طلایی برای تفویض اختیار!
        // مثال: ["CREATE_USER", "DELETE_TENANT", "VIEW_FINANCE"]
    }],
    mustChangePassword: {
        type: Boolean,
        default: true // به صورت پیش‌فرض همه کاربران جدید باید در اولین ورود رمز خود را تغییر دهند
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const User = mongoose.model("User", userSchema)
export default User