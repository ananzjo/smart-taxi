/**
 * FILE: sidebar.js
 * DESCRIPTION: النسخة النهائية المعتمدة - حماية + ساعة + سايدبار + توحيد ثيمات آلي.
 * NOTE: تم إلغاء نبض الاتصال بناءً على طلب المستخدم.
 */

// 1. حماية الصفحات (كودك الأصلي)
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// 2. دالة حقن السايدبار الأصلي (كما هو تماماً)
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
        </div>

        <nav class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 text-right">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-gauge-high"></i> لوحة التحكم
            </a>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-car"></i> السيارات
            </a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-users"></i> السائقين
            </a>
            <a href="owners.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-user-tie"></i> الملاك
            </a>
            <hr class="border-slate-800 my-4">
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-hand-holding-dollar"></i> الإيرادات
            </a>
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-file-invoice-dollar"></i> المصاريف
            </a>
            <a href="payments.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-money-bill-transfer"></i> الدفعات
            </a>
        </nav>
    </aside>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 3. دالة الساعة الرقمية (كودك الأصلي - تعبك محفوظ)
function updateSystem() {
    const now = new Date();
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, ' / ');
    const dayName = days[now.getDay()];

    const clockElement = document.getElementById('currentDate');
    if (clockElement) {
        clockElement.innerHTML = `
            <div class="flex items-center gap-4 font-digital">
                <span class="text-lg font-black tracking-tighter text-slate-800">${timeStr}</span>
                <div class="flex flex-col border-r-2 border-slate-200 pr-3 text-right">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">${dayName}</span>
                    <span class="text-[9px] text-slate-400 tracking-widest">${dateStr}</span>
                </div>
            </div>`;
    }
}

// 4. وظائف التحكم (فتح وإغلاق القائمة + تمييز الرابط)
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.replace('sidebar-closed', 'sidebar-open');
        overlay.classList.remove('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '0';
    } else {
        sidebar.classList.replace('sidebar-open', 'sidebar-closed');
        overlay.classList.add('hidden');
        if (toggleBtn) toggleBtn.style.opacity = '1';
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('bg-slate-800', 'text-white');
            link.classList.remove('text-slate-400');
        }
    });
}

// 5. محرك الثيمات (إضافة ذكية لتوحيد الـ 12 صفحة آلياً)
function applySystemTheme() {
    const page = window.location.pathname.split("/").pop();
    const b = document.body;

    if (page.includes('cars')) b.classList.add('theme-cars');
    else if (page.includes('drivers')) b.classList.add('theme-drivers');
    else if (page.includes('owners')) b.classList.add('theme-owners');
    else if (page.includes('users')) b.classList.add('theme-users');
    else if (page.includes('revenues')) b.classList.add('theme-revenues');
    else if (page.includes('expenses')) b.classList.add('theme-expenses');
    else if (page.includes('payments')) b.classList.add('theme-payments');
}

// 6. تشغيل كل شيء عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    applySystemTheme(); // يلون الصفحة فوراً
    highlightActiveLink();
    
    setInterval(updateSystem, 1000);
    updateSystem();
});
