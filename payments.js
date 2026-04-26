/**
 * [AR] ملف إدارة المدفوعات وتسوية المصاريف
 * [EN] Payment and Expense Reconciliation Management Engine
 * Version: v3.0.0 [STABLE]
 */

let allPayments = [];
let filteredPayments = [];
let currentSort = { col: 'f02_date', asc: false };

/**
 * [AR] تهيئة صفحة المدفوعات - الوظيفة المركزية
 * [EN] Main initialization function for the Payments page
 */
async function initPaymentPage() {
    // [AR] تعبئة خيارات طرق الدفع
    // [EN] Populate payment method options
    if (typeof LookupEngine !== 'undefined') {
        await LookupEngine.fillSelect('payment_methods', 'f07_method', { placeholder: '-- طريقة الدفع --' });
    }

    await fillCarDropdown();
    await loadPaymentsData();
    initTableControls();
    syncPayerField();
    
    // [AR] ربط اختيار السيارة بتحميل المصاريف المعلقة للمطابقة
    // [EN] Link car selection with loading pending expenses for reconciliation
    const carSelect = document.getElementById('f05_car_no');
    if (carSelect) {
        carSelect.addEventListener('change', (e) => loadPendingExpenses(e.target.value));
    }

    const form = document.getElementById('paymentForm');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            safeSubmit(async () => await savePaymentData());
        };
    }
}

/**
 * [AR] جلب قائمة السيارات لتعبئة القائمة المنسدلة
 * [EN] Fetch cars list for dropdown population
 */
async function fillCarDropdown() {
    const { data } = await _supabase.from('t01_cars').select('f02_plate_no');
    fillOptions('f05_car_no', data || [], 'f02_plate_no', 'f02_plate_no', '-- اختر السيارة --');
}

/**
 * [AR] دالة مساعدة لتحويل معرفات المصاريف إلى مصفوفة
 * [EN] Helper to parse expense link IDs into an array
 */
function parseExpenseIds(link) {
    if (!link) return [];
    if (Array.isArray(link)) return link;
    if (typeof link === 'string') {
        try {
            const parsed = JSON.parse(link);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            return [link];
        }
    }
    return [];
}

/**
 * [AR] جلب المصاريف المعلقة لسيارة معينة للمطابقة
 * [EN] Load pending expenses for a specific car for matching
 */
async function loadPendingExpenses(carNo, editingLinkedIds = []) {
    const checklist = document.getElementById('expense_checklist');
    const group = document.getElementById('expenseGroup');

    if (!checklist) return;
    if (!carNo) {
        checklist.innerHTML = '<p class="placeholder-text">يرجى اختيار السيارة أولاً...</p>';
        if (group) group.style.display = 'none';
        return;
    }

    if (group) group.style.display = 'block';

    try {
        const { data: allCarExpenses } = await _supabase.from('t06_expenses')
            .select('f01_id, f05_expense_type, f07_amount, f02_date, f10_status')
            .eq('f03_car_no', carNo)
            .order('f02_date', { ascending: false });

        const linkedSet = new Set(editingLinkedIds || []);
        // [AR] عرض المصاريف غير المدفوعة أو تلك المرتبطة حالياً بهذا السجل (في حالة التعديل)
        // [EN] Show unpaid expenses or those currently linked to this record (for edit mode)
        const relevantExpenses = (allCarExpenses || []).filter(e => 
            linkedSet.has(e.f01_id) || (e.f10_status !== 'Paid|مدفوع' && e.f10_status !== 'مدفوع')
        );

        if (relevantExpenses.length === 0) {
            checklist.innerHTML = '<p class="placeholder-text">✅ لا توجد مصاريف معلقة.</p>';
            return;
        }

        let html = '';
        relevantExpenses.forEach(exp => {
            const isChecked = linkedSet.has(exp.f01_id) ? 'checked' : '';
            const dayName = new Date(exp.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
            html += `
                <label class="checklist-item">
                    <input type="checkbox" value="${exp.f01_id}" data-amount="${exp.f07_amount}" ${isChecked} onchange="calculatePaymentChecklistTotal()">
                    <span class="item-details">
                        <span style="font-size:0.75rem; color:var(--taxi-gold); display:block;">${dayName}</span>
                        <span>${exp.f02_date} | ${exp.f05_expense_type} (${exp.f07_amount} JD)</span>
                    </span>
                </label>`;
        });
        checklist.innerHTML = html;
        calculatePaymentChecklistTotal();

    } catch (err) {
        checklist.innerHTML = '<p class="placeholder-text" style="color:red;">❌ فشل التحميل.</p>';
    }
}

/**
 * [AR] حساب المجموع الإجمالي للمصاريف المختارة في القائمة
 * [EN] Calculate total amount for selected expenses
 */
function calculatePaymentChecklistTotal() {
    const checklist = document.getElementById('expense_checklist');
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]:checked');
    let total = Array.from(checkboxes).reduce((s, cb) => s + parseFloat(cb.dataset.amount || 0), 0);

    const badge = document.getElementById('selectedExpenseTotal');
    if (badge) {
        badge.innerText = checkboxes.length > 0 ? `(المجموع: ${total} JD - تطبيق؟)` : '';
        badge.style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
        badge.onclick = () => { document.getElementById('f04_amount').value = total; };
    }
}

