import QRCode from "qrcode";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// تولید دسته‌جمعی بارکد (QR Code) برای میزهای رستوران
// ------------------------------------------------------------------
export const generateTableQrCodes = catchAsync(async (req, res, next) => {
    // مدیر می‌تواند درخواست تولید بارکد برای چندین میز را همزمان بدهد: [1, 2, 3, 4, 5]
    const { tableNumbers } = req.body;

    // 👈 رفع باگ: شناسایی branchId حتی اگر سوپرادمین درخواست داده باشد
    const branchId = req.user.role === 'superAdmin' ? req.body.branchId : req.user.branchId;

    if (!branchId) {
        return next(new HandleERROR("Tenant ID is required to generate QR codes.", 400));
    }

    if (!tableNumbers || !Array.isArray(tableNumbers) || tableNumbers.length === 0) {
        return next(new HandleERROR("Please provide a valid array of table numbers.", 400));
    }

    // آدرس فرانت‌اند شما (می‌توانید از فایل env. بخوانید)
    const frontendBaseUrl = process.env.FRONTEND_URL || "https://app.bitequest.com";

    // پردازش موازی برای تولید سریع بارکدها
    const qrCodes = await Promise.all(tableNumbers.map(async (tableNumber) => {
        // لینکی که مشتری با اسکن بارکد به آن هدایت می‌شود
        const scanUrl = `${frontendBaseUrl}/menu?branchId=${branchId}&table=${tableNumber}`;

        // تولید تصویر Base64 با بالاترین کیفیت (H) و بدون افت کیفیت در چاپ
        const qrImageBase64 = await QRCode.toDataURL(scanUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 500, // رزولوشن بالا
            color: {
                dark: '#1e293b', // رنگ تیره و جذاب برای خود بارکد
                light: '#ffffff' // پس‌زمینه سفید
            }
        });

        return {
            tableNumber,
            scanUrl,
            qrImageBase64
        };
    }));

    return res.status(200).json({
        success: true,
        message: "QR Codes generated successfully",
        data: { qrCodes }
    });
});