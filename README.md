# 🍔 BiteQuest - Enterprise Multi-Tenant Restaurant SaaS

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-blue?style=for-the-badge)

BiteQuest is a robust, highly modular Software as a Service (SaaS) platform built on the MERN stack. It goes beyond a simple digital menu, serving as an intelligent customer retention engine and a comprehensive resource management dashboard for restaurant owners.

---

## 💡 The Vision & Why It Was Built
Restaurants typically face two major hurdles: 
1. **Lack of Customer Data:** They don't know who their dine-in customers are, making remarketing impossible.
2. **POS Integration Complexity:** Connecting new digital ordering systems to legacy physical POS machines is costly and technically messy.

**BiteQuest solves both.** We gamified the ordering process using an interactive Quiz system. Customers willingly provide their phone numbers (via OTP login) to claim discount vouchers they win from the quiz. This instantly transforms the platform into a Lead Generation and CRM machine. 

To solve the POS integration, BiteQuest uses a "Visual Handoff" approach. The customer's cart and the generated discount code (e.g., `OFF-20`) are displayed prominently on their phone. The waiter simply reads the code and punches it into the physical POS. No complex API bridges required.

---

## 🎬 Business Workflow & Ecosystem
The platform is divided into three isolated zones:

1. **Zone 1: Customer PWA (Mobile-First)**
   * **Seamless Entry:** Customers scan a QR code to view the menu without logging in.
   * **Gamification:** They are prompted to take a short quiz. Winning generates a voucher.
   * **OTP Auth:** To claim the voucher, the customer logs in via an SMS-based OTP.
   * **Smart Cart:** The voucher is applied automatically. The customer shows the final cart and the `posCode` to the waiter to finalize the order.

2. **Zone 2: Tenant Admin Dashboard (Tablet/Desktop)**
   * **Menu Builder:** Restaurant managers can add items, set prices, and upload food images.
   * **Quiz Builder:** Create dynamic questions, define the correct options, and set reward tiers based on correct answers.
   * **CRM & SMS:** Select customers from the database and send bulk promotional SMS campaigns.
   * **Audit Logs:** Monitor staff activity to prevent fraud.

3. **Zone 3: SuperAdmin Center (Platform Management)**
   * **Global Overview:** Monitor platform-wide revenue and tenant subscription statuses.
   * **Tenant Management:** Register new restaurants, allocate SMS wallet balances, and suspend inactive accounts.
   * **Helpdesk:** Answer support tickets submitted by restaurant managers.

---

## 🏗 Technical Architecture & Highlights
* **Strict Multi-Tenancy:** Implemented a custom `TenantScopeMw` middleware to ensure absolute data isolation.
* **PBAC (Policy-Based Access Control):** Granular permission system for restaurant staff (e.g., `MENU_CREATE`, `FINANCE_VIEW`).
* **Stateless Authentication:** Dual JWT strategy for both OTP-based customer logins and password-based staff logins.
* **Audit Trail:** A dedicated `AuditLog` module that tracks and records all sensitive database mutations.

---

## 📦 Tech Stack & Core Packages
* **Node.js & Express.js:** Core backend runtime and routing framework.
* **MongoDB & Mongoose:** NoSQL database and ODM for complex data modeling and schema validation.
* **Bcryptjs:** Cryptographic hashing for secure password storage.
* **JsonWebToken (JWT):** Secure token generation for authenticated API routes.
* **Multer:** Middleware for handling `multipart/form-data` (Menu images, logos, ticket attachments).
* **Vanta-api:** Custom utility wrapper for standardized error handling, filtering, sorting, and pagination.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.x or higher
* **MongoDB:** Locally installed instance or a MongoDB Atlas cluster URI

### 1. Installation
```bash
git clone [https://github.com/yourusername/bitequest-backend.git](https://github.com/yourusername/bitequest-backend.git)
cd bitequest-backend
npm install
```

### 2. Environment Variables (.env)
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/bitequest

# Security & Authentication
JWT_SECRET=your_very_long_and_secure_random_string_here
JWT_EXPIRES_IN=90d

# SMS & OTP Gateway
SMS_API_KEY=your_sms_provider_api_key
SMS_SENDER_NUMBER=100020003000

# File Upload Configuration
MAX_FILE_SIZE_MB=5
```

### 3. Running the Server
```bash
# Development Mode (Hot-reloading)
npm run dev

# Production Mode
npm start
```

---

## 📖 Comprehensive API Documentation

Base URL: `http://localhost:3000/api/v1`
*Note: Routes marked with 🔒 require `Authorization: Bearer <token>` in the header.*

### 1. Authentication
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/staff-login` | Login for Restaurant Admins, Staff, and SuperAdmin | `{ "username": "", "password": "" }` |
| **POST** | `/customer-auth/send-otp` | Send 5-digit OTP via SMS to customer | `{ "phone": "0912...", "tenantId": "..." }` |
| **POST** | `/customer-auth/verify-otp` | Verify OTP and issue JWT for customer | `{ "phone": "0912...", "otp": "12345" }` |
| **GET** | 🔒 `/auth/me` | Get current logged-in user profile | None |

### 2. Menu Management
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/menu?tenantId={id}` | Get public menu for a specific restaurant | None |
| **POST** | 🔒 `/menu` | Add new food item (Requires `multipart/form-data`) | `name`, `price`, `category`, `image` (file) |
| **PATCH**| 🔒 `/menu/:id` | Update food item or toggle `isAvailable` | `{ "price": 150, "isAvailable": false }` |

### 3. Customer Cart & Orders
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **GET** | 🔒 `/cart` | View current customer's cart | None |
| **POST** | 🔒 `/cart` | Add item to cart or update quantity | `{ "menuItemId": "...", "quantity": 2 }` |
| **POST** | 🔒 `/cart/finalize` | Convert active cart into a final Order | None |

### 4. Gamification (Quiz & Vouchers)
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/campaigns` | Get active quiz questions (correct answers hidden) | None |
| **POST** | 🔒 `/campaigns/:id/play` | Submit quiz answers and win discount voucher | `{ "answers": [0, 2, 1] }` |
| **GET** | 🔒 `/campaigns/my-vouchers`| Get customer's won vouchers & `posCode` | None |

### 5. CRM & SMS (Tenant Admin)
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **GET** | 🔒 `/crm/customers` | Get list of all customers who visited the restaurant| None |
| **POST** | 🔒 `/crm/send-bulk-sms` | Send promotional SMS to selected customers | `{ "targetCustomerIds": [...], "message": "..." }` |

### 6. Analytics & Audit (Tenant Admin)
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **GET** | 🔒 `/analytics/kpi` | Get total revenue, orders count, etc. | None |
| **GET** | 🔒 `/analytics/sales-chart`| Get 30-day sales data for line chart | None |
| **GET** | 🔒 `/audit-logs` | Get activity logs of staff (e.g., who changed price)| Query params (page, limit, sort) |

### 7. SuperAdmin (Platform Management)
| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| **POST** | 🔒 `/tenants` | Create a new restaurant (Tenant) | `name`, `slug`, `ownerName`, `logo` (file) |
| **PATCH**| 🔒 `/tenants/:id/status`| Suspend or activate a restaurant | `{ "isActive": false }` |
| **GET** | 🔒 `/tickets` | View support tickets from all restaurants | None |
| **POST** | 🔒 `/tickets/:id/reply` | Reply to a specific support ticket | `{ "message": "..." }` |

---
