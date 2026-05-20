/**
 * BiteQuest Database Seeder
 * ────────────────────────────────────────
 * Usage:  npm run seed          → seed database
 *         npm run seed:fresh    → drop DB then seed
 *
 * Creates:
 *   - 1 SuperAdmin account
 *   - 6 Organizations (2 chains + 4 singles)
 *   - 10 Branches (chains have 2-3 branches each)
 *   - ~5-15 staff per branch (proportional to order volume)
 *   - ~50 menu items per branch
 *   - ~3,000 customers
 *   - 50 active + 300 finished campaigns
 *   - ~150-700 orders/day for last 60 days per branch
 *   - Vouchers, Carts, AuditLogs
 */

import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".config.env") });

// ── Models ──────────────────────────────
import Organization from "../Models/OrganizationMd.js";
import Branch from "../Models/BranchMd.js";
import User from "../Models/UserMd.js";
import Customer from "../Models/CustomerMd.js";
import MenuItem from "../Models/MenuMd.js";
import Campaign from "../Models/CampaignMd.js";
import Voucher from "../Models/VoucherMd.js";
import Cart from "../Models/CartMd.js";
import Order from "../Models/OrderMd.js";
import AuditLog from "../Models/AuditLogMd.js";
import Transaction from "../Models/TransactionMd.js";
import DiscountPool from "../Models/DiscountPoolMd.js";
import CustomerVisit from "../Models/CustomerVisitMd.js";

