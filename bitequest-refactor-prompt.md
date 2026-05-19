# BiteQuest Backend — Refactor & Completion Prompt

You are working on the BiteQuest backend — a B2B2C SaaS platform for restaurant in-store marketing and customer loyalty through gamification. Read CLAUDE.md first for full product context.

I've reviewed the current codebase against our product decisions. Below are all the issues that need to be fixed, organized by priority. Work through them in order.

---

## 🔴 PRIORITY 1 — Critical (System won't function without these)

### 1.1 — MenuMd.js: Add Rich Fields for AI Quiz Generation

The current MenuItem model only has `name`, `price`, `category`, `image`. This is the foundation for AI-generated quiz questions — without rich details, AI can't generate good questions.

**Add these fields to MenuMd.js:**
```
description: String          // توضیحات غذا — مثلاً "برگر دست‌ساز با سس مخصوص خانگی"
ingredients: [String]        // مواد اولیه — مثلاً ["گوشت تازه", "نان بریوش", "کاهو"]
weight: String               // وزن — مثلاً "200 گرم"
preparationTime: Number      // زمان آماده‌سازی به دقیقه
tags: [String]               // تگ‌ها — مثلاً ["تند", "پرفروش", "جدید"]
nutritionalInfo: {            // اطلاعات تغذیه‌ای (اختیاری)
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number
}
```

Keep all existing fields. Don't break the seed file — update it to include sample data for the new fields.

---

### 1.2 — Discount System: Implement All 5 Types

The current Campaign model only supports tier-based discounts. We need 5 types. 

**Create a new model `DiscountPoolMd.js`:**
```javascript
{
  branchId: ObjectId (ref Branch, required),
  campaignId: ObjectId (ref Campaign, required),
  
  type: {
    type: String,
    enum: ["universal", "limited", "oneTime", "timeBased", "smartReturn"],
    required: true
  },
  
  // === For "universal" type ===
  universalCode: String,           // یک کد برای همه — مثلاً "WELCOME10"
  
  // === For "limited" and "oneTime" types ===
  codes: [{
    code: String,                   // کد POS رستوران
    isUsed: Boolean (default false),
    usedBy: ObjectId (ref Customer),
    usedAt: Date
  }],
  totalCodes: Number,              // تعداد کل کدها
  remainingCodes: Number,          // تعداد باقیمانده
  
  // === For "timeBased" type ===
  schedule: {
    validDays: [String],           // ["saturday", "monday"]
    validHours: {
      start: String,               // "12:00"
      end: String                  // "15:00"
    },
    startDate: Date,
    endDate: Date
  },
  
  // === For "smartReturn" type ===
  returnConfig: {
    baseDiscount: Number,          // تخفیف پایه — مثلاً 10%
    urgencyDiscount: Number,       // تخفیف فوری — مثلاً 25%
    urgencyWindowHours: Number,    // مهلت — مثلاً 24 ساعت
    targetDaysSinceLastVisit: Number // مثلاً مشتریانی که 14 روز نیومدن
  },
  
  discountPercentage: Number (required),
  maxDiscountAmount: Number (default 0),
  posCode: String,                 // کد POS رستوران (for universal/timeBased)
  
  isActive: Boolean (default true),
  isArchived: Boolean (default false)
}
```

**Important behavior rule:** When `remainingCodes` reaches 0 for "limited" or "oneTime" types, the quiz/discount prompt must NOT be shown to customers. Add a method or virtual to check availability.

**Update CampaignMd.js:** Remove the `tiers` array and instead reference DiscountPool:
```
discountPools: [{ type: ObjectId, ref: "DiscountPool" }]
```

Keep `questions` and `conditions` as they are.

---

### 1.3 — VoucherCn.js + Route: Full Implementation

VoucherCn.js and Routes/Voucher.js are completely empty. Implement:

- `getMyVouchers` — Customer gets their vouchers (used + unused) for a branch
- `redeemVoucher` — Mark voucher as used (with validation: not expired, not already used, belongs to customer)
- `getVoucherByCode` — Lookup voucher by code (for waiter/cashier verification)

Mount the route in app.js: `app.use("/api/v1/vouchers", voucherRouter)`

---

### 1.4 — Customer-Branch Relationship

Current CustomerMd.js has no link to branches. We can't track which customer visited which restaurant.

**Create a new model `CustomerVisitMd.js`:**
```javascript
{
  customerId: ObjectId (ref Customer, required),
  branchId: ObjectId (ref Branch, required),
  
  // RFM data (auto-calculated)
  firstVisit: Date,
  lastVisit: Date,
  totalVisits: Number (default 0),
  totalSpent: Number (default 0),
  averageOrderValue: Number (default 0),
  
  // Discount bank for this specific restaurant
  discountBank: [{
    voucherId: ObjectId (ref Voucher),
    discountPercentage: Number,
    posCode: String,
    expiresAt: Date,
    isUsed: Boolean (default false)
  }],
  
  isSubscribedToSMS: Boolean (default true)
}
```

