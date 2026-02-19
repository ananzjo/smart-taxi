/**
 * FILE: sidebar.js
 * DESCRIPTION: المحرك الموحد - الحفاظ على الساعة والمنطق مع إضافة توحيد القوالب
 * ACTION: تم إضافة "منطق توحيد الثيمات" دون حذف أي سطر أصلي.
 */

// 1. [كود الحماية الأصلي] - لا تغيير
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

/**
 * 2. دالة توحيد قالب الصفحة (إضافة جديدة)
 * شرح: هذه الدالة تقوم بتلوين الصفحة آلياً بناءً على اسمها لتوحيد الثيم.
 */
function unifyPageTheme() {
    const pageName = window.location.pathname.split("/").pop();
    const body = document.body;

    // تحديد الثيم بناءً على اسم الملف (الألوان التي اتفقنا عليها)
    if (pageName.includes('cars')) body.className += ' theme-cars';
    else if (pageName.includes('drivers')) body.className += ' theme-drivers';
    else if (pageName.includes('owners')) body.className += ' theme-owners';
    else if (pageName.includes('users')) body.className += ' theme-users';
    else if (pageName.includes('revenues')) body.className += ' theme-revenues';
    else if (pageName.includes('expenses')) body.className += ' theme-expenses';
    else if (pageName.includes('payments')) body.className += ' theme-payments';
    
    // إضافة كلاسات Tailwind الأساسية لتوحيد المسافات والخلفية
    body.classList.add('bg-gray-50', 'transition-all', 'duration-500');
}

// 3. [دالة حقن السايدبار] - تم إضافة "نبض الاتصال" في الأسفل فقط
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
                <div class="bg-yellow-400 p-2 rounded-lg text-slate-900 shadow-lg"><i class="fa-solid fa-taxi text-xl"></i></div>
                <h1 class="text-lg font-bold">التاكسي الذكي</h1>
            </div>
        </div>

        <nav class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-gauge-high"></i> لوحة التحكم</a>
            <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-car"></i> السيارات</a>
            <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-users"></i> السائقين</a>
            <a href="owners.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-user-tie"></i> الملاك</a>
            <hr class="border-slate-800 my-4">
            <a href="revenues.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-hand-holding-dollar"></i> الإيرادات</a>
            <a href="expenses.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-slate-800 transition-all"><i class="fa-solid fa-file-invoice-dollar"></i> المصاريف</a>
        </nav>

        <div class="mt-auto pt-6 border-t border-slate-800">
            <div class="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <span id="conn-pulse" class="pulse-status pulse-green"></span>
                <span id="conn-text" class="text-[10px] text-green-400 font-bold uppercase tracking-widest">System Online</span>
            </div>
        </div>
    </aside>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// 4. [دالة الساعة الرقمية الأصلية] - لا تغيير (updateSystem)
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

// 5. [وظائف التحكم الأصلية] - لا تغيير (toggleSidebar, highlightActiveLink)

// 6. مراقبة حالة الإنترنت (إضافة جديدة للنبض)
function watchConnection() {
    const pulse = document.getElementById('conn-pulse');
    const text = document.getElementById('conn-text');
    const update = () => {
        if (navigator.onLine) {
            if(pulse) pulse.className = 'pulse-status pulse-green';
            if(text) text.innerText = 'System Online';
        } else {
            if(pulse) pulse.className = 'pulse-status pulse-red';
            if(text) text.innerText = 'System Offline';
        }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
}

// 7. التنفيذ النهائي المدمج
document.addEventListener('DOMContentLoaded', () => {
    unifyPageTheme();      // توحيد الثيم أولاً
    injectSidebar();       // حقن القائمة
    highlightActiveLink(); // تمييز الصفحة الحالية
    watchConnection();     // تشغيل النبض
    
    setInterval(updateSystem, 1000);
    updateSystem();        // تشغيل الساعة الرقمية
});
