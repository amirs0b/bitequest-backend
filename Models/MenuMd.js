import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: [true, "Tenant ID is required"]
    },
    name: {
        type: String,
        required: [true, "Item name is required"]
    },
    price: {
        type: Number,
        required: [true, "Price is required"]
    },
    category: {
        type: String,
        required: [true, "Category is required"]
    },
    image: {
        type: String,
        default: ""
    },
    isAvailable: {
        type: Boolean,
        default: true // برای زمانی که غذا در همان روز موقتاً تمام شده است (Sold Out)
    },
    isArchived: {
        type: Boolean,
        default: false // برای زمانی که مدیر کلا غذا را از منوی رستوران حذف/بایگانی می‌کند
    }
}, { timestamps: true });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;