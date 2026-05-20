import { HandleERROR } from "vanta-api";
import { logEvent } from "../Controllers/EventCn.js";
import { t } from "../Utils/i18n.js";

// ------------------------------------------------------------------
// Single Source of Truth for permission codes
// ------------------------------------------------------------------
export const PERMISSIONS = {
    // Menu
    MENU_VIEW: 'MNU-101',
    MENU_CREATE: 'MNU-102',
    MENU_EDIT: 'MNU-103',
    MENU_ARCHIVE: 'MNU-104',

    // Campaigns / Gamification
    CAMP_VIEW: 'CMP-201',
    CAMP_CREATE: 'CMP-202',

    // Finance & Orders
    FINANCE_VIEW: 'FIN-301',
    ORDER_FINALIZE: 'ORD-302',

    // Staff management
    USER_MANAGE: 'USR-401',

    // CRM
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

/**
 * PBAC permission middleware.
 *
 * @param {string} permissionCode - e.g. PERMISSIONS.MENU_EDIT
 * @param {object} conditions     - optional condition checks:
 *   - branchScoped {boolean}     - actor can only access their own branch's resources
 *   - allowedHours { start, end } - operation allowed only between these hours (0-23)
 */
export const requirePermission = (permissionCode, conditions = {}) => {
    return async (req, res, next) => {
        const lang = req.lang || "fa";

        if (!req.user) {
            return next(new HandleERROR(t("auth.authRequired", lang), 401));
        }

        // superAdmin and owner bypass all permission checks
        if (req.user.role === "superAdmin" || req.user.role === "owner") {
            return next();
        }

        const hasPermission = req.user.permissions && req.user.permissions.includes(permissionCode);

        if (!hasPermission) {
            // Log the denial event (fire-and-forget)
            logEvent({
                branchId: req.user.branchId || null,
                actorId: req.user._id,
                actorType: "User",
                action: "permission_denied",
                resource: req.baseUrl + req.path,
                metadata: {
                    requiredPermission: permissionCode,
                    route: req.originalUrl,
                    method: req.method
                },
                ip: req.ip,
                userAgent: req.headers["user-agent"]
            });

            return next(new HandleERROR(t("auth.accessDenied", lang, { code: permissionCode }), 403));
        }

        // Condition: branch scope — actor can only touch their own branch's data
        if (conditions.branchScoped && req.user.branchId) {
            const resourceBranchId = req.body?.branchId || req.query?.branchId || req.params?.branchId;
            if (resourceBranchId && resourceBranchId.toString() !== req.user.branchId.toString()) {
                logEvent({
                    branchId: req.user.branchId,
                    actorId: req.user._id,
                    actorType: "User",
                    action: "permission_denied",
                    resource: req.baseUrl + req.path,
                    metadata: {
                        requiredPermission: permissionCode,
                        reason: "branch_scope_violation",
                        requestedBranchId: resourceBranchId,
                        route: req.originalUrl
                    },
                    ip: req.ip,
                    userAgent: req.headers["user-agent"]
                });
                return next(new HandleERROR(t("permission.branchScopeViolation", lang, { code: permissionCode }), 403));
            }
        }

        // Condition: time-based access window
        if (conditions.allowedHours) {
            const currentHour = new Date().getHours();
            if (currentHour < conditions.allowedHours.start || currentHour > conditions.allowedHours.end) {
                return next(new HandleERROR(
                    t("permission.timeRestriction", lang, {
                        start: conditions.allowedHours.start,
                        end: conditions.allowedHours.end,
                        code: permissionCode
                    }),
                    403
                ));
            }
        }

        next();
    };
};