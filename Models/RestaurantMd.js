import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Restaurant name is required"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: [true, "Slug must be unique"]
    },
    logoUrl: {
        type: String
    },
    coverImage: {
        type: String
    },
    subscriptionStatus: {
        type: String,
        enum: ["ACTIVE", "SUSPENDED", "EXPIRED"],
        default: "ACTIVE"
    },
    subscriptionValidUntil: {
        type: Date
    },
    smsBalance: {
        type: Number,
        default: 0
    },
    gameSettings: {
        consolationDiscountEnabled: { type: Boolean, default: true },
        upsellEnabled: { type: Boolean, default: true }
    },
    // فیلدهای کمکی برای استخراج سریع KPI بدون نیاز به کوئری‌های سنگین
    kpiStats: {
        totalGamesPlayed: { type: Number, default: 0 },
        totalDiscountsGiven: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)
export default Restaurant