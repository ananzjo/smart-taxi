/**
 * نظام إدارة التاكسي الذكي - الإصدار النهائي المعتمد
 * الروابط: الأسماء الملتزم بها حرفياً + حل مشكلة innerText + أيقونة الواي فاي
 */

// 1. حماية الوصول
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// 2. دالة حقن السايدبار بالأسماء المطلوبة حرفياً
function injectSidebar() {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-open { transform: translateX(0) !important; }
        .sidebar-closed { transform: translateX(100%) !important; }
        .nav-link.active-page { background-color: #1e293b; color: white; border-right: 4px solid #facc15; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    `;
    document.head.appendChild(style);

    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 font-bold transition-all duration-500">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm">لوحة التحكم</span>
    </button>
    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>
    
    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 sidebar-closed font-bold border-l border-slate-800 transition-transform duration-400 ease-in-out text-right" dir="rtl">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-slate-900 shadow-lg"><i class="fa-solid fa-taxi text-xl"></i></div>
                <div>
                    <h1 class="text-lg font-black tracking-tight">التاكسي الذكي</h1>
                    <p class="text-[10px] text-yellow-400/50 italic">Smart Taxi System</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-gauge-high w-6"></i> لوحة التحكم
            </a>
            <a href="index02.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-chart-pie w-6"></i> لوحة التحكم 02
            </a>

            <div class="pt-4 pb-2"><p class="text-[10px] text-slate-500 uppercase px-3 tracking-widest font-black">إدارة الأسطول</p></div>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-car w-6"></i> السيارات
            </a>
            <a href="owners.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-user-tie w-6"></i> المالكين
            </a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-users w-6"></i> السائقين
            </a>
            <a href="staff.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-user-gear w-6"></i> الموظفين
            </a>

            <div class="pt-4 pb-2"><p class="text-[10px] text-slate-500 uppercase px-3 tracking-widest font-black">العمليات والتشغيل</p></div>
            <a href="work_days.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-calendar-check w-6"></i> أيام العمل
            </a>
            <a href="handover.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-key w-6"></i> سجل التسليم و الإستلام
            </a>

            <div class="pt-4 pb-2"><p class="text-[10px] text-slate-500 uppercase px-3 tracking-widest font-black">المالية والمطابقة</p></div>
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-hand-holding-dollar w-6"></i> الإيرادات
            </a>
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-receipt w-6"></i> المصاريف
            </a>
            <a href="payments.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-money-bill-transfer w-6"></i> المدفوعات
            </a>
            <a href="matching.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-scale-balanced w-6"></i> تسوية المطابقة
            </a>
            <a href="closing.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-lock w-6"></i> الإقفال المالي
            </a>
        </nav>

        <div class="mt-auto pt-4 border-t border-slate-800">
             <button onclick="handleLogout()" class="w-full flex items-center p-3 rounded-xl gap-3 text-red-400 hover:bg-red-500/10 transition-all">
                <i class="fa-solid fa-right-from-bracket w-6"></i> تسجيل خروج
            </button>
        </div>
    </aside>`;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 3. الساعة الرقمية (مع مصلح أخطاء index.html)
function initDigitalTaxiClock() {
    const clockStyle = document.createElement('style');
    clockStyle.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-7-mono');
        .taxi-clock-box { position: fixed; top: 20px; left: 25px; z-index: 60; background: #0f172a; padding: 10px 20px; border-radius: 12px; border: 1px solid #334155; display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .clock-time { font-family: 'Digital-7 Mono', sans-serif; font-size: 2rem; color: #FFD700; line-height: 1; }
        .clock-date { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; text-align: center; }
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
        const tEl = document.getElementById('side-time');
        const dEl = document.getElementById('side-date');
        const indexDateEl = document.getElementById('currentDate');

        if(tEl) tEl.innerText = now.toTimeString().split(' ')[0];
        
        const days = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayName = days[now.getDay()];
        if(dEl) dEl.innerText = `${dayName} ${now.toLocaleDateString('en-GB')}`;

        // إصلاح الخطأ لملف index.html لكي يتصل بالسحابة
        if(indexDateEl) indexDateEl.innerText = now.toLocaleDateString('ar-EG');
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
    if (typeof supabase !== 'undefined') { await supabase.auth.signOut(); }
    sessionStorage.clear();
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initDigitalTaxiClock();
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === current) link.classList.add('active-page');
    });
});
