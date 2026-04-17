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
let currentSort = { col: 'f02_date', asc: false };
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
        initTableControls();
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
                    <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ ↕</th>
                    <th onclick="sortData('f03_car_no')" style="cursor:pointer">السيارة ↕</th>
                    <th onclick="sortData('f04_driver_id')" style="cursor:pointer">السائق ↕</th>
                    <th onclick="sortData('f05_category')" style="cursor:pointer">الفئة ↕</th>
                    <th onclick="sortData('f06_amount')" style="cursor:pointer">المبلغ ↕</th>
                    <th onclick="sortData('f08_collector_id')" style="cursor:pointer">المحصل ↕</th>
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
    updateCounter();
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
async function printRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    const driverName = driversList.find(d => d.f01_id === record.f04_driver_id)?.f02_name || '---';
    const staffName = staffList.find(s => s.f01_id === record.f08_collector_id)?.f02_name || '---';
    const printArea = document.getElementById('printReceiptSection');

    if (!printArea) return;

    printArea.innerHTML = `
        <div class="v-stamp" style="font-family: 'Tajawal', sans-serif;">مدفوع | PAID</div>
        <div class="v-header" style="border-bottom: 3px solid #000; padding-bottom:15px; margin-bottom:25px;">
            <div class="v-logo" style="font-size:3.5rem;">🚖</div>
            <div class="v-title">
                <h2 style="font-size:2.2rem; font-weight:900; margin:0;">Smart Taxi Systems</h2>
                <p style="font-size:1.1rem; font-weight:bold; margin:5px 0 0; color:#333;">وصل مالي رسمي | Official Payment Receipt</p>
            </div>
            <div class="v-meta" style="text-align:left; font-size:0.9rem; line-height:1.4;">
                <p><strong>الرقم | REF:</strong> ${record.f01_id.slice(0,8).toUpperCase()}</p>
                <p><strong>التاريخ | Date:</strong> ${record.f02_date}</p>
                <p><strong>الوقت | Time:</strong> ${new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
        </div>

        <div class="v-body">
            <div class="v-row">
                <span class="v-lbl">وصلنا من السيد:</span>
                <span class="v-val">${driverName}</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">رقم السيارة:</span>
                <span class="v-val">${record.f03_car_no}</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">وذلك عن:</span>
                <span class="v-val">${record.f05_category} ${record.f09_notes ? ` - ${record.f09_notes}` : ''}</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">طريقة الدفع:</span>
                <span class="v-val">${record.f07_method}</span>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <div class="v-amount-box">
                    <span>${record.f06_amount} JD</span>
                </div>
            </div>
        </div>

        <div class="v-footer">
            <div class="v-sig">
                <p>توقيع السائق</p>
                <div class="v-line"></div>
            </div>
            <div class="v-sig">
                <p>توقيع المحصل (${staffName})</p>
                <div class="v-line"></div>
            </div>
        </div>

        <div class="v-notice">
            * تم إصدار هذا السند آلياً عبر نظام Smart Taxi. يرجى الاحتفاظ به لضمان حقوقك المالية.
        </div>
    `;

    setTimeout(() => {
        window.print();
    }, 250);
}

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

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredRevenues.sort((a, b) => {
        let vA = a[col] || '';
        let vB = b[col] || '';
        
        if (!isNaN(vA) && !isNaN(vB) && vA !== "" && vB !== "") {
            vA = parseFloat(vA);
            vB = parseFloat(vB);
        }

        if (vA < vB) return currentSort.asc ? -1 : 1;
        if (vA > vB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    renderTable();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي التحصيلات: <span id="count">${allRevenues.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="excelSearch" class="global-search-input" placeholder="بحث بالسيارة، السائق أو الوصف..." onkeyup="excelFilter()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        `;
    }
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    filteredRevenues = allRevenues.filter(r => 
        (r.f03_car_no && r.f03_car_no.toLowerCase().includes(val)) ||
        (r.f05_category && r.f05_category.toLowerCase().includes(val)) ||
        (r.f09_notes && r.f09_notes.toLowerCase().includes(val)) ||
        Object.values(r).some(v => String(v).toLowerCase().includes(val))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredRevenues.length;
}

/* === END OF FILE === */