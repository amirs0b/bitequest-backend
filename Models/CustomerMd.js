import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        unique: [true, "Phone number must be unique"]
    },
    firstName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // 👈 فیلدهای مربوط به احراز هویت پیامکی اضافه شدند
    otp: {
        type: String
    },
    otpExpiresAt: {
        type: Date
    },
    // ذخیره آخرین موقعیت مکانی مشتری برای پیشنهاد رستوران‌های اطراف
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // ساختار استاندارد: [طول جغرافیایی، عرض جغرافیایی]
            default: [0, 0]
        }
    }
}, { timestamps: true });

// ایجاد ایندکس 2dsphere برای جستجوی فوق‌سریع جغرافیایی
customerSchema.index({ location: '2dsphere' });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;