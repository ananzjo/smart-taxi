/* ==================================================================
 [global-config.js] - القاموس الموحد + التلميحات الذكية + نظام الجداول المطور
 نظام إدارة التاكسي الذكي - Smart Taxi Management System
 ================================================================== */

// إعدادات الاتصال بقاعدة بيانات Supabase
const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim();
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim();
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- [1] نظام حماية الإرسال المتعدد والتغذية الراجعة ---
let isSubmitting = false;
window.safeSubmit = async function(submitFunction) {
    if (isSubmitting) return; 
    const activeBtns = document.querySelectorAll('button[type="submit"], .primary-btn');
    activeBtns.forEach(btn => { 
        btn.disabled = true; 
        btn.classList.add('btn-clicked');
        btn.innerHTML = '⌛ جاري المعالجة...'; 
    });
    isSubmitting = true;
    try {
        await submitFunction();
    } catch (err) {
        console.error("Submission Error:", err);
        window.showToast("حدث خطأ تقني، حاول مرة أخرى", "error");
    } finally {
        setTimeout(() => {
            isSubmitting = false;
            activeBtns.forEach(btn => { 
                btn.disabled = false; 
                btn.innerHTML = btn.dataset.oldText || 'حفظ | Save';
            });
        }, 1000);
    }
};

// --- [2] نظام تشغيل الواجهة (Boot Sequence) ---
function bootSystem(pageTitle) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startBootSequence(pageTitle));
    } else {
        startBootSequence(pageTitle);
    }
}

function startBootSequence(pageTitle) {
    if (!document.getElementById('unified-ui-css')) {
        const link = document.createElement('link');
        link.id = 'unified-ui-css'; link.rel = 'stylesheet'; link.href = 'unified-ui.css';
        document.head.appendChild(link);
    }
    injectGlobalStyles();  
    renderGlobalLayout(pageTitle); 
    startPulseEngine(); 
    initGlobalModalStructure(); 
    initGlobalToastStructure();
    initViewModalStructure();
    applyAdvancedTooltips(); // تشغيل نظام التلميحات الذكي
}

// --- [3] التنسيقات والواجهة العامة ---
function injectGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'global-styles-extra';
    style.textContent = `
        @import url('https://fonts.cdnfonts.com/css/digital-numbers');
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        :root { --taxi-gold: #d4af37; --taxi-dark: #0b0c10; --status-green: #39ff14; --status-red: #ff3131; }
        body { margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; direction: rtl; background: #f4f7f6; padding-top: 85px; }
        .global-header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(180deg, #1a1c1e 0%, #0b0c10 100%); color: white; height: 75px; padding: 0 30px; position: fixed; top: 0; width: 100%; z-index: 2000; border-bottom: 3px solid var(--taxi-gold); box-shadow: 0 5px 20px rgba(0,0,0,0.3); }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .header-right { display: flex; align-items: center; gap: 25px; }
        .taxi-meter-clock { font-family: 'Digital Numbers', monospace; font-size: 2.2rem; background: #000; padding: 4px 18px; border-radius: 10px; border: 2px solid #333; letter-spacing: 4px; box-shadow: inset 0 0 15px rgba(0,0,0,0.8); }
        .status-online { color: var(--status-green); text-shadow: 0 0 15px var(--status-green); animation: pulse-glow-green 2s infinite; }
        .status-offline { color: var(--status-red); text-shadow: 0 0 15px var(--status-red); animation: pulse-glow-red 1s infinite; }
        @keyframes pulse-glow-green { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
        @keyframes pulse-glow-red { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .header-page-name { color: var(--taxi-gold); font-weight: 900; font-size: 1.2rem; margin-right: 15px; border-right: 2px solid #444; padding-right: 15px; }
        .sidebar { height: 100vh; width: 280px; position: fixed; z-index: 4000; top: 0; right: -300px; background: rgba(15,15,15,0.98); backdrop-filter: blur(15px); transition: 0.5s ease; border-left: 2px solid var(--taxi-gold); }
        .sidebar.open { transform: translateX(-300px); }
        .sidebar a { padding: 18px 25px; text-decoration: none; color: #ccc; display: block; border-bottom: 1px solid #222; transition: 0.3s; font-weight: 600; }
        .sidebar a:hover { color: var(--taxi-gold); background: rgba(212,175,55,0.08); padding-right: 40px; }
        .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2500; }
        .table-header-controls { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 2px solid var(--taxi-gold); border-radius: 12px 12px 0 0; margin-top: 20px; }
        .global-search-wrapper { position: relative; width: 320px; order: 1; }
        .global-search-input { width: 100%; padding: 10px 15px 10px 40px; border-radius: 8px; border: 1px solid #ddd; font-family: inherit; }
        .record-badge { background: #fcfcfc; color: #666; padding: 8px 18px; border-radius: 8px; font-weight: 700; border: 1px solid #eee; order: 2; }
    `;
    document.head.appendChild(style);
}

