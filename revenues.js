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
    const { data, error } = await _supabase.from('t05_revenues').select('*').order('f02_date', { ascending: false }).order('created_at', { ascending: false });
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
        const dayName = new Date(row.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });

        html += `
            <tr>
                <td style="font-weight:700;">
                    <div style="font-size:0.75rem; color:var(--taxi-gold);">${dayName}</div>
                    <div>${row.f02_date}</div>
                </td>
                <td>${window.formatJordanPlate(row.f03_car_no, true)}</td>
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

async function editRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    document.getElementById('f01_id').value = record.f01_id;
    document.getElementById('f02_date').value = record.f02_date;
    document.getElementById('f03_car_no').value = record.f03_car_no;
    
    // Parse linked IDs
    let linkedIds = [];
    if (record.f10_work_day_link) {
        try { linkedIds = JSON.parse(record.f10_work_day_link); } catch(e) {}
    }

    // Trigger checklist update and wait for it
    await updateWorkDayDues(record.f03_car_no, record.f01_id, linkedIds);

    document.getElementById('f04_driver_id').value = record.f04_driver_id;
    document.getElementById('f05_category').value = record.f05_category;
    
    // Show/Hide matching section based on category
    const group = document.getElementById('workDayGroup');
    if (group) {
        group.style.display = (record.f05_category === 'ضمان يومي') ? 'block' : 'none';
    }
    document.getElementById('f06_amount').value = record.f06_amount;
    document.getElementById('f07_method').value = record.f07_method;
    document.getElementById('f08_collector_id').value = record.f08_collector_id || "";
    document.getElementById('f09_notes').value = record.f09_notes || "";

    // After checklist is updated, check the linked days
    if (record.f10_work_day_link) {
        try {
            const ids = JSON.parse(record.f10_work_day_link);
            const workDayChecklist = document.getElementById('work_day_checklist');
            if (workDayChecklist) {
                workDayChecklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = ids.includes(cb.value);
                });
                calculateChecklistTotal();
            }
        } catch (e) { }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}



/**
 * دالة مساعدة لتجميل البيانات قبل العرض أو الطباعة
 * تحول الـ UUIDs إلى أسماء وتواريخ
 */
async function getEnhancedData(record) {
    const data = { ...record };
    data.f04_driver_id = driversList.find(d => d.f01_id === record.f04_driver_id)?.f02_name || record.f04_driver_id || '---';
    data.f08_collector_id = staffList.find(s => s.f01_id === record.f08_collector_id)?.f02_name || record.f08_collector_id || '---';

    if (record.f10_work_day_link) {
        try {
            const ids = JSON.parse(record.f10_work_day_link);
            if (Array.isArray(ids) && ids.length > 0) {
                const { data: days } = await _supabase.from('t08_work_days').select('f02_date').in('f01_id', ids);
                if (days && days.length > 0) {
                    data.f10_work_day_link = days.map(d => d.f02_date).join(' , ');
                }
            }
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

async function printRevenue(id) {
    const record = allRevenues.find(r => r.f01_id === id);
    if (!record) return;

    const viewData = await getEnhancedData(record);
    const driverName = viewData.f04_driver_id;
    const staffName = viewData.f08_collector_id;
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
                <span class="v-val">
                    ${record.f05_category} 
                    ${record.f10_work_day_link ? ` (أيام: ${viewData.f10_work_day_link})` : ''}
                    ${record.f09_notes ? ` - ${record.f09_notes}` : ''}
                </span>
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
 * جلب سجلات الضمان المتاحة لمطابقتها مع الإيراد وتحويلها لقائمة خيارات (Checklist)
 */
let lastFetchedCar = ""; 
async function updateWorkDayDues(forceCarNo = null, editingRevenueId = null, editingLinkedIds = []) {
    const carNo = forceCarNo || document.getElementById('f03_car_no').value;
    const checklist = document.getElementById('work_day_checklist');

    if (!checklist) return;
    if (!carNo) {
        checklist.innerHTML = '<p class="placeholder-text">-- اختر السيارة أولاً لعرض الأيام المكسورة --</p>';
        lastFetchedCar = "";
        return;
    }

    // Skip if already fetched same car, unless we are forcing an update (like in Edit mode)
    if (carNo === lastFetchedCar && !editingRevenueId) return;
    lastFetchedCar = carNo;

    try {
        // 1. Fetch recent work days for this car
        const { data: workDays, error: wErr } = await _supabase
            .from('t08_work_days')
            .select('*')
            .eq('f03_car_no', carNo)
            .eq('f06_is_off_day', false)
            .order('f02_date', { ascending: false })
            .limit(50); 

        if (wErr) throw wErr;

        // 2. Fetch all other revenues to identify which days are already paid
        const { data: otherRevs } = await _supabase
            .from('t05_revenues')
            .select('f01_id, f10_work_day_link')
            .eq('f03_car_no', carNo)
            .not('f10_work_day_link', 'is', null);

        const paidByOthers = new Set();
        (otherRevs || []).forEach(r => {
            // Very important: Skip the current record being edited
            if (editingRevenueId && String(r.f01_id) === String(editingRevenueId)) return;

            try {
                const linkedIds = JSON.parse(r.f10_work_day_link);
                if (Array.isArray(linkedIds)) {
                    linkedIds.forEach(id => paidByOthers.add(id));
                }
            } catch(e) {}
        });

        // 3. Filter the list
        let relevantDays = [];
        if (editingLinkedIds && editingLinkedIds.length > 0) {
            // IF ALREADY MATCHED: Show ONLY the days linked to this record
            relevantDays = (workDays || []).filter(d => editingLinkedIds.includes(d.f01_id));
        } else {
            // IF NOT MATCHED: Show ONLY days that are NOT paid by others
            relevantDays = (workDays || []).filter(d => !paidByOthers.has(d.f01_id));
        }

        if (relevantDays.length === 0) {
            checklist.innerHTML = '<p class="placeholder-text">✅ لا توجد أيام مكسورة حالياً.</p>';
            return;
        }

        let html = '';
        relevantDays.forEach(day => {
            const dayName = new Date(day.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
            
            // Check if this day is linked to the current edit record
            const isChecked = editingLinkedIds.includes(day.f01_id) ? 'checked' : '';

            html += `
                <label class="checklist-item">
                    <input type="checkbox" value="${day.f01_id}" data-amount="${day.f05_daily_amount}" ${isChecked} onchange="calculateChecklistTotal()">
                    <span class="item-details">
                        <span class="item-day-name" style="font-size:0.75rem; color:var(--taxi-gold); display:block;">${dayName}</span>
                        <span class="item-date">${day.f02_date}</span>
                        <span class="item-amount">(${day.f05_daily_amount} د.أ)</span>
                    </span>
                </label>
            `;
        });
        checklist.innerHTML = html;
        calculateChecklistTotal();

    } catch (err) {
        console.error("Error fetching work days:", err);
        checklist.innerHTML = '<p class="placeholder-text" style="color:red;">❌ فشل تحميل البيانات.</p>';
    }
}

/**
 * حساب المجموع من القائمة المختارة
 */
function calculateChecklistTotal() {
    const checklist = document.getElementById('work_day_checklist');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]:checked');
    let total = 0;
    checkboxes.forEach(cb => {
        total += parseFloat(cb.dataset.amount || 0);
    });

    const badge = document.getElementById('selectedTotal');
    if (badge) {
        badge.innerText = checkboxes.length > 0 ? `(المجموع: ${total} د.أ - تطبيق؟)` : '';
        badge.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
        badge.onclick = () => {
            const amountInput = document.getElementById('f06_amount');
            if (amountInput) {
                amountInput.value = total;
                if (window.showToast) window.showToast("تم تطبيق المجموع", "info");
            }
        };
    }

    const amountInput = document.getElementById('f06_amount');
    if (amountInput && checkboxes.length > 0) {
        const currentVal = parseFloat(amountInput.value) || 0;
        if (currentVal === 0) {
            amountInput.value = total;
        }
    }
}

async function resetRevenueForm() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = '';
    const dateInput = document.getElementById('f02_date');
    if (dateInput) dateInput.valueAsDate = new Date();
    const badge = document.getElementById('selectedTotal');
    if (badge) badge.innerText = '';
    lastFetchedCar = ""; // Reset tracking
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        
        // جلب المعرفات المختارة من الـ Checklist
        const checklist = document.getElementById('work_day_checklist');
        const selectedWorkDays = Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked'))
                                    .map(cb => cb.value);

        // Validation: ensure revenue amount covers selected due amounts
        const revenueAmt = parseFloat(document.getElementById('f06_amount').value) || 0;
        if (selectedWorkDays.length) {
            let totalDue = 0;
            checklist.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                totalDue += parseFloat(cb.dataset.amount || 0);
            });
            
            if (revenueAmt < totalDue) {
                return window.showModal('خطأ في العملية', `المبلغ المدفوع (${revenueAmt}) أقل من مجموع المستحقات (${totalDue}). يرجى اختيار أيام أقل أو زيادة المبلغ.`, 'error');
            }
        }
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_id: document.getElementById('f04_driver_id').value || null,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: revenueAmt,
            f07_method: document.getElementById('f07_method').value,
            f08_collector_id: document.getElementById('f08_collector_id').value || null,
            f09_notes: document.getElementById('f09_notes').value || '',
            f10_work_day_link: selectedWorkDays.length ? JSON.stringify(selectedWorkDays) : null
        };
        try {
            const res = id
                ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
                : await _supabase.from('t05_revenues').insert([payload]);
            if (res.error) throw res.error;
            window.showToast("تم حفظ الإيراد بنجاح ✅", "success");
            resetRevenueForm();
            fetchRevenuesData();
        } catch (err) {
            console.error("Revenue Save Error:", err);
            window.showToast("حدث خطأ أثناء الحفظ: " + (err.message || ''), "error");
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