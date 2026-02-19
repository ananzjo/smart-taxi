// 1. حماية الصفحات (كما هي في ملفك الأصلي)
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// دالة التاريخ الحالي بتنسيق رسمي
function getFormattedDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('ar-EG', options);
}

// دالة حقن الهيدر والنبضة (تمت إضافتها لتعمل مع السايد بار)
function injectHeaderStatus() {
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('flex', 'justify-between', 'items-center');
        const statusBadgeHTML = `
            <div class="bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/20 flex items-center gap-3 text-sm font-bold shadow-xl order-first">
                <div class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span id="connectionStatus" class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span class="text-white font-mono text-xs">متصل</span>
                <span class="text-white/30">|</span>
                <span class="text-white font-mono text-[11px] font-medium">${getFormattedDate()}</span>
            </div>
        `;
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

    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 sidebar-closed font-bold border-l border-slate-800 transition-transform duration-400">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="bg-yellow-400 p-2 rounded-lg text-slate-900 shadow-lg">
                    <i class="fa-solid fa-taxi text-xl"></i>
                </div>
                <h1 class="text-lg font-bold text-white">التاكسي الذكي</h1>
            </div>
            <button onclick="toggleSidebar()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <nav class="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-gauge-high w-6 text-center"></i> لوحة التحكم
            </a>
            
            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-[0.2em]">إدارة الأسطول</div>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-car w-6 text-center"></i> السيارات</a>
            <a href="owners.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-user-tie w-6 text-center"></i> المالكين</a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-users w-6 text-center"></i> السائقين</a>

            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-[0.2em]">التسليم و الإستلام</div>
            <a href="work_days.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-calendar-check w-6 text-center"></i> أيام العمل</a>
            <a href="handover.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-key w-6 text-center"></i> سجل التسليم و الإستلام</a>

            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-[0.2em]">المالية والمطابقة</div>
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-hand-holding-dollar w-6 text-center"></i> الإيرادات</a>
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-receipt w-6 text-center"></i> المصاريف</a>
            <a href="payments.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-money-bill-transfer w-6 text-center"></i> المدفوعات</a>
            <a href="matching.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-scale-balanced w-6 text-center"></i> تسوية المطابقة</a>
            <a href="closing.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-lock w-6 text-center"></i> الإقفال المالي</a>

            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-[0.2em]">الإعدادات</div>
            <a href="users.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-user-gear w-6 text-center"></i> المستخدمين</a>
        </nav>
    </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    highlightActiveLink();
    injectHeaderStatus(); // حقن النبضة والتاريخ في الهيدر
}

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (!sidebar || !overlay) return;

    const isClosed = sidebar.classList.contains('sidebar-closed');

    if (isClosed) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('hidden');
        if (toggleBtn) {
            toggleBtn.style.opacity = '0';
            toggleBtn.style.pointerEvents = 'none';
        }
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        overlay.classList.add('hidden');
        if (toggleBtn) {
            toggleBtn.style.opacity = '1';
            toggleBtn.style.pointerEvents = 'auto';
        }
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

// تنفيذ الحقن عند التحميل
document.addEventListener('DOMContentLoaded', injectSidebar);
