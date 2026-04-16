/* === START OF FILE === */
/**
 * File: revenues.js
 * Version: v1.9.0
 * Function: إدارة الإيرادات والتحصيلات - النسخة النهائية المستقرة
 * Logic: Fixed Status Field & Manual Init to prevent conflicts
 */

// --- [1] التعريفات العامة ---
let allRevenues = [];
let filteredRevenues = [];
let driversList = [];
let staffList = [];
let carsList = [];

/**
 * الوظيفة المركزية للتشغيل - يتم استدعاؤها من HTML فقط
 */
async function initRevenuesPage() {
    try {
        console.log("🚀 Initializing Revenues System...");

        // 1. تعبئة القوائم الثابتة
        if (typeof LookupEngine !== 'undefined') {
            await Promise.all([
                LookupEngine.fillSelect('revenue_category', 'f05_category', { placeholder: '-- الفئة --' }),
                LookupEngine.fillSelect('payment_methods', 'f07_method', { placeholder: '-- الطريقة --' })
            ]);
        }

        // 2. جلب البيانات الأساسية
        await Promise.all([
            fetchCars(),
            fetchDrivers(),
            fetchStaff()
        ]);

        // 3. جلب الجدول
        await fetchRevenuesData();

        setupFormListener();
        
        console.log("✅ System Ready.");
    } catch (err) {
        console.error("Critical Init Error:", err);
    }
}

// --- [2] دوال جلب البيانات ---

async function fetchCars() {
    // جلب كل السيارات وتصفية النشط منها بمرونة
    const { data } = await _supabase.from('t01_cars').select('f01_id, f02_plate_no, f11_is_active');
    carsList = (data || []).filter(c => 
        !c.f11_is_active || 
        c.f11_is_active.includes('نشط') || 
        c.f11_is_active.toLowerCase().includes('active')
    );
    fillOptions('f03_car_no', carsList, 'f02_plate_no', 'f02_plate_no', '-- السيارة --');
}

async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status');
    driversList = (data || []).filter(d => 
        !d.f06_status || 
        d.f06_status.includes('نشط') || 
        d.f06_status.toLowerCase().includes('active')
    );
    fillOptions('f04_driver_id', driversList, 'f01_id', 'f02_name', '-- السائق --');
}

async function fetchStaff() {
    const { data } = await _supabase.from('t11_staff').select('f01_id, f02_name');
    staffList = data || [];
    fillOptions('f08_collector_id', staffList, 'f01_id', 'f02_name', '-- المحصل --');
}

async function fetchRevenuesData() {
    const { data, error } = await _supabase.from('t05_revenues').select('*').order('f02_date', { ascending: false });
    if (!error) {
        allRevenues = data || [];
        filteredRevenues = [...allRevenues];
        renderTable();
    }
}

// --- [3] عرض الجدول ---

