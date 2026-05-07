import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: [true, "Tenant ID is required"]
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

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;