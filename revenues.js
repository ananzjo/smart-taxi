/**
 * [AR] ملف إدارة الإيرادات والتحصيلات المالية
 * [EN] Revenue and Collection Management Engine
 * Version: v3.0.0 [STABLE]
 */

let allRevenues = [];
let filteredRevenues = [];
let currentSort = { col: 'f02_date', asc: false };
let driversList = [];
let staffList = [];
let carsList = [];
let workDaysMetadata = []; // [AR] تخزين مبالغ الأيام للمطابقة | [EN] Store work day amounts for matching

/**
 * [AR] تهيئة صفحة الإيرادات - الوظيفة المركزية
 * [EN] Main initialization function for the Revenues page
 */
async function initRevenuesPage() {
    try {
        // [AR] تعبئة القوائم المنسدلة من محرك البيانات
        // [EN] Populate select inputs from LookupEngine
        if (typeof LookupEngine !== 'undefined') {
            await Promise.all([
                LookupEngine.fillSelect('revenue_category', 'f05_category', { placeholder: '-- الفئة --' }),
                LookupEngine.fillSelect('payment_methods', 'f07_method', { placeholder: '-- الطريقة --' })
            ]);
        }

        // [AR] جلب البيانات الأساسية من قاعدة البيانات
        // [EN] Fetch core entity data
        await Promise.all([
            fetchCars(),
            fetchDrivers(),
            fetchStaff(),
            fetchWorkDaysMetadata() // [AR] جلب بيانات الأيام للمطابقة | [EN] Fetch days for matching
        ]);

        await fetchRevenuesData();
        initTableControls();
        setupFormListener();
        
    } catch (err) {
        console.error("Critical Init Error:", err);
    }
}

/**
 * [AR] جلب قائمة السيارات الفعالة
 * [EN] Fetch active vehicles list
 */
async function fetchCars() {
    const { data } = await _supabase.from('t01_cars').select('f01_id, f02_plate_no, f11_is_active');
    carsList = (data || []).filter(c => {
        const s = (c.f11_is_active || '').toLowerCase();
        return (s.includes('active') || s.includes('نشط')) && !s.includes('inactive');
    });
    fillOptions('f03_car_no', carsList, 'f02_plate_no', 'f02_plate_no', '-- السيارة --');
}

/**
 * [AR] جلب قائمة السائقين الفعالين
 * [EN] Fetch active drivers list
 */
async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status');
    driversList = (data || []).filter(d => {
        const s = (d.f06_status || '').toLowerCase();
        return (s.includes('active') || s.includes('نشط')) && !s.includes('inactive');
    });
    fillOptions('f04_driver_id', driversList, 'f01_id', 'f02_name', '-- السائق --');
}

/**
 * [AR] جلب قائمة المحصلين (الموظفين)
 * [EN] Fetch staff list for collectors
 */
async function fetchStaff() {
    const { data } = await _supabase.from('t11_staff').select('f01_id, f02_name');
    staffList = data || [];
    fillOptions('f08_collector_id', staffList, 'f01_id', 'f02_name', '-- المحصل --');
}

/**
 * [AR] جلب بيانات الأيام (المعرف والمبلغ) للمطابقة في الجدول
 * [EN] Fetch work days metadata (ID and amount) for table matching status
 */
async function fetchWorkDaysMetadata() {
    const { data } = await _supabase.from('t08_work_days').select('f01_id, f05_daily_amount');
    workDaysMetadata = data || [];
}

/**
 * [AR] جلب جميع سجلات الإيرادات
 * [EN] Fetch all revenue records
 */
async function fetchRevenuesData() {
    const { data, error } = await _supabase.from('t05_revenues')
        .select('*').order('f02_date', { ascending: false }).order('created_at', { ascending: false });
    if (!error) {
        allRevenues = data || [];
        // [AR] الحفاظ على الفلترة الحالية إن وجدت
        // [EN] Preserve current filtering if it exists
        const searchInput = document.getElementById('excelSearch');
        if (searchInput && searchInput.value) {
            excelFilter();
        } else {
            filteredRevenues = [...allRevenues];
            renderTable();
        }
    }
}

