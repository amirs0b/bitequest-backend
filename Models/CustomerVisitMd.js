import mongoose from "mongoose";

const customerVisitSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer ID is required"]
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Branch ID is required"]
    },

    // RFM data (auto-calculated)
    firstVisit: {
        type: Date,
        default: null
    },
    lastVisit: {
        type: Date,
        default: null
    },
    totalVisits: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    averageOrderValue: {
        type: Number,
        default: 0
    },

    // Discount bank for this specific restaurant
    discountBank: [{
        voucherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voucher"
        },
        discountPercentage: { type: Number },
        posCode: { type: String, default: null },
        expiresAt: { type: Date },
        isUsed: { type: Boolean, default: false }
    }],

    isSubscribedToSMS: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Unique compound index: one record per customer per branch
customerVisitSchema.index({ customerId: 1, branchId: 1 }, { unique: true });

// Query performance indexes
customerVisitSchema.index({ branchId: 1, lastVisit: -1 });
customerVisitSchema.index({ branchId: 1, totalVisits: -1 });
customerVisitSchema.index({ branchId: 1, totalSpent: -1 });

const CustomerVisit = mongoose.model("CustomerVisit", customerVisitSchema);
export default CustomerVisit;
