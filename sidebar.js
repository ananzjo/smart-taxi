/**
 * نظام إدارة التاكسي الذكي - الإصدار المستقر الكامل
 * الميزات: القائمة الكاملة + الساعة الرقمية + أيقونة الواي فاي
 */

// 1. حماية الوصول
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// 2. دالة حقن السايدبار (مع استعادة كافة الروابط الأصلية)
function injectSidebar() {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-open { transform: translateX(0) !important; }
        .sidebar-closed { transform: translateX(100%) !important; }
        .nav-link.active-page { background-color: #1e293b; color: white; border-right: 4px solid #facc15; }
    `;
    document.head.appendChild(style);

    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 font-bold transition-all duration-500">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm">لوحة التحكم</span>
    </button>
    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>
    
    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 sidebar-closed font-bold border-l border-slate-800 transition-transform duration-400 ease-in-out">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-slate-900 shadow-lg"><i class="fa-solid fa-taxi text-xl"></i></div>
                <div>
                    <h1 class="text-lg font-black uppercase tracking-tight">نظام التاكسي</h1>
                    <p class="text-[10px] text-yellow-400/50 italic">Smart Fleet Management</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-chart-pie w-6"></i> لوحة التحكم
            </a>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-car-side w-6"></i> أسطول السيارات
            </a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-users-gear w-6"></i> إدارة السائقين
            </a>
            <a href="custody.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-box-open w-6"></i> مستودع العُهد
            </a>

            <div class="pt-4 pb-2">
                <p class="text-[10px] text-slate-500 uppercase px-3 tracking-widest font-black">المالية والمطابقة</p>
            </div>

            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-file-invoice-dollar w-6"></i> المصروفات التشغيلية
            </a>
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-cash-register w-6"></i> تحصيل الإيرادات
            </a>
            <a href="matching.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-scale-balanced w-6"></i> المطابقة المالية
            </a>
            <a href="claim.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-hand-holding-dollar w-6"></i> نظام المطالبات
            </a>
        </nav>

        <div class="mt-auto pt-4 border-t border-slate-800">
             <button onclick="handleLogout()" class="w-full flex items-center p-3 rounded-xl gap-3 text-red-400 hover:bg-red-500/10 transition-all">
                <i class="fa-solid fa-right-from-bracket w-6"></i> تسجيل الخروج
            </button>
        </div>
    </aside>`;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 3. الساعة مع الواي فاي (ثابتة ومنظمة)
function initDigitalTaxiClock() {
    const clockStyle = document.createElement('style');
    clockStyle.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-7-mono');
        .taxi-clock-box { position: fixed; top: 20px; left: 25px; z-index: 60; background: #0f172a; padding: 10px 20px; border-radius: 12px; border: 1px solid #334155; display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .clock-time { font-family: 'Digital-7 Mono', sans-serif; font-size: 2rem; color: #FFD700; line-height: 1; }
        .clock-date { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
        .wifi-icon { color: #22c55e; animation: pulse 2s infinite; font-size: 1.1rem; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `;
    document.head.appendChild(clockStyle);

    const clockDiv = document.createElement('div');
    clockDiv.className = 'taxi-clock-box';
    clockDiv.innerHTML = `<div class="wifi-icon"><i class="fa-solid fa-wifi"></i></div><div><div id="side-time" class="clock-time">00:00:00</div><div id="side-date" class="clock-date">--/--/----</div></div>`;
    document.body.appendChild(clockDiv);

    setInterval(() => {
        const now = new Date();
        const t = now.toTimeString().split(' ')[0];
        const d = now.toLocaleDateString('en-GB');
        const timeEl = document.getElementById('side-time');
        const dateEl = document.getElementById('side-date');
        if(timeEl) timeEl.innerText = t;
        if(dateEl) dateEl.innerText = d;
    }, 1000);
}

// 4. وظائف التحكم
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('sidebar-toggle-btn');
    if (!sidebar) return;

    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.replace('sidebar-closed', 'sidebar-open');
        overlay.classList.remove('hidden');
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
    } else {
        sidebar.classList.replace('sidebar-open', 'sidebar-closed');
        overlay.classList.add('hidden');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
}

async function handleLogout() {
    if (typeof supabase !== 'undefined') {
        await supabase.auth.signOut();
    }
    sessionStorage.clear();
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initDigitalTaxiClock();
    
    // تمييز الصفحة الحالية
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === current) link.classList.add('active-page');
    });
});
