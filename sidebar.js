// 1. هيكل السايدبار الموحد
const sidebarHTML = `
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] hidden transition-opacity"></div>
    <aside id="main-sidebar" class="fixed top-0 right-0 h-full w-72 bg-slate-900 text-white z-[999] flex flex-col p-6 shadow-2xl transition-transform duration-300">
        <div class="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
                <div class="bg-yellow-400 p-2 rounded-lg text-slate-900 shadow-lg shadow-yellow-400/20">
                    <i class="fa-solid fa-taxi text-xl"></i>
                </div>
                <h1 class="text-lg font-bold">التاكسي الذكي</h1>
            </div>
            <button onclick="toggleSidebar()" class="md:hidden text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-2xl"></i>
            </button>
        </div>

        <nav class="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            <a href="index.html" class="flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-gauge-high w-6"></i> لوحة التحكم
            </a>
            
            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-widest">إدارة الأسطول</div>
            <a href="cars.html" class="flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-car w-6"></i> السيارات
            </a>
            <a href="drivers.html" class="flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-users w-6"></i> السائقين
            </a>

            <div class="text-[10px] text-slate-500 font-bold px-4 pt-6 pb-2 uppercase tracking-widest">المالية والحركة</div>
            <a href="revenues.html" class="flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-file-invoice-dollar w-6"></i> الإيرادات
            </a>
            <a href="handover.html" class="flex items-center p-3 rounded-xl gap-3 text-sm text-slate-400 hover:bg-slate-800 transition">
                <i class="fa-solid fa-key w-6"></i> سجل الاستلام
            </a>
        </nav>

        <div id="digital-clock" class="mt-auto bg-slate-800/50 p-4 rounded-2xl text-center border border-slate-700/50 shadow-inner">
            <div id="clock-time" class="text-2xl font-mono font-bold text-yellow-400 leading-none">00:00:00</div>
            <div id="clock-date" class="text-[10px] text-slate-500 mt-1 font-bold">---</div>
        </div>
    </aside>

    <button onclick="toggleSidebar()" class="fixed top-6 right-6 z-[1001] bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 md:hidden active:scale-95 transition">
        <i class="fa-solid fa-bars-staggered"></i>
    </button>
`;

// 2. وظائف التشغيل
function initSystem() {
    // حقن السايدبار
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    const path = window.location.pathname.split("/").pop();
    const body = document.body;

    // تغيير الخلفية تلقائياً (تغيير مركزي)
    if (['cars.html', 'drivers.html', 'owners.html'].includes(path)) body.classList.add('theme-fleet');
    else if (['revenues.html', 'expenses.html'].includes(path)) body.classList.add('theme-finance');
    else if (['handover.html', 'work_days.html'].includes(path)) body.classList.add('theme-operation');

    // تشغيل الساعة
    updateClock();
    setInterval(updateClock, 1000);

    // إغلاق السايدبار عند النقر خارجاً (مهم جداً للآيفون)
    document.getElementById('sidebar-overlay').onclick = toggleSidebar;
}

function toggleSidebar() {
    document.getElementById('main-sidebar').classList.toggle('sidebar-open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function updateClock() {
    const now = new Date();
    if(document.getElementById('clock-time')) {
        document.getElementById('clock-time').textContent = now.toLocaleTimeString('en-GB');
        document.getElementById('clock-date').textContent = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}

// البدء عند جاهزية الصفحة
document.addEventListener('DOMContentLoaded', initSystem);
