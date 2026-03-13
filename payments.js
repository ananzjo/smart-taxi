/* ==================================================================
 [payments.js] - إدارة المدفوعات (v1.1.0)
 ================================================================== */

let allPayments = [];
let sortDirections = {};

// [1] تعبئة القوائم المنسدلة
async function fillPaymentDropdowns() {
    try {
        const { data } = await _supabase.from('t01_cars').select('f02_plate_no');
        const carSelect = document.getElementById('f05_car_no');
        if (data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختياري --</option>' +
                data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

// [2] جلب البيانات من t07_payments
async function loadData() {
    const { data, error } = await _supabase
        .from('t07_payments')
        .select('*')
        .order('f02_date', { ascending: false });

    if (error) {
        console.error('Payments fetch error:', error);
        window.showToast("تعذر جلب البيانات", "error");
        return;
    }
    allPayments = data || [];
    renderTable(data || []);
}

// [3] بناء الجدول — تصفية فوق العناوين
function renderTable(list) {
    const countEl = document.getElementById('pageRecordCount');
    if (countEl) countEl.innerText = list.length;

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
                 <th onclick="sortTable(1)">النوع</th>
                 <th onclick="sortTable(2)">المستلم</th>
                 <th onclick="sortTable(3)">المبلغ</th>
                 <th onclick="sortTable(4)">السيارة</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;

    list.forEach(item => {
        html += `<tr>
             <td>${item.f02_date || ''}</td>
             <td>${item.f03_type || ''}</td>
             <td><b>${item.f09_recipient || ''}</b></td>
             <td style="color:var(--taxi-red); font-weight:bold;">${item.f04_amount || ''}</td>
             <td>${item.f05_car_no || '-'}</td>
             <td>
                 <div class="action-btns-group">
                     <button onclick='viewRecord(${JSON.stringify(item)})' class="btn-action-sm btn-view" title="عرض">👁️</button>
                     <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action-sm btn-edit" title="تعديل">✍️</button>
                     <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete" title="حذف">🗑️</button>
                 </div>
             </td>
         </tr>`;
    });

    const container = document.getElementById('tableContainer');
    if (container) container.innerHTML = html + "</tbody></table>";
}

// [4] حفظ البيانات
async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    ['f02_date', 'f03_type', 'f04_amount', 'f05_car_no', 'f07_method', 'f08_payer', 'f09_recipient', 'f10_reference', 'f13_notes']
        .forEach(fid => {
            const el = document.getElementById(fid);
            if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
        });

    if (!payload.f02_date || !payload.f04_amount || !payload.f09_recipient) {
        window.showToast('يرجى إكمال البيانات الأساسية (التاريخ، المبلغ، المستلم)', 'warning');
        return;
    }

    const btn = document.querySelector('.btn-main');
    const originalText = btn?.innerHTML;
    if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }

    try {
        const { error } = id
            ? await _supabase.from('t07_payments').update(payload).eq('f01_id', id)
            : await _supabase.from('t07_payments').insert([payload]);

        if (error) {
            window.showToast(error.message, 'error');
        } else {
            window.showToast('تم حفظ العملية بنجاح ✅', 'success');
            resetFieldsOnly(); loadData();
        }
    } finally {
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
}

// [5] البحث المتقدم
function multiColumnSearch() {
    const globalVal = (document.getElementById('globalSearch')?.value || '').toLowerCase();
    const colFilters = [
        (document.getElementById('col0Filter')?.value || '').toLowerCase(),
        (document.getElementById('col1Filter')?.value || '').toLowerCase(),
        (document.getElementById('col2Filter')?.value || '').toLowerCase(),
        (document.getElementById('col3Filter')?.value || '').toLowerCase(),
        (document.getElementById('col4Filter')?.value || '').toLowerCase()
    ];
    const fields = ['f02_date', 'f03_type', 'f09_recipient', 'f04_amount', 'f05_car_no'];

    const filtered = allPayments.filter(item => {
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

// [6] دوال مساعدة
function resetFieldsOnly() {
    document.getElementById('f01_id').value = '';
    document.getElementById('paymentForm').reset();
    document.getElementById('f02_date').valueAsDate = new Date();
}

function confirmReset() {
    window.showModal('تنبيه', 'هل تريد إفراغ جميع الحقول؟', 'warning', () => { resetFieldsOnly(); });
}


function viewRecord(item) {
    let msg = `
         <div style="text-align:right; font-family:inherit;">
             <p><b>اسم المالك:</b> ${item.f02_owner_name || '-'}</p>
             <p><b>رقم الهوية:</b> ${item.f03_national_id || '-'}</p>
             <p><b>رقم التواصل:</b> ${item.f04_contact_number || '-'}</p>
             <p><b>العنوان:</b> ${item.f05_address || '-'}</p>
             <p><b>ملاحظات:</b> ${item.f06_notes || '-'}</p>
         </div>
     `;
    window.showModal('تفاصيل المالك', msg, 'info');
}
function deleteRecord(id) {
    window.showModal('تأكيد', 'هل أنت متأكد من حذف هذه العملية؟', 'error', async () => {
        const { error } = await _supabase.from('t07_payments').delete().eq('f01_id', id);
        if (error) { window.showToast('فشل الحذف', 'error'); }
        else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
    });
}

function editRecord(item) {
    document.getElementById('f01_id').value = item.f01_id;
    ['f02_date', 'f03_type', 'f04_amount', 'f05_car_no', 'f07_method', 'f08_payer', 'f09_recipient', 'f10_reference', 'f13_notes']
        .forEach(fid => {
            const el = document.getElementById(fid);
            if (el) el.value = item[fid] || '';
        });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.showToast('تم تحميل البيانات للتعديل', 'info');
}

function viewRecord(item) {
    let msg = `
         <div style="text-align:right; font-family:inherit;">
             <p><b>التاريخ:</b> ${item.f02_date || '-'}</p>
             <p><b>النوع:</b> ${item.f03_type || '-'}</p>
             <p><b>المبلغ:</b> ${item.f04_amount || '-'}</p>
             <p><b>السيارة:</b> ${item.f05_car_no || '-'}</p>
             <p><b>المستلم:</b> ${item.f09_recipient || '-'}</p>
             <p><b>الدافع:</b> ${item.f08_payer || '-'}</p>
             <p><b>المرجع:</b> ${item.f10_reference || '-'}</p>
             <p><b>ملاحظات:</b> ${item.f13_notes || '-'}</p>
         </div>
     `;
    window.showModal('تفاصيل المدفوعات', msg, 'info');
}

function sortTable(n) {
    const tbody = document.querySelector("table tbody");
    const rows = Array.from(tbody.rows);
    const isAsc = sortDirections[n] !== true;

    rows.sort((a, b) => {
        let x = a.cells[n].innerText.toLowerCase();
        let y = b.cells[n].innerText.toLowerCase();
        if (!isNaN(x) && !isNaN(y)) { x = parseFloat(x); y = parseFloat(y); }
        return isAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });

    sortDirections[n] = isAsc;
    rows.forEach(row => tbody.appendChild(row));

    // تحديث أيقونات الترتيب في global-config.js
    if (window.updateSortVisuals) window.updateSortVisuals(n, isAsc);
}
/* === END OF FILE === */