import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: [true, "Restaurant ID is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"]
    },
    type: {
        type: String,
        enum: ["SUBSCRIPTION_PRO", "SUBSCRIPTION_BASIC", "SMS_WALLET_TOPUP"],
        required: [true, "Transaction type is required"]
    },
    status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING"
    },
    referenceId: {
        type: String // کدرهگیری درگاه بانکی
    }
}, {timestamps: true})

const Transaction = mongoose.model("Transaction", transactionSchema)
export default Transaction