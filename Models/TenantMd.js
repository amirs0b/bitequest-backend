import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tenant name is required"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: [true, "Slug must be unique"],
        lowercase: true
    },
    address: {
        city: { type: String, default: "" },
        street: { type: String, default: "" },
        fullAddress: { type: String, default: "" }
    },
    // ثبت دقیق موقعیت رستوران روی نقشه
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [طول جغرافیایی, عرض جغرافیایی]
            required: true
        }
    },
    media: {
        logo: { type: String, default: "" },
        coverImage: { type: String, default: "" }
    },
    subscription: {
        status: {
            type: String,
            enum: ["active", "expired", "suspended"],
            default: "active"
        },
        plan: {
            type: String,
            enum: ["basic", "pro", "enterprise"],
            default: "basic"
        },
        expiresAt: {
            type: Date,
            required: [true, "Subscription expiration date is required"]
        }
    },
    smsWalletBalance: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// ایجاد ایندکس 2dsphere برای پیدا کردن رستوران‌های نزدیک به مشتری
tenantSchema.index({ location: '2dsphere' });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;