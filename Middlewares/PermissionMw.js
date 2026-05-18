import { HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// منبع حقیقت واحد (Single Source of Truth)
// ------------------------------------------------------------------
export const PERMISSIONS = {
    // دسترسی‌های منو
    MENU_VIEW: 'MNU-101',
    MENU_CREATE: 'MNU-102',
    MENU_EDIT: 'MNU-103',
    MENU_ARCHIVE: 'MNU-104',

    // دسترسی‌های کمپین‌ها (گیمیفیکیشن)
    CAMP_VIEW: 'CMP-201',
    CAMP_CREATE: 'CMP-202',

    // دسترسی‌های صندوق و مالی
    FINANCE_VIEW: 'FIN-301',
    ORDER_FINALIZE: 'ORD-302',

    // دسترسی مدیریت پرسنل
    USER_MANAGE: 'USR-401',

    // دسترسی‌های ارتباط با مشتری (CRM)
    CRM_VIEW: 'CRM-501',
    CRM_SMS: 'CRM-502',

    // Branch & Organization management
    BRANCH_EDIT: 'BRN-601',
    ORG_EDIT: 'ORG-602',
    QR_GENERATE: 'QRC-701',

    // Ticketing & Support
    TICKET_VIEW: 'TKT-801',
    TICKET_CREATE: 'TKT-802',
    TICKET_REPLY: 'TKT-803',
    TICKET_CLOSE: 'TKT-804'
};

export const requirePermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new HandleERROR("Authentication required.", 401));
        }

        if (req.user.role === 'superAdmin' || req.user.role === 'owner') {
            return next();
        }

        const hasPermission = req.user.permissions && req.user.permissions.includes(permissionCode);

        if (!hasPermission) {
            return next(new HandleERROR(`Access Denied! You need permission code [${permissionCode}]. Please provide this code to your manager to request access.`, 403));
        }

        next();
    };
};