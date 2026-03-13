/* ==================================================================
 [expenses.js] - إدارة المصروفات
 ================================================================== */

let allExpenses = [];
let sortDirections = {};

// [1] تعبئة القوائم المنسدلة
async function fillExpenseDropdowns() {
    try {
        // Cars can stay with supabase client (plate_no is string)
        const carsRes = await _supabase.from('t01_cars').select('f02_plate_no');

        // Fetch staff via raw fetch to preserve bigint precision as strings
        const staffUrl = `https://jmalxvhumgygqxqislut.supabase.co/rest/v1/t11_staff?select=f01_id,f02_name`;
        const staffFetch = await fetch(staffUrl, {
            headers: {
                'apikey': 'sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8',
                'Authorization': `Bearer sb_publishable_62y7dPN9SEc4U_8Lpu4ZNQ_H1PLDVv8`
            }
        });
        const staffText = await staffFetch.text();
        // Hack: wrap bigint IDs in quotes before parsing to keep them as strings
        const staffData = JSON.parse(staffText.replace(/"f01_id":\s*(-?\d+)/g, '"f01_id":"$1"'));

        const carSelect = document.getElementById('f03_car_no');
        const officerSelect = document.getElementById('f09_user_id');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">جاري التحميل...<\/option>';
            carsRes.data.forEach(c => {
                carSelect.innerHTML += `<option value="${c.f02_plate_no}">${c.f02_plate_no}<\/option>`;
            });
        }

        if (staffData && officerSelect) {
            officerSelect.innerHTML = '<option value="">اختر المسؤول<\/option>';
            staffData.forEach(s => {
                officerSelect.innerHTML += `<option value="${s.f01_id}">${s.f02_name}<\/option>`;
            });
        }
    } catch (err) {
        console.error('Dropdown Fill Error:', err);
        window.showToast("خطأ في تحميل القوائم - تفقد الكونسول", "error");
    }
}

/* === START OF FILE === */
/* File: expenses.js
Version: v1.0.4
Function: loadData()
Description: Fetches expenses data while joining with staff and drivers tables to retrieve names instead of just IDs.
*/
async function loadData() {
    // We join with t11_staff and t02_drivers to get the names (f02_name)
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`
            *,
            t11_staff ( f02_name ),
            t02_drivers ( f02_name )
        `)
        .order('f02_date', { ascending: false });

    if (error) {
        console.error('Expenses fetch error:', error);
        window.showToast(`خطأ: ${error.message}`, "error");
        return;
    }

    allExpenses = data || [];
    renderTable(data || []);
}
/* === END OF FILE === */

