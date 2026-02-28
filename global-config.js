/* ==================================================================
 [global-config.js] - النسخة النهائية الشاملة (2026)
 نظام إدارة التاكسي الذكي - Smart Cloud-based System
 ================================================================== */

// 1. إعدادات الاتصال بـ Supabase
const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim();
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim();
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// 2. محرك تشغيل النظام (Boot Engine)
function bootSystem(pageTitle) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startBootSequence(pageTitle));
    } else {
        startBootSequence(pageTitle);
    }
}

function startBootSequence(pageTitle) {
    if (document.getElementById('global-styles')) return;

    injectAppIcons();          // حقن أيقونات التبويب وآيفون
    injectGlobalStyles();       // حقن التنسيقات العامة
    showSplashScreen();        // إظهار شاشة الترحيب الفورية
    renderGlobalLayout(pageTitle); // بناء الهيدر والقائمة الجانبية
    startPulseEngine();        // تشغيل الساعة الرقمية
    initGlobalModalStructure(); // تهيئة نظام النوافذ المنبثقة
    setupPWA();                // تهيئة إعدادات التطبيق للجوال

    // تعبئة حقل المحصل (f08_collector) تلقائياً بعد هدوء الصفحة
    setTimeout(applyCollectorName, 400); 
}

// 3. شاشة الترحيب (Splash Screen)
function showSplashScreen() {
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #ffffff; display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 9999;
        transition: opacity 0.6s ease;
    `;
    splash.innerHTML = `
        <img src="icon.png" alt="Logo" style="width:130px; height:130px; margin-bottom:20px; animation: pulse 2s infinite;">
        <h2 style="color: #2c3e50; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0;">نظام إدارة التاكسي الذكي</h2>
        <div style="margin-top:15px; color:#f1c40f; font-weight:bold; letter-spacing:1px;">جاري التحميل...</div>
    `;
    document.body.appendChild(splash);

    window.addEventListener('load', () => {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 600);
        }, 1000);
    });
}

// 4. حقن الأيقونات (Favicon & Apple Touch Icon)
function injectAppIcons() {
    const head = document.head;
    const iconPath = 'icon.png';

    // أيقونة المتصفح
    let favicon = document.querySelector("link[rel*='icon']");
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        head.appendChild(favicon);
    }
    favicon.href = iconPath;

    // أيقونة آيفون
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        head.appendChild(appleIcon);
    }
    appleIcon.href = iconPath;

    // إعدادات الشاشة للموبايل
    if (!document.querySelector("meta[name='viewport']")) {
        const meta = document.createElement('meta');
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        head.appendChild(meta);
    }
}

// 5. التنسيقات العالمية (CSS Injection)
function injectGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'global-styles';
    style.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-numbers');
        :root { --taxi-gold: #f1c40f; --taxi-dark: #121212; --taxi-red: #e74c3c; --taxi-green: #2ecc71; }
        body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 80px; }
        
        .global-header { display: flex; justify-content: space-between; align-items: center; background: var(--taxi-dark); color: white; height: 70px; padding: 0 20px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-sizing: border-box; }
        .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.8rem; color: #00ff41; background: #000; padding: 2px 12px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; }
        
        .sidebar { height: 100vh; width: 0; position: fixed; z-index: 3000; top: 0; right: 0; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(15px); transition: 0.4s; overflow-x: hidden; padding-top: 60px; }
        .sidebar a { padding: 12px 25px; text-decoration: none; color: white; display: block; transition: 0.3s; font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 35px; }
        
        .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2500; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; }
        .modal-card { background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; border-top: 10px solid var(--taxi-gold); box-shadow: 0 20px 40px rgba(0,0,0,0.3); color: #333; }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// 6. بناء الهيكلية العالمية (Header & SideNav)
function renderGlobalLayout(title) {
    const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام";

    const layout = `
        <header class="global-header">
            <div style="display:flex; align-items:center; gap:15px;">
                <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:30px; cursor:pointer;">☰</button>
                <h3 style="margin:0;">${title}</h3>
            </div>
            
            <div style="display:flex; align-items:center;">
                <div style="display: flex; align-items: center; gap: 10px; margin-left: 15px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px;">
                    <div style="text-align: left;">
                        <div style="font-size:0.65rem; color:#aaa; margin-bottom:-3px;">مرحباً بك،</div>
                        <div style="font-size: 0.9rem; font-weight: bold; color: var(--taxi-gold);">${fullNameAr}</div>
                    </div>
                    <div style="width: 32px; height: 32px; background: var(--taxi-gold); color: var(--taxi-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #fff;">${fullNameAr.charAt(0)}</div>
                </div>
                <div id="meterClock" class="taxi-meter-clock">00:00:00</div>
                <button onclick="handleLogout()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.4rem; margin-right:15px;">🚪</button>
            </div>
        </header>

        <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
        <nav id="sideNav" class="sidebar">
            <div style="padding:20px; color:var(--taxi-gold); font-weight:bold; text-align:center; font-size:1.2rem; border-bottom:1px solid rgba(255,255,255,0.1);">🚖 القائمة الرئيسية</div>
            <a href="index.html">📉 لوحة التحكم | Dashboard</a>
            <a href="cars.html">🚗 أسطول السيارات</a>
            <a href="drivers.html">👨‍✈️ السائقين</a>
            <a href="contracts.html">📜 العقود والضمانات</a>
            <a href="shifts.html">⏱️ المناوبات</a>
            <a href="revenues.html">💰 الإيرادات والتحصيل</a>
            <a href="expenses.html">🔧 المصاريف والصيانة</a>
            <a href="handover.html">📦 العُهد والأمانات</a>
            <a href="t08-violations.html">⚠️ المخالفات والحوادث</a>
            <a href="t09-permits.html">🪪 التصاريح والأوراق</a>
            <a href="staff.html">👥 الموظفين والإدارة</a>
            <a href="t11-assets.html">🏢 الأصول والممتلكات</a>
            <a href="t12-settings.html">⚙️ إعدادات النظام</a>
            <div style="border-top:1px solid rgba(255,255,255,0.1); margin:15px 0;"></div>
            <a href="reports.html" style="color:var(--taxi-gold); font-weight:bold;">📊 التقارير المركزية</a>
            <a href="#" onclick="handleLogout()" style="color:#e74c3c;">🚪 تسجيل الخروج</a>
        </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', layout);
}

