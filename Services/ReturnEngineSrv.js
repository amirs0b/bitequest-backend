import CustomerVisit from "../Models/CustomerVisitMd.js";
import DiscountPool from "../Models/DiscountPoolMd.js";
import Customer from "../Models/CustomerMd.js";
import Branch from "../Models/BranchMd.js";
import mongoose from "mongoose";
import { sendReturnOffer } from "./SmsSrv.js";

// ------------------------------------------------------------------
// 1. Find customers who haven't visited in N days and are SMS-subscribed
// ------------------------------------------------------------------
export const identifyReturnTargets = async (branchId, daysSinceLastVisit = 14) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSinceLastVisit);

    const targets = await CustomerVisit.find({
        branchId: new mongoose.Types.ObjectId(branchId),
        isSubscribedToSMS: true,
        lastVisit: { $lt: cutoff }
    }).select("customerId lastVisit totalVisits totalSpent");

    return targets.map(t => ({
        customerId: t.customerId,
        lastVisit: t.lastVisit,
        totalVisits: t.totalVisits,
        totalSpent: t.totalSpent
    }));
};

// ------------------------------------------------------------------
// 2. Send return offer SMS to a list of customers
// ------------------------------------------------------------------
export const sendReturnOffers = async (branchId, customerIds, discountPoolId) => {
    const pool = await DiscountPool.findById(discountPoolId);

    if (!pool) throw new Error("DiscountPool not found");
    if (pool.type !== "smartReturn") throw new Error("DiscountPool must be of type 'smartReturn'");
    if (!pool.isAvailable()) throw new Error("DiscountPool is not available");

    const branch = await Branch.findById(branchId).select("name");
    if (!branch) throw new Error("Branch not found");

    const customers = await Customer.find({
        _id: { $in: customerIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).select("phone");

    const { baseDiscount, urgencyDiscount, urgencyWindowHours } = pool.returnConfig;

    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
        if (!customer.phone) { failed++; continue; }

        try {
            await sendReturnOffer(
                customer.phone,
                branch.name,
                baseDiscount,
                urgencyDiscount,
                urgencyWindowHours
            );
            sent++;
        } catch (_err) {
            failed++;
        }
    }

    return { sent, failed, total: customers.length };
};

// ------------------------------------------------------------------
// 3. Check if a customer has an urgency bonus on their next visit
// ------------------------------------------------------------------
export const checkAndApplyUrgency = async (customerId, branchId) => {
    const visit = await CustomerVisit.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
        branchId: new mongoose.Types.ObjectId(branchId)
    });

    if (!visit || !visit.lastVisit) {
        return { hasUrgency: false };
    }

    const pool = await DiscountPool.findOne({
        branchId: new mongoose.Types.ObjectId(branchId),
        type: "smartReturn",
        isActive: true,
        isArchived: false
    });

    if (!pool) return { hasUrgency: false };

    const { baseDiscount, urgencyDiscount, urgencyWindowHours, targetDaysSinceLastVisit } = pool.returnConfig;

    const daysSinceLastVisit = Math.floor((Date.now() - visit.lastVisit.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastVisit < targetDaysSinceLastVisit) {
        return { hasUrgency: false, baseDiscount };
    }

    // Within urgency window counted from the moment they became a target
    const hoursIntoUrgency = (daysSinceLastVisit - targetDaysSinceLastVisit) * 24;
    const hasUrgency = hoursIntoUrgency <= urgencyWindowHours;

    return {
        hasUrgency,
        baseDiscount,
        urgencyDiscount: hasUrgency ? urgencyDiscount : null,
        daysSinceLastVisit,
        hoursRemainingInUrgency: hasUrgency ? Math.max(0, urgencyWindowHours - hoursIntoUrgency) : null
    };
};
