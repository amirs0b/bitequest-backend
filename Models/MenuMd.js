import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Branch ID is required"]
    },
    name: {
        type: String,
        required: [true, "Item name is required"],
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true
    },
    image: {
        type: String,
        default: ""
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
menuItemSchema.index({ branchId: 1, isArchived: 1, isAvailable: 1 });
menuItemSchema.index({ branchId: 1, category: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;