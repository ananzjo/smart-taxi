/**
 * FILE: sidebar.js 
 * الميزات: (أمان، ساعة رقمية، سايدبار منزلق متوافق مع index.html)
 */

// 1. حماية الصفحات
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// 2. دالة حقن السايدبار مع الأنماط (Styles)
function injectSidebar() {
    // إضافة الأنماط برمجياً لضمان اشتغال القائمة حتى لو ملف CSS فارغ
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-open { transform: translateX(0); }
        .sidebar-closed { transform: translateX(100%); }
        #sidebar-overlay { transition: opacity 0.3s ease; }
        .nav-link.active { background-color: #1e293b; color: white; border-right: 4px solid #facc15; }
    `;
    document.head.appendChild(style);

    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl transition-all duration-500 border border-slate-700 flex items-center gap-3 font-bold">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm">لوحة التحكم</span>
    </button>

    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 sidebar-closed font-bold border-l border-slate-800 transition-transform duration-400 ease-in-out">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-400/20">
                    <i class="fa-solid fa-taxi text-xl"></i>
                </div>
                <div>
                    <h1 class="text-lg font-black tracking-tight">نظام التاكسي</h1>
                    <p class="text-[10px] text-yellow-400/60 tracking-[0.2em] uppercase">Smart System</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 space-y-2 overflow-y-auto">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-chart-pie w-6"></i> لوحة التحكم
            </a>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-car-side w-6"></i> الأسطول
            </a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-users-gear w-6"></i> السائقين
            </a>
            <a href="custody.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-box-open w-6"></i> العُهد
            </a>
            <hr class="border-slate-800 my-4">
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-file-invoice-dollar w-6"></i> المصاريف
            </a>
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-cash-register w-6"></i> الإيرادات
            </a>
            <a href="matching.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <i class="fa-solid fa-scale-balanced w-6"></i> المطابقة المالية
            </a>
        </nav>
    </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 3. الساعة الرقمية مع أيقونة واي فاي (ثابتة)
function initDigitalTaxiClock() {
    const clockStyle = document.createElement('style');
    clockStyle.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-7-mono');
        .taxi-clock-box {
            position: fixed; top: 20px; left: 25px; z-index: 60;
            background: #0f172a; padding: 8px 15px; border-radius: 12px;
            border: 1px solid #334155; display: flex; align-items: center;
            direction: ltr; box-shadow: 0 10px 30px rgba(0,0,0,0.5); gap: 12px;
        }
        .clock-time { font-family: 'Digital-7 Mono', sans-serif; font-size: 2rem; color: #FFD700; line-height: 1; }
        .clock-date { font-size: 0.7rem; color: #94a3b8; font-weight: bold; margin-top: 3px; text-align: center; }
        .wifi-icon-active { color: #22c55e; font-size: 1.1rem; animation: pulse-wifi 2s infinite; }
        @keyframes pulse-wifi { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    `;
    document.head.appendChild(clockStyle);

    const clockDiv = document.createElement('div');
    clockDiv.className = 'taxi-clock-box';
    clockDiv.innerHTML = `
        <div class="wifi-icon-active"><i class="fa-solid fa-wifi"></i></div>
        <div>
            <div id="header-time" class="clock-time">00:00:00</div>
            <div id="header-date" class="clock-date">--/--/----</div>
        </div>
    `;
    document.body.appendChild(clockDiv);

    function updateClock() {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                        now.getMinutes().toString().padStart(2, '0') + ":" + 
                        now.getSeconds().toString().padStart(2, '0');
        const dateStr = now.toLocaleDateString('en-GB');
        document.getElementById('header-time').innerText = timeStr;
        document.getElementById('header-date').innerText = dateStr;
    }
    setInterval(updateClock, 1000);
    updateClock();
}

// 4. وظائف التحكم (تم إصلاحها لضمان التبديل)
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('sidebar-toggle-btn');
    
    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('hidden');
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        overlay.classList.add('hidden');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.classList.remove('text-slate-400');
        }
    });
}

// 5. التشغيل النهائي
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initDigitalTaxiClock();
    highlightActiveLink();
});
