const messages = {
    en: {
        // Auth
        "auth.loginRequired": "You are not logged in! Please log in to get access.",
        "auth.invalidToken": "Invalid or expired token. Please log in again.",
        "auth.accessDenied": "Access Denied! You need permission code [{code}]. Please provide this code to your manager to request access.",
        "auth.noPermission": "You do not have permission to perform this action.",
        "auth.authRequired": "Authentication required.",
        "auth.roleRequired": "You do not have permission to perform this action.",
        "auth.forcePasswordChange": "You must change your password before accessing this resource.",

        // General
        "error.notFound": "Not found.",
        "error.badRequest": "Invalid request data.",
        "error.serverError": "An internal server error occurred.",
        "error.insufficientSmsBalance": "Insufficient SMS wallet balance. You need {required} SMS charges, but have only {available}.",
        "error.branchNotFound": "Branch not found.",
        "error.orgNotFound": "Organization not found.",
        "error.customerNotFound": "Customer not found.",
        "error.campaignNotFound": "Campaign not found.",
        "error.voucherNotFound": "Voucher not found.",
        "error.menuItemNotFound": "Menu item not found.",

        // Permission conditions
        "permission.branchScopeViolation": "Access Denied! You can only access your own branch data. [{code}]",
        "permission.timeRestriction": "This operation is only allowed between {start}:00 and {end}:00. [{code}]",

        // Voucher
        "voucher.alreadyUsed": "This voucher has already been used.",
        "voucher.expired": "This voucher has expired.",
        "voucher.notYours": "This voucher does not belong to you.",

        // SMS
        "sms.messageEmpty": "Message content cannot be empty.",
        "sms.noRecipients": "Please provide a list of customers to message.",
    },

    fa: {
        // Auth
        "auth.loginRequired": "شما وارد نشده‌اید! لطفاً ابتدا وارد شوید.",
        "auth.invalidToken": "توکن نامعتبر یا منقضی شده. لطفاً دوباره وارد شوید.",
        "auth.accessDenied": "دسترسی محدود شده! شما به مجوز شماره [{code}] نیاز دارید. این کد را به مدیر خود ارائه دهید.",
        "auth.noPermission": "شما مجاز به انجام این عملیات نیستید.",
        "auth.authRequired": "برای ادامه باید وارد شوید.",
        "auth.roleRequired": "نقش شما اجازه انجام این عملیات را ندارد.",
        "auth.forcePasswordChange": "برای دسترسی به این بخش، ابتدا باید رمز عبور خود را تغییر دهید.",

        // General
        "error.notFound": "موردی یافت نشد.",
        "error.badRequest": "داده‌های ارسالی نامعتبر است.",
        "error.serverError": "خطای داخلی سرور رخ داده است.",
        "error.insufficientSmsBalance": "موجودی پیامک کافی نیست. نیاز به {required} پیامک دارید اما تنها {available} پیامک باقی مانده.",
        "error.branchNotFound": "شعبه پیدا نشد.",
        "error.orgNotFound": "سازمان پیدا نشد.",
        "error.customerNotFound": "مشتری پیدا نشد.",
        "error.campaignNotFound": "کمپین پیدا نشد.",
        "error.voucherNotFound": "کوپن پیدا نشد.",
        "error.menuItemNotFound": "آیتم منو پیدا نشد.",

        // Permission conditions
        "permission.branchScopeViolation": "دسترسی محدود! شما فقط به داده‌های شعبه خود دسترسی دارید. [{code}]",
        "permission.timeRestriction": "این عملیات فقط بین ساعت {start}:00 و {end}:00 مجاز است. [{code}]",

        // Voucher
        "voucher.alreadyUsed": "این کوپن قبلاً استفاده شده است.",
        "voucher.expired": "این کوپن منقضی شده است.",
        "voucher.notYours": "این کوپن متعلق به شما نیست.",

        // SMS
        "sms.messageEmpty": "متن پیام نمی‌تواند خالی باشد.",
        "sms.noRecipients": "لطفاً لیست مشتریان را برای ارسال پیام مشخص کنید.",
    }
};

/**
 * Translate a message key to the given language with optional parameter substitution.
 * Falls back to English, then returns the raw key if missing in both.
 *
 * @param {string} key    - dot-notation key, e.g. "auth.accessDenied"
 * @param {string} lang   - "fa" | "en" (default "fa")
 * @param {object} params - key/value pairs to substitute [{placeholder}] tokens
 */
export const t = (key, lang = "fa", params = {}) => {
    let msg = messages[lang]?.[key] ?? messages["en"]?.[key] ?? key;
    for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`[{${k}}]`, v).replaceAll(`{${k}}`, v);
    }
    return msg;
};

export default t;
