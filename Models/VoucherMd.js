import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: [true, "Tenant ID is required"]
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        required: [true, "Campaign ID is required"]
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    code: {
        type: String,
        required: [true, "Voucher code is required"],
        unique: [true, "Voucher code must be unique"]
    },
    rewardSnapshot: {
        type: { type: String },
        value: { type: Number },
        targetItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null },
        maxDiscountCap: { type: Number, default: null }
    },
    status: {
        type: String,
        enum: ["active", "used", "expired"], // وضعیت active یعنی این کد الان در بانک/کیف‌پول مشتری است
        default: "active"
    }
}, { timestamps: true });

const Voucher = mongoose.model("Voucher", voucherSchema);
export default Voucher;