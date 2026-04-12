/* === START OF FILE: revenues.js === */
/**
 * File: revenues.js
 * Version: v1.5.0
 * Function: إدارة الإيرادات مع دعم Jordan Plate UI والعداد المطور
 */

let allRevenues = [];
let sortDirections = {};

document.addEventListener('DOMContentLoaded', async () => {
    await initPage();
});

async function initPage() {
    renderTableControls(); // بناء صندوق البحث والعداد
    await fillRevenueDropdowns();
    await loadData();
}

// [1] بناء صندوق البحث والعداد الأزرق
function renderTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; gap:15px;">
                <div class="global-search-wrapper" style="flex:1;">
                    <input type="text" id="excelSearch" onkeyup="excelFilter()" placeholder="🔍 بحث في السجلات..." 
                           style="width:100%; padding:10px 15px; border-radius:var(--border-radius-sm); border:1px solid #ddd;">
                </div>
                <div class="badge-status badge-active" style="padding:10px 20px;">
                    إجمالي السجلات: <span id="countDisplay" style="margin-right:5px;">0</span>
                </div>
            </div>
        `;
    }
}

// [2] توليد لوحة السيارة بتنسيق Jordan Plate
function createJordanPlate(plateNo, size = 'sm') {
    if (!plateNo) return '-';
    // نفترض أن التنسيق "10-12345" أو "12345"
    const parts = plateNo.split('-');
    const prefix = parts.length > 1 ? parts[0] : '..';
    const number = parts.length > 1 ? parts[1] : parts[0];

    return `
        <div class="jordan-plate ${size}">
            <div class="plate-left">الأردن<br>JORDAN</div>
            <div class="plate-right">
                <span class="prefix">${prefix}</span>
                <span class="number">${number}</span>
            </div>
        </div>
    `;
}

// [3] تعبئة القوائم المنسدلة
async function fillRevenueDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no').eq('f12_is_active', 'نشط'),
            _supabase.from('t02_drivers').select('f02_name'),
            _supabase.from('t11_staff').select('f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_name');
        const staffSelect = document.getElementById('f08_collector');

        if (carSelect && carsRes.data) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driverSelect && driversRes.data) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f02_name}">${d.f02_name}</option>`).join('');
        }
        if (staffSelect && staffRes.data) {
            staffSelect.innerHTML = '<option value="">-- اختر المحصل --</option>' + 
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }
    } catch (err) { console.error("Dropdown Error:", err); }
}

// [4] جلب البيانات ورسم الجدول
async function loadData() {
    const { data, error } = await _supabase.from('t05_revenues').select('*').order('f02_date', { ascending: false });
    if (error) return window.showModal("خطأ", "فشل جلب البيانات", "error");
    allRevenues = data || [];
    renderTable(allRevenues);
}

function renderTable(list) {
    const container = document.getElementById('tableContainer');
    const countDisplay = document.getElementById('countDisplay');
    if (countDisplay) countDisplay.innerText = list.length;

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortTable('f02_date')">التاريخ ↕</th>
                    <th onclick="sortTable('f03_car_no')">السيارة ↕</th>
                    <th>السائق</th>
                    <th onclick="sortTable('f06_amount')">المبلغ ↕</th>
                    <th>المحصل</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(rev => `
                    <tr>
                        <td>${rev.f02_date}</td>
                        <td>${createJordanPlate(rev.f03_car_no)}</td>
                        <td>${rev.f04_driver_name}</td>
                        <td style="color:var(--taxi-green); font-weight:bold;">${parseFloat(rev.f06_amount).toFixed(2)}</td>
                        <td>${rev.f08_collector || '-'}</td>
                        <td>
                            <div class="action-btns-group">
                                <button class="btn-action-sm btn-view" onclick='viewDetails(${JSON.stringify(rev)})'>👁️</button>
                                <button class="btn-action-sm btn-edit" onclick='editRecord(${JSON.stringify(rev)})'>✏️</button>
                                <button class="btn-action-sm btn-delete" onclick="deleteRecord('${rev.f01_id}')">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = list.length > 0 ? html : '<div style="padding:40px; text-align:center;">لا توجد بيانات</div>';
}

// [5] الحفظ المطور
async function saveData(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('f01_id').value;
    const payload = {};
    
    document.querySelectorAll('#revenueForm [id^="f"]').forEach(el => {
        if (el.value.trim() !== "") {
            payload[el.id] = (el.id === 'f06_amount') ? parseFloat(el.value) : el.value.trim();
        }
    });

    if (!payload.f03_car_no || !payload.f06_amount) {
        return window.showModal("نواقص", "يرجى تعبئة الحقول الأساسية", "warning");
    }

    const res = id 
        ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
        : await _supabase.from('t05_revenues').insert([payload]);

    if (res.error) {
        window.showModal("فشل", "حدث خطأ: " + res.error.message, "error");
    } else {
        window.showModal("نجاح", "تم الحفظ بنجاح ✅", "success");
        resetFieldsOnly();
        loadData();
    }
}

// [6] وظائف إضافية (فرز، بحث، معاينة)
function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allRevenues.filter(r => 
        String(r.f03_car_no).toLowerCase().includes(val) || 
        String(r.f04_driver_name).toLowerCase().includes(val)
    );
    renderTable(filtered);
}

function sortTable(key) {
    sortDirections[key] = !sortDirections[key];
    allRevenues.sort((a, b) => {
        let valA = a[key], valB = b[key];
        if (key === 'f06_amount') return (valA - valB) * (sortDirections[key] ? 1 : -1);
        return String(valA).localeCompare(String(valB), 'ar') * (sortDirections[key] ? 1 : -1);
    });
    renderTable(allRevenues);
}

function viewDetails(rev) {
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <div class="view-data-grid">
            <div class="view-item"> <span class="view-label">التاريخ</span> <span class="view-value">${rev.f02_date}</span> </div>
            <div class="view-item"> <span class="view-label">رقم السيارة</span> ${createJordanPlate(rev.f03_car_no)} </div>
            <div class="view-item"> <span class="view-label">السائق</span> <span class="view-value">${rev.f04_driver_name}</span> </div>
            <div class="view-item"> <span class="view-label">المبلغ</span> <span class="view-value">${rev.f06_amount} د.أ</span> </div>
            <div class="view-item full-width"> <span class="view-label">ملاحظات</span> <span class="view-value">${rev.f09_notes || 'لا يوجد'}</span> </div>
        </div>
    `;
    document.getElementById('viewModal').classList.add('active');
}

function closeViewModal() { document.getElementById('viewModal').classList.remove('active'); }

function editRecord(rev) {
    Object.keys(rev).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = rev[key];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFieldsOnly() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
}

async function loadPendingWorkDays(carNo) {
    const wdSelect = document.getElementById('f10_work_day_link');
    const group = document.getElementById('workDayGroup');
    if (!carNo) { group.style.display = 'none'; return; }

    const { data } = await _supabase.from('t08_work_days')
        .select('f01_id, f02_date, f05_daily_amount')
        .eq('f03_car_no', carNo).eq('f06_is_off_day', false);

    if (data && data.length > 0) {
        group.style.display = 'block';
        wdSelect.innerHTML = '<option value="">-- اختر ضمان للمطابقة --</option>' + 
            data.map(d => `<option value="${d.f01_id}">${d.f02_date} | ${d.f05_daily_amount} د.أ</option>`).join('');
    } else { group.style.display = 'none'; }
}

/* === END OF FILE: revenues.js === */
