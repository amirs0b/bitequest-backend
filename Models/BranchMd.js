import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization ID is required"]
    },
    name: {
        type: String,
        required: [true, "Branch name is required"],
        trim: true
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        lowercase: true,
        trim: true
    },
    address: {
        city: { type: String, default: "" },
        street: { type: String, default: "" },
        fullAddress: { type: String, default: "" }
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: [true, "Branch coordinates are required"]
        }
    },
    phone: {
        type: String,
        default: ""
    },
    media: {
        logo: { type: String, default: "" },
        coverImage: { type: String, default: "" }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
branchSchema.index({ location: "2dsphere" });
branchSchema.index({ organizationId: 1 });
branchSchema.index({ slug: 1, organizationId: 1 }, { unique: true });
branchSchema.index({ isActive: 1, isArchived: 1 });

const Branch = mongoose.model("Branch", branchSchema);
export default Branch;