Index on `{ customerId: 1, branchId: 1 }` with unique constraint.

---

### 1.5 — SmsSrv.js: Basic Structure

SmsSrv.js is empty. Create a basic service with a placeholder that can be swapped for any SMS provider:

```javascript
export const sendSMS = async (phone, message) => {
  // TODO: Integrate with actual SMS gateway (e.g., Kavenegar, Ghasedak)
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
```

---

## 🟡 PRIORITY 2 — Important (v1 is incomplete without these)

### 2.1 — Event Tracking Model + Controller + Route

Create `EventMd.js`:
```javascript
{
  branchId: ObjectId (ref Branch, default null),   // null for BiteQuest company events
  actorId: ObjectId (required),
  actorType: String (enum ["User", "Customer"], required),
  sessionId: String,                                // group events in one session
  
  action: String (required),
  // Possible actions: "page_view", "menu_browse", "menu_item_view", "cart_add", 
  // "cart_remove", "quiz_start", "quiz_answer", "quiz_complete", "voucher_won",
  // "voucher_redeem", "discount_bank_view", "register_phone", "permission_denied",
  // "login", "logout", "error", "campaign_create", "menu_item_create", etc.
  
  resource: String,                                 // "menu", "campaign", "cart", "voucher", etc.
  resourceId: ObjectId (default null),              // specific document ID
  
  metadata: Mixed,                                  // action-specific details
  // Examples:
  // quiz_answer: { questionIndex: 2, selectedOption: 1, isCorrect: true }
  // permission_denied: { requiredPermission: "MNU-104", route: "/api/v1/menu/123" }
  // menu_item_view: { itemName: "چیزبرگر", viewDuration: 8500 }
  // error: { statusCode: 500, message: "Database timeout" }
  
  ip: String,
  userAgent: String,
  
  createdAt: Date (default Date.now)
  // NO updatedAt — events are immutable
}
```

Indexes:
```
{ branchId: 1, createdAt: -1 }
{ actorId: 1, actorType: 1, createdAt: -1 }
{ sessionId: 1 }
{ action: 1, createdAt: -1 }
{ createdAt: 1 }   // TTL index — auto-delete after 365 days
```

Create `EventCn.js` with:
- `logEvent` — internal helper function (not a route handler), called from other controllers
- `getEventTimeline` — for support: get all events of a specific user in chronological order
- `getEventOverview` — for managers: aggregated view (event counts by action, error rates, etc.)

Create `Routes/Event.js` and mount in app.js.

**Important:** Add TTL index on `createdAt` to auto-delete events older than 365 days:
```javascript
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
```

---

### 2.2 — UserMd.js: Add HR Fields (Employment Record)

Add these fields to the existing User schema:
```
employeeCode: String,          // کد پرسنلی — مثلاً "EMP-0042"
firstName: String,
lastName: String,
nationalId: String,            // کد ملی
phone: String,
email: String,
address: String,
hireDate: Date,                // تاریخ استخدام
position: String,              // سمت — مثلاً "مدیر بازاریابی"
department: String,            // بخش — مثلاً "بازاریابی"
emergencyContact: {
  name: String,
  phone: String,
  relationship: String
},
employmentStatus: {
  type: String,
  enum: ["active", "onLeave", "terminated"],
  default: "active"
},
notes: String                  // یادداشت‌های مدیر
```

Don't remove any existing fields. Update the seed file to include sample HR data.

---

### 2.3 — Discount Bank (in CustomerVisitMd)

The discount bank is already included in CustomerVisitMd (Priority 1.4). But we need a controller for it.

Create `DiscountBankCn.js`:
- `getMyDiscountBank` — Customer sees all their unused discount vouchers across all restaurants
- `getDiscountBankForBranch` — Customer sees vouchers for a specific restaurant
- `checkUrgencyOffer` — Check if customer has an active urgency bonus (smart return)

---

### 2.4 — CRM RFM Calculation

Update `CrmCn.js` to include RFM-based insights:
- When returning customer list, calculate and include: days since last visit (Recency), total visits (Frequency), total spent (Monetary)
- Add endpoint `getAtRiskCustomers` — customers who haven't visited in X days (configurable)
- Add endpoint `getTopCustomers` — top customers by spending or frequency

Use data from CustomerVisit model.

---

### 2.5 — Smart Return Engine

Create `ReturnEngineSrv.js` in Services/:
- `identifyReturnTargets(branchId, daysSinceLastVisit)` — find customers who haven't visited in N days
- `sendReturnOffers(branchId, customerIds, discountPoolId)` — send SMS with urgency offer
- `checkAndApplyUrgency(customerId, branchId)` — when customer visits, check if they have urgency bonus

