import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        unique: [true, "Phone number must be unique"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // دیتای طلایی برای استخراج KPIهای رفتار مشتریان
    totalGamesPlayed: {
        type: Number,
        default: 0
    },
    totalDiscountsWon: {
        type: Number,
        default: 0
    }
}, {timestamps: true})

const Customer = mongoose.model("Customer", customerSchema)
export default Customer