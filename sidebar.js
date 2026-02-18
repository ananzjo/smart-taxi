(function() {
    // 1. نظام الحماية
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== 'index.html' && currentPage !== '' && document.referrer === "") {
        window.location.href = 'index.html';
        return;
    }

    // 2. حقن الهيكل
    function injectSidebar() {
        const sidebarHTML = `
        <button id="sidebar-toggle-btn" onclick="toggleSidebar()" 
            class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 font-bold transition-all duration-700">
            <i class="fa-solid fa-bars-staggered text-xl"></i>
            <span class="text-sm text-white">لوحة التحكم</span>
        </button>

        <div id="sidebar-overlay" onclick="toggleSidebar()" 
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 hidden opacity-0 transition-opacity duration-500"></div>

        <aside id="main-sidebar" 
            class="fixed top-0 right-0 w-80 bg-[#0f172a] h-screen text-white p-6 shadow-2xl flex flex-col z-50 translate-x-full transition-transform duration-500 ease-in-out border-l border-white/10">
            
            <div class="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div class="flex items-center gap-3">
                    <div class="bg-yellow-400 p-2 rounded-lg text-slate-900"><i class="fa-solid fa-taxi"></i></div>
                    <h1 class="font-black">التاكسي الذكي</h1>
                </div>
                <button onclick="toggleSidebar()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-2xl"></i></button>
            </div>

            <nav class="space-y-2 flex-1 overflow-y-auto">
                <a href="index.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-white/5 transition-all"><i class="fa-solid fa-gauge-high w-5"></i> لوحة التحكم</a>
                <a href="cars.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-white/5 transition-all"><i class="fa-solid fa-car w-5"></i> السيارات</a>
                <a href="drivers.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-white/5 transition-all"><i class="fa-solid fa-users w-5"></i> السائقين</a>
                <a href="matching.html" class="nav-link flex items-center p-3 rounded-xl gap-3 text-slate-400 hover:bg-white/5 transition-all"><i class="fa-solid fa-scale-balanced w-5"></i> المطابقة المالية</a>
            </nav>
        </aside>
        `;
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        highlightActiveLink();
    }

    // 3. وظيفة التبديل (تم إصلاح المنطق هنا)
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('main-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');

        // نستخدم class للتأكد من الحالة بدلاً من style.transform
        const isOpen = sidebar.classList.contains('translate-x-0');

        if (!isOpen) {
            // فتح القائمة
            sidebar.classList.remove('translate-x-full');
            sidebar.classList.add('translate-x-0');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.style.opacity = '1', 10);
            
            // حركة الباليه (شفافية + طيران للمنتصف)
            toggleBtn.style.cssText = `
                opacity: 0 !important;
                top: 0px !important;
                right: 50% !important;
                transform: translate(50%, -50px) scale(0) !important;
                pointer-events: none !important;
                transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            `;
        } else {
            // إغلاق القائمة
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('translate-x-full');
            overlay.style.opacity = '0';
            setTimeout(() => overlay.classList.add('hidden'), 500);
            
            // عودة الزر
            toggleBtn.style.cssText = `
                opacity: 1 !important;
                top: 1.25rem !important;
                right: 1.25rem !important;
                transform: translate(0, 0) scale(1) !important;
                pointer-events: auto !important;
                transition: all 0.5s ease !important;
            `;
        }
    }

    function highlightActiveLink() {
        const current = window.location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === current) {
                link.classList.add('text-yellow-400', 'bg-white/10');
            }
        });
    }

    injectSidebar();
})();