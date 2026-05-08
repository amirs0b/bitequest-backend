import mongoose from "mongoose";

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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    conditions: {
        minCartValue: { type: Number, default: 0 },
        validDays: [{
            type: String,
            enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
        }],
        validHours: {
            start: { type: String, default: "00:00" },
            end: { type: String, default: "23:59" }
        }
    },
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true }
    }],
    tiers: [{
        requiredCorrectAnswers: { type: Number, required: true },
        discountPercentage: { type: Number, required: true },
        maxDiscountAmount: { type: Number, default: 0 },
        validityDays: { type: Number, default: 7 },
        posCode: { type: String, default: null } // کد تعریف شده در سیستم حسابداری رستوران
    }]
}, { timestamps: true });

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;