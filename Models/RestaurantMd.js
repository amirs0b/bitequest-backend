import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    // --- اطلاعات پایه ---
    name: {
        type: String,
        required: [true, "Restaurant name is required"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: [true, "Slug must be unique"],
        lowercase: true,
        trim: true
    },
    address: { type: String }, // اضافه شده جهت ثبت آدرس
    phone:   { type: String }, // اضافه شده جهت تماس پشتیبانی

    // --- رسانه‌ها ---
    logoUrl: { type: String },
    coverImage: { type: String },

    // --- تنظیمات مالی و سفارش‌گیری ---
    taxRate: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    isAcceptingOrders: { type: Boolean, default: false },

    // --- اشتراک و مالی B2B ---
    subscriptionStatus: {
        type: String,
        enum: ["ACTIVE", "SUSPENDED", "EXPIRED"],
        default: "ACTIVE"
    },
    subscriptionValidUntil: { type: Date },
    smsBalance: { type: Number, default: 0 },

    // --- تنظیمات بازاریابی بازی‌وار شده (Gamification) ---
    gameSettings: {
        consolationDiscountEnabled: { type: Boolean, default: true }, // فعال بودن تخفیف تسلی‌بخش (بازنده‌ها)
        upsellEnabled: { type: Boolean, default: true }               // فعال بودن فروش بیش‌فروشی!
    },

    // --- KPI و آمار (عدم نیاز به کوئری سنگین) ---
    kpiStats: {
        totalGamesPlayed: { type: Number, default: 0 },
        totalDiscountsGiven: { type: Number, default: 0 }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;