# Smart Taxi Management System - Documentation
# نظام إدارة التاكسي الذكي - التوثيق الشامل

> **Version:** 2.0 (Golden Edition)
> **Language:** Bilingual (Arabic / English)
> **Purpose:** Detailed Functional & Technical Documentation

---

## 1. Project Overview | نظرة عامة على المشروع

**English:**
The Smart Taxi Management System is a comprehensive web-based platform designed to manage taxi fleets, driver performance, financial tracking (revenues & expenses), and operational logistics. It features a real-time dashboard, automated state management for car handovers, and a deep integration with Supabase for cloud-based data persistence.

**العربية:**
نظام إدارة التاكسي الذكي هو منصة ويب متكاملة مصممة لإدارة أساطيل التاكسي، متابعة أداء السائقين، التتبع المالي (الإيرادات والمصاريف)، والخدمات اللوجستية التشغيلية. يتميز النظام بلوحة تحكم فورية، إدارة آلية لحالات استلام وتسليم السيارات، وتكامل عميق مع Supabase لضمان بقاء البيانات سحابياً.

---

## 2. Functional Documentation | التوثيق الوظيفي

### 2.1 Dashboard | لوحة التحكم
**English:**
The central hub for monitoring system health. It provides:
- **Financial Metrics:** Total collection by month and collector.
- **Fleet Status:** Real-time visibility of active vs. inactive vehicles.
- **Top Performers:** Insights into driver productivity and revenue generation.

**العربية:**
المركز الرئيسي لمراقبة حالة النظام. يوفر:
- **المقاييس المالية:** إجمالي التحصيل حسب الشهر والمحصل.
- **حالة الأسطول:** رؤية فورية للسيارات النشطة وغير النشطة.
- **الأداء العالي:** رؤى حول إنتاجية السائقين وتوليد الإيرادات.

![Dashboard Preview](docs/assets/dashboard.png)

---

### 2.2 Fleet Management | إدارة الأسطول
**English:**
Allows admins to register vehicles, track license expiry, and manage ownership.
- **Dynamic Formatting:** Jordanian taxi plate visualization.
- **Status Tracking:** Automated "Active/Inactive" status based on handover logs.

**العربية:**
يتيح للمسؤولين تسجيل المركبات، تتبع انتهاء الترخيص، وإدارة الملكية.
- **التنسيق الديناميكي:** عرض مرئي للوحات التاكسي الأردنية.
- **تتبع الحالة:** حالة "نشط/غير نشط" تلقائية بناءً على سجلات التسليم.

![Cars Module](docs/assets/cars.png)

---

### 2.3 Driver Management | إدارة السائقين
**English:**
Comprehensive profiles for drivers including:
- **Personal Data:** National ID, license details, and contact info.
- **Financial Ledger:** Total guarantees (Daman) paid vs. owed.
- **Current Assignment:** Real-time link to their currently assigned vehicle.

**العربية:**
ملفات تعريف شاملة للسائقين تشمل:
- **البيانات الشخصية:** الرقم الوطني، تفاصيل الرخصة، ومعلومات الاتصال.
- **السجل المالي:** إجمالي الضمانات المدفوعة مقابل المستحقة.
- **التكليف الحالي:** رابط فوري للسيارة المكلف بها حالياً.

![Drivers Module](docs/assets/drivers.png)

---

### 2.4 Operations: Revenues & Expenses | العمليات: الإيرادات والمصاريف
**English:**
- **Revenues:** Simplified entry for daily collections, categorized by type (Daily Rent, Fines, etc.).
- **Expenses:** Tracking maintenance costs, fuel, and spare parts with vendor referencing.

**العربية:**
- **الإيرادات:** إدخال مبسط للتحصيلات اليومية، مصنفة حسب النوع (ضمان يومي، مخالفات، إلخ).
- **المصاريف:** تتبع تكاليف الصيانة، الوقود، وقطع الغيار مع الإشارة للموردين.

![Revenues Module](docs/assets/revenues.png)

