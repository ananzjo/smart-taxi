/* ==================================================================
 [global-config.js] - النسخة المعتمدة والمحصنة (العداد + حماية التكرار)
 نظام إدارة التاكسي الذكي - Smart Taxi Management System
 ================================================================== */

// إعدادات الاتصال بقاعدة بيانات Supabase
const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim();
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim();
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- [1] نظام حماية الإرسال المتعدد (Submission Guard) ---
let isSubmitting = false;

/**
 * دالة الحماية: تمنع تشغيل أي دالة (مثل الحفظ) أكثر من مرة في ثانية واحدة
 * الاستخدام: safeSubmit(saveData)
 */
window.safeSubmit = async function(submitFunction) {
    if (isSubmitting) {
        console.warn("⚠️ محاولة إرسال مكررة تم حجبها بنجاح.");
        return; 
    }

    isSubmitting = true;
    try {
        await submitFunction(); // تشغيل الدالة الأصلية
    } catch (err) {
        console.error("Submission Error:", err);
    } finally {
        // إعادة التفعيل بعد ثانية واحدة (1000ms)
        setTimeout(() => { isSubmitting = false; }, 1000);
    }
};

// --- [2] نظام تشغيل الواجهة (Boot Sequence) ---
function bootSystem(pageTitle) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startBootSequence(pageTitle));
    } else {
        startBootSequence(pageTitle);
    }
}

function startBootSequence(pageTitle) {
    if (document.getElementById('global-styles')) return;
    injectGlobalStyles();  
    renderGlobalLayout(pageTitle); 
    startPulseEngine(); 
    initGlobalModalStructure(); 
    initGlobalToastStructure();
}

