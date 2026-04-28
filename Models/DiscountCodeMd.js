import mongoose from "mongoose";

const discountCodeSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: [true, "Restaurant ID is required"]
    },
    code: {
        type: String,
        required: [true, "Discount code is required"]
    },
    discountType: {
        type: String,
        enum: ["PERCENTAGE", "FIXED_AMOUNT"],
        required: [true, "Discount type is required"]
    },
    value: {
        type: Number,
        required: [true, "Discount value is required"]
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    minCartValue: {
        type: Number,
        default: null
    },
    applicableMenuItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem"
    }],
    usageLimit: {
        type: Number,
        default: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isFullyConsumed: {
        type: Boolean,
        default: false
    },
    rewardPhase: {
        type: String,
        enum: ["INSTANT", "FUTURE"],
        required: [true, "Reward phase is required"]
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const DiscountCode = mongoose.model("DiscountCode", discountCodeSchema)
export default DiscountCode