# 🚖 نظام إدارة التاكسي الذكي | Smart Taxi Management System

![Version](https://img.shields.io/badge/version-1.0.0-gold)
![License](https://img.shields.io/badge/license-MIT-darkgreen)
![Supabase](https://img.shields.io/badge/Backend-Supabase-blueviolet)

---

## 📝 وصف المشروع | Project Description

**بالعربية:**
نظام سحابي ذكي متكامل مصمم لإدارة أساطيل التاكسي، العُهد، والمطابقة المالية. يهدف النظام إلى أتمتة العمليات اليومية بدءاً من إدارة أصحاب السيارات والسائقين وصولاً إلى تتبع الإيرادات والمصاريف اليومية بدقة عالية.

**In English:**
A comprehensive smart cloud-based system designed for taxi fleet management, custody tracking, and financial reconciliation. The system aims to automate daily operations, from managing car owners and drivers to precisely tracking daily revenues and expenses.

---

## ✨ المميزات الرئيسية | Key Features

* **📊 لوحة تحكم تفاعلية (Dashboard):** عرض ملخص سريع للعمليات المالية وأداء الأسطول.
* **🚗 إدارة الأسطول (Fleet Management):** سجل كامل للسيارات، أصحابها (Owners)، والسائقين.
* **💰 المحاسبة المالية (Financial Accounting):** تتبع دقيق للإيرادات، التحصيل، والمصاريف اليومية.
* **📦 نظام التسليم والاستلام (Handover):** توثيق حالة السيارة عند تبديل الورديات أو السائقين.
* **🕒 سجلات الأمان (Audit Logs):** مراقبة سجلات دخول الموظفين وتحركات النظام لضمان الشفافية.
* **📱 تصميم متجاوب (Responsive UI):** واجهة مستخدم ناعمة تدعم أجهزة iPhone وجميع الهواتف الذكية.

---

## 🚀 التقنيات المستخدمة | Tech Stack

* **Frontend:** HTML5, CSS3 (Custom Variables & Backdrop Filters), Pure JavaScript (ES6+).
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL).
* **Authentication:** Supabase Auth Integration.
* **Icons:** Emoji-based intuitive navigation.

---

## 📂 هيكلية الملفات | File Structure

| File | Description | الوصف |
| :--- | :--- | :--- |
| `global-config.js` | Core logic, UI rendering & Supabase init | الإعدادات العامة، بناء الواجهة، والاتصال بسوبابيس |
| `cars-style.css` | Main styling for the application | ملف التنسيق الأساسي للنظام |
| `cars-logic.js` | Business logic for car management | المنطق البرمجي لإدارة سجلات السيارات |
| `expenses.html` | Expenses and maintenance management | صفحة إدارة المصاريف والصيانة |

---

## 🛠️ التثبيت والتشغيل | Installation & Setup

1. قم بعمل `Clone` للمستودع:
   ```bash
   git clone [https://github.com/your-username/taxi-management-system.git](https://github.com/your-username/taxi-management-system.git)