This service uses CustomerVisit + DiscountPool + SmsSrv.

---

## 🟢 PRIORITY 3 — Important but can wait

### 3.1 — i18n Infrastructure

Create `Utils/i18n.js`:
```javascript
const messages = {
  en: {
    "auth.loginRequired": "You are not logged in! Please log in to get access.",
    "auth.invalidToken": "Invalid or expired token. Please log in again.",
    "auth.accessDenied": "Access Denied! You need permission code [{code}].",
    // ... all user-facing strings
  },
  fa: {
    "auth.loginRequired": "شما وارد نشده‌اید! لطفاً ابتدا وارد شوید.",
    "auth.invalidToken": "توکن نامعتبر یا منقضی شده. لطفاً دوباره وارد شوید.",
    "auth.accessDenied": "دسترسی محدود شده! شما به مجوز شماره [{code}] نیاز دارید.",
    // ... all user-facing strings
  }
};

export const t = (key, lang = "fa", params = {}) => {
  let msg = messages[lang]?.[key] || messages["en"]?.[key] || key;
  for (const [k, v] of Object.entries(params)) {
    msg = msg.replace(`[{${k}}]`, v);
  }
  return msg;
};
```

Add `Accept-Language` header parsing middleware and use `t()` in all error messages and responses.

---

### 3.2 — PBAC Condition-Based Evaluation

Current PermissionMw.js only checks if permission code exists in user.permissions[]. For true PBAC, we need condition evaluation.

**Update requirePermission to support conditions:**
```javascript
export const requirePermission = (permissionCode, conditions = {}) => {
    return (req, res, next) => {
        // ... existing checks ...
        
        // Condition: branch scope
        if (conditions.branchScoped && req.user.branchId) {
            const resourceBranchId = req.body.branchId || req.query.branchId || req.params.branchId;
            if (resourceBranchId && resourceBranchId.toString() !== req.user.branchId.toString()) {
                return next(new HandleERROR(`Access Denied! You can only access your own branch data. [${permissionCode}]`, 403));
            }
        }
        
        // Condition: time-based
        if (conditions.allowedHours) {
            const currentHour = new Date().getHours();
            if (currentHour < conditions.allowedHours.start || currentHour > conditions.allowedHours.end) {
                return next(new HandleERROR(`This operation is only allowed between ${conditions.allowedHours.start}:00 and ${conditions.allowedHours.end}:00. [${permissionCode}]`, 403));
            }
        }
        
        next();
    };
};
```

Also log every permission evaluation in Event Tracking (call logEvent).

---

### 3.3 — Subscription Model (Separate from Organization)

For future ERP readiness, extract subscription from Organization into its own model:

```javascript
// SubscriptionMd.js
{
  organizationId: ObjectId (ref Organization, required, unique),
  plan: String (enum ["trial", "basic", "pro", "enterprise"]),
  status: String (enum ["active", "expired", "suspended", "cancelled"]),
  startDate: Date,
  expiresAt: Date,
  billingCycle: String (enum ["monthly", "yearly"]),
  paymentHistory: [{
    amount: Number,
    paidAt: Date,
    method: String,
    transactionId: String
  }],
  features: {
    maxBranches: Number,
    maxStaffPerBranch: Number,
    maxCampaigns: Number,
    smsIncluded: Number,
    analyticsLevel: String (enum ["basic", "advanced"])
  }
}
```

---

## 📋 Final Checklist After All Changes

- [ ] All new models have proper indexes
- [ ] All new models follow naming convention: `{Name}Md.js`
- [ ] All new controllers follow naming convention: `{Name}Cn.js`
- [ ] All new routes follow naming convention: `{Name}.js`
- [ ] All new routes are mounted in `app.js`
- [ ] Seed file (`tools/seed.js`) updated with sample data for all new models
- [ ] No `tenantId` references remain — all migrated to `branchId` or `organizationId`
- [ ] VoucherCn.js is fully implemented (not empty)
- [ ] SmsSrv.js has at least mock implementation
- [ ] Event Tracking has TTL index for 365-day retention
- [ ] All sensitive mutations call `logEvent()` from EventCn
- [ ] Permission denials include the permission code in error message
- [ ] `isArchived` soft delete pattern used everywhere (no hard deletes)
- [ ] `{ timestamps: true }` on every schema
- [ ] All API responses follow format: `{ success, message, count?, data }`

---

## ⚠️ Rules

1. Do NOT delete existing working code — extend and improve
2. Do NOT change the vanta-api usage pattern (catchAsync, HandleERROR, ApiFeatures)
3. Do NOT change the file naming convention (Md, Cn, Mw, Srv suffixes)
4. Do NOT change the API versioning (`/api/v1/`)
5. Keep all comments in English
6. Use ESM imports (not CommonJS)
7. Every new model needs indexes for common query patterns
8. Test each priority level before moving to the next
