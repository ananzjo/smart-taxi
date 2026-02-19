/** * النسخة الأصلية الكاملة مع إضافة "محرك الثيمات" فقط
 * حدث، ادمج، ولا تبعبص.
 */

// 1. حماية الصفحات
if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && document.referrer === "") {
    window.location.href = 'index.html';
}

// 2. دالة حقن السايدبار الأصلي
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
}

// 3. دالة الساعة الرقمية (عداد التاكسي + أيقونة الحالة)
function initDigitalTaxiClock() {
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-7-mono');
        
        .taxi-header-container {
            position: fixed;
            top: 20px;
            left: 25px;
            z-index: 60;
            background: #0f172a;
            padding: 6px 15px;
            border-radius: 12px;
            border: 1px solid #334155;
            display: flex;
            align-items: center;
            gap: 12px;
            direction: ltr;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }

        .status-icon-box { display: flex; align-items: center; justify-content: center; font-size: 1.2rem; width: 30px; }
        .digital-info-box { display: flex; flex-direction: column; align-items: center; }
        
        .digital-time {
            font-family: 'Digital-7 Mono', sans-serif;
            font-size: 1.9rem;
            line-height: 1;
            margin: 0;
        }

        .digital-date {
            font-size: 0.65rem;
            color: #94a3b8;
            font-family: sans-serif;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        .online-style { color: #22c55e; text-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
        .offline-style { color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.5); animation: taxi-blink 1s infinite; }

        @keyframes taxi-blink { 50% { opacity: 0.4; } }

        @media (max-width: 640px) {
            .taxi-header-container { top: 15px; left: 10px; padding: 4px 10px; gap: 8px; }
            .digital-time { font-size: 1.4rem; }
        }
    `;
    document.head.appendChild(style);

    const clockContainer = document.createElement('div');
    clockContainer.className = 'taxi-header-container';
    clockContainer.innerHTML = `
        <div id="taxi-status-icon" class="status-icon-box online-style"><i class="fa-solid fa-wifi"></i></div>
        <div class="digital-info-box">
            <div id="header-time" class="digital-time online-style">00:00:00</div>
            <div id="header-date" class="digital-date">--/--/----</div>
        </div>
    `;
    document.body.appendChild(clockContainer);

    const timeEl = document.getElementById('header-time');
    const dateEl = document.getElementById('header-date');
    const iconBox = document.getElementById('taxi-status-icon');

    function updateSystem() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${h}:${m}:${s}`;

        const d = String(now.getDate()).padStart(2, '0');
        const mon = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        dateEl.textContent = `${d}-${mon}-${y}`;

        if (navigator.onLine) {
            timeEl.className = 'digital-time online-style';
            iconBox.className = 'status-icon-box online-style';
            iconBox.innerHTML = '<i class="fa-solid fa-wifi"></i>';
        } else {
            timeEl.className = 'digital-time offline-style';
            iconBox.className = 'status-icon-box offline-style';
            iconBox.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        }
    }

    setInterval(updateSystem, 1000);
    updateSystem();
}

// 4. وظائف التحكم
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (!sidebar || !overlay) return;

    if (sidebar.classList.contains('sidebar-closed')) {
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

// --- الإضافة الجديدة: دالة تطبيق الألوان (الثيمات) الموحدة ---
function applyThemeByPage() {
    const page = window.location.pathname.split("/").pop();
    const b = document.body;

    // قاموس توزيع الألوان على الصفحات
    const themes = {
        'cars.html': 'theme-cars',      // أصفر
        'owners.html': 'theme-owners',  // وردي رجالي
        'drivers.html': 'theme-drivers',// أسود/رمادي
        'revenues.html': 'theme-revenues', // أزرق
        'expenses.html': 'theme-expenses', // أحمر
        'payments.html': 'theme-payments', // أحمر غامق
        'users.html': 'theme-users'      // رمادي فاتح
    };

    if (themes[page]) {
        b.classList.add(themes[page]);
    }
}

// 5. التنفيذ النهائي المدمج (بدون حذف)
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initDigitalTaxiClock();
    applyThemeByPage(); // تفعيل محرك الألوان حبة حبة
});

// وظيفة تغيير الخلفية تلقائياً بناءً على الصفحة
function applyPageTheme() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const body = document.body;

    // إزالة أي ثيمات قديمة
    body.classList.remove('theme-fleet', 'theme-finance', 'theme-operation');

    // تحديد الثيم المناسب
    if (page === 'cars.html' || page === 'drivers.html' || page === 'owners.html') {
        body.classList.add('theme-fleet');
    } 
    else if (page === 'revenues.html' || page === 'expenses.html') {
        body.classList.add('theme-finance');
    } 
    else if (page === 'handover.html' || page === 'work_days.html') {
        body.classList.add('theme-operation');
    } 
    else {
        // ثيم افتراضي للوحة التحكم أو غيرها
        body.style.backgroundColor = '#f8fafc';
    }
}

// تشغيل الوظيفة عند تحميل الصفحة
applyPageTheme();
