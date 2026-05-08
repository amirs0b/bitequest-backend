import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: [true, "Tenant ID is required"]
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer ID is required"]
    },
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: String, // ذخیره نام برای تحلیل سریع‌تر بدون Join
        price: Number,
        quantity: { type: Number, default: 1 }
    }],
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
        default: null
    },
    status: {
        type: String,
        enum: ["active", "finalized", "abandoned"],
        default: "active"
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;