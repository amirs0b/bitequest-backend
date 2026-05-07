import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["percentage", "fixed_amount", "free_item", "bogo"],
        required: [true, "Reward type is required"]
    },
    value: {
        type: Number,
        default: 0
    },
    targetItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        default: null
    },
    maxDiscountCap: {
        type: Number,
        default: null
    }
}, { _id: false });

const tierSchema = new mongoose.Schema({
    requiredCorrectAnswers: {
        type: Number,
        required: [true, "Required correct answers count is required"]
    },
    reward: {
        type: rewardSchema,
        required: true
    }
}, { _id: false });

const campaignSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: [true, "Tenant ID is required"]
    },
    title: {
        type: String,
        required: [true, "Campaign title is required"]
    },
    description: {
        type: String,
        default: ""
    },
    tiers: [tierSchema],
    conditions: {
        minCartValue: { type: Number, default: 0 },
        validDays: [{
            type: String,
            enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
        }],
        validHours: {
            start: { type: String, default: "00:00" },
            end: { type: String, default: "23:59" }
        },
        maxUsagePerCustomer: { type: Number, default: 1 },
        totalIssuanceLimit: { type: Number, default: null }
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;