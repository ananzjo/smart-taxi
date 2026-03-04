/* ==================================================================
 [expenses.js] - إدارة المصاريف (حل مشكلة Foreign Key)
 ================================================================== */

// [1] التعبئة الذكية للقوائم (الحل الجذري)
async function fillDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name') // التأكد من جلب f01_id
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_id');
        const staffSelect = document.getElementById('f09_user_id'); // الحقل المسبب للخطأ

        // سيارات
        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }

        // سائقين (نرسل الـ ID كـ Value)
        if (driversRes.data && driverSelect) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        // موظفين (نرسل الـ ID كـ Value لحل مشكلة الربط)
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("خطأ في تعبئة القوائم:", err);
    }
}

// [2] دالة الحفظ الموحدة (حسب الدستور)
document.getElementById('expenseForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // إنشاء كائن البيانات آلياً من الحقول التي تبدأ بـ f
    const formData = {};
    const inputs = document.querySelectorAll('#expenseForm [id^="f"]');
    
    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            // تحويل مبالغ الـ ID إلى أرقام إذا كانت قاعدة البيانات تطلب int8
            if (input.id === 'f09_user_id' || input.id === 'f04_driver_id' || input.id === 'f07_amount') {
                formData[input.id] = Number(input.value);
            } else {
                formData[input.id] = input.value.trim();
            }
        }
    });

    // تنفيذ الإدخال في Supabase
    const { data, error } = await _supabase
        .from('t06_expenses')
        .insert([formData]);

    if (error) {
        console.error("Error Detail:", error);
        // عرض رسالة الخطأ للمستخدم عبر المودال الموحد
        if (window.showModal) {
            window.showModal("فشل الحفظ", "السبب: " + error.message, "error");
        } else {
            alert("خطأ: " + error.message);
        }
    } else {
        window.showModal("نجاح", "تم تسجيل المصروف بنجاح ✅", "success");
        document.getElementById('expenseForm').reset();
        document.getElementById('f02_date').valueAsDate = new Date();
        loadExpenses(); // تحديث الجدول
    }
};
