/* START OF FILE: expenses.js */
/**
 * File: expenses.js
 * Version: v1.3.0
 * Function: إدارة المصاريف التشغيلية
 */

let allExpenses = [];
let filteredExpenses = [];

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
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f01_id, f02_name').eq('f07_status', 'فعال | Active'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_id');
        const staffSelect = document.getElementById('f09_user_id');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML += carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driversRes.data && driverSelect) {
            driverSelect.innerHTML += driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML += staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
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
                    <th onclick="sortData('f02_date')">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')">السيارة | Plate ↕</th>
                    <th>النوع | Type</th>
                    <th onclick="sortData('f07_amount')">المبلغ | Amt ↕</th>
                    <th>المسؤول | Admin</th>
                    <th>السداد | Status</th>
                    <th>إجراءات | Acts</th>
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
                        <td>
                            <div class="action-btns-group">
                                <button onclick='showViewModal(${JSON.stringify(ex)}, "تفاصيل المصروف | Expense Info")' class="btn-action-sm btn-view">👁️</button>
                                <button onclick='editRecord(${ex.f01_id})' class="btn-action-sm btn-edit">✏️</button>
                                <button onclick="deleteRecord(${ex.f01_id})" class="btn-action-sm btn-delete">🗑️</button>
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
            f04_driver_id: parseInt(document.getElementById('f04_driver_id').value),
            f05_expense_type: document.getElementById('f05_expense_type').value,
            f06_seller: document.getElementById('f06_seller').value.trim(),
            f07_amount: parseFloat(document.getElementById('f07_amount').value),
            f08_ref_no: document.getElementById('f08_ref_no').value.trim(),
            f09_user_id: parseInt(document.getElementById('f09_user_id').value),
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
    document.getElementById('f09_user_id').value = ex.f09_user_id;
    document.getElementById('f10_status').value = ex.f10_status;
    document.getElementById('f11_notes').value = ex.f11_notes || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    showModal("تأكيد الحذف", "هل تريد حذف هذا السجل المالي؟", 'error', async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            loadData();
        }
    });
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
}

/* END OF FILE: expenses.js */
