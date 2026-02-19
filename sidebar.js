// 1. حماية الصفحات
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// دالة التاريخ (مثال: الجمعة، 20 فبراير 2026)
function getFormattedDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('ar-EG', options);
}

// دالة حقن بار الحالة في أقصى اليسار بتنسيق زجاجي
function injectStatusBadge() {
    const header = document.querySelector('header');
    if (header) {
        // ضبط الهيدر ليكون مرناً (العنوان يمين والنبضة يسار)
        header.classList.add('flex', 'flex-row', 'justify-between', 'items-center', 'w-full');
        
        const statusBadgeHTML = `
            <div class="bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/20 flex items-center gap-3 text-sm font-bold shadow-xl order-first md:order-none">
                <div class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span id="connectionStatus" class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span id="statusText" class="text-white font-mono">متصل</span>
                <span class="text-white/30">|</span>
                <span id="currentDate" class="text-white font-mono text-xs font-medium">${getFormattedDate()}</span>
            </div>
        `;
        
        // الحقن في النهاية (لتظهر في اليسار في نظام RTL)
        header.insertAdjacentHTML('beforeend', statusBadgeHTML);
    }
}

function injectSidebar() {
    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl transition-all duration-500 border border-slate-700 flex items-center gap-3 font-bold">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm">لوحة التحكم</span>
    </button>

    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 sidebar-closed font-bold border-l border-slate-800 transition-transform duration-400 text-right" dir="rtl">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="bg-yellow-400 p-2 rounded-lg text-slate-900 shadow-lg shadow-yellow-400/20">
                    <i class="fa-solid fa-taxi text-xl"></i>
                </div>
                <h1 class="text-lg font-bold tracking-tight text-white font-[IBM Plex Sans Arabic]">التاكسي الذكي</h1>
            </div>
            <button onclick="toggleSidebar()" class="text-slate-500 hover:text-white transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
        </div>

        <nav class="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar font-[IBM Plex Sans Arabic]">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-gauge-high w-6 text-center text-lg"></i> لوحة التحكم
            </a>
            
            <div class="text-[10px] text-slate-500 font-bold px-3 pt-6 pb-2 uppercase tracking-widest italic opacity-50">إدارة الأسطول</div>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-car-side w-6 text-center text-lg"></i> السيارات
            </a>
            <a href="owners.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-user-tie w-6 text-center text-lg"></i> الملاك
            </a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-users w-6 text-center text-lg"></i> السائقين
            </a>

            <div class="text-[10px] text-slate-500 font-bold px-3 pt-6 pb-2 uppercase tracking-widest italic opacity-50">الحركة والتشغيل</div>
            <a href="handover.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-key w-6 text-center text-lg"></i> سجل الاستلام
            </a>
            <a href="work_days.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-calendar-check w-6 text-center text-lg"></i> أيام العمل
            </a>

            <div class="text-[10px] text-slate-500 font-bold px-3 pt-6 pb-2 uppercase tracking-widest italic opacity-50">المالية والمطابقة</div>
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-money-bill-trend-up w-6 text-center text-lg"></i> الإيرادات
            </a>
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-file-invoice-dollar w-6 text-center text-lg"></i> المصاريف
            </a>
        </nav>

        <div class="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between px-2">
            <span class="text-slate-500 text-[10px] font-mono lowercase tracking-tighter italic">Version 2.0.4</span>
            <i class="fa-solid fa-shield-halved text-slate-700 text-xs"></i>
        </div>
    </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    highlightActiveLink();
    injectStatusBadge();
}

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!sidebar || !overlay) return;

    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '0';
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        overlay.classList.add('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '1';
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('bg-slate-800', 'text-white');
            link.classList.remove('text-slate-400');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
    injectSidebar();
}
