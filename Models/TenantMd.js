import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Tenant name is required"] },
    slug: { type: String, required: [true, "Slug is required"], unique: true, lowercase: true },
    address: { city: String, street: String, fullAddress: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    media: { logo: { type: String, default: "" }, coverImage: { type: String, default: "" } },
    subscription: {
        status: { type: String, enum: ["active", "expired", "suspended"], default: "active" },
        plan: { type: String, enum: ["basic", "pro", "enterprise"], default: "basic" },
        expiresAt: { type: Date, required: true }
    },
    smsWalletBalance: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false } // فیلد جدید
}, { timestamps: true });

tenantSchema.index({ location: '2dsphere' });
const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;