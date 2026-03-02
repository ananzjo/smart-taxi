/* ==================================================================
 [global-config.js] - النسخة الموحدة (المودال + الأسهم + الترحيب الذكي)
 ================================================================== */

const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim();
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim();
const _supabase = supabase.createClient(SB_URL, SB_KEY);

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
}

function injectGlobalStyles() {
  const style = document.createElement('style');
  style.id = 'global-styles';
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/digital-numbers');
    :root { --taxi-gold: #f1c40f; --taxi-dark: #121212; --taxi-red: #e74c3c; --taxi-green: #2ecc71; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 80px; }
    
    .global-header { display: flex; justify-content: space-between; align-items: center; background: var(--taxi-dark); color: white; height: 70px; padding: 0 20px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-sizing: border-box; }
    .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.8rem; color: #00ff41; background: #000; padding: 2px 12px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; }
    
    /* ستايل الترحيب المدمج */
    .user-welcome-section { display: flex; align-items: center; gap: 10px; margin-left: 15px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px; }
    .user-name-text { font-size: 0.9rem; font-weight: bold; color: var(--taxi-gold); }
    .user-avatar { width: 32px; height: 32px; background: var(--taxi-gold); color: var(--taxi-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #fff; }

    .sidebar { height: 100vh; width: 0; position: fixed; z-index: 3000; top: 0; right: 0; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(15px); transition: 0.4s; overflow-x: hidden; padding-top: 60px; }
    .sidebar a { padding: 12px 25px; text-decoration: none; color: white; display: block; transition: 0.3s; font-size: 0.95rem; }
    .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 35px; }
    .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2500; }

    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; }
    .modal-card { background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; border-top: 10px solid var(--taxi-gold); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
    .sort-icon { display: inline-block; margin-right: 5px; color: #ccc; transition: 0.3s; }
    .sort-active { color: var(--taxi-gold) !important; font-weight: bold; }
  `;
  document.head.appendChild(style);
}

function renderGlobalLayout(title) {
  // جلب الاسم العربي من sessionStorage
  const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام";

  const layout = `
    <header class="global-header">
      <div style="display:flex; align-items:center; gap:15px;">
        <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:30px; cursor:pointer;">☰</button>
        <h3 style="margin:0;">${title}</h3>
      </div>
      
      <div style="display:flex; align-items:center;">
        <div class="user-welcome-section">
          <div style="text-align: left;">
             <div style="font-size:0.65rem; color:#aaa; margin-bottom:-3px;">مرحباً بك،</div>
             <div class="user-name-text">${fullNameAr}</div>
          </div>
          <div class="user-avatar">${fullNameAr.charAt(0)}</div>
        </div>
        
        <div id="meterClock" class="taxi-meter-clock">00:00:00</div>
        
        <button onclick="handleLogout()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.4rem; margin-right:15px;" title="خروج">🚪</button>
      </div>
    </header>

    <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
    <nav id="sideNav" class="sidebar">
      <div style="padding:20px; color:var(--taxi-gold); font-weight:bold; text-align:center; font-size:1.2rem; border-bottom:1px solid rgba(255,255,255,0.1);">
        🚖 نظام إدارة التاكسي
      </div>
      
      <a href="index.html">📉 لوحة التحكم | Dashboard</a>
      <a href="cars.html">🚗 أسطول السيارات</a>
      <a href="drivers.html">👨‍✈️ السائقين</a>
      <a href="contracts.html">📜 العقود والضمانات</a>
      <a href="shifts.html">⏱️ المناوبات</a>
      <a href="revenues.html">💰 الإيرادات والتحصيل</a>
      <a href="expenses.html">🔧 المصاريف والصيانة</a>
      <a href="handover.html">📦 تسليم واستلام السيارات</a>
      <a href="payments.html">💰 المدفوعات وتسوية المصاريف</a>
      <a href="t08-violations⚠️ المخالفات والحوادث</a>
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

function handleLogout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

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

/* --- نظام المودال العالمي --- */
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
  const card = document.getElementById('modalCard');
  const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f1c40f', info: '#3498db' };
  
  card.style.borderTopColor = colors[type] || colors.info;
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalTitle').style.color = colors[type];
  document.getElementById('modalMsg').innerText = message;
  
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
  document.getElementById('globalModal').style.display = 'none';
}

/* --- محرك الفرز العالمي للأسهم --- */
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