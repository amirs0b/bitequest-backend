import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: [true, "Restaurant ID is required"]
    },
    category: {
        type: String, // مثلاً "نوشیدنی‌ها" (در صورت نیاز می‌توانیم بعداً این را هم یک Model جدا کنیم)
        required: [true, "Category is required"]
    },
    name: {
        type: String,
        required: [true, "Menu item name is required"]
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: [true, "Price is required"]
    },
    imageUrl: {
        type: String
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const MenuItem = mongoose.model("MenuItem", menuItemSchema)
export default MenuItem
