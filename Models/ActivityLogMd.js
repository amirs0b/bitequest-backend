import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        default: null
    },
    userId: { // برای لاگ کارهای مدیران و پرسنل
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    customerId: { // برای لاگ بازی‌های مشتریان رستوران
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    actionType: {
        type: String,
        required: [true, "Action type is required"]
        // مثال: "GAME_PLAYED", "DISCOUNT_GENERATED", "MENU_UPDATED"
    },
    description: {
        type: String
    },
    // معدن اصلی KPIهای داینامیک اینجاست!
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {timestamps: true})

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema)
export default ActivityLog