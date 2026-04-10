/* === START OF FILE: revenues.js === */

// ... (بقية المتغيرات والدوال الأصلية تبقى كما هي دون تغيير)

// [إصلاح دالة الفرز فقط]
function sortData(fieldName) {
    const isNumeric = fieldName === 'f06_amount';
    filteredRevenues.sort((a, b) => {
        let valA = a[fieldName] || (isNumeric ? 0 : "");
        let valB = b[fieldName] || (isNumeric ? 0 : "");
        if (isNumeric) return parseFloat(valA) - parseFloat(valB);
        return String(valA).localeCompare(String(valB), 'ar');
    });
    renderTable();
}

// ... (دوال fillRevenueDropdowns و loadData الأصلية)

// [إصلاح دالة الحفظ فقط لضمان توافق النوع الرقمي]
async function saveData(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_name: document.getElementById('f04_driver_name').value,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: parseFloat(document.getElementById('f06_amount').value) || 0, // الإصلاح: تحويل الرقم لمنع خطأ 22P02
            f07_method: document.getElementById('f07_method').value,
            f08_collector: document.getElementById('f08_collector').value,
            f09_notes: document.getElementById('f09_notes').value.trim()
        };

        try {
            const res = id 
                ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
                : await _supabase.from('t05_revenues').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ السجل بنجاح ✅", "success");
            resetForm();
            loadData();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

// ... (بقية الكود الأصلي: loadPendingWorkDays, editRecord, deleteRecord, الخ... تبقى كما هي)

/* === END OF FILE: revenues.js === */
