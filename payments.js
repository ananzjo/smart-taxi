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
    syncPayerField();
    
    // ربط اختيار السيارة بتحميل المصاريف والاختيار التلقائي
    const carSelect = document.getElementById('f05_car_no');
    if (carSelect) {
        carSelect.addEventListener('change', (e) => {
            loadPendingExpenses(e.target.value);
            // Although payments doesn't have a direct driver field, 
            // the user might want a recipient or other field auto-filled.
            // For now, let's keep it to matching expenses.
        });
    }

    // ربط الفورم بعملية الحفظ
    const form = document.getElementById('paymentForm');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            safeSubmit(async () => {
                await savePaymentData();
            });
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
async function loadPendingExpenses(carNo, selectedIds = []) {
    const expenseSelect = document.getElementById('f06_expense_link');
    if (expenseSelect) {
        expenseSelect.innerHTML = '<option value="">-- اختر مصروف للمطابقة --</option>';
        expenseSelect.multiple = true;
    }
    if (!carNo) return;

    // جلب المصاريف المرتبطة بالسيارة من جدول t06
    const { data } = await _supabase.from('t06_expenses')
      .select('f01_id, f05_expense_type, f07_amount, f02_date, f10_status')
      .eq('f03_car_no', carNo);

    if (data && expenseSelect) {
        // فلترة: إظهار المصاريف غير المدفوعة فقط، أو المصاريف المحددة مسبقاً في هذه الدفعة
        const filteredData = data.filter(e => e.f10_status !== 'Paid|مدفوع' || selectedIds.includes(e.f01_id));
        
        expenseSelect.innerHTML += filteredData.map(e => 
            `<option value="${e.f01_id}" data-amount="${e.f07_amount}">${e.f02_date} | ${e.f05_expense_type} (${e.f07_amount} د.أ)</option>`
        ).join('');
    }
}

