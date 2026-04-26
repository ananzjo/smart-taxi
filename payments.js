/* ==================================================================
 [payments.js] - إدارة المدفوعات وتسوية المصاريف (النسخة الكاملة)
 ================================================================== */

let allPayments = [];
let filteredPayments = [];
let currentSort = { col: 'f02_date', asc: false };

// [1] تهيئة الصفحة عند التحميل
async function initPaymentPage() {
    if (typeof LookupEngine !== 'undefined') {
        await LookupEngine.fillSelect('payment_methods', 'f07_method', { placeholder: '-- طريقة الدفع --' });
    }
    await fillCarDropdown();
    await loadPaymentsData();
    initTableControls();
    syncPayerField();
    
    // ربط اختيار السيارة بتحميل المصاريف
    const carSelect = document.getElementById('f05_car_no');
    if (carSelect) {
        carSelect.addEventListener('change', (e) => {
            loadPendingExpenses(e.target.value);
        });
    }

    // ربط الفورم بعملية الحفظ
    const form = document.getElementById('paymentForm');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (window.safeSubmit) {
                await window.safeSubmit(async () => {
                    await savePaymentData();
                });
            } else {
                await savePaymentData();
            }
        };
    }
}

// [2] جلب السيارات لتعبئة القائمة
async function fillCarDropdown() {
    const { data } = await _supabase.from('t01_cars').select('f02_plate_no');
    const carSelect = document.getElementById('f05_car_no');
    if (data && carSelect) {
        carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
            data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
    }
}

// [3] مطابقة ذكية: جلب مصاريف السيارة المختارة (غير المدفوعة)
async function loadPendingExpenses(carNo, editingLinkedIds = []) {
    const checklist = document.getElementById('expense_checklist');
    const group = document.getElementById('expenseGroup');

    if (!checklist) return;

    if (!carNo) {
        checklist.innerHTML = '<p class="placeholder-text">يرجى اختيار السيارة أولاً لعرض المصاريف...</p>';
        if (group) group.style.display = 'none';
        return;
    }

    if (group) group.style.display = 'block';

    try {
        const { data: allCarExpenses } = await _supabase.from('t06_expenses')
            .select('f01_id, f05_expense_type, f07_amount, f02_date, f10_status')
            .eq('f03_car_no', carNo)
            .order('f02_date', { ascending: false });

        let relevantExpenses = [];
        const linkedSet = new Set(editingLinkedIds || []);

        if (linkedSet.size > 0) {
            relevantExpenses = (allCarExpenses || []).filter(e => linkedSet.has(e.f01_id));
        } else {
            relevantExpenses = (allCarExpenses || []).filter(e => e.f10_status !== 'Paid|مدفوع');
        }

        if (relevantExpenses.length === 0) {
            checklist.innerHTML = '<p class="placeholder-text">✅ لا توجد مصاريف معلقة لهذه السيارة.</p>';
            return;
        }

        let html = '';
        relevantExpenses.forEach(exp => {
            const dayName = new Date(exp.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
            const isChecked = linkedSet.has(exp.f01_id) ? 'checked' : '';

            html += `
                <label class="checklist-item">
                    <input type="checkbox" value="${exp.f01_id}" data-amount="${exp.f07_amount}" ${isChecked} onchange="calculatePaymentChecklistTotal()">
                    <span class="item-details">
                        <span class="item-day-name" style="font-size:0.75rem; color:var(--taxi-gold); display:block;">${dayName}</span>
                        <span class="item-date">${exp.f02_date} | ${exp.f05_expense_type}</span>
                        <span class="item-amount">(${exp.f07_amount} د.أ)</span>
                    </span>
                </label>
            `;
        });
        checklist.innerHTML = html;
        calculatePaymentChecklistTotal();

    } catch (err) {
        checklist.innerHTML = '<p class="placeholder-text" style="color:red;">❌ فشل تحميل المصاريف.</p>';
    }
}

function calculatePaymentChecklistTotal() {
    const checklist = document.getElementById('expense_checklist');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]:checked');
    let total = 0;
    checkboxes.forEach(cb => {
        total += parseFloat(cb.dataset.amount || 0);
    });

    const badge = document.getElementById('selectedExpenseTotal');
    if (badge) {
        badge.innerText = checkboxes.length > 0 ? `(المجموع: ${total} د.أ - تطبيق؟)` : '';
        badge.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
        badge.onclick = () => {
            const amountInput = document.getElementById('f04_amount');
            if (amountInput) {
                amountInput.value = total;
            }
        };
    }
}

