import Ticket from "../Models/TicketMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. باز کردن یک تیکت جدید
// ------------------------------------------------------------------
export const createTicket = catchAsync(async (req, res, next) => {
    const { subject, department, priority, message } = req.body;

    // تعیین اینکه تیکت برای کدام رستوران است
    const branchId = req.user.role === 'superAdmin' ? req.body.branchId : req.user.branchId;

    if (!subject || !message) {
        return next(new HandleERROR("Subject and initial message are required.", 400));
    }

    // 👈 پردازش فایل‌های آپلود شده (اگر عکسی فرستاده باشند)
    let attachments = [];
    if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newTicket = await Ticket.create({
        branchId,
        creatorId: req.user.id,
        subject,
        department,
        priority,
        // پیام اول به عنوان اولین آبجکت در آرایه replies ذخیره می‌شود
        replies: [{
            senderId: req.user.id,
            senderRole: req.user.role,
            message,
            attachments
        }]
    });

    return res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        data: { ticket: newTicket }
    });
});

// ------------------------------------------------------------------
// 2. دریافت لیست تیکت‌ها
// ------------------------------------------------------------------
export const getAllTickets = catchAsync(async (req, res, next) => {
    // ایجاد یک کوئری پایه برای امنیت
    const query = Ticket.find().select("-replies"); // برای سبک بودن لیست، پیام‌ها را اینجا واکشی نمی‌کنیم

    // 🔒 اعمال دیوار امنیتی: رستوران‌ها فقط تیکت‌های خودشان را می‌بینند
    if (req.user.role !== "superAdmin") {
        query.where({ branchId: req.user.branchId });
    }

    const features = new ApiFeatures(query, req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const result = await features.execute();

    return res.status(200).json({
        success: true,
        count: result.count,
        data: { tickets: result.data }
    });
});

// ------------------------------------------------------------------
// 3. دریافت یک تیکت به همراه تمام پیام‌های داخل آن (چت‌ها)
// ------------------------------------------------------------------
export const getTicketById = catchAsync(async (req, res, next) => {
    const query = { _id: req.params.id };

    // 🔒 امنیت: جلوگیری از دیدن تیکت‌های رستوران رقیب
    if (req.user.role !== "superAdmin") {
        query.branchId = req.user.branchId;
    }

    const ticket = await Ticket.findOne(query).populate('creatorId', 'username role');

    if (!ticket) return next(new HandleERROR("Ticket not found", 404));

    return res.status(200).json({
        success: true,
        data: { ticket }
    });
});

// ------------------------------------------------------------------
// 4. ارسال پیام جدید در تیکت (Reply)
// ------------------------------------------------------------------
export const replyToTicket = catchAsync(async (req, res, next) => {
    const { message } = req.body;
    if (!message) return next(new HandleERROR("Message content is required.", 400));

    const query = { _id: req.params.id };
    if (req.user.role !== "superAdmin") query.branchId = req.user.branchId;

    const ticket = await Ticket.findOne(query);
    if (!ticket) return next(new HandleERROR("Ticket not found", 404));

    // جلوگیری از ارسال پیام در تیکت‌های بسته شده
    if (ticket.status === 'Closed') {
        return next(new HandleERROR("Cannot reply to a closed ticket.", 400));
    }

    // پردازش عکس‌های ضمیمه شده
    let attachments = [];
    if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => `/uploads/${file.filename}`);
    }

    // اضافه کردن پیام جدید به آرایه
    ticket.replies.push({
        senderId: req.user.id,
        senderRole: req.user.role,
        message,
        attachments
    });

    // 💡 هوش سیستم: تغییر خودکار وضعیت تیکت بر اساس کسی که جواب می‌دهد
    if (req.user.role === 'superAdmin') {
        ticket.status = 'Waiting on Customer'; // وقتی شما جواب می‌دهید
    } else {
        ticket.status = 'Open'; // وقتی مشتری جواب می‌دهد
    }

    await ticket.save();

    return res.status(200).json({
        success: true,
        message: "Reply added successfully",
        data: { ticket }
    });
});

// ------------------------------------------------------------------
// 5. تغییر دستی وضعیت تیکت (مثلاً بستن تیکت)
// ------------------------------------------------------------------
export const updateTicketStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    if (!status) return next(new HandleERROR("Status is required.", 400));

    const query = { _id: req.params.id };
    if (req.user.role !== "superAdmin") query.branchId = req.user.branchId;

    const ticket = await Ticket.findOneAndUpdate(
        query,
        { status },
        { new: true, runValidators: true }
    );

    if (!ticket) return next(new HandleERROR("Ticket not found", 404));

    return res.status(200).json({
        success: true,
        message: `Ticket status updated to ${status}`,
        data: { ticket }
    });
});