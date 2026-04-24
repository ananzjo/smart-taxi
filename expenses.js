/* START OF FILE: expenses.js */
/**
 * File: expenses.js
 * Version: v1.4.0
 * Function: إدارة المصاريف التشغيلية
 */

let allExpenses = [];
let filteredExpenses = [];
let currentSort = { col: 'f02_date', asc: false };

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fillExpenseDropdowns();
    await loadData();
    initTableControls();
    setupFormListener();
}

async function fillExpenseDropdowns() {
    try {
        // 1. Metadata from Lookup Table
        if (typeof LookupEngine !== 'undefined') {
            await Promise.all([
                LookupEngine.fillSelect('expense_type', 'f05_expense_type', { placeholder: '-- فئة المصروف --' }),
                LookupEngine.fillSelect('financial_status', 'f10_status', { placeholder: '-- الحالة المالية --' })
            ]);
        }

        // 2. Relational data from primary tables
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no, f11_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_id');
        const staffSelect = document.getElementById('f09_staff_id');

        // تصفية السيارات النشطة بمرونة
        const activeCars = (carsRes.data || []).filter(c =>
            !c.f11_is_active || c.f11_is_active.includes('نشط') || c.f11_is_active.toLowerCase().includes('active')
        );

        // تصفية السائقين النشطين بمرونة
        const activeDrivers = (driversRes.data || []).filter(d =>
            !d.f06_status || d.f06_status.includes('نشط') || d.f06_status.toLowerCase().includes('active')
        );

        if (activeCars && carSelect) {
            carSelect.innerHTML = '<option value="">-- السيارة --</option>' + activeCars.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (activeDrivers && driverSelect) {
            driverSelect.innerHTML = '<option value="">-- السائق --</option>' + activeDrivers.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- الموظف المسؤول --</option>' + staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

async function loadData() {
    try {
        const { data, error } = await _supabase
            .from('t06_expenses')
            .select(`*, t02_drivers(f02_name), t11_staff(f02_name)`)
            .order('f02_date', { ascending: false });

        if (error) throw error;
        allExpenses = data || [];
        filteredExpenses = [...allExpenses];
        renderTable();
    } catch (err) {
        showToast("تعذر جلب البيانات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('expensesTableContainer');
    if (!container) return;

    if (filteredExpenses.length === 0) {
        container.innerHTML = '<div class="loading-state">🔧 لا توجد سجلات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')" style="cursor:pointer">السيارة | Plate ↕</th>
                    <th onclick="sortData('f05_expense_type')" style="cursor:pointer">النوع | Type ↕</th>
                    <th onclick="sortData('f07_amount')" style="cursor:pointer">المبلغ | Amt ↕</th>
                    <th onclick="sortData('f09_staff_id')" style="cursor:pointer">المسؤول | Admin ↕</th>
                    <th onclick="sortData('f10_status')" style="cursor:pointer">السداد | Status ↕</th>
                    <th class="no-print">إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredExpenses.map(ex => `
                    <tr>
                        <td>${ex.f02_date}</td>
                        <td>${window.formatJordanPlate(ex.f03_car_no, true)}</td>
                        <td>${ex.f05_expense_type}</td>
                        <td style="font-weight:900; color:var(--taxi-red)">${ex.f07_amount.toLocaleString()}</td>
                        <td>${ex.t11_staff?.f02_name || '-'}</td>
                        <td><span class="badge-status ${ex.f10_status === 'Paid|مدفوع' ? 'badge-paid' : 'badge-pending'}">${ex.f10_status}</span></td>
                        <td class="no-print">
                            <div class="action-btns-group">
                                <button onclick='showViewModal(${JSON.stringify(ex)}, "تفاصيل المصروف | Expense Info")' class="btn-action-sm btn-view">👁️</button>
                                <button onclick="editRecord('${ex.f01_id}')" class="btn-action-sm btn-edit">✏️</button>
                                <button onclick="printExpense('${ex.f01_id}')" class="btn-action-sm btn-print" title="طباعة سند صرف">🖨️</button>
                                <button onclick="deleteRecord('${ex.f01_id}')" class="btn-action-sm btn-delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    updateCounter();
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_id: document.getElementById('f04_driver_id').value || null,
            f05_expense_type: document.getElementById('f05_expense_type').value,
            f06_seller: document.getElementById('f06_seller').value.trim(),
            f07_amount: parseFloat(document.getElementById('f07_amount').value),
            f08_ref_no: document.getElementById('f08_ref_no').value.trim(),
            f09_staff_id: document.getElementById('f09_staff_id').value || null,
            f10_status: document.getElementById('f10_status').value,
            f11_notes: document.getElementById('f11_notes').value.trim()
        };

        try {
            const res = id
                ? await _supabase.from('t06_expenses').update(payload).eq('f01_id', id)
                : await _supabase.from('t06_expenses').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ المصروف بنجاح ✅", "success");
            resetForm();
            loadData();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

function editRecord(id) {
    const ex = allExpenses.find(x => x.f01_id == id);
    if (!ex) return;

    document.getElementById('f01_id').value = ex.f01_id;
    document.getElementById('f02_date').value = ex.f02_date;
    document.getElementById('f03_car_no').value = ex.f03_car_no;
    document.getElementById('f04_driver_id').value = ex.f04_driver_id;
    document.getElementById('f05_expense_type').value = ex.f05_expense_type;
    document.getElementById('f06_seller').value = ex.f06_seller || '';
    document.getElementById('f07_amount').value = ex.f07_amount;
    document.getElementById('f08_ref_no').value = ex.f08_ref_no || '';
    document.getElementById('f09_staff_id').value = ex.f09_staff_id;
    document.getElementById('f10_status').value = ex.f10_status;
    document.getElementById('f11_notes').value = ex.f11_notes || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    window.showModal("تأكيد الحذف", "هل تريد حذف هذا المصروف نهائياً؟", "warning", async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (error) {
            window.showToast("خطأ في الحذف: " + error.message, "error");
        } else {
            window.showToast("تم الحذف بنجاح", "success");
            loadData();
        }
    });
}


async function printExpense(id) {
    const record = allExpenses.find(e => e.f01_id === id);
    if (!record) return;

    const staffName = record.t11_staff?.f02_name || '---';
    const driverName = record.t02_drivers?.f02_name || '---';
    const printArea = document.getElementById('printVoucherSection');

    if (!printArea) return;

    printArea.innerHTML = `
        <div class="v-stamp">صُرف | DISBURSED</div>
        <div class="v-header" style="border-bottom: 3px solid #000; padding-bottom:15px; margin-bottom:25px;">
            <div class="v-logo" style="font-size:3.5rem;">🚖</div>
            <div class="v-title">
                <h2 style="font-size:2.2rem; font-weight:900; margin:0;">Smart Taxi Systems</h2>
                <p style="font-size:1.1rem; font-weight:bold; margin:5px 0 0; color:#333;">سند صرف رسمي | Official Disbursement Voucher</p>
            </div>
            <div class="v-meta" style="text-align:left; font-size:0.9rem; line-height:1.4;">
                <p><strong>الرقم | REF:</strong> ${record.f01_id.slice(0, 8).toUpperCase()}</p>
                <p><strong>التاريخ | Date:</strong> ${record.f02_date}</p>
                <p><strong>الوقت | Time:</strong> ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>

        <div class="v-body">
            <div class="v-row">
                <span class="v-lbl">يصرف للسيد:</span>
                <span class="v-val">${record.f06_seller || driverName}</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">مبلغ وقدره:</span>
                <span class="v-val">${record.f07_amount} JD</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">بخصوص:</span>
                <span class="v-val">${record.f05_expense_type} ${record.f03_car_no ? ` للسيارة (${record.f03_car_no})` : ''}</span>
            </div>
            <div class="v-row">
                <span class="v-lbl">ملاحظات:</span>
                <span class="v-val">${record.f11_notes || '-'}</span>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <div class="v-amount-box">
                    <span>${record.f07_amount} JD</span>
                </div>
            </div>
        </div>

        <div class="v-footer">
            <div class="v-sig">
                <p>توقيع المستلم</p>
                <div class="v-line"></div>
            </div>
            <div class="v-sig">
                <p>المحاسب المسؤول (${staffName})</p>
                <div class="v-line"></div>
            </div>
        </div>

        <div class="v-notice">
            * هذا السند يثبت عملية الصرف المالي من خزينة الشركة. يرجى التدقيق قبل التوقيع.
        </div>
    `;

    setTimeout(() => {
        window.print();
    }, 250);
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي السجلات: <span id="count">${allExpenses.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالسيارة، السائق، أو النوع..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredExpenses = allExpenses.filter(ex => Object.values(ex).some(v => String(v).toLowerCase().includes(term)));
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredExpenses.length;
}

function resetForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('f01_id').value = '';
    document.getElementById('f02_date').valueAsDate = new Date();
}

function setupFormListener() {
    document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);

    // Auto-select logic
    const carSel = document.getElementById('f03_car_no');
    const drvSel = document.getElementById('f04_driver_id');

    if (carSel) {
        carSel.addEventListener('change', (e) => {
            window.smartAutoSelect.onCarChange(e.target.value, 'f04_driver_id');
        });
    }

    if (drvSel) {
        drvSel.addEventListener('change', (e) => {
            window.smartAutoSelect.onDriverChange(e.target.value, 'f03_car_no');
        });
    }
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }

    filteredExpenses.sort((a, b) => {
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

/* END OF FILE: expenses.js */
