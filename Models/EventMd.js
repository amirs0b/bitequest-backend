import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        default: null
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Actor ID is required"]
    },
    actorType: {
        type: String,
        enum: ["User", "Customer"],
        required: [true, "Actor type is required"]
    },
    sessionId: {
        type: String,
        default: null
    },
    action: {
        type: String,
        required: [true, "Action is required"]
        // Possible: "page_view", "menu_browse", "menu_item_view", "cart_add",
        // "cart_remove", "quiz_start", "quiz_answer", "quiz_complete", "voucher_won",
        // "voucher_redeem", "discount_bank_view", "register_phone", "permission_denied",
        // "login", "logout", "error", "campaign_create", "menu_item_create"
    },
    resource: {
        type: String,
        default: null
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });

// Query indexes
eventSchema.index({ branchId: 1, createdAt: -1 });
eventSchema.index({ actorId: 1, actorType: 1, createdAt: -1 });
eventSchema.index({ sessionId: 1 });
eventSchema.index({ action: 1, createdAt: -1 });
// TTL index — auto-delete events older than 365 days
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
