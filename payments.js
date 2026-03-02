/* ==================================================================
 [payments.js] - إدارة المدفوعات وتسوية المصاريف (النسخة الكاملة)
 ================================================================== */

let allPayments = [];

// [1] تهيئة الصفحة عند التحميل
async function initPaymentPage() {
    await fillCarDropdown();
    await loadPaymentsData();
    syncPayerField();
    
    // ربط الفورم بعملية الحفظ
    const form = document.getElementById('paymentForm');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await savePaymentData();
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
async function loadPendingExpenses(carNo) {
    if (!carNo) return;
    const expenseSelect = document.getElementById('f06_expense_link');
    
    // جلب المصاريف المرتبطة بالسيارة من جدول t06
    const { data } = await _supabase.from('t06_expenses')
        .select('f01_id, f07_expense_type, f08_amount, f02_date')
        .eq('f03_car_no', carNo);

    if (data && expenseSelect) {
        expenseSelect.innerHTML = '<option value="">-- اختر مصروف للمطابقة --</option>' + 
            data.map(e => `<option value="${e.f01_id}">${e.f02_date} | ${e.f07_expense_type} (${e.f08_amount} د.أ)</option>`).join('');
    }
}

// [4] جلب وعرض البيانات
async function loadPaymentsData() {
    const { data, error } = await _supabase.from('t07_payments').select('*').order('f02_date', { ascending: false });
    if (data) {
        allPayments = data;
        renderTable(data);
    }
}

function renderTable(data) {
    let html = `<table><thead><tr>
        <th>التاريخ</th><th>النوع</th><th>السيارة</th><th>المبلغ</th><th>المستلم</th><th>مطابقة؟</th><th>إجراءات</th>
    </tr></thead><tbody>`;

    data.forEach(item => {
        // تحويل البيانات لنص JSON لإرسالها لدالة التعديل
        const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");
        
        html += `<tr>
            <td>${item.f02_date}</td>
            <td>${item.f03_type}</td>
            <td>${item.f05_car_no || '-'}</td>
            <td style="font-weight:bold;">${item.f04_amount}</td>
            <td>${item.f09_recipient || '-'}</td>
            <td>${item.f06_expense_link ? '✅' : '❌'}</td>
            <td>
                <button class="btn-action edit-btn" onclick='editRecord(${itemJson})'>📝</button>
                <button class="btn-action delete-btn" onclick="deleteRecord('${item.f01_id}')">🗑️</button>
            </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('tableContainer').innerHTML = html;
}

// [5] دالة التعديل (تعبئة الفورم بالبيانات)
function editRecord(item) {
    // تعبئة كل الحقول التي تبدأ بـ f وتطابق أسماء الأعمدة
    Object.keys(item).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = item[key];
    });
    
    // إذا كانت السيارة مختارة، يجب تحميل قائمة المصاريف المرتبطة بها
    if(item.f05_car_no) {
        loadPendingExpenses(item.f05_car_no).then(() => {
            document.getElementById('f06_expense_link').value = item.f06_expense_link || "";
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// [6] دالة الحذف (باستخدام المودال المخصص)
function deleteRecord(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع!", "danger", async () => {
        const { error } = await _supabase.from('t07_payments').delete().eq('f01_id', id);
        if (!error) {
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
    
    const payload = {
        f02_date: document.getElementById('f02_date').value,
        f03_type: document.getElementById('f03_type').value,
        f04_amount: parseFloat(document.getElementById('f04_amount').value),
        f05_car_no: document.getElementById('f05_car_no').value,
        f06_expense_link: document.getElementById('f06_expense_link').value || null,
        f07_method: document.getElementById('f07_method').value,
        f08_payer: document.getElementById('f08_payer').value,
        f09_recipient: document.getElementById('f09_recipient').value,
        f10_reference: document.getElementById('f10_reference').value,
        f11_is_reconciled: isReconciled,
        f13_notes: document.getElementById('f13_notes').value
    };

    let res;
    if (id) {
        res = await _supabase.from('t07_payments').update(payload).eq('f01_id', id);
    } else {
        res = await _supabase.from('t07_payments').insert([payload]);
    }

    if (!res.error) {
        window.showModal("نجاح", "تمت العملية بنجاح", "success");
        resetFieldsOnly();
        loadPaymentsData();
    }
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
    const filtered = allPayments.filter(p => 
        (p.f03_type && p.f03_type.toLowerCase().includes(val)) || 
        (p.f05_car_no && p.f05_car_no.toLowerCase().includes(val)) ||
        (p.f09_recipient && p.f09_recipient.toLowerCase().includes(val))
    );
    renderTable(filtered);
}