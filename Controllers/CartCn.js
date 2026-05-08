import Cart from "../Models/CartMd.js";
import Order from "../Models/OrderMd.js";
import Voucher from "../Models/VoucherMd.js";
import MenuItem from "../Models/MenuMd.js"; // وارد کردن مدل منو برای چک کردن قیمت واقعی
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// 1. همگام‌سازی سبد (ذخیره انتخاب‌های مشتری با امنیت کامل قیمت)
// ------------------------------------------------------------------
export const syncCart = catchAsync(async (req, res, next) => {
    const { items, voucherId, tenantId } = req.body;
    const customerId = req.customer.id;

    // 🔒 استخراج قیمت و نام واقعی غذاها از دیتابیس (عدم اعتماد به کلاینت)
    const menuItemIds = items.map(i => i.menuItemId);
    const dbMenuItems = await MenuItem.find({ _id: { $in: menuItemIds }, tenantId });

    let cartTotal = 0;
    const secureItems = items.map(item => {
        const dbItem = dbMenuItems.find(dbI => dbI._id.toString() === item.menuItemId.toString());
        if (!dbItem) throw new HandleERROR(`Menu item ${item.menuItemId} not found`, 404);

        cartTotal += (dbItem.price * item.quantity);

        return {
            menuItemId: dbItem._id,
            name: dbItem.name,
            price: dbItem.price,
            quantity: item.quantity
        };
    });

    // 🔒 اعتبارسنجی ووچر و بررسی شروط کمپین (مثل حداقل مبلغ خرید)
    let validVoucherId = null;
    if (voucherId) {
        const voucher = await Voucher.findOne({
            _id: voucherId,
            customerId,
            tenantId,
            isUsed: false,
            expiresAt: { $gte: new Date() }
        }).populate('campaignId');

        if (!voucher) {
            return next(new HandleERROR("This voucher is invalid or expired.", 400));
        }

        if (voucher.campaignId && cartTotal < voucher.campaignId.conditions.minCartValue) {
            return next(new HandleERROR(`Minimum order for this discount is ${voucher.campaignId.conditions.minCartValue}`, 400));
        }

        validVoucherId = voucher._id;
    }

    let cart = await Cart.findOne({ customerId, tenantId, status: "active" });

    if (cart) {
        cart.items = secureItems;
        if (voucherId !== undefined) cart.voucherId = validVoucherId;
        await cart.save();
    } else {
        cart = await Cart.create({
            tenantId,
            customerId,
            items: secureItems,
            voucherId: validVoucherId
        });
    }

    return res.status(200).json({
        success: true,
        message: "Cart synced securely",
        data: { cart }
    });
});

// ------------------------------------------------------------------
// 2. دریافت سبد فعال (نمایش پیش‌فاکتور به مشتری)
// ------------------------------------------------------------------
export const getActiveCart = catchAsync(async (req, res, next) => {
    const { tenantId } = req.query;
    const customerId = req.customer.id;

    const cart = await Cart.findOne({ customerId, tenantId, status: "active" })
        .populate('voucherId');

    if (!cart) {
        return next(new HandleERROR("Your cart is empty", 404));
    }

    return res.status(200).json({
        success: true,
        data: { cart }
    });
});

// ------------------------------------------------------------------
// 3. نهایی‌سازی سفارش (توسط خود مشتری برای نمایش به گارسون)
// ------------------------------------------------------------------
export const finalizeOrder = catchAsync(async (req, res, next) => {
    const { cartId } = req.params;
    const customerId = req.customer.id;

    const cart = await Cart.findOne({ _id: cartId, customerId, status: "active" }).populate('voucherId');

    if (!cart) {
        return next(new HandleERROR("Active cart not found", 404));
    }

    // 🧮 محاسبه هوشمند مبالغ نهایی برای ثبت در تاریخچه سفارشات
    let totalAmount = 0;
    cart.items.forEach(item => totalAmount += (item.price * item.quantity));

    let discountAmount = 0;
    if (cart.voucherId) {
        discountAmount = (totalAmount * cart.voucherId.discountPercentage) / 100;
        if (cart.voucherId.maxDiscountAmount > 0 && discountAmount > cart.voucherId.maxDiscountAmount) {
            discountAmount = cart.voucherId.maxDiscountAmount;
        }
    }

    // ثبت فاکتور قطعی برای تحلیل‌های مدیر
    const finalizedOrder = await Order.create({
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        cartId: cart._id,
        items: cart.items,
        voucherId: cart.voucherId ? cart.voucherId._id : null,
        totalAmount,
        discountAmount,
        finalAmount: totalAmount - discountAmount
    });

    // باطل کردن کد تخفیف
    if (cart.voucherId) {
        await Voucher.findByIdAndUpdate(cart.voucherId._id, {
            isUsed: true,
            usedAt: new Date()
        });
    }

    // آرشیو کردن سبد خرید
    cart.status = "finalized";
    cart.isArchived = true;
    await cart.save();

    // خروجی برای صفحه جذاب موبایل مشتری (نمایش فاکتور و کد سیستم حسابداری به گارسون)
    return res.status(200).json({
        success: true,
        message: "Order ready for waiter",
        data: {
            orderSummary: finalizedOrder,
            posCode: cart.voucherId ? cart.voucherId.posCode : null
        }
    });
});