import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
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
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: [true, "Cart ID is required"]
    },
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 }
    }],
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
        default: null
    },
    totalAmount: { type: Number, required: true },    // جمع کل قبل از تخفیف
    discountAmount: { type: Number, default: 0 },     // مقدار سود مشتری از گیمیفیکیشن
    finalAmount: { type: Number, required: true }     // مبلغی که باید در صندوق پرداخت شود
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;