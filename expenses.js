/* ==================================================================
 [expenses.js] - إدارة المصاريف (تطبيق الدستور مع معالجة الربط)
 ================================================================== */

let allExpenses = []; // لتخزين البيانات محلياً للبحث والفرز

// [1] التعبئة الأولية للقوائم والبيانات
async function loadInitialData() {
    await fillDropdowns(); // تعبئة السيارات والسائقين والموظفين
    await fetchExpenses(); // جلب سجل المصاريف
    document.getElementById('f02_date').valueAsDate = new Date(); // ضبط تاريخ اليوم
}

// [2] تعبئة القوائم المنسدلة (الحل الجذري لخطأ الـ Foreign Key)
async function fillDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'), // نحتاج الـ ID للربط
            _supabase.from('t11_staff').select('f01_id, f02_name')  // نحتاج الـ ID للربط
        ]);

        // تعبئة السيارات (القيمة هي رقم اللوحة)
        const carSelect = document.getElementById('f03_car_no');
        if (carsRes.data) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }

        // تعبئة السائقين (القيمة هي الـ ID لضمان صحة الـ Foreign Key)
        const driverSelect = document.getElementById('f04_driver_id');
        if (driversRes.data) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        // تعبئة الموظفين (القيمة هي الـ ID لضمان صحة الـ Foreign Key)
        const staffSelect = document.getElementById('f09_user_id');
        if (staffRes.data) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("خطأ في تعبئة القوائم:", err);
    }
}

// [3] جلب سجلات المصاريف وعرضها
async function fetchExpenses() {
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`
            *,
            t02_drivers(f02_name),
            t11_staff(f02_name)
        `) // عمل Join لجلب الأسماء بدلاً من الـ IDs في الجدول فقط
        .order('f02_date', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }
    allExpenses = data;
    renderExpensesTable(data);
}

// [4] بناء جدول المصاريف
function renderExpensesTable(data) {
    let html = `<table>
        <thead>
            <tr>
                <th>التاريخ</th>
                <th>السيارة</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الموظف</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(ex => {
        html += `
            <tr>
                <td>${ex.f02_date}</td>
                <td><b>${ex.f03_car_no}</b></td>
                <td>${ex.f05_expense_type}</td>
                <td style="color:var(--taxi-red); font-weight:bold;">${ex.f07_amount}</td>
                <td><span class="status-badge ${ex.f10_status}">${ex.f10_status}</span></td>
                <td>${ex.t11_staff?.f02_name || 'غير محدد'}</td>
                <td>
                    <button onclick="deleteExpense('${ex.f01_id}')" class="btn-action delete-btn">🗑️</button>
                </td>
            </tr>`;
    });

    document.getElementById('expensesTableContainer').innerHTML = html + "</tbody></table>";
}

// [5] حفظ مصروف جديد (Handle Submit)
document.getElementById('expenseForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const payload = {};
    // جمع البيانات آلياً بناءً على الـ ID الذي يبدأ بـ f
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value) payload[el.id] = el.value;
    });

    const { error } = await _supabase.from('t06_expenses').insert([payload]);

    if (error) {
        window.showModal("خطأ في الحفظ", "السبب: " + error.message, "error");
    } else {
        window.showModal("تم الحفظ", "تم تسجيل المصروف بنجاح", "success");
        document.getElementById('expenseForm').reset();
        document.getElementById('f02_date').valueAsDate = new Date();
        fetchExpenses();
    }
};

// [6] حذف مصروف
async function deleteExpense(id) {
    window.showModal("تأكيد الحذف", "هل أنت متأكد من حذف هذا السجل؟", "warning", async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (!error) fetchExpenses();
    });
}