// [4] جلب وعرض البيانات
async function loadPaymentsData() {
    const { data, error } = await _supabase.from('t07_payments').select('*').order('f02_date', { ascending: false });
    if (data) {
        allPayments = data;
        filteredPayments = [...data];
        renderTable();
        initTableControls();
    }
}

function renderTable() {
    const data = filteredPayments;
    if(document.getElementById("recordCount")) document.getElementById("recordCount").innerText = data.length;
    let html = `<table><thead><tr>
        <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ ↕</th>
        <th onclick="sortData('f03_type')" style="cursor:pointer">النوع ↕</th>
        <th onclick="sortData('f05_car_no')" style="cursor:pointer">السيارة ↕</th>
        <th onclick="sortData('f04_amount')" style="cursor:pointer">المبلغ ↕</th>
        <th onclick="sortData('f09_recipient')" style="cursor:pointer">المستلم ↕</th>
        <th onclick="sortData('f06_expense_link')" style="cursor:pointer">مطابقة؟ ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    data.forEach(item => {
        const dayName = new Date(item.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
        html += `<tr>
            <td style="font-weight:700;">
                <div style="font-size:0.75rem; color:var(--taxi-gold);">${dayName}</div>
                <div>${item.f02_date}</div>
            </td>
            <td>${item.f03_type}</td>
            <td>${item.f05_car_no ? window.formatJordanPlate(item.f05_car_no, true) : '-'}</td>
            <td style="font-weight:bold;">${item.f04_amount}</td>
            <td>${item.f09_recipient || '-'}</td>
            <td>${item.f06_expense_link ? '✅' : '❌'}</td>
            <td class="no-print">
                <div class="action-btns-group">
                    <button class="btn-action-sm btn-view" onclick="viewPayment('${item.f01_id}')" title="عرض">👁️</button>
                    <button class="btn-action-sm btn-edit" onclick="editRecord('${item.f01_id}')" title="تعديل">✏️</button>
                    <button class="btn-action-sm btn-delete" onclick="deleteRecord('${item.f01_id}')" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('tableContainer').innerHTML = html;
}

async function editRecord(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;

    Object.keys(item).forEach(key => {
        const input = document.getElementById(key);
        if (input && key !== 'f06_expense_link') {
            input.value = Array.isArray(item[key]) ? item[key][0] : item[key];
        }
    });
    
    let selectedIds = [];
    const link = item.f06_expense_link;
    if (link) {
        if (Array.isArray(link)) {
            selectedIds = link;
        } else if (typeof link === 'string') {
            if (link.startsWith('[') || link.startsWith('{')) {
                try { selectedIds = JSON.parse(link); } catch(e){ selectedIds = [link]; }
            } else {
                selectedIds = [link];
            }
        }
    }

    if (item.f05_car_no) {
        await loadPendingExpenses(item.f05_car_no, selectedIds);
    } else {
        const group = document.getElementById('expenseGroup');
        if (group) group.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.viewPayment = function(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;
    const viewData = { ...item };
    window.showViewModal(viewData, "تفاصيل الدفعة | Payment Info");
};

function deleteRecord(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع!", "danger", async () => {
        const { data: oldPayment } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).maybeSingle();
        let linkedIds = [];
        const link = oldPayment ? oldPayment.f06_expense_link : null;
        if (link) {
            if (Array.isArray(link)) {
                linkedIds = link;
            } else if (typeof link === 'string') {
                if (link.startsWith('[') || link.startsWith('{')) {
                    try { linkedIds = JSON.parse(link); } catch(e){ linkedIds = [link]; }
                } else {
                    linkedIds = [link];
                }
            }
        }

        const { error } = await _supabase.from('t07_payments').delete().eq('f01_id', id);
        if (!error) {
            if (linkedIds.length > 0) {
                await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', linkedIds);
            }
            if (window.showToast) window.showToast("تم الحذف بنجاح", "success");
            loadPaymentsData();
        } else {
            window.showModal("خطأ", "فشل الحذف: " + error.message, "error");
        }
    });
}

