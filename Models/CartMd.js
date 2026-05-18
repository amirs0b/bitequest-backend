import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
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
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1, min: 1 }
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

// Indexes
cartSchema.index({ customerId: 1, branchId: 1, status: 1 });
cartSchema.index({ status: 1, updatedAt: 1 });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;