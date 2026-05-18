import mongoose from "mongoose";

// ------------------------------------------------------------------
// 1. اسکیمای پیام‌های داخل یک تیکت (سابقه چت)
// ------------------------------------------------------------------
const replySchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    // نقش فرستنده در این لحظه (آیا مدیر رستوران است یا تیم پشتیبانی ما؟)
    senderRole: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // آدرس فایل‌های آپلود شده (تغذیه شده از UploadMw)
    attachments: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ------------------------------------------------------------------
// 2. اسکیمای اصلی تیکت
// ------------------------------------------------------------------
const ticketSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject: {
        type: String,
        required: [true, "Ticket subject is required"],
        trim: true
    },
    department: {
        type: String,
        enum: ['Technical', 'Billing', 'Sales', 'General'],
        default: 'General'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'],
        default: 'Open'
    },
    // آرایه‌ای از چت‌های رد و بدل شده در این تیکت
    replies: [replySchema]
}, { timestamps: true });

// Indexes
ticketSchema.index({ branchId: 1, status: 1 });
ticketSchema.index({ creatorId: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;