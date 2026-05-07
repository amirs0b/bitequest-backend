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
        default: null
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        },
        priceAtTimeOfOrder: { // ثبت قیمت در لحظه خرید، تا اگر منو تغییر کرد، تاریخچه به هم نریزد
            type: Number,
            required: true
        }
    }],
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
        default: null
    },
    status: {
        type: String,
        enum: ["active", "completed", "abandoned"], // وضعیت completed به معنای ثبت در تاریخچه سفارشات مشتری است
        default: "active"
    }
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;