// --- [3] التنسيقات العالمية (CSS) ---
function injectGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'global-styles';
    style.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-numbers');
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        :root { 
            --taxi-gold: #d4af37; /* Premium Gold */
            --taxi-gold-light: #f3e5ab;
            --taxi-dark: #0b0c10; /* Elegant deep dark */
            --taxi-red: #ff4c4c; 
            --taxi-green: #00d289; 
            --taxi-bg-light: #f5f6f8;
            --taxi-glass: rgba(11, 12, 16, 0.85);
        }
        body { margin: 0; padding: 0; font-family: 'Tajawal', 'Segoe UI', sans-serif; direction: rtl; background: var(--taxi-bg-light); padding-top: 80px; }
        
        /* ============================
           LUXURY GLOBAL HEADER
           ============================ */
        .global-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, rgba(11,12,16,0.96) 0%, rgba(20,22,30,0.95) 100%);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            color: white;
            height: 72px;
            padding: 0 28px;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 2000;
            border-bottom: 1px solid rgba(212,175,55,0.25);
            border-radius: 0 0 20px 20px;
            box-shadow:
                0 8px 32px rgba(0,0,0,0.5),
                0 2px 0 rgba(212,175,55,0.3),
                inset 0 1px 0 rgba(255,255,255,0.05);
            box-sizing: border-box;
            transition: box-shadow 0.3s ease;
        }
        .global-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 5%; right: 5%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--taxi-gold), transparent);
            border-radius: 50%;
        }
        .header-logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header-logo-icon {
            font-size: 1.8rem;
            filter: drop-shadow(0 0 8px rgba(212,175,55,0.6));
        }
        .header-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: rgba(255,255,255,0.85);
            letter-spacing: 0.8px;
            border-right: 2px solid var(--taxi-gold);
            padding-right: 12px;
        }
        .header-page-name {
            font-size: 1rem;
            font-weight: 700;
            color: var(--taxi-gold);
            margin-right: 10px;
        }
        .header-menu-btn {
            background: rgba(212,175,55,0.1);
            border: 1px solid rgba(212,175,55,0.3);
            color: var(--taxi-gold);
            font-size: 1.4rem;
            cursor: pointer;
            width: 42px; height: 42px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.3s ease;
        }
        .header-menu-btn:hover {
            background: rgba(212,175,55,0.25);
            box-shadow: 0 0 15px rgba(212,175,55,0.3);
            transform: scale(1.05);
        }
        .taxi-meter-clock { font-family: 'Digital Numbers', monospace; font-size: 1.6rem; color: #39ff14; background: #000; padding: 5px 14px; border-radius: 10px; box-shadow: inset 0 0 12px rgba(57,255,20,0.25), 0 0 20px rgba(57,255,20,0.1); text-shadow: 0 0 6px #39ff14; letter-spacing: 3px; border: 1px solid rgba(57,255,20,0.4); }
        
        /* Record Capsule */
        .record-counter-capsule {
            display: none; /* Moved to local pages */
        }

        .user-welcome-section { display: flex; align-items: center; gap: 12px; margin-left: 20px; border-left: 1px solid rgba(255,255,255,0.15); padding-left: 20px; }
        .user-name-text { font-size: 0.95rem; font-weight: 700; color: var(--taxi-gold); letter-spacing: 0.5px; }
        .user-avatar { width: 38px; height: 38px; background: linear-gradient(135deg, var(--taxi-gold), #b58500); color: var(--taxi-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #fff; box-shadow: 0 2px 10px rgba(212,175,55,0.4); font-size: 1.1rem; }

        /* Glassmorphism Sidebar */
        .sidebar { height: 100vh; width: 260px; position: fixed; z-index: 4000; top: 0; right: -280px; background: var(--taxi-glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1); overflow-y: auto; border-left: 1px solid rgba(212, 175, 55, 0.2); box-shadow: -15px 0 50px rgba(0,0,0,0.7); }
        .sidebar.open { transform: translateX(-280px); }
        .sidebar a { padding: 15px 25px; text-decoration: none; color: #ddd; display: block; transition: all 0.3s ease; font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.03); white-space: nowrap; font-weight: 500; position: relative; }
        .sidebar a::before { content: ''; position: absolute; right: 0; top: 0; height: 100%; width: 0; background: linear-gradient(90deg, rgba(212,175,55,0.1) 0%, transparent 100%); transition: width 0.3s ease; z-index: -1; }
        .sidebar a:hover { color: var(--taxi-gold); padding-right: 35px; border-right: 4px solid var(--taxi-gold); font-weight: 700; text-shadow: 0 0 8px rgba(212,175,55,0.3); }
        .sidebar a:hover::before { width: 100%; }
        
        .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 2500; transition: opacity 0.3s; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-card { background: white; padding: 35px; border-radius: 20px; text-align: center; max-width: 420px; width: 90%; border-top: 10px solid var(--taxi-gold); box-shadow: 0 25px 50px rgba(0,0,0,0.4); transform: scale(0.9); animation: modalPop 0.3s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes modalPop { to { transform: scale(1); } }
        .sort-icon { display: inline-block; margin-right: 5px; color: #ccc; transition: 0.3s; }
        .sort-active { color: var(--taxi-gold) !important; font-weight: bold; text-shadow: 0 0 5px rgba(212,175,55,0.5); }
        
        /* Toast Notification System */
        .toast-container { position: fixed; bottom: 30px; left: 30px; z-index: 10000; display: flex; flex-direction: column; gap: 15px; }
        .toast-msg { min-width: 250px; background: var(--taxi-glass); backdrop-filter: blur(10px); color: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px; font-weight: 500; border-right: 5px solid; transform: translateX(-120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s; opacity: 0; border-left: 1px solid rgba(255,255,255,0.1); border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .toast-msg.show { transform: translateX(0); opacity: 1; }
        .toast-icon { font-size: 1.4rem; }
        .toast-success { border-right-color: var(--taxi-green); }
        .toast-error { border-right-color: var(--taxi-red); }
        .toast-warning { border-right-color: var(--taxi-gold); }
        .toast-info { border-right-color: #3498db; }
        /* ===== ADVANCED TABLE CONTROLS ===== */
        .table-header-controls { display: flex; justify-content: space-between; align-items: center; padding: 18px 30px; background: linear-gradient(135deg, #fff 0%, #fafafa 100%); border-bottom: 2px solid var(--taxi-gold); border-radius: 20px 20px 0 0; }
        .record-badge { background: linear-gradient(135deg, var(--taxi-dark) 0%, #1a1c22 100%); color: var(--taxi-gold); padding: 8px 22px; border-radius: 30px; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15), 0 0 0 1px rgba(212,175,55,0.3); letter-spacing: 0.5px; }
        .record-badge span { font-size: 1.4rem; color: white; font-weight: 900; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: inline-block; }
        .global-search-wrapper { position: relative; width: 350px; }
        .global-search-input { width: 100%; padding: 12px 20px; padding-right: 45px; border-radius: 30px; border: 1.5px solid #e0e0e0; font-family: inherit; font-size: 1rem; transition: all 0.3s; background: #fff; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02); box-sizing: border-box; }
        .global-search-input:focus { border-color: var(--taxi-gold); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.12); outline: none; }
        .search-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--taxi-gold); font-size: 1.2rem; pointer-events: none; }
        
        /* Column Search Row Styling (Filters above labels) */
        .column-search-row th { 
            padding: 10px 8px 4px; 
            background: #fdfdfd; 
            border-bottom: 1px solid #f0f0f0; 
        }
        .column-search-input { 
            width: 92%; 
            padding: 8px 12px; 
            border: 1.5px solid #e2e2e2; 
            border-radius: 10px; 
            font-family: inherit; 
            font-size: 0.82rem; 
            text-align: center; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            background: #ffffff; 
            color: var(--taxi-dark);
        }
        .column-search-input:focus { 
            border-color: var(--taxi-gold); 
            outline: none; 
            box-shadow: 0 4px 12px rgba(212,175,55,0.15); 
            background: #fff;
        }
        .column-search-input::placeholder { color: #ccc; font-weight: 400; }
        
        /* Sort Indicator Arrows (Prominent Yellow) */
        th[onclick] { 
            cursor: pointer; 
            user-select: none; 
            padding: 12px 10px !important; 
            font-weight: 800 !important;
            color: var(--taxi-dark);
            position: relative;
            transition: background 0.2s;
        }
        th[onclick]:hover { background: rgba(212,175,55,0.03); }
        th[onclick]::after { 
            content: ' \u2195'; 
            color: var(--taxi-gold); 
            font-size: 1.15rem; 
            font-weight: 900; 
            opacity: 0.3; 
            transition: opacity 0.2s, transform 0.2s;
            margin-right: 6px;
        }
        th[onclick]:hover::after { opacity: 0.8; }
        th.sorted-asc::after  { content: ' \u25B2'; color: var(--taxi-gold) !important; opacity: 1 !important; }
        th.sorted-desc::after { content: ' \u25BC'; color: var(--taxi-gold) !important; opacity: 1 !important; }
        
        .sort-icon { display: none; } /* Hide old sort icons if any */
        
        /* ==== Unified Action Buttons ==== */
        .action-btns-group { display: flex; gap: 6px; justify-content: center; }
        .btn-action-sm { background: none; border: none; font-size: 1.35rem; cursor: pointer; transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); padding: 6px; opacity: 0.8; border-radius: 8px; line-height: 1; }
        .btn-action-sm:hover { opacity: 1; transform: scale(1.5); }
        .btn-view { color: #3498db; }
        .btn-edit { color: #e6ac00; }
        .btn-delete { color: #e74c3c; }
        .btn-view:hover  { background: rgba(52, 152, 219, 0.12); }
        .btn-edit:hover  { background: rgba(230, 172, 0, 0.12); }
        .btn-delete:hover { background: rgba(231, 76, 60, 0.12); }
    `;
    document.head.appendChild(style);
}

// --- [4] بناء الهيكل العام (Header & Sidebar) ---
function renderGlobalLayout(title) {
    const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام";
    const initials = fullNameAr.trim().charAt(0) || 'م';
    const layout = `
        <header class="global-header">
            <div class="header-logo">
                <button onclick="toggleNav(true)" class="header-menu-btn" title="القائمة">☰</button>
                <span class="header-logo-icon">🚖</span>
                <span class="header-title">نظام إدارة التاكسي</span>
                <span class="header-page-name">${title}</span>
            </div>
            <div style="display:flex; align-items:center; gap: 16px;">
                <div class="user-welcome-section">
                    <div style="text-align: left;">
                        <div style="font-size:0.62rem; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase;">مرحباً</div>
                        <div class="user-name-text">${fullNameAr}</div>
                    </div>
                    <div class="user-avatar">${initials}</div>
                </div>
                <div id="meterClock" class="taxi-meter-clock">00:00:00</div>
                <button onclick="handleLogout()" style="background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; cursor:pointer; font-size:1.3rem; width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; transition:all 0.3s;" title="خروج" onmouseover="this.style.background='rgba(231,76,60,0.25)'" onmouseout="this.style.background='rgba(231,76,60,0.1)'">🚨</button>
            </div>
        </header>
        <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
        <nav id="sideNav" class="sidebar">
            <div style="padding:25px 20px 15px; color:var(--taxi-gold); font-weight:800; text-align:center; font-size:1.05rem; border-bottom:1px solid rgba(212,175,55,0.2); letter-spacing:0.5px;">🚖 نظام إدارة التاكسي الذكي</div>
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
            <div style="border-top:1px solid rgba(255,255,255,0.08); margin:15px 0;"></div>
            <a href="reports.html" style="color:var(--taxi-gold); font-weight:bold;">📊 التقارير المركزية</a>
            <a href="#" onclick="handleLogout()" style="color:#e74c3c;">🚨 تسجيل الخروج</a>
        </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', layout);
}

// --- [5] الدوال الوظيفية المساعدة ---
function handleLogout() { sessionStorage.clear(); window.location.href = 'login.html'; }

function toggleNav(open) {
    const nav = document.getElementById("sideNav");
    const overlay = document.getElementById("navOverlay");
    if (open) { nav.classList.add("open"); overlay.style.display = "block"; document.body.style.overflow = "hidden"; } 
    else { nav.classList.remove("open"); overlay.style.display = "none"; document.body.style.overflow = "auto"; }
}

function startPulseEngine() {
    setInterval(() => {
        const clock = document.getElementById('meterClock');
        if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }, 1000);
}

// --- [6] نظام المودال العالمي ---
function initGlobalModalStructure() {
    if (document.getElementById('globalModal')) return;
    const html = `
        <div id="globalModal" class="modal-overlay">
            <div id="modalCard" class="modal-card">
                <div id="modalIconRow" style="font-size:2.5rem; margin-bottom:8px;"></div>
                <h2 id="modalTitle" style="margin:0 0 16px; font-size:1.2rem;"></h2>
                <div id="modalMsg" style="font-size:0.95rem; text-align:right; line-height:2; color:#333; max-height:55vh; overflow-y:auto; padding:16px 20px; background:#f8f9fa; border-radius:12px; border:1px solid #eee; margin-bottom:16px;"></div>
                <div id="modalBtnContainer" style="display:flex; gap:10px; justify-content:center;"></div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

window.showModal = function(title, message, type = 'info', onConfirm = null) {
    const modal = document.getElementById('globalModal');
    const card = document.getElementById('modalCard');
    const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f1c40f', info: '#3498db' };
    
    if (!modal) return;
    
    card.style.borderTopColor = colors[type] || colors.info;
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalTitle').style.color = colors[type];
    // Use innerHTML so viewRecord HTML (<b> tags) renders properly
    document.getElementById('modalMsg').innerHTML = message;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const iconEl = document.getElementById('modalIconRow');
    if (iconEl) iconEl.innerText = icons[type] || icons.info;
    
    const container = document.getElementById('modalBtnContainer');
    container.innerHTML = '';

    if (onConfirm) {
        const okBtn = document.createElement('button');
        okBtn.innerText = 'تأكيد';
        okBtn.style = `background:${colors.error}; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;`;
        okBtn.onclick = async () => { await onConfirm(); closeGlobalModal(); };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = 'إلغاء';
        cancelBtn.style = `background:#eee; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;`;
        cancelBtn.onclick = closeGlobalModal;
        
        container.appendChild(okBtn);
        container.appendChild(cancelBtn);
    } else {
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'موافق';
        closeBtn.style = `background:var(--taxi-dark); color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;`;
        closeBtn.onclick = closeGlobalModal;
        container.appendChild(closeBtn);
    }
    modal.style.display = 'flex';
}

function closeGlobalModal() { 
    const modal = document.getElementById('globalModal');
    if(modal) modal.style.display = 'none'; 
}

window.updateSortVisuals = function(columnIndex, isAscending) {
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.innerText = "↕";
        icon.classList.remove('sort-active');
    });
    const activeIcon = document.getElementById('sortIcon' + columnIndex);
    if (activeIcon) {
        activeIcon.innerText = isAscending ? "↑" : "↓";
        activeIcon.classList.add('sort-active');
    }
}

// --- [7] نظام الإشعارات الفاخر (Toast Notifications) ---
function initGlobalToastStructure() {
    if (document.getElementById('toastContainer')) return;
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

/**
 * يعرض رسالة إشعار منسدلة بشكل فاخر.
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الرسالة (success | error | warning | info)
 */
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toastClass = 'toast-' + type;

    const toast = document.createElement('div');
    toast.className = `toast-msg ${toastClass}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger reflow to animate
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for transition to end
    }, 3500);
}
