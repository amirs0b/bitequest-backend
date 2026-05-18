import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization ID is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"]
    },
    type: {
        type: String,
        enum: ["subscription_renewal", "sms_wallet_charge"],
        required: [true, "Transaction type is required"]
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    },
    referenceId: {
        type: String
    }
}, { timestamps: true });

// Indexes
transactionSchema.index({ organizationId: 1, status: 1 });
transactionSchema.index({ type: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;