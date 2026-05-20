import Event from "../Models/EventMd.js";
import mongoose from "mongoose";
import { catchAsync, HandleERROR } from "vanta-api";

// ------------------------------------------------------------------
// Internal helper — call from other controllers, never used as a route
// Fails silently so it never crashes the caller
// ------------------------------------------------------------------
export const logEvent = async ({
    branchId = null,
    actorId,
    actorType,
    sessionId = null,
    action,
    resource = null,
    resourceId = null,
    metadata = null,
    ip = null,
    userAgent = null
}) => {
    try {
        await Event.create({
            branchId,
            actorId,
            actorType,
            sessionId,
            action,
            resource,
            resourceId,
            metadata,
            ip,
            userAgent
        });
    } catch (_err) {
        // Never crash the calling controller
    }
};

// ------------------------------------------------------------------
// 1. Get all events for a specific actor in chronological order (support)
// GET /api/v1/events/timeline/:actorId?actorType=User&page=1&limit=50
// ------------------------------------------------------------------
export const getEventTimeline = catchAsync(async (req, res, next) => {
    const { actorId } = req.params;
    const { actorType, page = 1, limit = 50 } = req.query;

    if (!actorType || !["User", "Customer"].includes(actorType)) {
        return next(new HandleERROR("actorType query param must be 'User' or 'Customer'", 400));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
        Event.find({ actorId: new mongoose.Types.ObjectId(actorId), actorType })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Event.countDocuments({ actorId: new mongoose.Types.ObjectId(actorId), actorType })
    ]);

    return res.status(200).json({
        success: true,
        count: events.length,
        total,
        data: { events }
    });
});

// ------------------------------------------------------------------
// 2. Aggregated event overview for managers/analytics
// GET /api/v1/events/overview?branchId=...&start=...&end=...
// ------------------------------------------------------------------
export const getEventOverview = catchAsync(async (req, res, next) => {
    const { branchId, start, end } = req.query;

    const matchFilter = {};
    if (branchId) matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
    if (start || end) {
        matchFilter.createdAt = {};
        if (start) matchFilter.createdAt.$gte = new Date(start);
        if (end) matchFilter.createdAt.$lte = new Date(end);
    }

    const [actionCounts, errorRate, topActors] = await Promise.all([
        // Event counts grouped by action
        Event.aggregate([
            { $match: matchFilter },
            { $group: { _id: "$action", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Error rate: errors / total events
        Event.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    errors: { $sum: { $cond: [{ $eq: ["$action", "error"] }, 1, 0] } }
                }
            }
        ]),

        // Top 10 most active actors
        Event.aggregate([
            { $match: matchFilter },
            { $group: { _id: { actorId: "$actorId", actorType: "$actorType" }, eventCount: { $sum: 1 } } },
            { $sort: { eventCount: -1 } },
            { $limit: 10 }
        ])
    ]);

    const errorStats = errorRate[0] || { total: 0, errors: 0 };

    return res.status(200).json({
        success: true,
        data: {
            actionCounts,
            errorRate: {
                total: errorStats.total,
                errors: errorStats.errors,
                rate: errorStats.total > 0
                    ? ((errorStats.errors / errorStats.total) * 100).toFixed(2) + "%"
                    : "0%"
            },
            topActors
        }
    });
});
