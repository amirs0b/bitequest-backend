import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Branch ID is required"]
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
        quantity: { type: Number, default: 1, min: 1 }
    }],
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
        default: null
    },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// Indexes
orderSchema.index({ branchId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, branchId: 1 });
orderSchema.index({ branchId: 1, voucherId: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;