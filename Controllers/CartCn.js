import Cart from "../Models/CartMd.js";
import Transaction from "../Models/TransactionMd.js";
import Voucher from "../Models/VoucherMd.js";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. همگام‌سازی سبد (ذخیره رفتار مشتری و انتخاب‌ها)
// ------------------------------------------------------------------
export const syncCart = catchAsync(async (req, res, next) => {
    const { items, voucherId, tenantId } = req.body;
    const customerId = req.customer.id;

    // پیدا کردن سبد فعال فعلی مشتری در این رستوران
    let cart = await Cart.findOne({
        customerId,
        tenantId,
        status: "active"
    });

    if (cart) {
        // بروزرسانی سبد موجود با انتخاب‌های جدید (ثبت رفتار لحظه‌ای)
        cart.items = items;
        cart.voucherId = voucherId || cart.voucherId;
        await cart.save();
    } else {
        // ایجاد یک سبد جدید برای شروع تعامل در این رستوران
        cart = await Cart.create({
            tenantId,
            customerId,
            items,
            voucherId
        });
    }

    return res.status(200).json({
        success: true,
        message: "Customer interaction synced successfully",
        data: { cart }
    });
});

// ------------------------------------------------------------------
// 2. دریافت سبد فعال (برای نمایش به مشتری و گارسون)
// ------------------------------------------------------------------
export const getActiveCart = catchAsync(async (req, res, next) => {
    const { tenantId } = req.query;
    const customerId = req.customer ? req.customer.id : req.query.customerId;

    if (!customerId || !tenantId) {
        return next(new HandleERROR("Customer ID and Tenant ID are required", 400));
    }

    const cart = await Cart.findOne({
        customerId,
        tenantId,
        status: "active"
    }).populate('items.menuItemId').populate('voucherId');

    if (!cart) {
        return next(new HandleERROR("No active interaction found for this customer", 404));
    }

    return res.status(200).json({
        success: true,
        data: { cart }
    });
});

// ------------------------------------------------------------------
// 3. نهایی‌سازی توسط گارسون (تبدیل تعامل به تحلیل مالی)
// ------------------------------------------------------------------
export const finalizeOrder = catchAsync(async (req, res, next) => {
    const { cartId } = req.params;

    // پیدا کردن سبد خرید فعال
    const cart = await Cart.findById(cartId);
    if (!cart || cart.status !== "active") {
        return next(new HandleERROR("Active cart not found", 404));
    }

    // 1. ثبت در جدول تراکنش‌ها برای تحلیل‌های مالی و سودآوری
    await Transaction.create({
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        items: cart.items,
        voucherId: cart.voucherId,
        finalAmount: req.body.finalAmount // مبلغی که گارسون در صندوق وارد کرده است
    });

    // 2. اگر کدتخفیفی استفاده شده، آن را باطل می‌کنیم
    if (cart.voucherId) {
        await Voucher.findByIdAndUpdate(cart.voucherId, {
            isUsed: true,
            usedAt: new Date()
        });
    }

    // 3. تغییر وضعیت سبد به نهایی و آرشیو کردن آن (هرگز پاک نمی‌شود)
    cart.status = "finalized";
    cart.isArchived = true;
    await cart.save();

    return res.status(200).json({
        success: true,
        message: "Order finalized and archived for analysis"
    });
});