// [3] بناء الجدول — أعمدة t06_expenses
function renderTable(list) {
    const countEl = document.getElementById('pageRecordCount');
    if (countEl) countEl.innerText = list.length;

    const tableDiv = document.getElementById('tableContainer');
    let html = `<table>
         <thead>
             <tr class="column-search-row">
                 <th><input type="text" class="column-search-input" id="col0Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col1Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col2Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col3Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col4Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th></th>
             </tr>
             <tr>
                 <th onclick="sortTable(0)">التاريخ</th>
                 <th onclick="sortTable(1)">السيارة</th>
                 <th onclick="sortTable(2)">نوع المصروف</th>
                 <th onclick="sortTable(3)">المبلغ</th>
                 <th onclick="sortTable(4)">الحالة</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;

    list.forEach(item => {
        html += `<tr>
             <td>${item.f02_date || ''}</td>
             <td><b>${item.f03_car_no || ''}</b></td>
             <td>${item.f05_expense_type || ''}</td>
             <td style="color:var(--taxi-red); font-weight:bold;">${item.f07_amount || ''}</td>
             <td><span style="padding:3px 8px; border-radius:5px; font-size:0.8rem; background:${item.f10_status === 'Approved' ? '#d4edda' : '#fff3cd'}; color:${item.f10_status === 'Approved' ? '#155724' : '#856404'}">${item.f10_status || 'Pending'}</span></td>
             <td>
                 <div class="action-btns-group">
                     <button onclick='viewRecord(${JSON.stringify(item)})' class="btn-action-sm btn-view" title="عرض">👁️</button>
                     <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action-sm btn-edit" title="تعديل">✍️</button>
                     <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete" title="حذف">🗑️</button>
                 </div>
             </td>
         </tr>`;
    });
    if (tableDiv) tableDiv.innerHTML = html + "</tbody></table>";
}

async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    ['f02_date', 'f03_car_no', 'f05_expense_type', 'f07_amount', 'f06_seller', 'f08_ref_no', 'f09_user_id', 'f10_status', 'f11_notes'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
    });
    if (!payload.f03_car_no || !payload.f07_amount) {
        window.showToast('يرجى اختيار السيارة والمبلغ', 'warning');
        return;
    }
    console.log('--- Expense Save Payload ---', payload);

    const btn = document.querySelector('.btn-main');
    const originalText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }

    try {
        const { error } = id
            ? await _supabase.from('t06_expenses').update(payload).eq('f01_id', id)
            : await _supabase.from('t06_expenses').insert([payload]);

        if (error) {
            window.showToast(error.message, 'error');
        } else {
            window.showToast('تم حفظ السجل بنجاح ✅', 'success');
            resetFieldsOnly(); loadData();
        }
    } finally {
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
}

function sortTable(n) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    let rows = Array.from(tbody.rows);
    sortDirections[n] = !sortDirections[n];
    const direction = sortDirections[n] ? 1 : -1;
    if (window.updateSortVisuals) window.updateSortVisuals(n, sortDirections[n]);
    rows.sort((a, b) => {
        let aT = a.cells[n].innerText.trim();
        let bT = b.cells[n].innerText.trim();
        return (isNaN(aT) || isNaN(bT))
            ? aT.localeCompare(bT, 'ar', { numeric: true }) * direction
            : (parseFloat(aT) - parseFloat(bT)) * direction;
    });
    tbody.append(...rows);
}

function multiColumnSearch() {
    const globalVal = (document.getElementById('globalSearch')?.value || '').toLowerCase();
    const colFilters = [
        (document.getElementById('col0Filter')?.value || '').toLowerCase(),
        (document.getElementById('col1Filter')?.value || '').toLowerCase(),
        (document.getElementById('col2Filter')?.value || '').toLowerCase(),
        (document.getElementById('col3Filter')?.value || '').toLowerCase(),
        (document.getElementById('col4Filter')?.value || '').toLowerCase()
    ];
    const fields = ['f02_date', 'f03_car_no', 'f05_expense_type', 'f07_amount', 'f10_status'];

    const filtered = allExpenses.filter(item => {
        const matchesGlobal = globalVal === '' || Object.values(item).some(v => String(v).toLowerCase().includes(globalVal));
        if (!matchesGlobal) return false;
        return fields.every((f, i) => colFilters[i] === '' || String(item[f] || '').toLowerCase().includes(colFilters[i]));
    });

    const activeId = document.activeElement.id;
    renderTable(filtered);
    if (activeId) {
        const input = document.getElementById(activeId);
        if (input) { input.focus(); const v = input.value; input.value = ''; input.value = v; }
    }
}

/* === START OF FILE === */
/* File: cars-logic.js
Version: v1.0.3
Function: viewRecord(item)
Components: HTML Modal, Dynamic Badge, Relational Data Mapping
Input: item (Object containing t06_expenses data + joined tables)
Output: Detailed Arabic Modal UI
*/

function viewRecord(item) {
    // Determine status badge color
    const statusColor = item.f10_status === 'Approved' ? '#28a745' : (item.f10_status === 'Pending' ? '#ffc107' : '#dc3545');

    // Extracting names from joined objects (Supabase standard join format)
    const staffName = item.t11_staff ? item.t11_staff.f02_name : (item.f09_user_id || '-');
    const driverName = item.t02_drivers ? item.t02_drivers.f02_name : (item.f04_driver_id || '-');

    let msg = `
        <div style="text-align: right; font-family: inherit; direction: rtl; line-height: 1.6;">
            <div style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.1em; font-weight: bold; color: #333;">تفاصيل قيد المصروف #${item.f01_id || '-'}</span>
                <span style="background: ${statusColor}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold;">
                    ${item.f10_status || 'Pending'}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">التاريخ</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${item.f02_date || '-'}</p>
                </div>
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">رقم اللوحة (السيارة)</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold; color: #007bff;">${item.f03_car_no || '-'}</p>
                </div>
                
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">نوع المصروف</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${item.f05_expense_type || '-'}</p>
                </div>
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">المبلغ</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 1.2em;">${item.f07_amount || '0.00'} <small>د.أ</small></p>
                </div>
                
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">السائق</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${driverName}</p>
                </div>
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">المسؤول (الموظف)</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${staffName}</p>
                </div>

                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">البائع / الجهة</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${item.f06_seller || '-'}</p>
                </div>
                <div>
                    <p style="margin: 0; color: #777; font-size: 0.9em;">رقم المرجع</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold;">${item.f08_ref_no || '-'}</p>
                </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            
            <p style="margin: 0; color: #777; font-size: 0.9em;">ملاحظات إضافية</p>
            <div style="background: #fdfdfd; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-top: 5px; min-height: 40px;">
                ${item.f11_notes || '<i style="color: #ccc;">لا توجد ملاحظات مسجلة</i>'}
            </div>
        </div>
    `;

    window.showModal('عرض بيانات المصروف', msg, 'info');
}
/* === END OF FILE === */
function deleteRecord(id) {
    window.showModal('تأكيد', 'هل أنت متأكد من حذف السجل نهائياً؟', 'error', async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (error) { window.showToast('فشل الحذف', 'error'); }
        else { window.showToast('تم الحذف 🗑️', 'success'); loadData(); }
    });
}

function editRecord(item) {
    Object.keys(item).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = item[key];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFieldsOnly() {
    const form = document.getElementById('expenseForm');
    if (form) form.reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
}

function confirmReset() {
    window.showModal("تنبيه", "هل تريد تفريغ جميع الحقول؟", "info", () => resetFieldsOnly());
}