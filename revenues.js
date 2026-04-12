/* === START OF FILE: revenues.js === */
/**
 * File: revenues.js
 * Version: v1.4.0
 * Function: إدارة الإيرادات مع البحث المتقدم ومطابقة أيام العمل
 */

let allRevenues = []; 
let sortDirections = {}; 

// [1] تشغيل النظام عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof bootSystem === 'function') bootSystem("إدارة الإيرادات | Revenues");
    await initPage();
});

async function initPage() {
    initTableControls(); // حقن صندوق البحث والعداد
    await fillRevenueDropdowns();
    await loadData();
    setupEventListeners();
}

// [2] حقن أدوات التحكم (صندوق البحث والعداد) في الـ HTML
function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <div class="search-box">
                    <input type="text" id="excelSearch" onkeyup="excelFilter()" placeholder="🔍 بحث سريع (سيارة، سائق، محصل)..." 
                           style="padding: 8px 15px; width: 300px; border-radius: 20px; border: 1px solid #ccc; outline: none;">
                </div>
                <div class="record-counter" style="background: #007bff; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                    إجمالي السجلات: <span id="countDisplay">0</span>
                </div>
            </div>
        `;
    }
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

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driversRes.data && driverSelect) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f02_name}">${d.f02_name}</option>`).join('');
        }
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- اختر المحصل --</option>' + 
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

// [4] جلب البيانات
async function loadData() {
    const { data, error } = await _supabase
        .from('t05_revenues')
        .select('*')
        .order('f02_date', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب البيانات", "error"); 
        return; 
    }
    allRevenues = data;
    renderTable(data);
}

// [5] بناء الجدول وتحديث العداد
function renderTable(list) {
    const countDisplay = document.getElementById('countDisplay');
    if (countDisplay) countDisplay.innerText = list.length;
    
    if (window.updateRecordCounter) window.updateRecordCounter(list.length);

    let html = `<table><thead><tr>
        <th onclick="sortTable(0)" style="cursor:pointer">التاريخ ↕</th>
        <th onclick="sortTable(1)" style="cursor:pointer">السيارة ↕</th>
        <th onclick="sortTable(2)" style="cursor:pointer">السائق ↕</th>
        <th onclick="sortTable(3)" style="cursor:pointer">المبلغ ↕</th>
        <th onclick="sortTable(4)" style="cursor:pointer">المحصل ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(rev => {
        html += `<tr>
            <td>${rev.f02_date}</td>
            <td><b>${rev.f03_car_no}</b></td>
            <td>${rev.f04_driver_name}</td>
            <td style="color:var(--taxi-green); font-weight:bold;">${parseFloat(rev.f06_amount).toLocaleString()}</td>
            <td>${rev.f08_collector || '-'}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(rev)})' class="btn-action edit-btn" title="تعديل">📝</button>
                <button onclick="deleteRecord('${rev.f01_id}')" class="btn-action delete-btn" title="حذف">🗑️</button>
            </td>
        </tr>`;
    });
    
    const container = document.getElementById('tableContainer');
    if(container) container.innerHTML = list.length > 0 ? html + "</tbody></table>" : '<p style="padding:20px; text-align:center;">لا توجد بيانات للعرض</p>';
}

// [6] الحفظ مع معالجة الأرقام والتحقق
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
        window.showModal("نواقص", "يرجى اختيار السيارة والمبلغ", "warning");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
        : await _supabase.from('t05_revenues').insert([payload]);

    if (error) { 
        window.showModal("فشل", "حدث خطأ أثناء الحفظ: " + error.message, "error"); 
    } else { 
        window.showModal("نجاح", "تم حفظ السجل بنجاح ✅", "success");
        resetFieldsOnly(); 
        loadData();
    }
}

// [7] نظام مطابقة أيام العمل (Work Days Logic)
async function loadPendingWorkDays(carNo) {
    const group = document.getElementById('workDayGroup');
    const wdSelect = document.getElementById('f10_work_day_link');
    if (!carNo || !wdSelect) return;

    const { data, error } = await _supabase.from('t08_work_days')
        .select('f01_id, f02_date, f05_daily_amount')
        .eq('f03_car_no', carNo)
        .eq('f06_is_off_day', false)
        .order('f02_date', { ascending: false });

    if (data && data.length > 0) {
        group.style.display = 'block';
        wdSelect.innerHTML = '<option value="">-- اختر ضمان للمطابقة --</option>' + 
            data.map(d => `<option value="${d.f01_id}">${d.f02_date} | ${d.f05_daily_amount} د.أ</option>`).join('');
    } else {
        group.style.display = 'none';
    }
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allRevenues.filter(item => {
        return (
            String(item.f03_car_no || "").toLowerCase().includes(val) ||
            String(item.f04_driver_name || "").toLowerCase().includes(val) ||
            String(item.f08_collector || "").toLowerCase().includes(val) ||
            String(item.f02_date || "").includes(val)
        );
    });
    renderTable(filtered);
}

function sortTable(n) {
    sortDirections[n] = !sortDirections[n];
    const direction = sortDirections[n] ? 1 : -1;
    
    allRevenues.sort((a, b) => {
        const keys = ['f02_date', 'f03_car_no', 'f04_driver_name', 'f06_amount', 'f08_collector'];
        let aV = a[keys[n]], bV = b[keys[n]];
        if (n === 3) return (parseFloat(aV) - parseFloat(bV)) * direction;
        return String(aV).localeCompare(String(bV), 'ar') * direction;
    });
    renderTable(allRevenues);
}

function editRecord(rev) {
    Object.keys(rev).forEach(key => { 
        const el = document.getElementById(key);
        if(el) el.value = rev[key]; 
    });
    if (rev.f03_car_no) loadPendingWorkDays(rev.f03_car_no);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    window.showModal("تأكيد", "هل أنت متأكد من حذف السجل نهائياً؟", "error", async () => {
        const { error } = await _supabase.from('t05_revenues').delete().eq('f01_id', id);
        if (error) window.showModal("خطأ", "فشل الحذف", "error"); else loadData();
    });
}

function setupEventListeners() {
    const carNoSelect = document.getElementById('f03_car_no');
    if (carNoSelect) {
        carNoSelect.addEventListener('change', (e) => loadPendingWorkDays(e.target.value));
    }
}

function resetFieldsOnly() {
    const form = document.getElementById('revenueForm');
    if(form) form.reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
    document.getElementById('workDayGroup').style.display = 'none';
}

/* === END OF FILE: revenues.js === */
