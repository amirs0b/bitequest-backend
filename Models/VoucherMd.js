import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage: { type: Number, required: true },
    maxDiscountAmount: { type: Number, default: 0 },
    posCode: { type: String, default: null }, // 👈 فیلد جدید: ذخیره اسنپ‌شات کد حسابداری برای نمایش به گارسون
    isUsed: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const Voucher = mongoose.model("Voucher", voucherSchema);
export default Voucher;