/**
 * [AR] رسم جدول الإيرادات في الصفحة
 * [EN] Rendering the revenue table
 */
function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    let html = `<table class="taxi-table"><thead><tr>
        <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ | Date ↕</th>
        <th onclick="sortData('f03_car_no')" style="cursor:pointer">السيارة | Car ↕</th>
        <th onclick="sortData('f04_driver_id')" style="cursor:pointer">السائق | Driver ↕</th>
        <th onclick="sortData('f05_category')" style="cursor:pointer">الفئة | Category ↕</th>
        <th onclick="sortData('f06_amount')" style="cursor:pointer">المبلغ | Amount ↕</th>
        <th onclick="sortData('f08_collector_id')" style="cursor:pointer">المحصل | Collector ↕</th>
        <th onclick="sortData('f10_work_day_link')" style="cursor:pointer">المطابقة | Match ↕</th>
        <th style="text-align:center">العمليات | Acts</th>
    </tr></thead><tbody>`;

    filteredRevenues.forEach(row => {
        const driverName = driversList.find(d => d.f01_id === row.f04_driver_id)?.f02_name || '---';
        const staffName = staffList.find(s => s.f01_id === row.f08_collector_id)?.f02_name || '---';
        const dayName = new Date(row.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });

        // [AR] معالجة مرجع المطابقة وحالتها (كامل / جزئي)
        // [EN] Process Match Reference and Status (Full / Partial)
        let matchRef = '<span style="color:#ccc;">❌ غير مطابق</span>';
        if (row.f10_work_day_link) {
            try {
                const links = JSON.parse(row.f10_work_day_link);
                if (Array.isArray(links) && links.length > 0) {
                    // حساب مجموع الأيام المختارة
                    const matchedTotal = links.reduce((sum, id) => {
                        const day = workDaysMetadata.find(d => d.f01_id === id);
                        return sum + (day ? parseFloat(day.f05_daily_amount || 0) : 0);
                    }, 0);

                    const isFull = parseFloat(row.f06_amount) >= matchedTotal;
                    const statusText = isFull ? 'يوم كامل' : 'يوم جزئي';
                    const badgeClass = isFull ? 'badge-paid' : 'badge-partial'; // Assuming badge-partial exists or using badge-status
                    
                    matchRef = `<span class="badge-status ${badgeClass}" style="padding:4px 10px;">
                        ${links.length} ${statusText}
                    </span>`;
                }
            } catch(e) {}
        }

        html += `<tr>
            <td style="font-weight:700;">
                <div style="font-size:0.75rem; color:var(--taxi-gold);">${dayName}</div>
                <div>${row.f02_date}</div>
            </td>
            <td>${window.formatJordanPlate(row.f03_car_no, true)}</td>
            <td>${driverName}</td>
            <td>${row.f05_category}</td>
            <td style="color:green; font-weight:bold">${row.f06_amount}</td>
            <td>${staffName}</td>
            <td style="text-align:center">${matchRef}</td>
            <td style="text-align:center">
                <div class="action-btns-group">
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

/**
 * [AR] تعديل سجل إيراد موجود
 * [EN] Edit an existing revenue record
 */
async function editRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    document.getElementById('f01_id').value = record.f01_id;
    document.getElementById('f02_date').value = record.f02_date;
    document.getElementById('f03_car_no').value = record.f03_car_no;
    
    let linkedIds = [];
    if (record.f10_work_day_link) {
        try { linkedIds = JSON.parse(record.f10_work_day_link); } catch(e) {}
    }

    // [AR] تحديث قائمة الأيام المكسورة لتشمل الأيام المرتبطة بهذا السجل تحديداً
    // [EN] Update due days checklist to include days linked to this record
    await updateWorkDayDues(record.f03_car_no, record.f01_id, linkedIds);

    document.getElementById('f04_driver_id').value = record.f04_driver_id;
    document.getElementById('f05_category').value = record.f05_category;
    
    const group = document.getElementById('workDayGroup');
    if (group) group.style.display = (record.f05_category === 'ضمان يومي') ? 'block' : 'none';
    
    document.getElementById('f06_amount').value = record.f06_amount;
    document.getElementById('f07_method').value = record.f07_method;
    document.getElementById('f08_collector_id').value = record.f08_collector_id || "";
    document.getElementById('f09_notes').value = record.f09_notes || "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * [AR] جلب بيانات محسنة للعرض أو الطباعة (استبدال المعرفات بأسماء)
 * [EN] Enhance data for display (replace UUIDs with names)
 */
async function getEnhancedData(record) {
    const data = { ...record };
    // NOTE: f03_car_no is left as plain text — showViewModal applies formatJordanPlate automatically
    data.f04_driver_id = driversList.find(d => d.f01_id === record.f04_driver_id)?.f02_name || record.f04_driver_id;
    data.f08_collector_id = staffList.find(s => s.f01_id === record.f08_collector_id)?.f02_name || record.f08_collector_id;

    if (record.f10_work_day_link) {
        try {
            const ids = JSON.parse(record.f10_work_day_link);
            const { data: days } = await _supabase.from('t08_work_days').select('f02_date').in('f01_id', ids);
            if (days) data.f10_work_day_link = days.map(d => d.f02_date).join(' , ');
        } catch (e) {}
    }
    return data;
}

async function viewRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;
    const viewData = await getEnhancedData(record);
    window.showViewModal(viewData, "تفاصيل الإيراد | Revenue Details");
}

/**
 * [AR] طباعة وصل قبض مالي احترافي
 * [EN] Printing a professional payment receipt
 */
async function printRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    const viewData = await getEnhancedData(record);
    const printArea = document.getElementById('printReceiptSection');
    if (!printArea) return;

    printArea.innerHTML = `
        <div class="v-stamp">مدفوع | PAID</div>
        <div class="v-header">
            <div class="v-logo" style="font-size:3.5rem;">🚖</div>
            <div class="v-title">
                <h2 style="font-size:2.2rem; font-weight:900; margin:0;">Smart Taxi</h2>
                <p style="font-size:1.1rem; font-weight:bold; margin:5px 0 0;">وصل قبض مالي رسمي</p>
            </div>
            <div class="v-meta">
                <p><strong>REF:</strong> ${record.f01_id.slice(0,8).toUpperCase()}</p>
                <p><strong>Date:</strong> ${record.f02_date}</p>
            </div>
        </div>
        <div class="v-body">
            <div class="v-row"><span class="v-lbl">وصلنا من السيد:</span><span class="v-val">${viewData.f04_driver_id}</span></div>
            <div class="v-row"><span class="v-lbl">رقم السيارة:</span><span class="v-val">${viewData.f03_car_no}</span></div>
            <div class="v-row"><span class="v-lbl">البيان:</span><span class="v-val">${record.f05_category} ${record.f10_work_day_link ? `(أيام: ${viewData.f10_work_day_link})` : ''}</span></div>
            <div class="v-row"><span class="v-lbl">ملاحظات:</span><span class="v-val">${record.f09_notes || '---'}</span></div>
            <div style="text-align: center; margin-top: 30px;"><div class="v-amount-box"><span>${record.f06_amount} JD</span></div></div>
        </div>
        <div class="v-footer">
            <div class="v-sig"><p>توقيع السائق</p><div class="v-line"></div></div>
            <div class="v-sig"><p>المحصل (${viewData.f08_collector_id})</p><div class="v-line"></div></div>
        </div>
    `;

    setTimeout(() => { window.print(); }, 250);
}

async function deleteRevenue(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذا السجل المالي؟", "danger", async () => {
        const { error } = await _supabase.from('t05_revenues').delete().eq('f01_id', id);
        if (!error) { showToast("تم الحذف بنجاح", "success"); fetchRevenuesData(); }
    });
}

/**
 * [AR] إعداد مستمعي الأحداث في النموذج
 * [EN] Setting up form event listeners
 */
function setupFormListener() {
    const form = document.getElementById('revenueForm');
    if (!form) return;
    form.addEventListener('submit', handleFormSubmit);
    
    // [AR] الربط التلقائي بين السيارة والسائق
    // [EN] Smart auto-select link between car and driver
    const carSel = document.getElementById('f03_car_no');
    if (carSel) {
        carSel.addEventListener('change', (e) => {
            if (window.smartAutoSelect) window.smartAutoSelect.onCarChange(e.target.value, 'f04_driver_id');
            updateWorkDayDues();
        });
    }

    const catSel = document.getElementById('f05_category');
    if (catSel) {
        catSel.addEventListener('change', (e) => {
            const group = document.getElementById('workDayGroup');
            const isDailyRent = e.target.value === 'ضمان يومي';
            if (group) group.style.display = isDailyRent ? 'block' : 'none';
            if (isDailyRent) updateWorkDayDues();
        });
    }
}

/**
 * [AR] جلب الأيام غير المسددة (المكسورة) للمطابقة المالية
 * [EN] Fetch due days (broken days) for financial matching
 */
let lastFetchedCar = ""; 
async function updateWorkDayDues(forceCarNo = null, editingRevenueId = null, editingLinkedIds = []) {
    const carNo = forceCarNo || document.getElementById('f03_car_no').value;
    const checklist = document.getElementById('work_day_checklist');

    if (!checklist || !carNo) {
        if(checklist) checklist.innerHTML = '<p class="placeholder-text">-- اختر السيارة أولاً --</p>';
        return;
    }

    if (carNo === lastFetchedCar && !editingRevenueId) return;
    lastFetchedCar = carNo;

    try {
        const { data: workDays } = await _supabase.from('t08_work_days').select('*')
            .eq('f03_car_no', carNo).eq('f06_is_off_day', false).order('f02_date', { ascending: false }).limit(50); 

        const { data: otherRevs } = await _supabase.from('t05_revenues').select('f01_id, f10_work_day_link')
            .eq('f03_car_no', carNo).not('f10_work_day_link', 'is', null);

        const paidByOthers = new Set();
        (otherRevs || []).forEach(r => {
            if (editingRevenueId && String(r.f01_id) === String(editingRevenueId)) return;
            try {
                const ids = JSON.parse(r.f10_work_day_link);
                if (Array.isArray(ids)) ids.forEach(id => paidByOthers.add(id));
            } catch(e) {}
        });

        const relevantDays = (workDays || []).filter(d => 
            (editingLinkedIds.includes(d.f01_id)) || !paidByOthers.has(d.f01_id)
        );

        if (relevantDays.length === 0) {
            checklist.innerHTML = '<p class="placeholder-text">✅ لا توجد أيام مكسورة.</p>';
            return;
        }

        let html = '';
        relevantDays.forEach(day => {
            const isChecked = editingLinkedIds.includes(day.f01_id) ? 'checked' : '';
            const dayName = new Date(day.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
            html += `
                <label class="checklist-item">
                    <input type="checkbox" value="${day.f01_id}" data-amount="${day.f05_daily_amount}" ${isChecked} onchange="calculateChecklistTotal()">
                    <span class="item-details">
                        <span style="font-size:0.75rem; color:var(--taxi-gold); display:block;">${dayName}</span>
                        <span>${day.f02_date} (${day.f05_daily_amount} JD)</span>
                    </span>
                </label>`;
        });
        checklist.innerHTML = html;
        calculateChecklistTotal();
    } catch (err) {
        checklist.innerHTML = '<p class="placeholder-text">❌ فشل تحميل البيانات.</p>';
    }
}

function calculateChecklistTotal() {
    const checklist = document.getElementById('work_day_checklist');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]:checked');
    let total = Array.from(checkboxes).reduce((s, cb) => s + parseFloat(cb.dataset.amount || 0), 0);

    const badge = document.getElementById('selectedTotal');
    if (badge) {
        badge.innerText = checkboxes.length > 0 ? `(المجموع: ${total} JD - تطبيق؟)` : '';
        badge.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
        badge.onclick = () => { document.getElementById('f06_amount').value = total; };
    }
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const checklist = document.getElementById('work_day_checklist');
        const selectedCheckboxes = Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked'));
        const selectedWorkDays = selectedCheckboxes.map(cb => cb.value);
        
        const matchedTotal = selectedCheckboxes.reduce((s, cb) => s + parseFloat(cb.dataset.amount || 0), 0);
        const matchingAmount = parseFloat(document.getElementById('f06_amount').value) || 0;

        // [AR] التحقق من أن المبلغ يغطي الأيام المختارة
        // [EN] Validate that the amount covers selected days
        if (selectedWorkDays.length > 0 && matchingAmount < matchedTotal) {
            showToast(`المبلغ (${matchingAmount}) أقل من مجموع الأيام المختارة (${matchedTotal})!`, "error");
            return;
        }

        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_id: document.getElementById('f04_driver_id').value || null,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: matchingAmount,
            f07_method: document.getElementById('f07_method').value,
            f08_collector_id: document.getElementById('f08_collector_id').value || null,
            f09_notes: document.getElementById('f09_notes').value || '',
            f10_work_day_link: selectedWorkDays.length ? JSON.stringify(selectedWorkDays) : null
        };

        // [AR] منع إزدواجية الإيرادات (نفس السيارة، نفس التاريخ، ونفس النوع)
        // [EN] Prevent duplicate revenues (same car, same date, same category)
        let dupQuery = _supabase.from('t05_revenues')
            .select('f01_id, created_at')
            .eq('f02_date', payload.f02_date)
            .eq('f03_car_no', payload.f03_car_no)
            .eq('f05_category', payload.f05_category);
            
        if (id) dupQuery = dupQuery.neq('f01_id', id);

        const { data: duplicates } = await dupQuery;
        
        if (duplicates && duplicates.length > 0) {
            const createdDate = new Date(duplicates[0].created_at).toLocaleString('ar-JO', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', second: '2-digit' 
            });
            window.showModal(
                "❌ إيراد مكرر | Duplicate Entry", 
                `يوجد إيراد مسجل مسبقاً لهذه السيارة <b>(${window.formatJordanPlate(payload.f03_car_no, true)})</b><br>
                لنفس التاريخ <b>(${payload.f02_date})</b><br>
                ومن نفس النوع <b>(${payload.f05_category})</b>.<br><br>
                <div style="background:#f8d7da; color:#721c24; padding:10px; border-radius:8px; font-size:0.9rem;">
                    تاريخ إدخال السجل السابق:<br><b dir="ltr">${createdDate}</b>
                </div>`, 
                "error"
            );
            return;
        }

        const res = id
            ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
            : await _supabase.from('t05_revenues').insert([payload]);

        if (!res.error) {
            const remaining = matchingAmount - matchedTotal;
            const msg = selectedWorkDays.length > 0 
                ? `تمت المطابقة بنجاح.<br>المبلغ المطبق: <b>${matchedTotal} JD</b><br>المبلغ المتبقي: <b>${remaining} JD</b>`
                : "تم حفظ الإيراد بنجاح ✅";
            
            window.showModal("نتيجة العملية", msg, "success");
            resetRevenueForm(); fetchRevenuesData();
        }
    });
}

async function resetRevenueForm() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = '';
    document.getElementById('f02_date').valueAsDate = new Date();
    lastFetchedCar = "";
}

function sortData(col) {
    if (currentSort.col === col) currentSort.asc = !currentSort.asc;
    else { currentSort.col = col; currentSort.asc = true; }
    filteredRevenues.sort((a, b) => {
        let vA = a[col] || ''; let vB = b[col] || '';
        if (!isNaN(vA) && !isNaN(vB)) { vA = parseFloat(vA); vB = parseFloat(vB); }
        return currentSort.asc ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });
    renderTable();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي التحصيلات: <span id="count">0</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="excelSearch" class="global-search-input" placeholder="بحث بالسيارة أو السائق..." onkeyup="excelFilter()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>`;
    }
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    filteredRevenues = allRevenues.filter(r => 
        Object.values(r).some(v => String(v).toLowerCase().includes(val))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredRevenues.length;
}