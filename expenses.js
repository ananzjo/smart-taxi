/* ==================================================================
 [expenses.js] - إدارة المصاريف (النسخة المتوافقة مع المخطط t06)
 نظام إدارة التاكسي الذكي - Smart Taxi Management System
 ================================================================== */

let allExpenses = []; // مصفوفة لتخزين المصاريف محلياً للبحث والفرز

// [1] دالة التحميل الأولية عند فتح الصفحة
async function loadInitialData() {
    await fillExpenseDropdowns(); // تعبئة قوائم (السيارات، السائقين، الموظفين)
    await fetchExpensesLog();      // جلب سجل المصاريف من قاعدة البيانات
    document.getElementById('f02_date').valueAsDate = new Date(); // ضبط تاريخ اليوم افتراضياً
}

// [2] تعبئة القوائم المنسدلة بناءً على علاقات المخطط (Foreign Keys)
async function fillExpenseDropdowns() {
    try {
        // جلب البيانات من الجداول الثلاثة المرتبطة بـ t06
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'), // الربط عبر رقم اللوحة
            _supabase.from('t02_drivers').select('f01_id, f02_name'), // الربط عبر ID السائق
            _supabase.from('t11_staff').select('f01_id, f02_name')   // الربط عبر ID الموظف
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_id');
        const staffSelect = document.getElementById('f09_user_id');

        // تعبئة قائمة السيارات
        if (carsRes.data) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }

        // تعبئة قائمة السائقين (القيمة هي الـ ID الرقمي لضمان الـ Foreign Key)
        if (driversRes.data) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        // تعبئة قائمة الموظفين (القيمة هي الـ ID الرقمي لحل خطأ fk_expenses_staff)
        if (staffRes.data) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("خطأ في جلب بيانات القوائم:", err);
    }
}

// [3] جلب سجلات المصاريف مع جلب أسماء الموظفين والسائقين (Join)
async function fetchExpensesLog() {
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`
            *,
            t11_staff!fk_expenses_staff(f02_name),
            t02_drivers!fk_expenses_driver(f02_name)
        `) // جلب الأسماء من الجداول المرتبطة بدلاً من مجرد أرقام
        .order('f02_date', { ascending: false });

    if (error) {
        window.showModal("خطأ", "تعذر جلب سجل المصاريف", "error");
        return;
    }
    allExpenses = data; // تخزين البيانات للفرز والبحث
    renderExpensesTable(data); // بناء الجدول
}

// [4] بناء جدول عرض المصاريف
function renderExpensesTable(list) {
    let html = `<table><thead><tr>
        <th>التاريخ</th>
        <th>السيارة</th>
        <th>النوع</th>
        <th>المورد</th>
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
            <td>${ex.f06_seller || '-'}</td>
            <td style="color:var(--taxi-red); font-weight:bold;">${ex.f07_amount}</td>
            <td>${ex.t11_staff?.f02_name || 'غير محدد'}</td>
            <td><span class="status-badge ${ex.f10_status}">${ex.f10_status}</span></td>
            <td>
                <button onclick="deleteExpense('${ex.f01_id}')" class="btn-action delete-btn" title="حذف">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('expensesTableContainer').innerHTML = html + "</tbody></table>";
}

// [5] معالجة إرسال النموذج (حفظ مصروف جديد)
document.getElementById('expenseForm').onsubmit = async (e) => {
    e.preventDefault(); // منع تحديث الصفحة
    
    const payload = {}; // كائن البيانات المراد إرسالها
    
    // جمع كل الحقول التي تبدأ بـ f (مطابقة للمخطط t06)
    document.querySelectorAll('#expenseForm [id^="f"]').forEach(el => {
        if (el.value.trim() !== "") {
            // تحويل القيم الرقمية لضمان توافقها مع bigint و numeric في Postgres
            if (['f04_driver_id', 'f09_user_id', 'f07_amount'].includes(el.id)) {
                payload[el.id] = Number(el.value);
            } else {
                payload[el.id] = el.value.trim();
            }
        }
    });

    // تنفيذ عملية الإدخال في Supabase
    const { error } = await _supabase.from('t06_expenses').insert([payload]);

    if (error) {
        console.error("Database Error:", error);
        window.showModal("فشل العملية", "خطأ في قاعدة البيانات: " + error.message, "error");
    } else {
        window.showModal("نجاح", "تم تسجيل المصروف بنجاح ✅", "success");
        document.getElementById('expenseForm').reset(); // تفريغ الحقول
        document.getElementById('f02_date').valueAsDate = new Date(); // إعادة ضبط التاريخ
        fetchExpensesLog(); // تحديث الجدول فوراً
    }
};

// [6] دالة الحذف
async function deleteExpense(id) {
    window.showModal("تأكيد", "هل أنت متأكد من حذف هذا المصروف؟", "error", async () => {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (error) window.showModal("خطأ", "فشل الحذف", "error");
        else fetchExpensesLog();
    });
}