---

### 2.5 Vehicle Handover | استلام وتسليم السيارات
**English:**
The logic core of the system.
- **Check-Out (OUT):** Assigns a car to a driver, updates status to "Active".
- **Check-In (IN):** Returns car to fleet, updates status to "InActive", records final KM reading.

**العربية:**
جوهر المنطق البرمجي للنظام.
- **التسليم (OUT):** يقوم بتكليف سيارة لسائق، ويحدث الحالة إلى "نشط".
- **الاستلام (IN):** يعيد السيارة للأسطول، ويحدث الحالة إلى "غير نشط"، ويسجل قراءة العداد النهائية.

---

## 3. Technical Documentation | التوثيق التقني

### 3.1 Technology Stack | المكونات التقنية
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla JS, CSS3 | Core application logic and UI |
| **Database** | Supabase (PostgreSQL) | Persistence, Real-time updates |
| **UI Design** | Custom Unified UI | Consistent branding and responsive layouts |
| **Icons/Fonts** | Tajawal (Arabic), Digital Numbers | Typography and styling |

### 3.2 Database Schema | هيكلية قاعدة البيانات
The system uses **12 core tables** in Supabase:

1.  **`t01_cars`**: Vehicle metadata (Plate, Model, Owner, Status).
2.  **`t02_drivers`**: Driver profiles and statuses.
3.  **`t03_revenues`**: Financial collection logs.
4.  **`t04_handover`**: Transactions for swapping car keys/assets.
5.  **`t05_expenses`**: Operational and maintenance costs.
6.  **`t06_work_days`**: Tracking of active working shifts and guarantees.
7.  **`t07_fines_accidents`**: Records of traffic penalties and damages.
8.  **`t08_suppliers`**: Directory of maintenance workshops and parts vendors.
9.  **`t09_payments`**: Settlement logs.
10. **`t10_login_logs`**: System security audit trail.
11. **`t11_owners`**: Vehicle owners/Investors.
12. **`t12_staff`**: Administrative users of the system.

### 3.3 Business Logic Patterns | أنماط منطق العمل

#### **A. Handover State Machine | آلة الحالة للتسليم**
When a `handover` record is saved:
1.  **If Action = OUT:** 
    - `t01_cars.f12_is_active` -> "Active"
    - `t02_drivers.f07_status` -> "Active"
2.  **If Action = IN:** 
    - `t01_cars.f12_is_active` -> "InActive"
    - `t02_drivers.f07_status` -> "InActive"

#### **B. Bilingual Tooltip System | نظام التلميحات ثنائي اللغة**
Implemented via `global-config.js` using a dictionary mapping:
```javascript
const tooltipsDictionary = {
    f02_plate_no: { ar: 'رقم اللوحة المعدنية...', en: 'Official license plate...' }
};
```

---

## 4. User & Admin Instructions | تعليمات المستخدمين والمديرين

### 4.1 Daily Tasks | المهام اليومية
1.  **Morning:** Check **Dashboard** for cars needing handover or maintenance.
2.  **Throughout Day:** Record **Revenues** as drivers pay their daily guarantees.
3.  **Maintenance:** Log all spare parts and workshop visits in **Expenses**.

### 4.2 Security | الأمان
- Use the **Login Logs** to monitor who accessed the system and when.
- Ensure every **Staff member** has a dedicated ID for accountability.

---

## 5. Developer Guide | دليل المطورين

### 5.1 Environment Setup
1.  Connect to Supabase using `SB_URL` and `SB_KEY` in `global-config.js`.
2.  Use `unified-ui.css` for any new components to ensure visual consistency.
3.  Bootstrap system using `bootSystem('Page Name')`.

### 5.2 Naming Convention
- **Tables:** `tXX_name` (e.g., `t01_cars`).
- **Fields:** `fXX_name` (e.g., `f02_plate_no`).
- This prefixing ensures zero conflicts with SQL reserved keywords.

---
**Created by Antigravity AI**
*Transforming taxi management through intelligence.*