// [4] جلب وعرض البيانات
async function loadPaymentsData() {
    const { data, error } = await _supabase.from('t07_payments').select('*').order('f02_date', { ascending: false });
    if (data) {
        allPayments = data;
        filteredPayments = [...data];
        renderTable();
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
        html += `<tr>
            <td>${item.f02_date}</td>
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

function editRecord(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;

    // تعبئة كل الحقول التي تبدأ بـ f وتطابق أسماء الأعمدة
    Object.keys(item).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = item[key];
    });
    
    // إذا كانت السيارة مختارة، يجب تحميل قائمة المصاريف المرتبطة بها
    if(item.f05_car_no) {
        let selectedIds = [];
        if (item.f06_expense_link) {
            try { selectedIds = JSON.parse(item.f06_expense_link); } catch(e){}
        }
        loadPendingExpenses(item.f05_car_no, selectedIds).then(() => {
            const expenseSelect = document.getElementById('f06_expense_link');
            if (expenseSelect) {
                Array.from(expenseSelect.options).forEach(opt => {
                    if (selectedIds.includes(opt.value)) opt.selected = true;
                });
            }
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.viewPayment = function(id) {
    const item = allPayments.find(p => p.f01_id === id);
    if (!item) return;
    const viewData = { ...item };
    // Expand expense links cleanly if needed, or just let them display raw. 
    window.showViewModal(viewData, "تفاصيل الدفعة | Payment Info");
};

// [6] دالة الحذف (باستخدام المودال المخصص)
function deleteRecord(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع!", "danger", async () => {
        // Fetch the payment to see linked expenses before deleting
        const { data: oldPayment } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).single();
        let linkedIds = [];
        if (oldPayment && oldPayment.f06_expense_link) {
            try { linkedIds = JSON.parse(oldPayment.f06_expense_link); } catch(e){}
        }

        const { error } = await _supabase.from('t07_payments').delete().eq('f01_id', id);
        if (!error) {
            // Revert linked expenses to Pending
            if (linkedIds.length > 0) {
                await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', linkedIds);
            }
            window.showModal("نجاح", "تم الحذف بنجاح", "success");
            loadPaymentsData();
        } else {
            window.showModal("خطأ", "فشل الحذف: " + error.message, "error");
        }
    });
}

// [7] الحفظ والتحديث
async function savePaymentData() {
    const id = document.getElementById('f01_id').value;
    const isReconciled = document.getElementById('f06_expense_link').value !== "";
    
    const expenseSelect = document.getElementById('f06_expense_link');
    const selectedOptions = Array.from(expenseSelect.selectedOptions).filter(o => o.value !== "");
    const selectedIds = selectedOptions.map(o => o.value);
    const totalDue = selectedOptions.reduce((sum, o) => sum + parseFloat(o.dataset.amount || 0), 0);
    const paymentAmount = parseFloat(document.getElementById('f04_amount').value);
    if (selectedIds.length > 0 && paymentAmount < totalDue) {
        return window.showModal('خطأ في العملية', `المبلغ المدفوع (${paymentAmount}) أقل من مجموع المستحقات (${totalDue}). يرجى تعديل المبلغ أو اختيار مستحقات أقل.`, 'error');
    }
    const payload = {
        f02_date: document.getElementById('f02_date').value,
        f03_type: document.getElementById('f03_type').value,
        f04_amount: paymentAmount,
        f05_car_no: document.getElementById('f05_car_no').value || null,
        f06_expense_link: selectedIds.length ? JSON.stringify(selectedIds) : null,
        f07_method: document.getElementById('f07_method').value,
        f08_payer: document.getElementById('f08_payer').value || null,
        f09_recipient: document.getElementById('f09_recipient').value || null,
        f10_reference: document.getElementById('f10_reference') ? document.getElementById('f10_reference').value : null,
        f11_is_reconciled: selectedIds.length > 0,
        f13_notes: document.getElementById('f13_notes').value || null
    };

    let oldExpenseIds = [];
    let res;
    if (id) {
        // Fetch old payment record to see if we unlinked any expenses
        const { data: oldPayment } = await _supabase.from('t07_payments').select('f06_expense_link').eq('f01_id', id).single();
        if (oldPayment && oldPayment.f06_expense_link) {
            try { oldExpenseIds = JSON.parse(oldPayment.f06_expense_link); } catch(e){}
        }
        res = await _supabase.from('t07_payments').update(payload).eq('f01_id', id);
    } else {
        res = await _supabase.from('t07_payments').insert([payload]);
    }

    if (res.error) throw res.error;

    // Update newly linked expenses to 'Paid|مدفوع'
    if (selectedIds.length > 0) {
        await _supabase.from('t06_expenses').update({ f10_status: 'Paid|مدفوع' }).in('f01_id', selectedIds);
    }

    // Revert unlinked expenses back to 'Pending|معلق'
    const unlinkedIds = oldExpenseIds.filter(oldId => !selectedIds.includes(oldId));
    if (unlinkedIds.length > 0) {
        await _supabase.from('t06_expenses').update({ f10_status: 'Pending|معلق' }).in('f01_id', unlinkedIds);
    }

    showToast("تمت العملية بنجاح", "success");
    resetFieldsOnly();
    loadPaymentsData();
}

function syncPayerField() {
    const user = sessionStorage.getItem('full_name_ar');
    if(user) document.getElementById('f08_payer').value = user;
}

function resetFieldsOnly() {
    document.getElementById('paymentForm').reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
    syncPayerField();
}

function confirmReset() {
    window.showModal("تنبيه", "تفريغ الحقول؟", "info", () => resetFieldsOnly());
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    filteredPayments = allPayments.filter(p => 
        (p.f03_type && p.f03_type.toLowerCase().includes(val)) || 
        (p.f05_car_no && p.f05_car_no.toLowerCase().includes(val)) ||
        (p.f09_recipient && p.f09_recipient.toLowerCase().includes(val))
    );
    renderTable();
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