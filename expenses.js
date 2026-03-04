/* ==================================================================
 [expenses.js] - إدارة المصاريف (بنفس منطق الإيرادات)
 ================================================================== */

let allExpenses = []; 

// [1] التعبئة الموحدة للقوائم (مثل الإيرادات)
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

        if (carsRes.data) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }

        // هنا التعديل: نضع الـ ID في الـ Value والاسم للعرض فقط
        if (driversRes.data) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        if (staffRes.data) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Error:", err);
    }
}

// [2] جلب البيانات للجدول (نفس منطق الإيرادات)
async function loadData() {
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`
            *,
            t11_staff(f02_name),
            t02_drivers(f02_name)
        `) // لكي يظهر الاسم في الجدول بدلاً من الرقم الطويل
        .order('f02_date', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب البيانات", "error"); 
        return; 
    }
    allExpenses = data; 
    renderTable(data);
}

// [3] بناء الجدول (نفس شكل الإيرادات)
function renderTable(list) {
    let html = `<table><thead><tr>
        <th>التاريخ</th>
        <th>السيارة</th>
        <th>النوع</th>
        <th>المبلغ</th>
        <th>المسؤول</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(ex => {
        html += `<tr>
            <td>${ex.f02_date}</td>
            <td><b>${ex.f03_car_no}</b></td>
            <td>${ex.f05_expense_type}</td>
            <td style="color:var(--taxi-red); font-weight:bold;">${ex.f07_amount}</td>
            <td>${ex.t11_staff?.f02_name || '-'}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(ex)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${ex.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('expensesTableContainer').innerHTML = html + "</tbody></table>";
}

// [4] الحفظ التلقائي (نفس دالة saveData في الإيرادات)
async function saveData() {
    const id = document.getElementById('f01_id')?.value; // لو أضفت حقل مخفي للـ ID
    const payload = {};
    
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value.trim() !== "") {
            // تحويل الحقول التي تتطلب أرقاماً في قاعدة البيانات
            if (['f07_amount', 'f04_driver_id', 'f09_user_id'].includes(el.id)) {
                payload[el.id] = el.value; // سيقوم Supabase بالتحويل التلقائي طالما القيمة رقمية
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

// [5] الدوال المساعدة (نفس الإيرادات)
function resetFieldsOnly() {
    const form = document.getElementById('expenseForm');
    if(form) form.reset();
    document.getElementById('f02_date').valueAsDate = new Date();
}

async function deleteRecord(id) {
    window.showModal("تأكيد", "هل أنت متأكد؟", "error", async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (!error) loadData();
    });
}

// دالة التشغيل عند التحميل
window.onload = async () => {
    bootSystem("إدارة المصاريف");
    await fillExpenseDropdowns();
    await loadData();
    document.getElementById('f02_date').valueAsDate = new Date();
};
