import Campaign from "../Models/CampaignMd.js";
import Voucher from "../Models/VoucherMd.js";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import { logEvent } from "./EventCn.js";

// ------------------------------------------------------------------
// 1. ساخت کمپین جدید
// ------------------------------------------------------------------
export const createCampaign = catchAsync(async (req, res, next) => {
    const campaign = await Campaign.create(req.body);

    logEvent({
        branchId: campaign.branchId,
        actorId: req.user._id,
        actorType: "User",
        action: "campaign_created",
        resource: "Campaign",
        resourceId: campaign._id,
        metadata: { title: campaign.title },
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        data: { campaign }
    });
});

// ------------------------------------------------------------------
// 2. دریافت لیست کمپین‌ها
// ------------------------------------------------------------------
export const getAllCampaigns = catchAsync(async (req, res, next) => {
    const role = req.user ? req.user.role : 'customer';
    const features = new ApiFeatures(Campaign, req.query, role)
        .filter().sort().limitFields().paginate();

    features.addManualFilters({ isArchived: false });

    if (role === 'customer') {
        const now = new Date();
        features.addManualFilters({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
    }

    const result = await features.execute();

    let campaignsData = result.data;
    if (role === 'customer') {
        campaignsData = campaignsData.map(camp => {
            const campObj = camp.toObject();
            if (campObj.questions) {
                campObj.questions.forEach(q => delete q.correctOptionIndex);
            }
            return campObj;
        });
    }

    return res.status(200).json({
        success: true,
        count: result.count,
        data: { campaigns: campaignsData }
    });
});

// ------------------------------------------------------------------
// 3. دریافت اطلاعات یک کمپین خاص
// ------------------------------------------------------------------
export const getCampaignById = catchAsync(async (req, res, next) => {
    const role = req.user ? req.user.role : 'customer';
    const campaign = await Campaign.findOne({ _id: req.params.id, isArchived: false });

    if (!campaign) return next(new HandleERROR("Campaign not found", 404));

    const campObj = campaign.toObject();
    if (role === 'customer' && campObj.questions) {
        campObj.questions.forEach(q => delete q.correctOptionIndex);
    }

    return res.status(200).json({ success: true, data: { campaign: campObj } });
});

// ------------------------------------------------------------------
// 4. ویرایش یا بایگانی کمپین
// ------------------------------------------------------------------
export const updateCampaign = catchAsync(async (req, res, next) => {
    const query = { _id: req.params.id, isArchived: false };
    if (req.user.role !== "superAdmin") query.branchId = req.user.branchId;

    const campaign = await Campaign.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!campaign) return next(new HandleERROR("Campaign not found or permission denied", 404));

    return res.status(200).json({ success: true, data: { campaign } });
});

export const archiveCampaign = catchAsync(async (req, res, next) => {
    const query = { _id: req.params.id, isArchived: false };
    if (req.user.role !== "superAdmin") query.branchId = req.user.branchId;

    const campaign = await Campaign.findOneAndUpdate(query, { isArchived: true, isActive: false }, { new: true });
    if (!campaign) return next(new HandleERROR("Campaign not found", 404));

    logEvent({
        branchId: campaign.branchId,
        actorId: req.user._id,
        actorType: "User",
        action: "campaign_archived",
        resource: "Campaign",
        resourceId: campaign._id,
        metadata: { title: campaign.title },
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Campaign archived successfully" });
});

// ------------------------------------------------------------------
// 5. تصحیح پاسخ‌ها و صدور آنی کد تخفیف (با پشتیبانی از کد صندوق)
// ------------------------------------------------------------------
export const playCampaign = catchAsync(async (req, res, next) => {
    const { campaignId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
        return next(new HandleERROR("Please provide an array of answers", 400));
    }

    const campaign = await Campaign.findOne({
        _id: campaignId,
        isActive: true,
        isArchived: false,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
    });

    if (!campaign) {
        return next(new HandleERROR("This campaign is not currently active or has expired.", 400));
    }

    const existingVoucher = await Voucher.findOne({ customerId: req.customer.id, campaignId: campaign._id });
    if (existingVoucher) {
        return next(new HandleERROR("You have already played this campaign.", 403));
    }

    let correctCount = 0;
    campaign.questions.forEach((q, index) => {
        if (answers[index] === q.correctOptionIndex) {
            correctCount++;
        }
    });

    const sortedTiers = campaign.tiers.sort((a, b) => b.requiredCorrectAnswers - a.requiredCorrectAnswers);
    const wonTier = sortedTiers.find(t => correctCount >= t.requiredCorrectAnswers);

    if (!wonTier) {
        return res.status(200).json({
            success: true,
            message: "You answered some questions, but unfortunately didn't reach the minimum score for a reward. Better luck next time!",
            data: { correctAnswers: correctCount }
        });
    }

    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueCode = `BITE-${randomString}`;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + wonTier.validityDays);

    const newVoucher = await Voucher.create({
        branchId: campaign.branchId,
        customerId: req.customer.id,
        campaignId: campaign._id,
        code: uniqueCode,
        discountPercentage: wonTier.discountPercentage,
        maxDiscountAmount: wonTier.maxDiscountAmount,
        posCode: wonTier.posCode, // 👈 انتقال کد سیستم حسابداری به ووچر
        expiresAt: expirationDate
    });

    return res.status(201).json({
        success: true,
        message: "Congratulations! You won a discount voucher.",
        data: {
            correctAnswers: correctCount,
            voucher: newVoucher
        }
    });
});

// ------------------------------------------------------------------
// 6. مشاهده کیف پول و کدهای تخفیف (مخصوص مشتری)
// ------------------------------------------------------------------
export const getMyVouchers = catchAsync(async (req, res, next) => {
    const vouchers = await Voucher.find({
        customerId: req.customer.id,
        isUsed: false,
        expiresAt: { $gte: new Date() }
    }).populate('branchId', 'name logo');

    return res.status(200).json({
        success: true,
        count: vouchers.length,
        data: { vouchers }
    });
});