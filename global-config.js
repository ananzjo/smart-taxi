/* ==================================================================
 [global-config.js] - النسخة النهائية المدمجة (الهيدر الأصلي + العداد الأزرق)
 نظام إدارة التاكسي الذكي - Smart Taxi Management System
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
     :root { 
         --taxi-gold: #f1c40f;
         --taxi-dark: #000000;
         --taxi-red: #e74c3c;
         --taxi-green: #2ecc71;
         --counter-blue: #1e40af;
         --counter-bg: #eff6ff;
     }
     body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; direction: rtl; background: #f4f4f4; padding-top: 85px; }
 
     /* الهيدر الأصلي (الأسود والذهبي) */
     .global-header { 
         display: flex; 
         justify-content: space-between; 
         align-items: center; 
         background: #000; 
         color: white; 
         height: 75px; 
         padding: 0 20px; 
         position: fixed; 
         top: 0; 
         width: 100%; 
         z-index: 2000; 
         border-bottom: 4px solid var(--taxi-gold); 
         box-sizing: border-box; 
     }
 
     /* قسم الترحيب (عنان زيتاوي) */
     .user-welcome-section { display: flex; align-items: center; gap: 12px; }
     .welcome-text-wrapper { text-align: left; line-height: 1.2; }
     .welcome-label { font-size: 0.7rem; color: #aaa; margin: 0; }
     .user-name-text { font-size: 0.95rem; font-weight: bold; color: var(--taxi-gold); margin: 0; }
     .user-avatar { 
         width: 40px; height: 40px; background: var(--taxi-gold); color: #000; 
         border-radius: 50%; display: flex; align-items: center; justify-content: center; 
         font-weight: 900; font-size: 1.2rem; border: 2px solid #fff; 
     }
 
     /* العداد الأزرق (Record Counter) */
     .record-badge {
         background-color: var(--counter-bg);
         color: var(--counter-blue);
         border: 1px solid #bfdbfe;
         padding: 0 15px;
         border-radius: 6px;
         font-weight: bold;
         font-size: 0.85rem;
         display: flex;
         align-items: center;
         height: 38px;
         white-space: nowrap;
     }
 
     .taxi-meter-clock { font-family: 'Digital Numbers', sans-serif; font-size: 1.8rem; color: #00ff41; background: #000; padding: 2px 12px; border-radius: 6px; box-shadow: inset 0 0 5px #00ff41; }
 
     /* السايدبار المحدث */
     .sidebar { 
         height: 100vh; width: 230px; position: fixed; z-index: 4000; top: 0; right: -240px; 
         background: rgba(18, 18, 18, 0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); 
         transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); overflow-y: auto; border-left: 1px solid rgba(255, 255, 255, 0.1);
     }
     .sidebar.open { transform: translateX(-240px); }
     .sidebar a { padding: 12px 25px; text-decoration: none; color: white; display: block; transition: 0.3s; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
     .sidebar a:hover { background: rgba(241, 196, 15, 0.2); color: var(--taxi-gold); padding-right: 35px; }
     
     .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2500; }
   `;
   document.head.appendChild(style);
 }
 
 function renderGlobalLayout(title) {
   const fullNameAr = sessionStorage.getItem('full_name_ar') || "عنان زيتاوي"; 
   const layout = `
     <header class="global-header">
       <div style="display:flex; align-items:center; gap:20px;">
         <button onclick="toggleNav(true)" style="background:none; border:none; color:var(--taxi-gold); font-size:30px; cursor:pointer;">☰</button>
         <h3 style="margin:0;">${title}</h3>
       </div>
       <div style="display:flex; align-items:center; gap:20px;">
         <div id="meterClock" class="taxi-meter-clock">00:00:00</div>
         <div class="user-welcome-section">
           <div class="welcome-text-wrapper">
              <p class="welcome-label">مرحباً بك،</p>
              <p class="user-name-text">${fullNameAr}</p>
           </div>
           <div class="user-avatar">${fullNameAr.charAt(0)}</div>
         </div>
         <button onclick="handleLogout()" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.5rem;" title="خروج">🚪</button>
       </div>
     </header>
     <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div> 
     <nav id="sideNav" class="sidebar"> 
        <div style="padding:20px; color:var(--taxi-gold); font-weight:bold; text-align:center; border-bottom:1px solid rgba(255,255,255,0.1);">🚖 نظام الإدارة </div>
        <a href="index.html">📉 لوحة التحكم</a>
        <a href="owners.html">👤 أصحاب السيارات</a>
        <a href="cars.html">🚗 أسطول السيارات</a>
        <a href="drivers.html">👨‍✈️ السائقين</a>
        <a href="revenues.html">💰 الإيرادات</a>
        <a href="expenses.html">🔧 المصاريف</a>
        <a href="handover.html">📦 التسليم والاستلام</a>
        <a href="payments.html">💳 المدفوعات</a>
        <a href="staff.html">👥 الموظفين</a>
        <a href="settings.html">⚙️ الإعدادات</a>
        <a href="#" onclick="handleLogout()" style="color:#e74c3c; border-top:1px solid rgba(255,255,255,0.1);">🚪 تسجيل الخروج</a>
     </nav>
   `;
   document.body.insertAdjacentHTML('afterbegin', layout);
 }
 
 window.updateRecordCounter = function(count) {
     const counterElement = document.getElementById('recordCount');
     if (counterElement) counterElement.innerText = count || 0;
 };
 
 function handleLogout() { sessionStorage.clear(); window.location.href = 'login.html'; }
 function toggleNav(open) {
   const nav = document.getElementById("sideNav");
   const overlay = document.getElementById("navOverlay");
   if (open) { nav.classList.add("open"); overlay.style.display = "block"; document.body.style.overflow = "hidden"; }
   else { nav.classList.remove("open"); overlay.style.display = "none"; document.body.style.overflow = "auto"; }
 }
 function startPulseEngine() { setInterval(() => { const clock = document.getElementById('meterClock'); if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); }, 1000); }
 function initGlobalModalStructure() {
   if (document.getElementById('globalModal')) return;
   const html = `<div id="globalModal" class="modal-overlay"><div id="modalCard" class="modal-card"><h2 id="modalTitle">تنبيه</h2><p id="modalMsg"></p><div id="modalBtnContainer" style="display:flex; gap:10px; justify-content:center; margin-top:20px;"></div></div></div>`;
   document.body.insertAdjacentHTML('beforeend', html);
 }