// [7] الحفظ والتحديث
async function savePaymentData() {
    const idEl = document.getElementById('f01_id');
    const id = idEl ? idEl.value : "";
    
    const checklist = document.getElementById('expense_checklist');
    const checkboxes = checklist ? checklist.querySelectorAll('input[type="checkbox"]:checked') : [];
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    const totalDue = Array.from(checkboxes).reduce((sum, cb) => sum + parseFloat(cb.dataset.amount || 0), 0);
    
    const amountEl = document.getElementById('f04_amount');
    const paymentAmount = amountEl ? parseFloat(amountEl.value) : 0;

    if (!paymentAmount || paymentAmount <= 0) {
        return window.showModal('تنبيه', 'يرجى إدخال مبلغ صحيح', 'warning');
    }

    if (selectedIds.length > 0 && paymentAmount < totalDue) {
        return window.showModal('خطأ في العملية', `المبلغ المدفوع (${paymentAmount}) أقل من مجموع المستحقات (${totalDue}). يرجى تعديل المبلغ أو اختيار مستحقات أقل.`, 'error');
    }

    const payload = {
        f02_date: document.getElementById('f02_date').value,
        f03_type: document.getElementById('f03_type').value,
        f04_amount: paymentAmount,
        f05_car_no: document.getElementById('f05_car_no').value || null,
        f06_expense_link: selectedIds.length > 0 ? selectedIds : null,
        f07_method: document.getElementById('f07_method').value,
        f08_payer: document.getElementById('f08_payer').value || null,
        f09_recipient: document.getElementById('f09_recipient').value || null,
        f10_reference: document.getElementById('f10_reference') ? [document.getElementById('f10_reference').value] : null,
        f11_is_reconciled: selectedIds.length > 0,
        f13_notes: document.getElementById('f13_notes').value || null
    };

    let oldExpenseIds = [];
    
    try {
        if (id) {
            const { data: oldPayment } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).maybeSingle();
            const link = oldPayment ? oldPayment.f06_expense_link : null;
            if (link) {
                if (Array.isArray(link)) {
                    oldExpenseIds = link;
                } else if (typeof link === 'string') {
                    if (link.startsWith('[') || link.startsWith('{')) {
                        try { oldExpenseIds = JSON.parse(link); } catch(e){ oldExpenseIds = [link]; }
                    } else {
                        oldExpenseIds = [link];
                    }
                }
            }
            const updateRes = await _supabase.from('t07_payments').update(payload).eq('f01_id', id);
            if (updateRes.error) throw updateRes.error;
        } else {
            const insertRes = await _supabase.from('t07_payments').insert([payload]);
            if (insertRes.error) throw insertRes.error;
        }

        // Update expenses
        if (selectedIds.length > 0) {
            await _supabase.from('t06_expenses').update({ f10_status: 'Paid|مدفوع' }).in('f01_id', selectedIds);
        }

        const unlinkedIds = oldExpenseIds.filter(oldId => !selectedIds.includes(oldId));
        if (unlinkedIds.length > 0) {
            await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', unlinkedIds);
        }

        if (window.showToast) window.showToast("تم الحفظ بنجاح", "success");
        resetFieldsOnly();
        loadPaymentsData();
    } catch (err) {
        console.error("Save Error:", err);
        if (window.showToast) window.showToast("خطأ: " + (err.message || "فشل حفظ البيانات"), "error");
        throw err;
    }
}

function syncPayerField() {
    const user = sessionStorage.getItem('full_name_ar');
    if(user) {
        const payerEl = document.getElementById('f08_payer');
        if (payerEl) payerEl.value = user;
    }
}

function resetFieldsOnly() {
    const form = document.getElementById('paymentForm');
    if (form) form.reset();
    
    const idEl = document.getElementById('f01_id');
    if (idEl) idEl.value = "";
    
    const dateEl = document.getElementById('f02_date');
    if (dateEl) {
        dateEl.value = new Date().toISOString().split('T')[0];
    }
    
    const checklist = document.getElementById('expense_checklist');
    if (checklist) checklist.innerHTML = '<p class="placeholder-text">يرجى اختيار السيارة أولاً لعرض المصاريف...</p>';
    
    const group = document.getElementById('expenseGroup');
    if (group) group.style.display = 'none';

    syncPayerField();
}

function confirmReset() {
    window.showModal("تنبيه", "تفريغ الحقول؟", "info", () => resetFieldsOnly());
}

function excelFilter() {
    const searchInput = document.getElementById('excelSearch');
    const val = searchInput ? searchInput.value.toLowerCase() : '';
    filteredPayments = allPayments.filter(p => 
        (p.f03_type && p.f03_type.toLowerCase().includes(val)) || 
        (p.f05_car_no && p.f05_car_no.toLowerCase().includes(val)) ||
        (p.f09_recipient && p.f09_recipient.toLowerCase().includes(val))
    );
    renderTable();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي السجلات: <span id="count">${allPayments.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="excelSearch" class="global-search-input" placeholder="بحث سريع في المدفوعات..." onkeyup="excelFilter()">
                    <span class="search-icon" style="position:absolute; left:12px; top:50%; transform:translateY(-50%);">🔍</span>
                </div>
            </div>
        `;
    }
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredPayments.sort((a, b) => {
        let vA = a[col] || '';
        let vB = b[col] || '';
        if (vA < vB) return currentSort.asc ? -1 : 1;
        if (vA > vB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    renderTable();
}