// 7. وظائف التحكم
function toggleNav(open) {
    document.getElementById("sideNav").style.width = open ? "300px" : "0";
    document.getElementById("navOverlay").style.display = open ? "block" : "none";
}

function startPulseEngine() {
    setInterval(() => {
        const clock = document.getElementById('meterClock');
        if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }, 1000);
}

function handleLogout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function applyCollectorName() {
    const user = sessionStorage.getItem('full_name_ar');
    const field = document.getElementById('f08_collector');
    if (field && user) {
        field.value = user;
        field.readOnly = true;
        field.style.background = "#f9f9f9";
    }
}

// 8. نظام المودال العالمي
function initGlobalModalStructure() {
    if (document.getElementById('globalModal')) return;
    const html = `
        <div id="globalModal" class="modal-overlay">
            <div id="modalCard" class="modal-card">
                <h2 id="modalTitle">تنبيه</h2>
                <p id="modalMsg"></p>
                <div id="modalBtnContainer" style="display:flex; gap:10px; justify-content:center; margin-top:20px;"></div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

window.showModal = function(title, message, type = 'info', onConfirm = null) {
    const modal = document.getElementById('globalModal');
    const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f1c40f', info: '#3498db' };
    
    document.getElementById('modalCard').style.borderTopColor = colors[type] || colors.info;
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalTitle').style.color = colors[type];
    document.getElementById('modalMsg').innerText = message;
    
    const container = document.getElementById('modalBtnContainer');
    container.innerHTML = '';

    if (onConfirm) {
        const okBtn = document.createElement('button');
        okBtn.innerText = 'تأكيد';
        okBtn.style = "background:#e74c3c; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;";
        okBtn.onclick = async () => { await onConfirm(); modal.style.display = 'none'; };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = 'إلغاء';
        cancelBtn.style = "background:#eee; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;";
        cancelBtn.onclick = () => modal.style.display = 'none';
        
        container.appendChild(okBtn);
        container.appendChild(cancelBtn);
    } else {
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'موافق';
        closeBtn.style = "background:var(--taxi-dark); color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;";
        closeBtn.onclick = () => modal.style.display = 'none';
        container.appendChild(closeBtn);
    }
    modal.style.display = 'flex';
}

// 9. إعدادات PWA للجوال
function setupPWA() {
    const head = document.head;
    const metaTags = [
        { name: 'theme-color', content: '#121212' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
    ];
    metaTags.forEach(tag => {
        const m = document.createElement('meta');
        m.name = tag.name; m.content = tag.content;
        head.appendChild(m);
    });
}
