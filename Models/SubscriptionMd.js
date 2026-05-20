import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization ID is required"],
        unique: true
    },
    plan: {
        type: String,
        enum: ["trial", "basic", "pro", "enterprise"],
        default: "trial"
    },
    status: {
        type: String,
        enum: ["active", "expired", "suspended", "cancelled"],
        default: "active"
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiry date is required"]
    },
    billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly"
    },
    paymentHistory: [{
        amount: { type: Number, required: true },
        paidAt: { type: Date, default: Date.now },
        method: { type: String, default: null },
        transactionId: { type: String, default: null }
    }],
    features: {
        maxBranches: { type: Number, default: 1 },
        maxStaffPerBranch: { type: Number, default: 5 },
        maxCampaigns: { type: Number, default: 3 },
        smsIncluded: { type: Number, default: 0 },
        analyticsLevel: {
            type: String,
            enum: ["basic", "advanced"],
            default: "basic"
        }
    }
}, { timestamps: true });

// Indexes
subscriptionSchema.index({ status: 1, expiresAt: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