function renderGlobalLayout(title) {
    const fullNameAr = sessionStorage.getItem('full_name_ar') || "مستخدم النظام";
    const layout = `
        <header class="global-header">
            <div class="header-left">
                <button onclick="toggleNav(true)" style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); color:var(--taxi-gold); font-size:1.6rem; cursor:pointer; width:45px; height:45px; border-radius:12px;">☰</button>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:2rem;">🚖</span>
                    <span class="header-page-name">${title}</span>
                </div>
            </div>
            <div class="header-right">
                <div style="color:var(--taxi-gold); font-weight:900; font-size:1rem; border-left:1px solid #333; padding-left:20px;">${fullNameAr}</div>
                <div id="meterClock" class="taxi-meter-clock status-online">00:00:00</div>
                <button onclick="handleLogout()" style="background:#e74c3c; border:none; color:white; padding:8px 15px; border-radius:8px; cursor:pointer;">خروج</button>
            </div>
        </header>
        <div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
        <nav id="sideNav" class="sidebar">
            <div style="padding:35px 20px; color:var(--taxi-gold); font-weight:900; text-align:center; border-bottom:1px solid #333;">🚖 مـديـر الـتـاكـسـي</div>
            <a href="index.html">📉 لوحة التحكم | Dashboard</a>
            <a href="work_days.html">📅 أيام العمل والضمان</a>
            <a href="cars.html">🚗 أسطول السيارات</a>
            <a href="drivers.html">👨‍✈️ السائقين</a>
            <a href="revenues.html">💰 الإيرادات والتحصيل</a>
            <a href="fines_accidents.html">⚠️ المخالفات والحوادث</a>
            <a href="expenses.html">🔧 المصاريف والصيانة</a>
            <a href="suppliers.html">🤝 الموردين والجهات</a>
            <a href="handover.html">📦 تسليم واستلام السيارات</a>
            <a href="payments.html">💳 المدفوعات والتسوية</a>
            <a href="reports.html" style="color:var(--taxi-gold); font-weight:bold;">📊 التقارير المركزية</a>
        </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', layout);
}

function toggleNav(open) {
    const nav = document.getElementById("sideNav"); const overlay = document.getElementById("navOverlay");
    if (open) { nav.classList.add("open"); overlay.style.display = "block"; } else { nav.classList.remove("open"); overlay.style.display = "none"; }
}
function handleLogout() { sessionStorage.clear(); window.location.href = 'login.html'; }

function startPulseEngine() {
    setInterval(async () => {
        const clock = document.getElementById('meterClock');
        if (clock) {
            try {
                const { error } = await _supabase.from('t01_cars').select('count', { count: 'exact', head: true }).limit(1);
                if (error) throw error;
                clock.classList.remove('status-offline'); clock.classList.add('status-online');
            } catch (err) { clock.classList.remove('status-online'); clock.classList.add('status-offline'); }
        }
    }, 5000);
    setInterval(() => {
        const clock = document.getElementById('meterClock');
        if(clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }, 1000);
}

// --- [4] Jordan Plate Formatter ---
window.formatJordanPlate = function(plateNo, isSm = false) {
    if (!plateNo) return '---';
    const smClass = isSm ? 'sm' : '';
    return `
        <div class="jordan-plate ${smClass}" title="Jordan Taxi Plate - الترميز 50">
            <div class="plate-left">الاردن<br>JORDAN</div>
            <div class="plate-right">
                <span class="prefix">50</span>
                <span class="main-no">${plateNo}</span>
            </div>
        </div>
    `;
};

// --- [5] Smart Tooltips System ---
const tooltipsDictionary = {
    f02_plate_no: { ar: 'رقم اللوحة المعدنية المسجل في الترخيص', en: 'Official license plate number' },
    f04_brand: { ar: 'الشركة المصنعة للسيارة (مثال: تويوتا، هيونداي)', en: 'Vehicle manufacturer brand' },
    f06_model: { ar: 'سنة تصنيع المركبة', en: 'Year of manufacture' },
    f08_standard_rent: { ar: 'قيمة الضمان اليومي المتفق عليها أساساً', en: 'Base daily rental/guarantee amount' },
    f02_name: { ar: 'الاسم الكامل للسائق كما في الهوية', en: 'Full legal name of the driver' },
    f04_mobile: { ar: 'رقم الهاتف الفعال للتواصل السريع', en: 'Active mobile number for contact' },
    f06_amount: { ar: 'المبلغ المالي المدفوع أو المصروف', en: 'Financial amount paid or spent' },
    f09_car: { ar: 'السيارة الحالية الموجودة بحوزة السائق', en: 'Current vehicle assigned to driver' },
    f10_notes: { ar: 'أي ملاحظات إضافية بخصوص هذا السجل', en: 'Additional remarks for this record' }
};

function applyAdvancedTooltips() {
    document.querySelectorAll('label').forEach(label => {
        const fieldId = label.getAttribute('for');
        if (fieldId && tooltipsDictionary[fieldId]) {
            const data = tooltipsDictionary[fieldId];
            label.classList.add('label-help');
            label.innerHTML += `
                <div class="tooltip-box">
                    <b>تعليمات | Instructions</b>
                    ${data.ar}
                    <span>${data.en}</span>
                </div>
            `;
        }
    });
}

// --- [6] قاموس المصطلحات الموحد ---
const globalLabels = {
    f02_date: 'التاريخ | Date',
    f03_car_no: 'رقم السيارة | Car No',
    f04_driver_id: 'كود السائق | Driver ID',
    f04_driver_name: 'اسم السائق | Driver Name',
    f05_revenue_type: 'نوع الإيراد | Rev Type',
    f05_expense_type: 'نوع المصروف | Exp Type',
    f05_category: 'الفئة | Category',
    f06_payment_type: 'وسيلة الدفع | Payment',
    f06_seller: 'المورد/البائع | Vendor',
    f06_amount: 'المبلغ | Amount',
    f07_amount: 'المبلغ الإجمالي | Total Amount',
    f07_method: 'الطريقة | Method',
    f08_ref_no: 'رقم المرجع | Ref No',
    f08_collector: 'المحصّل | Collector',
    f09_user_id: 'الموظف | Staff',
    f09_notes: 'الملاحظات | Notes',
    f10_status: 'الحالة | Status',
    f11_notes: 'تفاصيل إضافية | Details',
    f12_created_at: 'وقت التسجيل | Created At',
    f03_time: 'الوقت | Time',
    f04_car_id: 'رقم السيارة | Car No',
    f05_driver_id: 'كود السائق | Driver ID',
    f06_staff_id: 'موظف الاستلام | Staff ID',
    f07_action_type: 'نوع الحركة | Mov Type',
    f08_daman: 'الضمان | Rent',
    f09_km_reading: 'العداد | KM Reading',
    f10_car_condition: 'حالة السيارة | Condition',
    t02_drivers: 'اسم السائق | Driver Name',
    f02_plate_no: 'رقم اللوحة | Plate No',
    f03_car_office: 'المكتب | Office',
    f04_brand: 'الماركة | Brand',
    f06_model: 'الموديل | Year',
    f07_license_expiry: 'انتهاء الترخيص | License Expiry',
    f08_standard_rent: 'الضمان الافتراضي | Std. Rent',
    f09_management_fee: 'رسوم الإدارة | Admin Fee',
    f11_owner_id: 'المالك | Owner',
    f12_is_active: 'الحالة | Status',
    f13_current_driver_id: 'السائق الحالي | Driver',
    f14_car_notes: 'ملاحظات السيارة | Car Notes',
    f15_fuel_type: 'الوقود | Fuel',
    f02_name: 'الاسم | Name',
    f03_national_no: 'الرقم الوطني | National ID',
    f04_mobile: 'الهاتف | Mobile',
    f05_address: 'العنوان | Address',
    f06_location_url: 'الموقع | Location',
    f07_status: 'الحالة | Status'
};

// --- [7] نظام العرض التفصيلي ---
function initViewModalStructure() {
    if (document.getElementById('viewModalOverlay')) return;
    const modalHtml = `<div id="viewModalOverlay" class="view-modal-overlay" onclick="closeViewModal(event)"><div class="view-modal-card"><div class="view-modal-header"><h2 id="viewModalTitle">Record Details</h2><button onclick="closeViewModal(null, true)">&times;</button></div><div class="view-modal-body" id="viewModalBody"></div><div class="view-modal-footer"><button class="close-view-btn" onclick="closeViewModal(null, true)">إغلاق | Close</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.showViewModal = function(data, title = "Record Details", labelsMapping = {}) {
    const body = document.getElementById('viewModalBody'); document.getElementById('viewModalTitle').innerText = title;
    let html = '<div class="view-data-grid" style="direction:rtl;">';
    const finalMapping = { ...globalLabels, ...labelsMapping };
    Object.keys(data).forEach(key => {
        if (['f01_id', 'id', 'created_at', 'updated_at', 'f15_id', 'f08_status_date'].includes(key)) return;
        let value = data[key]; if (value === null || value === undefined) value = '---';
        if (typeof value === 'object' && value.f02_name) value = value.f02_name;
        if (typeof value === 'object' && value.f02_plate_no) value = value.f02_plate_no;
        if (key === 'f02_plate_no' || key === 'f03_car_no') value = window.formatJordanPlate(value);
        const label = finalMapping[key] || key;
        const isFullWidth = (String(value).length > 35 || key === 'f09_notes' || key === 'f11_notes') ? 'full-width' : '';
        html += `<div class="view-item ${isFullWidth}"><span class="view-label">${label}</span><span class="view-value">${value}</span></div>`;
    });
    html += '</div>'; body.innerHTML = html; document.getElementById('viewModalOverlay').classList.add('active');
};
window.closeViewModal = function(event, force = false) { if (force || event.target.id === 'viewModalOverlay') document.getElementById('viewModalOverlay').classList.remove('active'); };

function initGlobalModalStructure() {
    if (document.getElementById('globalModal')) return;
    const html = `<div id="globalModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;"><div style="background:white; padding:40px; border-radius:15px; text-align:center; max-width:400px; width:90%; border-top:8px solid var(--taxi-gold);"><h2 id="modalTitle"></h2><div id="modalMsg" style="margin:20px 0;"></div><div id="modalBtnContainer"></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}
window.showModal = function(title, message, type = 'info', onConfirm = null) {
    const modal = document.getElementById('globalModal');
    document.getElementById('modalTitle').innerText = title; document.getElementById('modalMsg').innerHTML = message;
    const container = document.getElementById('modalBtnContainer'); container.innerHTML = '';
    if (onConfirm) {
        const okBtn = document.createElement('button'); okBtn.innerText = 'تأكيد'; okBtn.className = 'primary-btn'; okBtn.style.background = '#e74c3c';
        okBtn.onclick = async () => { await onConfirm(); modal.style.display = 'none'; };
        const cancelBtn = document.createElement('button'); cancelBtn.innerText = 'إلغاء'; cancelBtn.className = 'secondary-btn'; cancelBtn.style.marginRight = '10px';
        cancelBtn.onclick = () => modal.style.display = 'none';
        container.appendChild(okBtn); container.appendChild(cancelBtn);
    } else {
        const closeBtn = document.createElement('button'); closeBtn.innerText = 'موافق'; closeBtn.className = 'primary-btn';
        closeBtn.onclick = () => modal.style.display = 'none'; container.appendChild(closeBtn);
    }
    modal.style.display = 'flex';
};
function initGlobalToastStructure() { if (document.getElementById('toastContainer')) return; const container = document.createElement('div'); container.id = 'toastContainer'; container.className = 'toast-container'; document.body.appendChild(container); }
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer'); const toast = document.createElement('div'); toast.className = 'toast-msg';
    if(type === 'error') toast.style.borderRightColor = '#e74c3c'; toast.innerText = message; container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
};
window.bootSystem = bootSystem;