/**
 * [AR] جلب وعرض بيانات المدفوعات
 * [EN] Fetch and display payments data
 */
async function loadPaymentsData() {
    const { data } = await _supabase.from('t07_payments').select('*').order('f02_date', { ascending: false });
    if (data) {
        allPayments = data;
        const searchInput = document.getElementById('excelSearch');
        if (searchInput && searchInput.value) {
            excelFilter();
        } else {
            filteredPayments = [...data];
            renderTable();
        }
    }
}

function renderTable() {
    let html = `<table><thead><tr>
        <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ | Date ↕</th>
        <th onclick="sortData('f03_type')" style="cursor:pointer">النوع | Type ↕</th>
        <th onclick="sortData('f05_car_no')" style="cursor:pointer">السيارة | Car ↕</th>
        <th onclick="sortData('f04_amount')" style="cursor:pointer">المبلغ | Amount ↕</th>
        <th onclick="sortData('f09_recipient')" style="cursor:pointer">المستلم | Recipient ↕</th>
        <th onclick="sortData('f06_expense_link')" style="cursor:pointer">مطابقة؟ | Settle? ↕</th>
        <th>إجراءات | Acts</th>
    </tr></thead><tbody>`;

    filteredPayments.forEach(item => {
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
            <td>
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
    updateCounter();
}

/**
 * [AR] تعديل سجل دفعة موجودة
 * [EN] Edit an existing payment record
 */
async function editRecord(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;

    Object.keys(item).forEach(key => {
        const input = document.getElementById(key);
        if (input && key !== 'f06_expense_link') {
            input.value = Array.isArray(item[key]) ? item[key][0] : item[key];
        }
    });
    
    const selectedIds = parseExpenseIds(item.f06_expense_link);
    if (item.f05_car_no) {
        await loadPendingExpenses(item.f05_car_no, selectedIds);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.viewPayment = function(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;
    window.showViewModal({ ...item }, "تفاصيل الدفعة | Payment Info");
};

/**
 * [AR] حذف سجل دفعة مع إعادة تعيين حالة المصاريف المرتبطة
 * [EN] Delete payment and reset linked expenses status
 */
function deleteRecord(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذه الدفعة؟ سيتم إعادة المصاريف المرتبطة إلى حالة (معلق).", "danger", async () => {
        const { data: oldPayment } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).maybeSingle();
        const linkedIds = parseExpenseIds(oldPayment?.f06_expense_link);

        const { error } = await _supabase.from('t07_payments').delete().eq('f01_id', id);
        if (!error) {
            if (linkedIds.length > 0) {
                await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', linkedIds);
            }
            showToast("تم الحذف بنجاح", "success"); loadPaymentsData();
        }
    });
}

/**
 * [AR] حفظ بيانات الدفعة وتحديث حالة المصاريف المسواة
 * [EN] Save payment data and update settled expenses status
 */
async function savePaymentData() {
    const id = document.getElementById('f01_id').value;
    const checklist = document.getElementById('expense_checklist');
    const selectedCheckboxes = checklist ? Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked')) : [];
    const selectedIds = selectedCheckboxes.map(cb => cb.value);
    
    const matchedTotal = selectedCheckboxes.reduce((s, cb) => s + parseFloat(cb.dataset.amount || 0), 0);
    const paymentAmount = parseFloat(document.getElementById('f04_amount').value) || 0;

    if (paymentAmount <= 0) return showToast("يرجى إدخال مبلغ صحيح", "warning");

    // [AR] التحقق من أن المبلغ يغطي المصاريف المختارة
    // [EN] Validate that the amount covers selected expenses
    if (selectedIds.length > 0 && paymentAmount < matchedTotal) {
        showToast(`المبلغ (${paymentAmount}) أقل من مجموع المصاريف المختارة (${matchedTotal})!`, "error");
        return;
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
        f11_is_reconciled: selectedIds.length > 0,
        f13_notes: document.getElementById('f13_notes').value || null
    };

    let oldExpenseIds = [];
    if (id) {
        const { data: old } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).maybeSingle();
        oldExpenseIds = parseExpenseIds(old?.f06_expense_link);
    }

    const res = id 
        ? await _supabase.from('t07_payments').update(payload).eq('f01_id', id)
        : await _supabase.from('t07_payments').insert([payload]);

    if (!res.error) {
        // [AR] تحديث حالة المصاريف المختارة إلى "مدفوع"
        // [EN] Update selected expenses status to "Paid"
        if (selectedIds.length > 0) {
            await _supabase.from('t06_expenses').update({ f10_status: 'Paid|مدفوع' }).in('f01_id', selectedIds);
        }
        // [AR] إعادة المصاريف التي تم فك ارتباطها إلى "معلق"
        // [EN] Revert unlinked expenses to "Pending"
        const unlinkedIds = oldExpenseIds.filter(oldId => !selectedIds.includes(oldId));
        if (unlinkedIds.length > 0) {
            await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', unlinkedIds);
        }

        const remaining = paymentAmount - matchedTotal;
        const msg = selectedIds.length > 0 
            ? `تمت التسوية بنجاح.<br>المبلغ المطبق: <b>${matchedTotal} JD</b><br>المبلغ المتبقي: <b>${remaining} JD</b>`
            : "تم حفظ الدفعة بنجاح ✅";
        
        window.showModal("نتيجة التسوية", msg, "success");
        resetFieldsOnly(); loadPaymentsData();
    }
}

function syncPayerField() {
    const user = sessionStorage.getItem('full_name_ar');
    if(user && document.getElementById('f08_payer')) document.getElementById('f08_payer').value = user;
}

function resetFieldsOnly() {
    const form = document.getElementById('paymentForm');
    if (form) form.reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').value = new Date().toISOString().split('T')[0];
    const checklist = document.getElementById('expense_checklist');
    if (checklist) checklist.innerHTML = '<p class="placeholder-text">يرجى اختيار السيارة أولاً...</p>';
    syncPayerField();
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    filteredPayments = allPayments.filter(p => 
        Object.values(p).some(v => String(v).toLowerCase().includes(val))
    );
    renderTable();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي السجلات: <span id="count">0</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="excelSearch" class="global-search-input" placeholder="بحث سريع..." onkeyup="excelFilter()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>`;
    }
}

function sortData(col) {
    if (currentSort.col === col) currentSort.asc = !currentSort.asc;
    else { currentSort.col = col; currentSort.asc = true; }
    filteredPayments.sort((a, b) => {
        let vA = a[col] || ''; let vB = b[col] || '';
        return currentSort.asc ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredPayments.length;
}