function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    let html = `
        <table class="taxi-table">
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>السيارة</th>
                    <th>السائق</th>
                    <th>الفئة</th>
                    <th>المبلغ</th>
                    <th>المحصل</th>
                    <th style="text-align:center">العمليات</th>
                </tr>
            </thead>
            <tbody>`;

    filteredRevenues.forEach(row => {
        const driverName = driversList.find(d => d.f01_id === row.f04_driver_id)?.f02_name || '---';
        const staffName = staffList.find(s => s.f01_id === row.f08_collector_id)?.f02_name || '---';

        html += `
            <tr>
                <td>${row.f02_date}</td>
                <td><strong>${row.f03_car_no}</strong></td>
                <td>${driverName}</td>
                <td>${row.f05_category}</td>
                <td style="color:green; font-weight:bold">${row.f06_amount}</td>
                <td>${staffName}</td>
                <td style="text-align:center">
                    <div style="display:flex; gap:5px; justify-content:center">
                        <button onclick="viewRevenue('${row.f01_id}')" class="btn-icon">👁️</button>
                        <button onclick="printRevenue('${row.f01_id}')" class="btn-icon">🖨️</button>
                        <button onclick="editRevenue('${row.f01_id}')" class="btn-icon">✏️</button>
                        <button onclick="deleteRevenue('${row.f01_id}')" class="btn-icon">🗑️</button>
                    </div>
                </td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// --- [4] العمليات ---

function editRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    document.getElementById('f01_id').value = record.f01_id;
    document.getElementById('f02_date').value = record.f02_date;
    document.getElementById('f03_car_no').value = record.f03_car_no;
    document.getElementById('f04_driver_id').value = record.f04_driver_id;
    document.getElementById('f05_category').value = record.f05_category;
    document.getElementById('f06_amount').value = record.f06_amount;
    document.getElementById('f07_method').value = record.f07_method;
    document.getElementById('f08_collector_id').value = record.f08_collector_id || "";
    document.getElementById('f09_notes').value = record.f09_notes || "";
    if (document.getElementById('f10_work_day_link')) document.getElementById('f10_work_day_link').value = record.f10_work_day_link || "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewRevenue(id) { console.log("View:", id); }
function printRevenue(id) { window.print(); }

async function deleteRevenue(id) {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await _supabase.from('t05_revenues').delete().eq('f01_id', id);
    if (!error) await fetchRevenuesData();
}

function fillOptions(elementId, data, valKey, txtKey, placeholder) {
    const select = document.getElementById(elementId);
    if (!select) return;
    let html = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
        html += `<option value="${item[valKey]}">${item[txtKey]}</option>`;
    });
    select.innerHTML = html;
}

// --- [5] حفظ وتحديث البيانات ---
function setupFormListener() {
    const form = document.getElementById('revenueForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
    
    // Auto Select Logic for Revenue Form
    const carSel = document.getElementById('f03_car_no');
    const drvSel = document.getElementById('f04_driver_id');

    if (carSel) {
        carSel.addEventListener('change', (e) => {
            if (window.smartAutoSelect) window.smartAutoSelect.onCarChange(e.target.value, 'f04_driver_id');
        });
    }

    if (drvSel) {
        drvSel.addEventListener('change', (e) => {
            if (window.smartAutoSelect) window.smartAutoSelect.onDriverChange(e.target.value, 'f03_car_no');
            updateWorkDayDues();
        });
    }

    const catSel = document.getElementById('f05_category');
    if (catSel) {
        catSel.addEventListener('change', (e) => {
            const group = document.getElementById('workDayGroup');
            if (group) {
                // Now matching against the standardized Arabic string
                const isDailyRent = e.target.value === 'ضمان يومي';
                group.style.display = isDailyRent ? 'block' : 'none';
                if (isDailyRent) updateWorkDayDues();
            }
        });
    }
}

/**
 * جلب سجلات الضمان المتاحة لمطابقتها مع الإيراد
 */
async function updateWorkDayDues() {
    const carNo = document.getElementById('f03_car_no').value;
    const driverId = document.getElementById('f04_driver_id').value;
    const matchSel = document.getElementById('f10_work_day_link');

    if (!matchSel) return;
    if (!carNo) {
        matchSel.innerHTML = '<option value="">-- اختر السيارة أولاً --</option>';
        return;
    }

    try {
        // Fetch unpaid or partially paid work days for this car
        const { data, error } = await _supabase
            .from('t08_work_days')
            .select('*')
            .eq('f03_car_no', carNo)
            .eq('f06_is_off_day', false)
            .order('f02_date', { ascending: false })
            .limit(10);

        if (error) throw error;

        let html = '<option value="">-- اختر ضمان للمطابقة --</option>';
        (data || []).forEach(day => {
            html += `<option value="${day.f01_id}">${day.f02_date} (المستحق: ${day.f05_daily_amount})</option>`;
        });
        matchSel.innerHTML = html;
    } catch (err) {
        console.error("Error fetching work days:", err);
    }
}

function resetRevenueForm() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = '';
    const dateInput = document.getElementById('f02_date');
    if (dateInput) dateInput.valueAsDate = new Date();
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_id: document.getElementById('f04_driver_id').value || null,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: parseFloat(document.getElementById('f06_amount').value) || 0,
            f07_method: document.getElementById('f07_method').value,
            f08_collector_id: document.getElementById('f08_collector_id').value || null,
            f09_notes: document.getElementById('f09_notes').value || "",
            f10_work_day_link: document.getElementById('f10_work_day_link')?.value || null
        };

        try {
            const res = id 
                ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
                : await _supabase.from('t05_revenues').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ الإيراد بنجاح ✅", "success");
            resetRevenueForm();
            fetchRevenuesData();
        } catch (err) {
            showToast("حدث خطأ أثناء الحفظ", "error");
        }
    });
}

/* === END OF FILE === */