// ------------------------------------------------------------------
// SMS Service — Mock implementation
// Replace with actual SMS gateway (e.g., Kavenegar, Ghasedak) in production
// ------------------------------------------------------------------

export const sendSMS = async (phone, message) => {
    // TODO: Integrate with actual SMS gateway
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
    return { success: true, provider: "mock" };
};

export const sendOTP = async (phone, otpCode) => {
    return sendSMS(phone, `BiteQuest: Your verification code is ${otpCode}`);
};

export const sendReturnOffer = async (phone, restaurantName, discount, urgencyDiscount, expiryHours) => {
    const msg = `${restaurantName}: شما ${discount}% تخفیف دارید! اگر تا ${expiryHours} ساعت آینده مراجعه کنید، تخفیف شما ${urgencyDiscount}% خواهد بود.`;
    return sendSMS(phone, msg);
};
