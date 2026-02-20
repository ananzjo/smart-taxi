/**
 * FILE: sidebar.js
 * DESCRIPTION: المحرك الموحد - الحفاظ على الساعة والمنطق مع إضافة توحيد القوالب وإصلاحات الآيفون
 */

// 1. [كود الحماية الأصلي]
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

/**
 * 2. دالة توحيد قالب الصفحة
 */
function unifyPageTheme() {
    const path = window.location.pathname;
    const pageName = path.split("/").pop();
    const body = document.body;

    // إزالة الكلاسات القديمة لضمان عدم التداخل
    body.classList.remove('theme-fleet', 'theme-finance', 'theme-operation');

    // تحديد الثيم بناءً على اسم الملف
    if (pageName.includes('cars') || pageName.includes('drivers') || pageName.includes('owners')) {
        body.classList.add('theme-fleet');
    } else if (pageName.includes('revenues') || pageName.includes('expenses')) {
        body.classList.add('theme-finance');
    } else if (pageName.includes('handover') || pageName.includes('work_days')) {
        body.classList.add('theme-operation');
    }
    
    body.classList.add('bg-gray-50', 'transition-all', 'duration-500');
}

// 3. [دالة حقن السايدبار]
function injectSidebar() {
    const sidebarHTML = `
    <button id="sidebar-toggle-btn" onclick="toggleSidebar()" class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl transition-all duration-300 border border-slate-700 flex items-center gap-3 font-bold active:scale-95">
        <i class="fa-solid fa-bars-staggered text-xl"></i>
        <span class="text-sm md:block hidden">لوحة التحكم</span>
    </button>

    <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <aside id="main-sidebar" class="fixed top-0 right-0 w-72 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 translate-x-full md:translate-x-0 transition-transform duration-300 font-bold border-l border-slate-800">
        <div class="flex items-center justify-between mb-8 px-2 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="bg-yellow-400 p-2 rounded-lg text-slate-900 shadow-lg"><i class="fa-solid fa-taxi text-xl"></i></div>
                <h1 class="text-lg font-bold tracking-tight">التاكسي الذكي</h1>
            </div>
            <button onclick="toggleSidebar()" class="md:hidden text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-2xl"></i>
            </button>
        </div>

        <nav class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <a href="index.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-gauge-high w-6"></i> لوحة التحكم</a>
            <a href="cars.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-car w-6"></i> السيارات</a>
            <a href="drivers.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-users w-6"></i> السائقين</a>
            <a href="owners.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-user-tie w-6"></i> الملاك</a>
            <hr class="border-slate-800 my-4">
            <a href="revenues.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-hand-holding-dollar w-6"></i> الإيرادات</a>
            <a href="expenses.html" class="flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 hover:text-yellow-400 transition-all"><i class="fa-solid fa-file-invoice-dollar w-6"></i> المصاريف</a>
        </nav>

        <div class="mt-auto pt-6 border-t border-slate-800">
            <div class="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <span id="conn-pulse" class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                <span id="conn-text" class="text-[10px] text-green-400 font-bold uppercase tracking-widest">System Online</span>
            </div>
        </div>
    </aside>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 4. وظيفة الفتح والإغلاق (إصلاح الآيفون)
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // استخدام الـ Classes التي عرفناها في style.css
    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

// 5. تحديث الساعة الرقمية
function updateSystem() {
    const now = new Date();
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, ' / ');
    const dayName = days[now.getDay()];

    const clockElement = document.getElementById('currentDate');
    if (clockElement) {
        clockElement.innerHTML = `
            <div class="flex items-center gap-4 font-mono">
                <span class="text-lg font-black tracking-tighter text-slate-800">${timeStr}</span>
                <div class="flex flex-col border-r-2 border-slate-200 pr-3 text-right">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">${dayName}</span>
                    <span class="text-[9px] text-slate-400 tracking-widest">${dateStr}</span>
                </div>
            </div>`;
    }
}

// 6. مراقبة حالة الإنترنت
function watchConnection() {
    const update = () => {
        const pulse = document.getElementById('conn-pulse');
        const text = document.getElementById('conn-text');
        if (navigator.onLine) {
            pulse?.classList.replace('bg-red-500', 'bg-green-500');
            if(text) text.innerText = 'System Online';
        } else {
            pulse?.classList.replace('bg-green-500', 'bg-red-500');
            if(text) text.innerText = 'System Offline';
        }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
}

// 7. التنفيذ النهائي
document.addEventListener('DOMContentLoaded', () => {
    unifyPageTheme();
    injectSidebar();
    watchConnection();
    setInterval(updateSystem, 1000);
    updateSystem();
});
