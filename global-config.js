/* ==================================================================
 [global-config.js] - النسخة المحدثة (تصغير السايدبار + دعم iPhone)
 ================================================================== */

// ... (الأكواد السابقة الخاصة بالـ URL و Key والـ Client تبقى كما هي)

function injectGlobalStyles() {
  const style = document.createElement('style');
  style.id = 'global-styles';
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/digital-numbers');
    :root { 
        --taxi-gold: #f1c40f; 
        --taxi-dark: #121212; 
        --taxi-red: #e74c3c; 
        --taxi-green: #2ecc71; 
        --sidebar-width: 225px; /* تم التصغير بنسبة 25% من 300px */
    }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 80px; }
    
    .global-header { display: flex; justify-content: space-between; align-items: center; background: var(--taxi-dark); color: white; height: 70px; padding: 0 20px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-sizing: border-box; }
    .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.5rem; color: #00ff41; background: #000; padding: 2px 10px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; }
    
    /* تعديل السايدبار ليدعم الآيفون والتصغير */
    .sidebar { 
        height: 100vh; 
        width: 0; 
        position: fixed; 
        z-index: 3000; 
        top: 0; 
        right: 0; 
        background: rgba(18, 18, 18, 0.98); 
        backdrop-filter: blur(15px); 
        transition: 0.4s; 
        
        /* حل مشكلة الطول على iPhone */
        overflow-y: auto; 
        overflow-x: hidden; 
        -webkit-overflow-scrolling: touch; /* تمرير ناعم على iOS */
        padding-top: 60px;
        padding-bottom: 40px; /* مساحة أمان سفلية */
    }

    /* تصغير الخطوط داخل القائمة لتناسب العرض الجديد */
    .sidebar a { 
        padding: 10px 20px; 
        text-decoration: none; 
        color: white; 
        display: block; 
        transition: 0.3s; 
        font-size: 0.82rem; /* تصغير الخط */
        white-space: nowrap; /* منع انكسار السطر */
    }
    .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 25px; }
    
    .sidebar-header {
        padding: 15px; 
        color: var(--taxi-gold); 
        font-weight: bold; 
        text-align: center; 
        font-size: 1rem; /* تصغير عنوان القائمة */
        border-bottom: 1px solid rgba(255,255,255,0.1);
        margin-bottom: 10px;
    }

    /* تحسين شكل الـ Scrollbar في السايدبار */
    .sidebar::-webkit-scrollbar { width: 4px; }
    .sidebar::-webkit-scrollbar-thumb { background: var(--taxi-gold); border-radius: 10px; }

    .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2500; }
    
    /* ... (بقية الستايلات الخاصة بالمودال تبقى كما هي) */
  `;
  document.head.appendChild(style);
}

// تعديل دالة التبديل لتستخدم العرض الجديد
function toggleNav(open) {
  const sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
  document.getElementById("sideNav").style.width = open ? sidebarWidth : "0";
  document.getElementById("navOverlay").style.display = open ? "block" : "none";
}

// تعديل بسيط في HTML السايدبار لإضافة الكلاس الجديد
function renderGlobalLayout(title) {
  const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام";

  // تم استبدال Inline styles بكلاسات للتحكم أفضل
  const layout = `
    <header class="global-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:26px; cursor:pointer;">☰</button>
        <h3 style="margin:0; font-size:1.1rem;">${title}</h3>
      </div>
      
      <div style="display:flex; align-items:center;">
        <div class="user-welcome-section" style="display:none; @media(min-width:600px){display:flex;}">
          <div style="text-align: left;">
             <div style="font-size:0.55rem; color:#aaa; margin-bottom:-3px;">مرحباً بك،</div>
             <div class="user-name-text" style="font-size:0.8rem;">${fullNameAr}</div>
          </div>
          <div class="user-avatar" style="width:28px; height:28px; font-size:0.8rem;">${fullNameAr.charAt(0)}</div>
        </div>
        
        <div id="meterClock" class="taxi-meter-clock">00:00:00</div>
        
        <button onclick="handleLogout()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.2rem; margin-right:10px;" title="خروج">🚪</button>
      </div>
    </header>

    <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
    <nav id="sideNav" class="sidebar">
      <div class="sidebar-header">🚖 نظام التاكسي</div>
      
      <a href="index.html">📉 لوحة التحكم | Dashboard</a>
      <a href="owners.html">👤 اصحاب السيارات</a>
      <a href="cars.html">🚗 أسطول السيارات</a>
      <a href="drivers.html">👨‍✈️ السائقين</a>
      <a href="revenues.html">💰 الإيرادات والتحصيل</a>
      <a href="expenses.html">🔧 المصاريف والصيانة</a>
      <a href="handover.html">📦 تسليم واستلام</a>
      <a href="payments.html">💳 المدفوعات والتسوية</a>
      <a href="staff.html">👥 الموظفين والإدارة</a>
      <a href="login_logs.html">📜 سجلات الدخول</a>
      <a href="settings.html">⚙️ إعدادات النظام</a>

      <div style="border-top:1px solid rgba(255,255,255,0.1); margin:10px 0;"></div>
      <a href="reports.html" style="color:var(--taxi-gold); font-weight:bold;">📊 التقارير المركزية</a>
      <a href="#" onclick="handleLogout()" style="color:#e74c3c;">🚪 تسجيل الخروج</a>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', layout);
}
