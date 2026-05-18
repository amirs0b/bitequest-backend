import multer from "multer";
import path from "path";
import fs from "fs";
import { HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// ۱. اطمینان از وجود پوشه آپلود در سرور
// ------------------------------------------------------------------
const uploadDirectory = "public/uploads";
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ------------------------------------------------------------------
// ۲. تنظیمات موتور ذخیره‌سازی (Storage Engine)
// ------------------------------------------------------------------
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory); // مسیر ذخیره فایل‌ها
    },
    filename: (req, file, cb) => {
        // استخراج پسوند فایل (مثلاً .jpg یا .png)
        const ext = file.mimetype.split('/')[1];

        // Unique filename: branchId-timestamp.ext (fallback to 'upload' for unauthenticated uploads)
        const prefix = req.user ? (req.user.branchId || req.user.organizationId || req.user._id).toString() : 'upload';
        const uniqueFilename = `${prefix}-${Date.now()}.${ext}`;

        cb(null, uniqueFilename);
    }
});

// ------------------------------------------------------------------
// ۳. فیلتر امنیتی (فقط عکس‌ها اجازه ورود دارند)
// ------------------------------------------------------------------
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new HandleERROR("Not an image! Please upload only image files.", 400), false);
    }
};

// ------------------------------------------------------------------
// ۴. ساخت میدل‌ور نهایی آپلود
// ------------------------------------------------------------------
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // محدودیت حجم فایل: حداکثر 5 مگابایت
    }
});

// اکسپورت کردن متدهای کاربردی برای استفاده در روت‌ها
export const uploadSingleImage = upload.single("image"); // برای آپلود یک عکس (مثل لوگو یا عکس غذا)
export const uploadMultipleImages = upload.array("images", 5); // برای آپلود گالری (حداکثر 5 عکس)