/* ==================================================================
 [global-config.js] - النسخة المعتمدة (حركة ناعمة + خطوط متزنة)
 نظام إدارة التاكسي الذكي - Smart Taxi Management System
 ================================================================== */

// إعدادات الاتصال بقاعدة بيانات Supabase
const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim(); // رابط المشروع
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim(); // مفتاح الوصول
const _supabase = supabase.createClient(SB_URL, SB_KEY); // إنشاء العميل للتعامل مع البيانات

// دالة بدء تشغيل النظام عند تحميل الصفحة
function bootSystem(pageTitle) {
  if (document.readyState === "loading") { // إذا كانت الصفحة لا تزال تحمل
    document.addEventListener("DOMContentLoaded", () => startBootSequence(pageTitle)); // انتظر حتى تكتمل
  } else {
    startBootSequence(pageTitle); // ابدأ فوراً إذا كانت محملة
  }
}

// تسلسل عمليات بناء الواجهة
function startBootSequence(pageTitle) {
  if (document.getElementById('global-styles')) return; // تجنب تكرار حقن التنسيقات
  injectGlobalStyles();  // حقن لغة التنسيق CSS
  renderGlobalLayout(pageTitle); // بناء الهيدر والسايدبار
  startPulseEngine(); // تشغيل الساعة الرقمية
  initGlobalModalStructure(); // تهيئة نظام التنبيهات (المودال)
}

// حقن التنسيقات العالمية CSS
function injectGlobalStyles() {
  const style = document.createElement('style'); // إنشاء عنصر style
  style.id = 'global-styles'; // تسمية العنصر للرجوع إليه
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/digital-numbers'); /* خط العداد الرقمي */
    :root { 
        --taxi-gold: #f1c40f; /* اللون الذهبي الرئيسي */
        --taxi-dark: #121212; /* اللون الأسود العميق */
        --taxi-red: #e74c3c; /* لون التنبيهات والأخطاء */
        --taxi-green: #2ecc71; /* لون العمليات الناجحة */
        --sidebar-w: 250px; /* العرض المثالي للقائمة */
    }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 80px; } /* تنسيق جسم الصفحة */
    
    /* تنسيق الهيدر العلوي */
    .global-header { display: flex; justify-content: space-between; align-items: center; background: var(--taxi-dark); color: white; height: 70px; padding: 0 20px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-sizing: border-box; }
    
    /* تنسيق الساعة الرقمية */
    .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.8rem; color: #00ff41; background: #000; padding: 2px 12px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; }
    
    /* قسم ترحيب المستخدم */
    .user-welcome-section { display: flex; align-items: center; gap: 10px; margin-left: 15px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px; }
    .user-name-text { font-size: 0.9rem; font-weight: bold; color: var(--taxi-gold); }
    .user-avatar { width: 32px; height: 32px; background: var(--taxi-gold); color: var(--taxi-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #fff; }

    /* السايدبار المحدث بحركة ناعمة (Soft Manner) */
    .sidebar { 
        height: calc(100vh - 70px); /* الارتفاع تحت الهيدر */
        width: var(--sidebar-w); /* العرض المحدد */
        position: fixed; /* تثبيت الموقع */
        z-index: 3000; /* فوق كل العناصر */
        top: 70px; /* البداية من تحت الهيدر */
        right: calc(var(--sidebar-w) * -1.1); /* إخفاء لجهة اليمين تماماً */
        background: rgba(18, 18, 18, 0.98); /* لون داكن بلمسة شفافة */
        backdrop-filter: blur(20px); /* تأثير ضبابي للخلفية */
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); /* حركة انسيابية جداً */
        overflow-y: auto; /* السماح بالتمرير */
        -webkit-overflow-scrolling: touch; /* دعم تمرير الآيفون */
        border-left: 1px solid rgba(241, 196, 15, 0.2); /* خط جانبي خفيف */
        box-shadow: -10px 0 30px rgba(0,0,0,0.3); /* ظل جانبي للعمق */
    }

    /* كلاس التفعيل عند الفتح */
    .sidebar.open { transform: translateX(calc(var(--sidebar-w) * -1.1)); }

    /* تنسيق روابط القائمة بخطوط معقولة */
    .sidebar a { padding: 12px 25px; text-decoration: none; color: white; display: block; transition: 0.3s; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.03); white-space: nowrap; }
    .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 35px; }
    
    /* طبقة التعتيم الخلفية */
    .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2500; transition: opacity 0.5s; }

    /* تنسيق المودال العالمي */
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; }
    .modal-card { background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; border-top: 10px solid var(--taxi-gold); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
    
    /* أيقونات الفرز في الجداول */
    .sort-icon { display: inline-block; margin-right: 5px; color: #ccc; transition: 0.3s; }
    .sort-active { color: var(--taxi-gold) !important; font-weight: bold; }
  `;
  document.head.appendChild(style); // إضافة التنسيقات للرأس
}

// بناء الهيكل العام للهيدر والسايدبار
function renderGlobalLayout(title) {
  const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام"; // جلب الاسم من الجلسة

  const layout = `
    <header class="global-header">
      <div style="display:flex; align-items:center; gap:15px;">
        <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:30px; cursor:pointer;">☰</button> <h3 style="margin:0;">${title}</h3> </div>
      
      <div style="display:flex; align-items:center;">
        <div class="user-welcome-section">
          <div style="text-align: left;">
             <div style="font-size:0.65rem; color:#aaa; margin-bottom:-3px;">مرحباً بك،</div>
             <div class="user-name-text">${fullNameAr}</div> </div>
          <div class="user-avatar">${fullNameAr.charAt(0)}</div> </div>
        
        <div id="meterClock" class="taxi-meter-clock">00:00:00</div> <button onclick="handleLogout()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.4rem; margin-right:15px;" title="خروج">🚪</button> </div>
    </header>

    <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div> <nav id="sideNav" class="sidebar"> <div style="padding:20px; color:var(--taxi-gold); font-weight:bold; text-align:center; font-size:1.1rem; border-bottom:1px solid rgba(255,255,255,0.1);">
        🚖 نظام إدارة التاكسي
      </div>
      
      <a href="index.html">📉 لوحة التحكم | Dashboard</a>
      <a href="owners.html">👤 أصحاب السيارات</a>
      <a href="cars.html">🚗 أسطول السيارات</a>
      <a href="drivers.html">👨‍✈️ السائقين</a>
      <a href="revenues.html">💰 الإيرادات والتحصيل</a>
      <a href="expenses.html">🔧 المصاريف والصيانة</a>
      <a href="handover.html">📦 تسليم واستلام السيارات</a>
      <a href="payments.html">💳 المدفوعات والتسوية</a>
      <a href="staff.html">👥 الموظفين والإدارة</a>
      <a href="login_logs.html">📜 سجلات الدخول</a>
      <a href="settings.html">⚙️ إعدادات النظام</a>

      <div style="border-top:1px solid rgba(255,255,255,0.1); margin:15px 0;"></div>
      <a href="reports.html" style="color:var(--taxi-gold); font-weight:bold;">📊 التقارير المركزية</a>
      <a href="#" onclick="handleLogout()" style="color:#e74c3c;">🚪 تسجيل الخروج</a>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', layout); // إدراج الهيكل في الصفحة
}

// دالة تسجيل الخروج
function handleLogout() {
    sessionStorage.clear(); // مسح بيانات الجلسة
    window.location.href = 'login.html'; // العودة لصفحة الدخول
}

// دالة فتح وإغلاق السايدبار
function toggleNav(open) {
  const nav = document.getElementById("sideNav"); // جلب القائمة
  const overlay = document.getElementById("navOverlay"); // جلب التعتيم
  if (open) {
    nav.classList.add("open"); // إضافة كلاس التحريك لليسار
    overlay.style.display = "block"; // إظهار التعتيم
    document.body.style.overflow = "hidden"; // منع التمرير في الخلفية
  } else {
    nav.classList.remove("open"); // إزالة كلاس التحريك
    overlay.style.display = "none"; // إخفاء التعتيم
    document.body.style.overflow = "auto"; // السماح بالتمرير مجدداً
  }
}

// محرك تحديث الوقت كل ثانية
function startPulseEngine() {
  setInterval(() => {
    const clock = document.getElementById('meterClock'); // جلب عنصر الساعة
    if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); // تحديث النص
  }, 1000);
}

