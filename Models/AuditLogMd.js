import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        default: null
    },
    category: {
        type: String,
        enum: ["security", "kpi", "system"],
        required: [true, "Log category is required"]
    },
    action: {
        type: String,
        required: [true, "Action type is required"]
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "actorModel"
    },
    actorModel: {
        type: String,
        required: true,
        enum: ["User", "Customer"]
    },
    target: {
        type: String,
        default: ""
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Indexes
auditLogSchema.index({ branchId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, actorModel: 1 });
auditLogSchema.index({ category: 1, action: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;