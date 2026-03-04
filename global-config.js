/* ==================================================================
 [global-config.js] - النسخة المدمجة والمحدثة (تصغير 25% + دعم iPhone)
 ================================================================== */

const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim(); // رابط مشروع قاعدة البيانات Supabase
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim(); // مفتاح الوصول الخاص بالمشروع
const _supabase = supabase.createClient(SB_URL, SB_KEY); // تهيئة اتصال مكتبة Supabase

function bootSystem(pageTitle) { // دالة بدء تشغيل النظام عند تحميل الصفحة
  if (document.readyState === "loading") { // التحقق إذا كانت الصفحة لا تزال في مرحلة التحميل
    document.addEventListener("DOMContentLoaded", () => startBootSequence(pageTitle)); // الانتظار حتى اكتمال تحميل عناصر HTML
  } else {
    startBootSequence(pageTitle); // تشغيل تسلسل التشغيل فوراً إذا كانت الصفحة جاهزة
  }
}

function startBootSequence(pageTitle) { // تسلسل إعداد الواجهة الموحدة
  if (document.getElementById('global-styles')) return; // منع تكرار إضافة التنسيقات إذا كانت موجودة
  injectGlobalStyles();  // حقن تنسيقات الـ CSS العالمية في الرأس
  renderGlobalLayout(pageTitle); // بناء الهيكل العام (الهيدر والسايدبار)
  startPulseEngine(); // تشغيل محرك الساعة المباشرة
  initGlobalModalStructure(); // تهيئة هيكل صناديق التنبيه (Modals)
}

function injectGlobalStyles() { // دالة تعريف وإضافة تنسيقات CSS
  const style = document.createElement('style'); // إنشاء عنصر style جديد
  style.id = 'global-styles'; // تعيين معرف للعنصر للتحكم به
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/digital-numbers'); /* استيراد خط الأرقام الرقمية للساعة */
    :root { 
        --taxi-gold: #f1c40f; /* تعريف اللون الذهبي الأساسي */
        --taxi-dark: #121212; /* تعريف اللون الأسود للخلفيات */
        --taxi-red: #e74c3c; /* تعريف اللون الأحمر للتحذيرات والخروج */
        --taxi-green: #2ecc71; /* تعريف اللون الأخضر للنجاح */
        --sidebar-w: 225px; /* العرض الجديد للسايدبار بعد التصغير */
    }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 80px; } /* تنسيق جسم الصفحة */
    
    .global-header { display: flex; justify-content: space-between; align-items: center; background: var(--taxi-dark); color: white; height: 70px; padding: 0 15px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-sizing: border-box; } /* تنسيق شريط العنوان العلوي */
    .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.5rem; color: #00ff41; background: #000; padding: 2px 10px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; } /* تنسيق الساعة الرقمية (عداد التاكسي) */
    
    .user-welcome-section { display: flex; align-items: center; gap: 8px; margin-left: 10px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 10px; } /* تنسيق قسم الترحيب بالمستخدم */
    .user-name-text { font-size: 0.8rem; font-weight: bold; color: var(--taxi-gold); } /* تنسيق نص اسم المستخدم */
    .user-avatar { width: 28px; height: 28px; background: var(--taxi-gold); color: var(--taxi-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #fff; font-size: 0.8rem; } /* تنسيق الصورة الرمزية للمستخدم */

    .sidebar { 
        height: calc(100vh - 70px); /* الارتفاع الكلي ناقص طول الهيدر */
        width: var(--sidebar-w); /* العرض المحدد بـ 225px */
        position: fixed; /* تثبيت الموقع في الشاشة */
        z-index: 3000; /* ضمان الظهور فوق المحتوى */
        top: 70px; /* البداية من تحت الهيدر مباشرة */
        right: calc(var(--sidebar-w) * -1); /* إخفاء القائمة خارج جهة اليمين */
        background: rgba(18, 18, 18, 0.98); /* لون الخلفية مع شفافية بسيطة */
        backdrop-filter: blur(25px); /* تأثير تمويه خلفية القائمة */
        transition: transform 0.8s ease-in-out; /* حركة انسيابية طويلة المدى للظهور */
        overflow-y: auto; /* السماح بالتمرير العمودي للمنيو الطويل */
        -webkit-overflow-scrolling: touch; /* تحسين التمرير في أجهزة iOS */
        padding-top: 10px; /* مساحة علوية بسيطة */
        padding-bottom: 50px; /* مساحة سفلية لضمان عدم اختفاء الروابط */
        border-left: 1px solid rgba(241, 196, 15, 0.3); /* خط جانبي ذهبي نحيف */
    }
    
    .sidebar.open { transform: translateX(calc(var(--sidebar-w) * -1)); } /* دفع القائمة لليسار عند الفتح لتظهر */

    .sidebar a { padding: 10px 20px; text-decoration: none; color: white; display: block; transition: 0.3s; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.05); } /* تنسيق روابط القائمة الجانبية */
    .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 30px; } /* تأثير تمرير الماوس فوق الروابط */
    
    .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2500; } /* تنسيق طبقة التعتيم الخلفية */

    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; } /* خلفية المودال المعتمة */
    .modal-card { background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; border-top: 10px solid var(--taxi-gold); box-shadow: 0 20px 40px rgba(0,0,0,0.3); } /* كرت المودال الأبيض */
    .sort-icon { display: inline-block; margin-right: 5px; color: #ccc; transition: 0.3s; } /* أيقونات ترتيب الجداول */
    .sort-active { color: var(--taxi-gold) !important; font-weight: bold; } /* مظهر أيقونة الترتيب النشطة */
  `;
  document.head.appendChild(style); // إضافة الـ CSS للرأس
}

function renderGlobalLayout(title) { // دالة بناء HTML الواجهة
  const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام"; // جلب الاسم من جلسة التخزين

  const layout = `
    <header class="global-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:28px; cursor:pointer;">☰</
