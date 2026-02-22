/* [1] بناء الهيكل العام */
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

/* [2] جلب البيانات للجدول مع دعم التجاوب data-label */
async function loadData() {
    const container = document.getElementById('tableContent');
    if (!container) return;

    const { data, error } = await _supabase.from('t01_cars').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);

    let html = `<table><thead><tr><th>اللوحة</th><th>المكتب</th><th>الموديل</th><th>الحالة</th><th>السائق</th><th>الإجراءات</th></tr></thead><tbody>`;

    data.forEach(item => {
        html += `<tr>
            <td data-label="اللوحة"><b>${item.f02_plate_no || '-'}</b></td>
            <td data-label="المكتب">${item.f03_car_office || '-'}</td>
            <td data-label="الموديل">${item.f06_model || '-'}</td>
            <td data-label="الحالة"><span class="badge ${item.f12_is_active === 'نشط' ? 'status-green' : 'status-red'}">${item.f12_is_active || '-'}</span></td>
            <td data-label="السائق"><span class="badge status-blue">${item.f13_current_driver_id || 'شاغر'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action btn-edit" onclick='fillForm(${JSON.stringify(item)})'>✏️</button>
                    <button class="btn-action btn-delete" onclick='deleteCar("${item.f01_id}")'>🗑️</button>
                </div>
            </td>
        </tr>`;
    });
    container.innerHTML = html + "</tbody></table>";
}

/* [3] تعبئة النموذج للتعديل */
function fillForm(car) {
    const fields = {
        'f01': car.f01_id, 'f02': car.f02_plate_no, 'f03': car.f03_car_office, 'f04': car.f04_brand,
        'f05': car.f05_brand_type, 'f06': car.f06_model, 'f07': car.f07_license_expiry,
        'f08': car.f08_standard_rent, 'f09': car.f09_management_fee, 'f10': car.f10_responsible_staff_id,
        'f11': car.f11_owner_id, 'f12': car.f12_is_active, 'f13': car.f13_current_driver_id,
        'f14': car.f14_car_notes, 'f15': car.f15_fuel_type
    };
    Object.keys(fields).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = fields[id] || '';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('saveBtn').innerHTML = "تحديث بيانات المركبة 🔄";
}

/* [4] وظيفة الحفظ (Update or Insert) */
async function saveData() {
    const id = document.getElementById('f01').value;
    const carData = {
        f02_plate_no: document.getElementById('f02').value,
        f03_car_office: document.getElementById('f03').value,
        f04_brand: document.getElementById('f04').value,
        f05_brand_type: document.getElementById('f05').value,
        f06_model: parseInt(document.getElementById('f06').value) || 0,
        f07_license_expiry: document.getElementById('f07').value || null,
        f08_standard_rent: parseFloat(document.getElementById('f08').value) || 0,
        f09_management_fee: parseFloat(document.getElementById('f09').value) || 0,
        f10_responsible_staff_id: document.getElementById('f10').value,
        f11_owner_id: document.getElementById('f11').value,
        f12_is_active: document.getElementById('f12').value,
        f13_current_driver_id: document.getElementById('f13').value,
        f14_car_notes: document.getElementById('f14').value,
        f15_fuel_type: document.getElementById('f15').value
    };

    let res = id ? await _supabase.from('t01_cars').update(carData).eq('f01_id', id) 
                 : await _supabase.from('t01_cars').insert([carData]);

    if (res.error) alert("خطأ: " + res.error.message);
    else location.reload();
}

/* [5] حذف مركبة */
async function deleteCar(id) {
    if (confirm("هل أنت متأكد؟")) {
        await _supabase.from('t01_cars').delete().eq('f01_id', id);
        loadData();
    }
}

// تشغيل الساعة والنبض
setInterval(async () => {
    const clock = document.getElementById('digitalClock');
    if(clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
}, 1000);

window.onload = () => { buildGeneralStructure(); loadData(); };