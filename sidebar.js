/* ============================================================
   باسم الله - هنا يبدأ الكود الذكي (نظام إدارة التاكسي الذكي)
   ============================================================ */

/**
 * خريطة النظام الذكي (Smart Map):
 * 1. قسم كشف الازدواجية: يحدد مصدر القائمة المتكررة.
 * 2. بناء السايدبار: الروابط والأسماء الرسمية.
 * 3. نظام الوقت والإصلاح: معالجة أخطاء index.html.
 */

// [1] قسم كشف الازدواجية والتحقيق (Audit & Protection)
function checkDuplication() {
    const existingSidebar = document.getElementById('main-sidebar');
    if (existingSidebar) {
        // رسالة واضحة تخبرك بوجود الازدواجية ومصدرها المحتمل
        const message = `⚠️ تنبيه: القائمة الجانبية موجودة بالفعل!
المصدر المحتمل: قد يكون هناك استدعاء متكرر لملف sidebar.js في الصفحة، أو أن الكود محقن مرتين في ملف HTML.
الحل: تأكد من وجود سطر <script src="sidebar.js"></script> مرة واحدة فقط.`;
        
        console.warn(message);
        // alert(message); // يمكنك تفعيل هذه السطر إذا أردت رسالة منبثقة تظهر لك فوراً
        return true; // القائمة موجودة
    }
    return false; // القائمة غير موجودة، يمكن المتابعة
}

// [2] دالة بناء القائمة
function injectSidebar() {
    // إذا وجدنا القائمة موجودة، نتوقف فوراً ولا نكمل الحقن
    if (checkDuplication()) return;

    const style = document.createElement('style');
    style.textContent = `
        .sidebar-open { transform: translateX(0) !important; }
        .sidebar-closed { transform: translateX(100%) !important; }
        .nav-link.active-page { background-color: #1e293b; color: white; border-right: 4px solid #facc15; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
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
    </aside>`;
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// [3] قسم الوقت وإصلاح الأخطاء
function initDigitalTaxiClock() {
    if (document.querySelector('.taxi-clock-box')) return;

    const clockDiv = document.createElement('div');
    clockDiv.className = 'taxi-clock-box fixed top-5 left-5 z-[60] bg-[#0f172a] p-3 rounded-xl border border-slate-700 flex items-center gap-4 text-yellow-400';
    clockDiv.innerHTML = `<i class="fa-solid fa-wifi text-green-500 animate-pulse"></i> <span id="side-time" style="font-family: monospace; font-size: 1.5rem;">00:00:00</span>`;
    document.body.appendChild(clockDiv);

    setInterval(() => {
        const now = new Date();
        const tEl = document.getElementById('side-time');
        const indexDateEl = document.getElementById('currentDate');

        if(tEl) tEl.innerText = now.toTimeString().split(' ')[0];
        
        // إصلاح الخطأ الشهير لضمان عمل السحابة (Supabase)
        if(indexDateEl) {
            indexDateEl.innerText = now.toLocaleDateString('ar-EG');
        } else if (window.location.pathname.includes('index.html')) {
            // حل ذكي: إنشاء العنصر المفقود برمجياً لمنع تعليق الجدول
            const ghost = document.createElement('div');
            ghost.id = 'currentDate';
            ghost.style.display = 'none';
            document.body.appendChild(ghost);
        }
    }, 1000);
}

// [4] التحكم والتنفيذ
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('sidebar-closed');
    sidebar.classList.toggle('sidebar-open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
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

/* ============================================================
   الحمد لله - هنا ينتهي الكود الذكي (نظام إدارة التاكسي الذكي)
   ============================================================ */
