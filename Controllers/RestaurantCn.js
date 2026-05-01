import Restaurant from "../Models/RestaurantMd.js";
import User from "../Models/UserMd.js";
import bcryptjs from "bcryptjs";
import { catchAsync, HandleERROR } from "vanta-api";

// ----------------------------------------------------------------
// 1. Create Restaurant & Auto-create Owner (SUPER_ADMIN Only)
// ----------------------------------------------------------------
export const createRestaurantWithOwner = catchAsync(async (req, res, next) => {
    const {
        restaurantName, slug, address, phone, // مدل اصلی + Slug
        ownerName, ownerEmail
    } = req.body;

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
        return next(new HandleERROR("A user with this email already exists", 400));
    }

    // چک کردن تکراری نبودن Slug
    const existingSlug = await Restaurant.findOne({ slug });
    if (existingSlug) {
        return next(new HandleERROR("This slug is already taken", 400));
    }

    // ساخت رستوران با شارژ اولیه 30 روزه جهت تست
    const initialValidity = new Date();
    initialValidity.setDate(initialValidity.getDate() + 30);

    const newRestaurant = await Restaurant.create({
        name: restaurantName,
        slug,
        address,
        phone,
        subscriptionValidUntil: initialValidity
    });

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashPassword = bcryptjs.hashSync(tempPassword, 10);

    const newOwner = await User.create({
        name: ownerName,
        email: ownerEmail,
        password: hashPassword,
        role: "TENANT_OWNER",
        restaurantId: newRestaurant._id,
        mustChangePassword: true
    });

    return res.status(201).json({
        success: true,
        message: "Restaurant and Gamification Engine configured successfully",
        data: {
            restaurant: newRestaurant,
            ownerEmail: newOwner.email,
            ownerTemporaryPassword: tempPassword
        }
    });
});

// ----------------------------------------------------------------
// 2. Get All Restaurants (SUPER_ADMIN / INTERNAL)
// ----------------------------------------------------------------
export const getAllRestaurants = catchAsync(async (req, res, next) => {
    // در اینجا می‌توانیم kpiStats را هم برای داشبورد برگردانیم
    const restaurants = await Restaurant.find()
        .select("-__v")
        .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: restaurants.length, data: { restaurants }});
});

// ----------------------------------------------------------------
// 3. Get & Update My Restaurant Settings (TENANT_OWNER)
// ----------------------------------------------------------------
export const getMyRestaurant = catchAsync(async (req, res, next) => {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return next(new HandleERROR("Restaurant not found", 404));

    return res.status(200).json({ success: true, data: { restaurant } });
});

export const updateMyRestaurant = catchAsync(async (req, res, next) => {
    const restaurantId = req.user.restaurantId;

    // استخراج تنظیمات جدید از جمله GameSettings
    const {
        name, address, phone, logoUrl, coverImage,
        taxRate, deliveryFee, minimumOrderAmount,
        gameSettings
    } = req.body;

    // آپدیت رستوران (فیلدهایی مثل slug یا smsBalance از اینجا قابل ویرایش نیستند!)
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        {
            name, address, phone, logoUrl, coverImage,
            taxRate, deliveryFee, minimumOrderAmount,
            gameSettings
        },
        { new: true, runValidators: true }
    );

    return res.status(200).json({
        success: true,
        message: "Restaurant and Game details updated successfully",
        data: { restaurant: updatedRestaurant }
    });
});

// ----------------------------------------------------------------
// 4. Toggle "isAcceptingOrders" 
// ----------------------------------------------------------------
export const toggleAcceptingOrders = catchAsync(async (req, res, next) => {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return next(new HandleERROR("Restaurant not found", 404));

    restaurant.isAcceptingOrders = !restaurant.isAcceptingOrders;
    await restaurant.save();

    return res.status(200).json({
        success: true,
        isAcceptingOrders: restaurant.isAcceptingOrders
    });
});

// ----------------------------------------------------------------
// 5. Manage Subscription & SMS Balance (SUPER_ADMIN ONLY)
// ----------------------------------------------------------------
export const manageSubscription = catchAsync(async (req, res, next) => {
    const targetRestaurantId = req.params.id;
    // سوپر ادمین می‌تواند پیامک شارژ کند یا اشتراک را تغییر دهد
    const { subscriptionStatus, additionalDays, addSms } = req.body;

    const restaurant = await Restaurant.findById(targetRestaurantId);
    if (!restaurant) return next(new HandleERROR("Restaurant not found", 404));

    if (subscriptionStatus) restaurant.subscriptionStatus = subscriptionStatus;

    if (additionalDays > 0) {
        const currentDate = restaurant.subscriptionValidUntil > new Date() ? restaurant.subscriptionValidUntil : new Date();
        currentDate.setDate(currentDate.getDate() + additionalDays);
        restaurant.subscriptionValidUntil = currentDate;
    }

    if (addSms > 0) {
        restaurant.smsBalance += addSms;
    }

    await restaurant.save();

    return res.status(200).json({
        success: true,
        message: "Financial and Subscription records updated",
        data: { restaurant }
    });
});