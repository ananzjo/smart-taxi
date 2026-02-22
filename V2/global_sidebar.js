/* ==================================================================
   [نظام إدارة التاكسي الذكي - الإصدار الشامل والمدمج]
================================================================== */

// [1] الإعدادات والربط
const SB_URL = "https://jmalxvhumgygqxqislut.supabase.co".trim();
const SB_KEY = "sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8".trim();
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// [2] بناء الهيكل العام (Sidebar & Header)
function buildGeneralStructure() {
    const ui = `
        <header class="global-header">
            <div class="header-right">
                <button id="menuBtn" style="background:none; border:none; color:var(--taxi-gold); font-size:30px; cursor:pointer;">☰</button>
                <span style="font-weight:bold; font-size:1.5rem; margin-right:20px;">نظام إدارة التاكسي الذكي</span>
            </div>
            <div style="display:flex; align-items:center;">
                <svg id="wifiSvg" class="wifi-icon-svg" viewBox="0 0 24 24"><path d="M12 21l-12-12c4.4-4.4 11.6-4.4 16 0l-12 12z"/></svg>
                <div id="digitalClock" class="taxi-meter-clock">00:00:00</div>
            </div>
        </header>
        <div id="sideOverlay" class="overlay"></div>
        <nav id="mySidebar" class="sidebar">
            <div class="sidebar-content">
                <a href="javascript:void(0)" onclick="toggleSidebar(false)" style="color:var(--taxi-gold);">× إغلاق القائمة</a>
                <a href="#">🏠 لوحة التحكم</a>
                <a href="cars.html" style="background:var(--taxi-gold); color:#000;">🚖 إدارة السيارات</a>
                <a href="#">📋 العُهد اليومية</a>
            </div>
        </nav>`;
    document.body.insertAdjacentHTML('afterbegin', ui);
    document.getElementById('menuBtn').onclick = () => toggleSidebar(true);
    document.getElementById('sideOverlay').onclick = () => toggleSidebar(false);
}

function toggleSidebar(open) {
    const side = document.getElementById("mySidebar");
    const over = document.getElementById("sideOverlay");
    if(side) side.style.width = open ? "320px" : "0";
    if(over) over.style.display = open ? "block" : "none";
}

// [3] جلب البيانات وعرض الجدول (الاعتماد على Schema: f02, f03, f06, f12, f13)
async function loadData() {
    const container = document.getElementById('tableContent');
    if (!container) return;

    const { data, error } = await _supabase
        .from('t01_cars')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("خطأ في جلب البيانات:", error);
        return;
    }

    let html = `<table>
        <thead>
            <tr>
                <th>اللوحة</th>
                <th>المكتب</th>
                <th>الموديل</th>
                <th>حالة السيارة</th>
                <th>السائق</th>
                <th>الإجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(item => {
        const carStatusClass = item.f12_is_active === 'نشط' ? 'status-green' : 'status-red';
        const driverStatusClass = 'status-blue';

        html += `<tr>
            <td><b>${item.f02_plate_no || '-'}</b></td>
            <td>${item.f03_car_office || '-'}</td>
            <td>${item.f06_model || '-'}</td>
            <td><span class="badge ${carStatusClass}">${item.f12_is_active || 'غير محدد'}</span></td>
            <td><span class="badge ${driverStatusClass}">${item.f13_current_driver_id || 'شاغر'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action btn-edit" onclick='fillForm(${JSON.stringify(item)})' title="تعديل">✏️</button>
                    <button class="btn-action btn-delete" onclick='deleteCar("${item.f01_id}")' title="حذف">🗑️</button>
                </div>
            </td>
        </tr>`;
    });
    
    container.innerHTML = html + "</tbody></table>";
}

// [4] وظيفة الحذف
async function deleteCar(id) {
    if (confirm("🚨 هل أنت متأكد من حذف هذه المركبة؟ لا يمكن التراجع عن هذا الإجراء.")) {
        const { error } = await _supabase
            .from('t01_cars')
            .delete()
            .eq('f01_id', id);

        if (error) {
            alert("خطأ أثناء الحذف: " + error.message);
        } else {
            loadData();
        }
    }
}

// [5] دالة تعبئة النموذج (تطابق 1:1 مع Schema الجديد)
function fillForm(car) {
    console.log("إحضار بيانات المركبة للسطر:", car);

    const mapping = {
        'f01': car.f01_id,
        'f02': car.f02_plate_no,
        'f03': car.f03_car_office,
        'f04': car.f04_brand,
        'f05': car.f05_brand_type,
        'f06': car.f06_model,
        'f07': car.f07_license_expiry,
        'f08': car.f08_standard_rent,
        'f09': car.f09_management_fee,
        'f10': car.f10_responsible_staff_id,
        'f11': car.f11_owner_id,
        'f12': car.f12_is_active,
        'f13': car.f13_current_driver_id,
        'f14': car.f14_car_notes,
        'f15': car.f15_fuel_type
    };

    Object.keys(mapping).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = mapping[id] || '';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = "تحديث بيانات المركبة 🔄";
        saveBtn.style.background = "#1976d2";
    }
}

// [6] دالة الحفظ (إضافة أو تعديل)
async function saveData() {
    const id = document.getElementById('f01').value;
    
    const carData = {
        f02_plate_no:             document.getElementById('f02').value,
        f03_car_office:           document.getElementById('f03').value,
        f04_brand:                document.getElementById('f04').value,
        f05_brand_type:           document.getElementById('f05').value,
        f06_model:                parseInt(document.getElementById('f06').value) || 0,
        f07_license_expiry:       document.getElementById('f07').value || null,
        f08_standard_rent:        parseFloat(document.getElementById('f08').value) || 0,
        f09_management_fee:       parseFloat(document.getElementById('f09').value) || 0,
        f10_responsible_staff_id: document.getElementById('f10').value,
        f11_owner_id:             document.getElementById('f11').value,
        f12_is_active:            document.getElementById('f12').value,
        f13_current_driver_id:    document.getElementById('f13').value,
        f14_car_notes:            document.getElementById('f14').value,
        f15_fuel_type:            document.getElementById('f15').value
    };

    let result;
    if (id) {
        result = await _supabase.from('t01_cars').update(carData).eq('f01_id', id);
    } else {
        result = await _supabase.from('t01_cars').insert([carData]);
    }

    if (result.error) {
        alert("فشل الحفظ: " + result.error.message);
    } else {
        alert("تم الحفظ بنجاح! ✅");
        location.reload();
    }
}

// [7] الساعة والنبض الذكي
setInterval(async () => {
    const clock = document.getElementById('digitalClock');
    const wifi = document.getElementById('wifiSvg');
    if(!clock) return;

    clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    
    try {
        const { error } = await _supabase.from('t01_cars').select('f01_id').limit(1);
        const isOk = !error;
        if(wifi) wifi.setAttribute('class', `wifi-icon-svg ${isOk ? 'pulse-green' : 'pulse-red'}`);
        clock.style.color = isOk ? "#2ecc71" : "#e74c3c";
    } catch (e) {
        if(wifi) wifi.setAttribute('class', 'wifi-icon-svg pulse-red');
    }
}, 1000);

// [8] التشغيل عند تحميل الصفحة
window.onload = () => {
    buildGeneralStructure();
    loadData();
};