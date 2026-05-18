import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Organization name is required"],
        trim: true
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    ownerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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
            required: [true, "Subscription expiry date is required"]
        }
    },
    smsWalletBalance: {
        type: Number,
        default: 0,
        min: [0, "SMS wallet balance cannot be negative"]
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
organizationSchema.index({ slug: 1 });
organizationSchema.index({ "subscription.status": 1 });
organizationSchema.index({ isArchived: 1, "subscription.status": 1 });

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
