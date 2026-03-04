/* ==================================================================
 [expenses.js] - إدارة المصاريف (نفس منطق الإيرادات تماماً)
 ================================================================== */

let allExpenses = []; // مصفوفة البيانات الأساسية للبحث والفرز

// [1] تعبئة القوائم الثلاث (سيارات، سائقين، موظفين)
async function fillExpenseDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_id');
        const staffSelect = document.getElementById('f09_user_id');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        
        if (driversRes.data && driverSelect) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

// [2] جلب البيانات للجدول (مع عمل Join لجلب الأسماء)
async function loadData() {
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`
            *,
            t02_drivers(f02_name),
            t11_staff(f02_name)
        `)
        .order('f02_date', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب البيانات", "error"); 
        return; 
    }
    allExpenses = data; 
    renderTable(data);
}

// [3] بناء الجدول (مثل الإيرادات)
function renderTable(list) {
    let html = `<table><thead><tr>
        <th>التاريخ</th>
        <th>السيارة</th>
        <th>النوع</th>
        <th>المبلغ</th>
        <th>المسؤول</th>
        <th>الحالة</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(ex => {
        html += `<tr>
            <td>${ex.f02_date}</td>
            <td><b>${ex.f03_car_no}</b></td>
            <td>${ex.f05_expense_type}</td>
            <td style="color:var(--taxi-red); font-weight:bold;">${ex.f07_amount}</td>
            <td>${ex.t11_staff?.f02_name || '-'}</td>
            <td>${ex.f10_status}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(ex)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${ex.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('expensesTableContainer').innerHTML = html + "</tbody></table>";
}

// [4] الحفظ التلقائي (Payload)
// ملاحظة: تم استبدال saveData لتستخدم في زر الحفظ أو submit النموذج
async function saveData() {
    const id = document.getElementById('f01_id')?.value;
    const payload = {};
    
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value.trim() !== "") {
            // تحويل الحقول الرقمية لضمان توافق الـ Foreign Key
            if (['f07_amount', 'f04_driver_id', 'f09_user_id'].includes(el.id)) {
                payload[el.id] = Number(el.value);
            } else {
                payload[el.id] = el.value.trim();
            }
        }
    });

    if (!payload.f03_car_no || !payload.f07_amount) {
        window.showModal("نواقص", "يرجى تعبئة الحقول الأساسية", "warning");
        return;
    }

    const { error } = id && id !== ""
        ? await _supabase.from('t06_expenses').update(payload).eq('f01_id', id)
        : await _supabase.from('t06_expenses').insert([payload]);

    if (error) {
        window.showModal("فشل", "السبب: " + error.message, "error");
    } else { 
        window.showModal("نجاح", "تم حفظ المصروف بنجاح ✅", "success");
        resetFieldsOnly();
        loadData();
    }
}

// [5] تشغيل النظام (هذا ما سيحل خطأ undefined)
window.onload = async () => {
    if (typeof bootSystem === "function") bootSystem("إدارة المصاريف");
    await fillExpenseDropdowns();
    await loadData();
    if (document.getElementById('f02_date')) {
        document.getElementById('f02_date').valueAsDate = new Date();
    }
};

// [6] دوال مساعدة
function resetFieldsOnly() {
    const form = document.getElementById('expenseForm');
    if(form) form.reset();
    if(document.getElementById('f01_id')) document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
}

function deleteRecord(id) {
    window.showModal("تأكيد", "حذف السجل نهائياً؟", "error", async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (error) window.showModal("خطأ", "فشل الحذف", "error");
        else loadData();
    });
}

function editRecord(ex) {
    Object.keys(ex).forEach(key => { 
        const el = document.getElementById(key);
        if(el) el.value = ex[key]; 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
