// 1. حماية الصفحات (تعطيلها مؤقتاً إذا كنت تعمل محلياً لتجنب الـ Redirect Loop)
// if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
//     window.location.href = 'index.html';
// }

function injectSidebar() {
    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 font-bold transition-all duration-300">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm">لوحة التحكم</span>
    </button>

    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 translate-x-full font-bold border-l border-slate-800 transition-transform duration-300">
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
            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-[0.2em]">التشغيل</div>
            <a href="work_days.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition"><i class="fa-solid fa-calendar-check w-6 text-center"></i> أيام العمل</a>
        </nav>
    </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    highlightActiveLink();
}

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('translate-x-0');

    if (!isOpen) {
        sidebar.classList.remove('translate-x-full');
        sidebar.classList.add('translate-x-0');
        overlay.classList.remove('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '0';
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '1';
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('bg-slate-800', 'text-yellow-400');
            link.classList.remove('text-slate-400');
        }
    });
}

injectSidebar();
