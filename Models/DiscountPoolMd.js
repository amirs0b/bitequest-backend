import mongoose from "mongoose";

const discountPoolSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Branch ID is required"]
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        required: [true, "Campaign ID is required"]
    },
    type: {
        type: String,
        enum: ["universal", "limited", "oneTime", "timeBased", "smartReturn"],
        required: [true, "Discount type is required"]
    },

    // === For "universal" type ===
    universalCode: {
        type: String,
        default: null
    },

    // === For "limited" and "oneTime" types ===
    codes: [{
        code: { type: String },
        isUsed: { type: Boolean, default: false },
        usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
        usedAt: { type: Date, default: null }
    }],
    totalCodes: {
        type: Number,
        default: 0
    },
    remainingCodes: {
        type: Number,
        default: 0
    },

    // === For "timeBased" type ===
    schedule: {
        validDays: [{
            type: String,
            enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]
        }],
        validHours: {
            start: { type: String, default: "00:00" },
            end: { type: String, default: "23:59" }
        },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null }
    },

    // === For "smartReturn" type ===
    returnConfig: {
        baseDiscount: { type: Number, default: 0 },
        urgencyDiscount: { type: Number, default: 0 },
        urgencyWindowHours: { type: Number, default: 24 },
        targetDaysSinceLastVisit: { type: Number, default: 14 }
    },

    discountPercentage: {
        type: Number,
        required: [true, "Discount percentage is required"]
    },
    maxDiscountAmount: {
        type: Number,
        default: 0
    },
    posCode: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
discountPoolSchema.index({ branchId: 1, isActive: 1, isArchived: 1 });
discountPoolSchema.index({ campaignId: 1 });
discountPoolSchema.index({ type: 1, isActive: 1 });

// Virtual: check if codes are still available for "limited" and "oneTime" types
discountPoolSchema.virtual("hasAvailableCodes").get(function () {
    if (this.type === "limited" || this.type === "oneTime") {
        return this.remainingCodes > 0;
    }
    return true;
});

// Method: check overall availability (active, not archived, codes available)
discountPoolSchema.methods.isAvailable = function () {
    if (!this.isActive || this.isArchived) return false;

    if (this.type === "limited" || this.type === "oneTime") {
        return this.remainingCodes > 0;
    }

    if (this.type === "timeBased") {
        const now = new Date();
        if (this.schedule.startDate && now < this.schedule.startDate) return false;
        if (this.schedule.endDate && now > this.schedule.endDate) return false;

        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const today = dayNames[now.getDay()];
        if (this.schedule.validDays.length > 0 && !this.schedule.validDays.includes(today)) return false;

        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (currentTime < this.schedule.validHours.start || currentTime > this.schedule.validHours.end) return false;
    }

    return true;
};

// Ensure virtuals are included in JSON output
discountPoolSchema.set("toJSON", { virtuals: true });
discountPoolSchema.set("toObject", { virtuals: true });

const DiscountPool = mongoose.model("DiscountPool", discountPoolSchema);
export default DiscountPool;
