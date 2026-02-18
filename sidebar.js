/**
 * نظام إدارة التاكسي الذكي - الإصدار الاحترافي (تكتكة كاملة)
 * الوظيفة: حقن القائمة الجانبية + حركة الزر الراقصة + حماية الصفحات
 */

(function() {
    // 1. نظام الحماية: منع التسلل المباشر للصفحات الفرعية
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== 'index.html' && currentPage !== '' && document.referrer === "") {
        window.location.href = 'index.html';
        return;
    }

    // 2. حقن هيكل القائمة والزر (UI Injection)
    function injectSidebar() {
        const sidebarHTML = `
        <button id="sidebar-toggle-btn" onclick="toggleSidebar()" 
            class="fixed top-5 right-5 z-[60] bg-[#0f172a] text-yellow-400 p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 font-bold"
            style="transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <i class="fa-solid fa-bars-staggered text-xl"></i>
            <span class="text-sm">لوحة التحكم</span>
        </button>

        <div id="sidebar-overlay" onclick="toggleSidebar()" 
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 hidden opacity-0 transition-opacity duration-500"></div>

        <aside id="main-sidebar" 
            class="fixed top-0 right-0 w-76 bg-[#0f172a]/95 backdrop-blur-xl h-screen text-white p-6 shadow-2xl flex flex-col z-50 translate-x-full transition-transform duration-500 ease-out border-l border-white/10">
            
            <div class="flex items-center justify-between mb-10 px-2 border-b border-white/5 pb-6">
                <div class="flex items-center gap-3">
                    <div class="bg-yellow-400 p-2.5 rounded-xl text-slate-900 shadow-lg">
                        <i class="fa-solid fa-taxi text-xl"></i>
                    </div>
                    <h1 class="text-lg font-black text-white">التاكسي الذكي</h1>
                </div>
                <button onclick="toggleSidebar()" class="text-slate-400 hover:text-white transition-all">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <nav class="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <a href="index.html" class="nav-link flex items-center p-3.5 rounded-xl gap-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-yellow-400 transition-all">
                    <i class="fa-solid fa-gauge-high w-6 text-center"></i> لوحة التحكم
                </a>
                
                <div class="text-[10px] text-slate-500 font-black px-4 pt-8 pb-2 uppercase tracking-widest">إدارة الأسطول</div>
                <a href="cars.html" class="nav-link flex items-center p-3.5 rounded-xl gap-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-yellow-400 transition-all"><i class="fa-solid fa-car w-6 text-center"></i> السيارات</a>
                <a href="drivers.html" class="nav-link flex items-center p-3.5 rounded-xl gap-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-yellow-400 transition-all"><i class="fa-solid fa-users w-6 text-center"></i> السائقين</a>

                <div class="text-[10px] text-slate-500 font-black px-4 pt-8 pb-2 uppercase tracking-widest">المالية</div>
                <a href="matching.html" class="nav-link flex items-center p-3.5 rounded-xl gap-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-yellow-400 transition-all"><i class="fa-solid fa-scale-balanced w-6 text-center"></i> تسوية المطابقة</a>
            </nav>
        </aside>
        `;

        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        highlightActiveLink();
    }

    // 3. حركة التبديل (التحرك الرشيق والشفافية)
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('main-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');

        const isOpen = sidebar.style.transform === 'translateX(0px)';

        if (!isOpen) {
            // فتح القائمة
            sidebar.style.transform = 'translateX(0)';
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.style.opacity = '1', 10);
            
            // الزر يرقص للمنتصف ويختفي بشفافية
            toggleBtn.style.cssText = `
                opacity: 0 !important;
                top: 20px !important;
                right: 50% !important;
                transform: translate(50%, -20px) scale(0.5) rotate(180deg) !important;
                pointer-events: none !important;
                transition: opacity 0.6s ease, top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            `;
        } else {
            // إغلاق القائمة
            sidebar.style.transform = 'translateX(100%)';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.classList.add('hidden'), 500);
            
            // الزر يعود لمكانه الأصلي برشاقة
            toggleBtn.style.cssText = `
                opacity: 1 !important;
                top: 1.25rem !important;
                right: 1.25rem !important;
                transform: translate(0, 0) scale(1) rotate(0deg) !important;
                pointer-events: auto !important;
                transition: opacity 0.4s ease, top 0.6s cubic-bezier(0.22, 1, 0.36, 1), right 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) !important;
            `;
        }
    }

    function highlightActiveLink() {
        const current = window.location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === current) {
                link.style.cssText = "background: rgba(250, 204, 21, 0.1) !important; border-right: 4px solid #facc15 !important; color: #facc15 !important;";
            }
        });
    }

    injectSidebar();
})();