import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        enum: ["superAdmin", "staff", "analyst", "owner", "manager", "cashier"],
        default: "staff"
    },
    permissions: [{
        type: String
    }],
    forcePasswordChange: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        default: null
    },

    // HR / Employment Record
    employeeCode: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    nationalId: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    address: { type: String, default: null },
    hireDate: { type: Date, default: null },
    position: { type: String, default: null },
    department: { type: String, default: null },
    emergencyContact: {
        name: { type: String, default: null },
        phone: { type: String, default: null },
        relationship: { type: String, default: null }
    },
    employmentStatus: {
        type: String,
        enum: ["active", "onLeave", "terminated"],
        default: "active"
    },
    notes: { type: String, default: null }
}, { timestamps: true });

// Indexes
userSchema.index({ organizationId: 1, isArchived: 1 });
userSchema.index({ branchId: 1, isArchived: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);
export default User;