// تهيئة هيكل المودال العالمي
function initGlobalModalStructure() {
  if (document.getElementById('globalModal')) return; // التحقق من عدم التكرار
  const html = `
    <div id="globalModal" class="modal-overlay">
        <div id="modalCard" class="modal-card">
            <h2 id="modalTitle">تنبيه</h2>
            <p id="modalMsg"></p>
            <div id="modalBtnContainer" style="display:flex; gap:10px; justify-content:center; margin-top:20px;"></div>
        </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html); // إضافته لنهاية الصفحة
}

// دالة عرض المودال (معلومات، خطأ، نجاح، تأكيد)
window.showModal = function(title, message, type = 'info', onConfirm = null) {
  const modal = document.getElementById('globalModal'); // جلب المودال
  const card = document.getElementById('modalCard'); // جلب الكرت
  const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f1c40f', info: '#3498db' }; // مصفوفة الألوان
  
  card.style.borderTopColor = colors[type] || colors.info; // تغيير لون الحدود حسب النوع
  document.getElementById('modalTitle').innerText = title; // تعيين العنوان
  document.getElementById('modalTitle').style.color = colors[type]; // تلوين العنوان
  document.getElementById('modalMsg').innerText = message; // تعيين الرسالة
  
  const container = document.getElementById('modalBtnContainer'); // جلب حاوية الأزرار
  container.innerHTML = ''; // تنظيف الحاوية

  if (onConfirm) { // إذا كانت هناك دالة تأكيد
    const okBtn = document.createElement('button'); // زر تأكيد
    okBtn.innerText = 'تأكيد';
    okBtn.style = `background:${colors.error}; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;`;
    okBtn.onclick = async () => { await onConfirm(); closeGlobalModal(); };
    
    const cancelBtn = document.createElement('button'); // زر إلغاء
    cancelBtn.innerText = 'إلغاء';
    cancelBtn.style = `background:#eee; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;`;
    cancelBtn.onclick = closeGlobalModal;
    
    container.appendChild(okBtn);
    container.appendChild(cancelBtn);
  } else { // مودال إعلامي فقط
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'موافق';
    closeBtn.style = `background:var(--taxi-dark); color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;`;
    closeBtn.onclick = closeGlobalModal;
    container.appendChild(closeBtn);
  }
  modal.style.display = 'flex'; // إظهار المودال
}

// دالة إغلاق المودال
function closeGlobalModal() {
  document.getElementById('globalModal').style.display = 'none';
}

// تحديث أيقونات الفرز في الجداول
window.updateSortVisuals = function(columnIndex, isAscending) {
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.innerText = "↕"; // تعيين أيقونة محايدة للكل
    icon.classList.remove('sort-active');
  });
  const activeIcon = document.getElementById('sortIcon' + columnIndex); // جلب الأيقونة النشطة
  if (activeIcon) {
    activeIcon.innerText = isAscending ? "↑" : "↓"; // تغيير السهم حسب اتجاه الفرز
    activeIcon.classList.add('sort-active'); // تمييز الأيقونة باللون الذهبي
  }
}