// ── Helpers ─────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const genPhone = (i) => `09${String(i).padStart(9, "0")}`;
const genCode = () => `BITE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const TEHRAN = [51.3890, 35.6892];
const offsetCoord = (base, km = 15) => [
    base[0] + (Math.random() - 0.5) * (km / 55),
    base[1] + (Math.random() - 0.5) * (km / 55)
];

// ── Persian Data Pools ──────────────────
const FOOD_CATEGORIES = ["پیتزا", "برگر", "پاستا", "ساندویچ", "سالاد", "نوشیدنی", "دسر", "پیش‌غذا", "غذای ایرانی", "سوشی"];

const FOOD_NAMES = {
    "پیتزا": ["پیتزا پپرونی", "پیتزا مارگاریتا", "پیتزا سبزیجات", "پیتزا گوشت و قارچ", "پیتزا مخصوص", "پیتزا چیکن باربیکیو", "پیتزا هاوایی"],
    "برگر": ["چیزبرگر کلاسیک", "دبل برگر", "چیکن برگر", "برگر قارچ و پنیر", "برگر مکزیکی", "برگر اسموکی"],
    "پاستا": ["پاستا آلفردو", "پاستا بلونز", "لازانیا گوشت", "پاستا پستو", "ماکارونی پنه"],
    "ساندویچ": ["ساندویچ مرغ", "ساندویچ استیک", "ساندویچ فلافل", "ساندویچ تن ماهی", "هات داگ ویژه"],
    "سالاد": ["سالاد سزار", "سالاد یونانی", "سالاد فصل", "سالاد مرغ گریل"],
    "نوشیدنی": ["نوشابه قوطی", "دوغ محلی", "آب معدنی", "لیموناد تازه", "اسموتی توت‌فرنگی", "قهوه لاته", "شیک شکلاتی"],
    "دسر": ["تیرامیسو", "چیزکیک", "بستنی سنتی", "کرم بروله", "پنکیک شکلاتی"],
    "پیش‌غذا": ["سوپ جو", "نان سیردار", "سیب‌زمینی سرخ‌شده", "ناگت مرغ", "پیاز حلقه‌ای سوخاری"],
    "غذای ایرانی": ["چلوکباب کوبیده", "جوجه‌کباب", "قورمه‌سبزی", "قیمه بادمجان", "زرشک‌پلو با مرغ", "آبگوشت سنتی", "باقالی‌پلو با گوشت"],
    "سوشی": ["سوشی سالمون", "سوشی میگو", "رول کالیفرنیا", "سوشی ادو", "ساشیمی مخلوط"]
};

// Rich menu item data for AI quiz generation
const FOOD_DETAILS = {
    "پیتزا پپرونی": { desc: "پیتزا با پپرونی تازه و پنیر موزارلا", ingredients: ["خمیر پیتزا", "سس گوجه", "پپرونی", "پنیر موزارلا"], weight: "450 گرم", prepTime: 20, tags: ["پرفروش"], cal: 350, protein: 15, carbs: 40, fat: 18 },
    "پیتزا مارگاریتا": { desc: "پیتزا کلاسیک ایتالیایی با ریحان تازه", ingredients: ["خمیر پیتزا", "سس گوجه", "پنیر موزارلا", "ریحان"], weight: "400 گرم", prepTime: 18, tags: ["کلاسیک"], cal: 300, protein: 12, carbs: 38, fat: 14 },
    "چیزبرگر کلاسیک": { desc: "برگر دست‌ساز با سس مخصوص خانگی", ingredients: ["گوشت تازه", "نان بریوش", "کاهو", "گوجه", "پنیر چدار"], weight: "280 گرم", prepTime: 15, tags: ["پرفروش", "محبوب"], cal: 550, protein: 30, carbs: 35, fat: 28 },
    "دبل برگر": { desc: "دو لایه گوشت با پنیر ذوب شده", ingredients: ["گوشت تازه", "نان", "پنیر", "سس مخصوص", "خیارشور"], weight: "380 گرم", prepTime: 18, tags: ["پرفروش"], cal: 750, protein: 42, carbs: 40, fat: 38 },
    "چلوکباب کوبیده": { desc: "کباب کوبیده سنتی با برنج ایرانی", ingredients: ["گوشت گوسفند", "پیاز", "برنج ایرانی", "کره", "گوجه کبابی"], weight: "500 گرم", prepTime: 25, tags: ["سنتی", "محبوب"], cal: 650, protein: 35, carbs: 60, fat: 25 },
    "قورمه‌سبزی": { desc: "خورشت سنتی ایرانی با سبزیجات معطر", ingredients: ["گوشت", "سبزی قورمه", "لوبیا قرمز", "لیمو عمانی"], weight: "400 گرم", prepTime: 45, tags: ["سنتی"], cal: 450, protein: 28, carbs: 30, fat: 22 },
    "سالاد سزار": { desc: "سالاد تازه با سس سزار خانگی", ingredients: ["کاهو رومی", "نان تست", "پنیر پارمزان", "سس سزار"], weight: "300 گرم", prepTime: 10, tags: ["سالم", "سبک"], cal: 200, protein: 8, carbs: 15, fat: 12 },
    "تیرامیسو": { desc: "دسر ایتالیایی با قهوه اسپرسو", ingredients: ["پنیر ماسکارپونه", "بیسکویت", "قهوه", "کاکائو"], weight: "180 گرم", prepTime: 15, tags: ["دسر", "محبوب"], cal: 350, protein: 6, carbs: 40, fat: 18 },
};

const DEFAULT_MENU_TAGS = ["جدید", "تند", "پرفروش", "محبوب", "سبک", "سنتی", "ویژه"];

const QUIZ_QUESTIONS = [
    { q: "پایتخت ایران کجاست؟", opts: ["تهران", "اصفهان", "شیراز", "تبریز"], correct: 0 },
    { q: "کدام غذا ایتالیایی است؟", opts: ["سوشی", "پیتزا", "تاکو", "کباب"], correct: 1 },
    { q: "بزرگترین اقیانوس کدام است؟", opts: ["اطلس", "هند", "آرام", "منجمد"], correct: 2 },
    { q: "کدام سیاره به خورشید نزدیک‌تر است؟", opts: ["زمین", "مریخ", "عطارد", "زهره"], correct: 2 },
    { q: "نماد شیمیایی آب چیست؟", opts: ["O2", "CO2", "H2O", "NaCl"], correct: 2 },
    { q: "قله دماوند در کدام رشته‌کوه است؟", opts: ["زاگرس", "البرز", "هیمالیا", "آلپ"], correct: 1 },
    { q: "چند قاره در جهان وجود دارد؟", opts: ["۵", "۶", "۷", "۸"], correct: 2 },
    { q: "سازنده برج ایفل کیست؟", opts: ["داوینچی", "گوستاو ایفل", "پیکاسو", "ناپلئون"], correct: 1 },
    { q: "بزرگ‌ترین کشور جهان کدام است؟", opts: ["کانادا", "چین", "روسیه", "آمریکا"], correct: 2 },
    { q: "رنگ‌های پرچم ایران چیست؟", opts: ["سبز و قرمز", "سبز، سفید و قرمز", "سبز و سفید", "قرمز و سفید"], correct: 1 },
    { q: "واحد پول ژاپن چیست؟", opts: ["یوان", "ین", "وون", "بات"], correct: 1 },
    { q: "کدام حیوان پادشاه جنگل است؟", opts: ["ببر", "شیر", "خرس", "عقاب"], correct: 1 },
];

const WEEK_DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// HR data pools for seeding employee records
const FIRST_NAMES = ["علی", "محمد", "رضا", "حسین", "امیر", "سارا", "مریم", "فاطمه", "زهرا", "نگار", "کامران", "بهنام", "سینا", "نیما", "آرش"];
const LAST_NAMES = ["احمدی", "محمدی", "رضایی", "حسینی", "کریمی", "موسوی", "صادقی", "جعفری", "علیزاده", "نجفی", "قاسمی", "شریفی", "مرادی", "تهرانی"];
const POSITIONS = {
    owner: "مدیرعامل",
    manager: ["مدیر شعبه", "مدیر عملیات", "مدیر بازاریابی"],
    cashier: ["صندوقدار", "حسابدار"],
    staff: ["گارسون", "سرآشپز", "دستیار آشپز", "مسئول سالن"]
};
const DEPARTMENTS = {
    owner: "مدیریت",
    manager: "مدیریت",
    cashier: "مالی",
    staff: "عملیات"
};
const genEmployeeCode = (n) => `EMP-${String(n).padStart(4, "0")}`;
const genHireDate = () => { const d = new Date(); d.setFullYear(d.getFullYear() - rand(0, 5)); d.setMonth(rand(0, 11)); return d; };

const ORG_DATA = [
    // ── Chains (2) ──
    { name: "زنجیره پیتزا ایتالیانو", slug: "italiano-pizza", plan: "enterprise", branches: [
        { name: "شعبه ونک", slug: "vanak", dailyOrders: [500, 700], staff: 15 },
        { name: "شعبه تجریش", slug: "tajrish", dailyOrders: [400, 600], staff: 12 },
        { name: "شعبه اکباتان", slug: "ekbatan", dailyOrders: [300, 500], staff: 10 },
    ]},
    { name: "زنجیره برگرلند", slug: "burgerland", plan: "enterprise", branches: [
        { name: "شعبه ولیعصر", slug: "valiasr", dailyOrders: [450, 650], staff: 13 },
        { name: "شعبه سعادت‌آباد", slug: "saadat-abad", dailyOrders: [350, 550], staff: 11 },
    ]},
    // ── Singles (4) ──
    { name: "رستوران سنتی باباطاهر", slug: "baba-taher", plan: "pro", branches: [
        { name: "رستوران باباطاهر", slug: "main", dailyOrders: [200, 400], staff: 8 },
    ]},
    { name: "کافه رستوران آریا", slug: "aria-cafe", plan: "pro", branches: [
        { name: "کافه آریا", slug: "main", dailyOrders: [150, 300], staff: 6 },
    ]},
    { name: "فست‌فود تندیس", slug: "tandis-fastfood", plan: "basic", branches: [
        { name: "فست‌فود تندیس", slug: "main", dailyOrders: [250, 450], staff: 9 },
    ]},
    { name: "رستوران دریایی مروارید", slug: "morvarid-seafood", plan: "pro", branches: [
        { name: "رستوران مروارید", slug: "main", dailyOrders: [180, 350], staff: 7 },
    ]},
];

// ═══════════════════════════════════════════
//  MAIN SEED FUNCTION
// ═══════════════════════════════════════════
async function seed() {
    const startTime = Date.now();

    // ── Connect ────────────────────────
    await mongoose.connect(process.env.DATA_BASE);
    console.log("✅ Connected to MongoDB");

    // ── Fresh mode: drop everything ────
    if (process.argv.includes("--fresh")) {
        console.log("🗑  Dropping all collections...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            await mongoose.connection.db.dropCollection(col.name);
        }
        console.log("   Done.");
    }

    // ═══════════════════════════════════
    // 1. SUPER ADMIN
    // ═══════════════════════════════════
    console.log("\n👤 Creating SuperAdmin...");
    const superAdmin = await User.create({
        username: "superadmin",
        password: bcryptjs.hashSync("Super@2024", 10),
        role: "superAdmin",
        permissions: [],
        forcePasswordChange: false,
        organizationId: null,
        branchId: null,
    });
    console.log(`   ✓ superadmin / Super@2024 (id: ${superAdmin._id})`);

    // ═══════════════════════════════════
    // 2. CUSTOMERS (3000)
    // ═══════════════════════════════════
    console.log("\n📱 Creating 3,000 customers...");
    const customerDocs = [];
    for (let i = 1; i <= 3000; i++) {
        const coord = offsetCoord(TEHRAN, 20);
        customerDocs.push({
            phone: genPhone(i),
            firstName: `مشتری`,
            lastName: `${i}`,
            isVerified: true,
            location: { type: "Point", coordinates: coord },
        });
    }
    const customers = await Customer.insertMany(customerDocs);
    console.log(`   ✓ ${customers.length} customers created`);

    // ═══════════════════════════════════
    // 3. ORGANIZATIONS + BRANCHES + STAFF + MENUS
    // ═══════════════════════════════════
    const allBranches = [];     // { branch, org, meta }
    const allMenuItems = [];    // flat array of all menu items
    const allStaff = [];        // flat array of all staff users
    let staffCounter = 0;

    for (const orgData of ORG_DATA) {
        console.log(`\n🏢 Creating Org: ${orgData.name}`);

        const org = await Organization.create({
            name: orgData.name,
            slug: orgData.slug,
            subscription: {
                status: "active",
                plan: orgData.plan,
                expiresAt: daysFromNow(rand(60, 365)),
            },
            smsWalletBalance: rand(500, 5000),
        });

        // Transaction record for the subscription
        await Transaction.create({
            organizationId: org._id,
            amount: orgData.plan === "enterprise" ? 5000000 : orgData.plan === "pro" ? 3000000 : 1500000,
            type: "subscription_renewal",
            status: "success",
            referenceId: `TXN-${Date.now()}-${rand(1000, 9999)}`,
        });

        for (const brData of orgData.branches) {
            const coord = offsetCoord(TEHRAN, 12);
            const branch = await Branch.create({
                organizationId: org._id,
                name: brData.name,
                slug: brData.slug,
                address: {
                    city: "تهران",
                    street: `خیابان ${brData.name}`,
                    fullAddress: `تهران، ${brData.name}، پلاک ${rand(1, 200)}`,
                },
                location: { type: "Point", coordinates: coord },
                phone: `021${rand(10000000, 99999999)}`,
                isActive: true,
            });

            console.log(`   🏪 Branch: ${brData.name} (${brData.dailyOrders[0]}-${brData.dailyOrders[1]} orders/day)`);

            // ── Owner ──
            staffCounter++;
            const owner = await User.create({
                username: `owner_${orgData.slug}_${brData.slug}`,
                password: bcryptjs.hashSync("Owner@123", 10),
                role: "owner",
                permissions: [],
                forcePasswordChange: false,
                organizationId: org._id,
                branchId: branch._id,
                employeeCode: genEmployeeCode(staffCounter),
                firstName: pick(FIRST_NAMES),
                lastName: pick(LAST_NAMES),
                nationalId: `${rand(1000000000, 9999999999)}`,
                phone: `09${rand(100000000, 999999999)}`,
                email: `owner_${orgData.slug}@bitequest.ir`,
                position: POSITIONS.owner,
                department: DEPARTMENTS.owner,
                hireDate: genHireDate(),
                employmentStatus: "active",
                emergencyContact: {
                    name: pick(FIRST_NAMES) + " " + pick(LAST_NAMES),
                    phone: `09${rand(100000000, 999999999)}`,
                    relationship: pick(["همسر", "پدر", "مادر", "برادر", "خواهر"])
                }
            });
            allStaff.push(owner);

            // ── Staff (managers, cashiers, regular staff) ──
            const staffRoles = [
                { role: "manager", count: Math.ceil(brData.staff * 0.15) },
                { role: "cashier", count: Math.ceil(brData.staff * 0.25) },
                { role: "staff",   count: brData.staff - Math.ceil(brData.staff * 0.15) - Math.ceil(brData.staff * 0.25) - 1 },
            ];

            for (const sr of staffRoles) {
                for (let i = 0; i < sr.count; i++) {
                    staffCounter++;
                    const perms = sr.role === "manager"
                        ? ["MNU-101", "MNU-102", "MNU-103", "MNU-104", "CMP-201", "CMP-202", "FIN-301", "USR-401", "CRM-501", "CRM-502", "BRN-601", "QRC-701", "TKT-801", "TKT-802"]
                        : sr.role === "cashier"
                        ? ["MNU-101", "FIN-301", "ORD-302"]
                        : ["MNU-101"];

                    const positionList = Array.isArray(POSITIONS[sr.role]) ? POSITIONS[sr.role] : [POSITIONS[sr.role]];
                    const u = await User.create({
                        username: `${sr.role}_${staffCounter}`,
                        password: bcryptjs.hashSync("Staff@123", 10),
                        role: sr.role,
                        permissions: perms,
                        forcePasswordChange: true,
                        organizationId: org._id,
                        branchId: branch._id,
                        employeeCode: genEmployeeCode(staffCounter),
                        firstName: pick(FIRST_NAMES),
                        lastName: pick(LAST_NAMES),
                        nationalId: `${rand(1000000000, 9999999999)}`,
                        phone: `09${rand(100000000, 999999999)}`,
                        position: pick(positionList),
                        department: DEPARTMENTS[sr.role] || "عملیات",
                        hireDate: genHireDate(),
                        employmentStatus: "active",
                    });
                    allStaff.push(u);
                }
            }

            // ── Menu Items (~50 per branch) with rich fields ──
            const branchMenuItems = [];
            for (const cat of FOOD_CATEGORIES) {
                const foods = FOOD_NAMES[cat] || [];
                for (const foodName of foods) {
                    const details = FOOD_DETAILS[foodName];
                    const itemData = {
                        branchId: branch._id,
                        name: foodName,
                        price: rand(50, 800) * 1000,
                        category: cat,
                        isAvailable: Math.random() > 0.08,
                        description: details ? details.desc : `${foodName} مخصوص رستوران`,
                        ingredients: details ? details.ingredients : [foodName],
                        weight: details ? details.weight : `${rand(150, 500)} گرم`,
                        preparationTime: details ? details.prepTime : rand(10, 40),
                        tags: details ? details.tags : [pick(DEFAULT_MENU_TAGS)],
                        nutritionalInfo: details
                            ? { calories: details.cal, protein: details.protein, carbs: details.carbs, fat: details.fat }
                            : { calories: rand(150, 800), protein: rand(5, 40), carbs: rand(10, 60), fat: rand(5, 35) }
                    };
                    const item = await MenuItem.create(itemData);
                    branchMenuItems.push(item);
                }
            }
            allMenuItems.push({ branchId: branch._id, items: branchMenuItems });
            console.log(`      📋 ${branchMenuItems.length} menu items`);

            allBranches.push({ branch, org, meta: brData, menuItems: branchMenuItems, owner });
        }
    }
    console.log(`\n   ✓ ${allStaff.length} staff users created across ${allBranches.length} branches`);

    // ═══════════════════════════════════
    // 4. CAMPAIGNS (50 active + 300 finished)
    // ═══════════════════════════════════
    console.log("\n🎮 Creating 350 campaigns...");
    const allCampaigns = [];

    for (let i = 0; i < 350; i++) {
        const brInfo = pick(allBranches);
        const isActive = i < 50;
        const qs = [];
        const numQuestions = rand(3, 5);
        const usedIndexes = new Set();
        for (let q = 0; q < numQuestions; q++) {
            let idx;
            do { idx = rand(0, QUIZ_QUESTIONS.length - 1); } while (usedIndexes.has(idx));
            usedIndexes.add(idx);
            const qq = QUIZ_QUESTIONS[idx];
            qs.push({ questionText: qq.q, options: qq.opts, correctOptionIndex: qq.correct });
        }

        const startDate = isActive ? daysAgo(rand(1, 14)) : daysAgo(rand(30, 180));
        const endDate = isActive ? daysFromNow(rand(7, 60)) : daysAgo(rand(1, 29));

        const validDays = WEEK_DAYS.slice(0, rand(5, 7));
        const posCodePrefix = isActive ? "ACT" : "EXP";

        const campaign = await Campaign.create({
            branchId: brInfo.branch._id,
            title: isActive
                ? `مسابقه فعال #${i + 1} - ${brInfo.branch.name}`
                : `مسابقه تمام‌شده #${i + 1 - 50}`,
            description: isActive ? "شرکت کنید و کد تخفیف ببرید!" : "این مسابقه به پایان رسیده است.",
            startDate,
            endDate,
            isActive,
            isArchived: !isActive && Math.random() > 0.7,
            conditions: {
                minCartValue: rand(1, 5) * 100000,
                validDays,
                validHours: { start: "10:00", end: "23:00" },
            },
            questions: qs,
            tiers: [
                { requiredCorrectAnswers: numQuestions, discountPercentage: rand(20, 40), maxDiscountAmount: rand(50, 150) * 1000, validityDays: rand(5, 14), posCode: `${posCodePrefix}-${rand(100, 999)}` },
                { requiredCorrectAnswers: Math.ceil(numQuestions * 0.6), discountPercentage: rand(10, 20), maxDiscountAmount: rand(30, 80) * 1000, validityDays: rand(3, 10), posCode: `${posCodePrefix}-${rand(100, 999)}` },
            ],
        });
        allCampaigns.push({ campaign, branchId: brInfo.branch._id });
    }
    console.log(`   ✓ 50 active + 300 finished campaigns`);

    // ═══════════════════════════════════
    // 5. ORDERS + VOUCHERS + CARTS (bulk)
    // ═══════════════════════════════════
    console.log("\n📦 Creating orders (60 days of history)...");
    const DAYS_HISTORY = 60;
    let totalOrders = 0;
    let totalVouchers = 0;

    for (const brInfo of allBranches) {
        const { branch, meta, menuItems } = brInfo;
        const [minDaily, maxDaily] = meta.dailyOrders;

        // Campaigns for this branch
        const branchCampaigns = allCampaigns.filter(c => c.branchId.toString() === branch._id.toString());
        const finishedCampaigns = branchCampaigns.filter(c => !c.campaign.isActive);

        console.log(`   🏪 ${branch.name}: generating ${DAYS_HISTORY} days...`);

        for (let day = DAYS_HISTORY; day >= 0; day--) {
            const orderDate = daysAgo(day);
            const dailyCount = rand(minDaily, maxDaily);

            // Batch insert for performance
            const orderBatch = [];
            const voucherBatch = [];
            const cartBatch = [];

            for (let o = 0; o < dailyCount; o++) {
                const customer = pick(customers);
                const numItems = rand(1, 5);
                const orderItems = [];
                let totalAmount = 0;

                for (let it = 0; it < numItems; it++) {
                    const menuItem = pick(menuItems);
                    const qty = rand(1, 3);
                    totalAmount += menuItem.price * qty;
                    orderItems.push({
                        menuItemId: menuItem._id,
                        name: menuItem.name,
                        price: menuItem.price,
                        quantity: qty,
                    });
                }

                // ~15% of orders use a voucher
                let discountAmount = 0;
                let voucherId = null;

                if (Math.random() < 0.15 && finishedCampaigns.length > 0) {
                    const camp = pick(finishedCampaigns).campaign;
                    const tier = pick(camp.tiers);
                    discountAmount = Math.min(
                        (totalAmount * tier.discountPercentage) / 100,
                        tier.maxDiscountAmount > 0 ? tier.maxDiscountAmount : Infinity
                    );

                    const vDoc = {
                        branchId: branch._id,
                        customerId: customer._id,
                        campaignId: camp._id,
                        code: genCode(),
                        discountPercentage: tier.discountPercentage,
                        maxDiscountAmount: tier.maxDiscountAmount,
                        posCode: tier.posCode,
                        isUsed: true,
                        usedAt: orderDate,
                        expiresAt: new Date(orderDate.getTime() + tier.validityDays * 86400000),
                    };
                    voucherBatch.push(vDoc);
                    // voucherId will be set after insert
                }

                const cartDoc = {
                    branchId: branch._id,
                    customerId: customer._id,
                    items: orderItems,
                    status: "finalized",
                    isArchived: true,
                    createdAt: orderDate,
                    updatedAt: orderDate,
                };
                cartBatch.push(cartDoc);

                orderBatch.push({
                    branchId: branch._id,
                    customerId: customer._id,
                    cartId: null, // placeholder
                    items: orderItems,
                    voucherId: null, // placeholder
                    totalAmount,
                    discountAmount,
                    finalAmount: totalAmount - discountAmount,
                    createdAt: orderDate,
                    updatedAt: orderDate,
                    _voucherIdx: voucherId !== null ? voucherBatch.length - 1 : (Math.random() < 0.15 && voucherBatch.length > 0 ? voucherBatch.length - 1 : -1),
                });
            }

            // Insert vouchers
            let insertedVouchers = [];
            if (voucherBatch.length > 0) {
                insertedVouchers = await Voucher.insertMany(voucherBatch, { ordered: false }).catch(() => []);
                totalVouchers += insertedVouchers.length;
            }

            // Insert carts
            const insertedCarts = await Cart.insertMany(cartBatch);

            // Link carts and vouchers to orders
            for (let i = 0; i < orderBatch.length; i++) {
                orderBatch[i].cartId = insertedCarts[i]._id;
                const vIdx = orderBatch[i]._voucherIdx;
                if (vIdx >= 0 && insertedVouchers[vIdx]) {
                    orderBatch[i].voucherId = insertedVouchers[vIdx]._id;
                }
                delete orderBatch[i]._voucherIdx;
            }

            // Insert orders
            await Order.insertMany(orderBatch);
            totalOrders += orderBatch.length;
        }
    }
    console.log(`   ✓ ${totalOrders.toLocaleString()} orders created`);
    console.log(`   ✓ ${totalVouchers.toLocaleString()} vouchers created`);

    // ═══════════════════════════════════
    // 6. ACTIVE VOUCHERS (unused, for active campaigns)
    // ═══════════════════════════════════
    console.log("\n🎟  Creating active (unused) vouchers...");
    const activeCampaigns = allCampaigns.filter(c => c.campaign.isActive);
    const activeVoucherDocs = [];

    for (let i = 0; i < 200; i++) {
        const camp = pick(activeCampaigns).campaign;
        const customer = pick(customers);
        const tier = pick(camp.tiers);

        activeVoucherDocs.push({
            branchId: camp.branchId,
            customerId: customer._id,
            campaignId: camp._id,
            code: genCode(),
            discountPercentage: tier.discountPercentage,
            maxDiscountAmount: tier.maxDiscountAmount,
            posCode: tier.posCode,
            isUsed: false,
            expiresAt: daysFromNow(rand(3, 30)),
        });
    }
    await Voucher.insertMany(activeVoucherDocs, { ordered: false }).catch(() => {});
    console.log(`   ✓ ${activeVoucherDocs.length} active vouchers`);

    // ═══════════════════════════════════
    // 7. ACTIVE CARTS (not finalized yet)
    // ═══════════════════════════════════
    console.log("\n🛒 Creating active carts...");
    const activeCartDocs = [];
    for (let i = 0; i < 80; i++) {
        const brInfo = pick(allBranches);
        const customer = pick(customers);
        const numItems = rand(1, 4);
        const items = [];
        for (let it = 0; it < numItems; it++) {
            const m = pick(brInfo.menuItems);
            items.push({ menuItemId: m._id, name: m.name, price: m.price, quantity: rand(1, 3) });
        }
        activeCartDocs.push({
            branchId: brInfo.branch._id,
            customerId: customer._id,
            items,
            status: Math.random() > 0.3 ? "active" : "abandoned",
        });
    }
    await Cart.insertMany(activeCartDocs);
    console.log(`   ✓ ${activeCartDocs.length} active/abandoned carts`);

    // ═══════════════════════════════════
    // 8. AUDIT LOGS
    // ═══════════════════════════════════
    console.log("\n📝 Creating audit logs...");
    const auditDocs = [];
    const auditActions = [
        { cat: "security", act: "STAFF_LOGIN" },
        { cat: "security", act: "PASSWORD_CHANGE" },
        { cat: "kpi", act: "MENU_PRICE_UPDATE" },
        { cat: "kpi", act: "MENU_ITEM_CREATED" },
        { cat: "kpi", act: "MENU_ITEM_ARCHIVED" },
        { cat: "system", act: "CAMPAIGN_CREATED" },
        { cat: "system", act: "CAMPAIGN_ARCHIVED" },
        { cat: "kpi", act: "VOUCHER_REDEEMED" },
        { cat: "security", act: "USER_CREATED" },
        { cat: "security", act: "USER_ARCHIVED" },
    ];

    for (let i = 0; i < 500; i++) {
        const brInfo = pick(allBranches);
        const action = pick(auditActions);
        auditDocs.push({
            branchId: brInfo.branch._id,
            category: action.cat,
            action: action.act,
            actorId: brInfo.owner._id,
            actorModel: "User",
            target: `Resource_${rand(1, 999)}`,
            metadata: { ip: `192.168.1.${rand(1, 254)}`, detail: `Automated seed log #${i + 1}` },
            createdAt: daysAgo(rand(0, 60)),
        });
    }
    await AuditLog.insertMany(auditDocs);
    console.log(`   ✓ ${auditDocs.length} audit logs`);

    // ═══════════════════════════════════
    // 9. DISCOUNT POOLS (for active campaigns)
    // ═══════════════════════════════════
    console.log("\n💰 Creating discount pools...");
    const discountTypes = ["universal", "limited", "oneTime", "timeBased", "smartReturn"];
    let totalDiscountPools = 0;

    for (const campInfo of activeCampaigns) {
        const camp = campInfo.campaign;
        const poolType = pick(discountTypes);
        const poolData = {
            branchId: camp.branchId,
            campaignId: camp._id,
            type: poolType,
            discountPercentage: rand(10, 30),
            maxDiscountAmount: rand(30, 150) * 1000,
            posCode: `DP-${rand(100, 999)}`,
        };

        if (poolType === "universal") {
            poolData.universalCode = `WELCOME${rand(10, 99)}`;
        } else if (poolType === "limited" || poolType === "oneTime") {
            const total = rand(20, 100);
            const used = rand(0, Math.floor(total * 0.6));
            poolData.totalCodes = total;
            poolData.remainingCodes = total - used;
            poolData.codes = Array.from({ length: total }, (_, i) => ({
                code: `DC-${rand(10000, 99999)}`,
                isUsed: i < used,
                usedAt: i < used ? daysAgo(rand(0, 14)) : null,
            }));
        } else if (poolType === "timeBased") {
            poolData.schedule = {
                validDays: WEEK_DAYS.slice(0, rand(4, 7)),
                validHours: { start: "11:00", end: "22:00" },
                startDate: daysAgo(7),
                endDate: daysFromNow(30),
            };
        } else if (poolType === "smartReturn") {
            poolData.returnConfig = {
                baseDiscount: rand(10, 15),
                urgencyDiscount: rand(20, 30),
                urgencyWindowHours: pick([12, 24, 48]),
                targetDaysSinceLastVisit: pick([7, 14, 21, 30]),
            };
        }

        const pool = await DiscountPool.create(poolData);
        // Link pool to campaign
        await Campaign.findByIdAndUpdate(camp._id, { $push: { discountPools: pool._id } });
        totalDiscountPools++;
    }
    console.log(`   ✓ ${totalDiscountPools} discount pools created`);

    // ═══════════════════════════════════
    // 10. CUSTOMER VISITS (RFM data)
    // ═══════════════════════════════════
    console.log("\n📊 Creating customer visit records...");
    const visitMap = new Map(); // key: `customerId-branchId`

    // Build visit records from existing orders (sample ~500 unique combinations)
    for (const brInfo of allBranches) {
        const branchCustomers = customers.slice(0, rand(80, 200));
        for (const cust of branchCustomers) {
            const key = `${cust._id}-${brInfo.branch._id}`;
            if (visitMap.has(key)) continue;

            const visits = rand(1, 30);
            const spent = rand(100, 2000) * 1000 * visits;
            visitMap.set(key, {
                customerId: cust._id,
                branchId: brInfo.branch._id,
                firstVisit: daysAgo(rand(30, 180)),
                lastVisit: daysAgo(rand(0, 30)),
                totalVisits: visits,
                totalSpent: spent,
                averageOrderValue: Math.round(spent / visits),
                isSubscribedToSMS: Math.random() > 0.1,
            });
        }
    }

    const visitDocs = Array.from(visitMap.values());
    await CustomerVisit.insertMany(visitDocs, { ordered: false }).catch(() => {});
    console.log(`   ✓ ${visitDocs.length} customer visit records`);

    // ═══════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n" + "═".repeat(50));
    console.log("  ✅ SEED COMPLETE");
    console.log("═".repeat(50));
    console.log(`  ⏱  Time: ${elapsed}s`);
    console.log(`  👤 SuperAdmin: superadmin / Super@2024`);
    console.log(`  🏢 Organizations: ${ORG_DATA.length}`);
    console.log(`  🏪 Branches: ${allBranches.length}`);
    console.log(`  👥 Staff: ${allStaff.length}`);
    console.log(`  📱 Customers: ${customers.length}`);
    console.log(`  📋 Menu items: ~${allBranches.length * 55}`);
    console.log(`  🎮 Campaigns: 50 active + 300 finished`);
    console.log(`  📦 Orders: ${totalOrders.toLocaleString()}`);
    console.log(`  🎟  Vouchers: ${(totalVouchers + activeVoucherDocs.length).toLocaleString()}`);
    console.log(`  📝 Audit logs: ${auditDocs.length}`);
    console.log(`  💰 Discount pools: ${totalDiscountPools}`);
    console.log(`  📊 Customer visits: ${visitDocs.length}`);
    console.log("═".repeat(50));

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error("\n❌ SEED FAILED:", err);
    process.exit(1);
});
