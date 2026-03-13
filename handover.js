/* === START OF FILE === */
/* File: handover.js 
   Version: v1.5.5 (Policy Compliant)
   Function: إدارة العهدة - التزام كامل بمعايير النظام (Forms, Buttons, Modals)
*/

// [1] تحميل القوائم وتجهيز النموذج
async function loadFormData() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no, f12_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        if (carsRes.data) {
            document.getElementById('f04_car_id').innerHTML = '<option value="">-- اختر السيارة --</option>' +
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }

        if (driversRes.data) {
            document.getElementById('f05_driver_id').innerHTML = '<option value="">-- اختر السائق --</option>' +
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        if (staffRes.data) {
            const staffSelect = document.getElementById('f06_staff_id');
            staffSelect.innerHTML = '<option value="">-- المسؤول --</option>' +
                staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');

            const activeUserId = sessionStorage.getItem('user_id');
            if (activeUserId) staffSelect.value = activeUserId;
        }

        await loadHistory();
    } catch (err) { console.error("Load Form Error:", err); }
}

// [2] جلب السجلات وعرض الأسماء يدوياً (Map Strategy)
async function loadHistory() {
    try {
        const { data: rawData, error: rawError } = await _supabase
            .from('t04_handover')
            .select('*')
            .order('f12_created_at', { ascending: false })
            .limit(20);

        if (rawError) throw rawError;

        const [driversRes, staffRes] = await Promise.all([
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        const driversMap = {};
        if (driversRes.data) driversRes.data.forEach(d => driversMap[d.f01_id.toString()] = d.f02_name);
        const staffMap = {};
        if (staffRes.data) staffRes.data.forEach(s => staffMap[s.f01_id.toString()] = s.f02_name);

        let html = `<table class="main-table">
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>السيارة</th>
                    <th>السائق</th>
                    <th>المسؤول</th>
                    <th>العداد</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>`;

        rawData.forEach((h, index) => {
            const isOut = h.f07_action_type === 'OUT';
            const driverName = driversMap[h.f05_driver_id?.toString()] || `سائق #${h.f05_driver_id}`;
            const staffName = staffMap[h.f06_staff_id?.toString()] || `مسؤول #${h.f06_staff_id}`;

            rawData[index].driver_name = driverName;
            rawData[index].staff_name = staffName;

            html += `
                <tr>
                    <td>${h.f02_date}<br><small>${h.f03_time?.substring(0, 5)}</small></td>
                    <td><b>${h.f04_car_id}</b></td>
                    <td>${driverName}</td>
                    <td>${staffName}</td>
                    <td>
                        <span class="digital-font odometer-red">${(h.f09_km_reading || 0).toLocaleString()}</span>
                    </td>
                    <td>
                        <span class="status-badge ${isOut ? 'status-out' : 'status-in'}">
                            ${isOut ? 'تسليم OUT' : 'استلام IN'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button onclick="viewRecord(${index})" class="btn-table view" title="عرض">👁️</button>
                            <button onclick="editRecord(${index})" class="btn-table edit" title="تعديل">✏️</button>
                            <button onclick="confirmDelete('${h.f01_id}', '${h.f04_car_id}')" class="btn-table delete" title="حذف">🗑️</button>
                        </div>
                    </td>
                </tr>`;
        });

        document.getElementById('handoverList').innerHTML = html + "</tbody></table>";
        window.allHandovers = rawData;

    } catch (err) { console.error("History Error:", err); }
}

// [3] حفظ البيانات (Submit)
document.getElementById('handoverForm').onsubmit = async (e) => {
    e.preventDefault();
    const action = document.querySelector('input[name="f07_action_type"]:checked').value;
    const carId = document.getElementById('f04_car_id').value;

    const payload = {
        f04_car_id: carId,
        f05_driver_id: document.getElementById('f05_driver_id').value,
        f06_staff_id: document.getElementById('f06_staff_id').value,
        f07_action_type: action,
        f08_daman: parseFloat(document.getElementById('f08_daman').value) || 0,
        f09_km_reading: parseInt(document.getElementById('f09_km_reading').value),
        f10_car_condition: document.getElementById('f10_car_condition').value,
        f11_notes: document.getElementById('f11_notes').value
    };

    const { error } = await _supabase.from('t04_handover').insert([payload]);

    if (!error) {
        const newStatus = (action === 'OUT') ? 'مشغول' : 'نشط';
        await _supabase.from('t01_cars').update({ f12_is_active: newStatus }).eq('f02_plate_no', carId);

        window.showModal("نجاح العملية", "تم حفظ بيانات العهدة وتحديث حالة المركبة بنجاح.", "success");
        e.target.reset();
        loadFormData();
    } else {
        window.showModal("خطأ في الحفظ", error.message, "error");
    }
};

// [4] وظائف الأزرار (View, Edit, Delete) حسب الـ Policy
function viewRecord(index) {
    const item = window.allHandovers[index];
    const content = `
        <div class="info-grid">
            <div class="info-item"><b>رقم المركبة:</b> ${item.f04_car_id}</div>
            <div class="info-item"><b>السائق:</b> ${item.driver_name}</div>
            <div class="info-item"><b>العداد:</b> <span class="digital-font">${item.f09_km_reading}</span></div>
            <div class="info-item"><b>الحالة:</b> ${item.f10_car_condition}</div>
            <div class="info-item"><b>ملاحظات:</b> ${item.f11_notes || 'لا يوجد'}</div>
        </div>`;
    window.showModal("تفاصيل السجل", content, "info");
}

function editRecord(index) {
    const item = window.allHandovers[index];
    // تعبئة النموذج للتحرير
    document.getElementById('f04_car_id').value = item.f04_car_id;
    document.getElementById('f05_driver_id').value = item.f05_driver_id;
    document.getElementById('f08_daman').value = item.f08_daman;
    document.getElementById('f09_km_reading').value = item.f09_km_reading;
    document.getElementById('f10_car_condition').value = item.f10_car_condition;
    document.getElementById('f11_notes').value = item.f11_notes;

    window.showModal("تنبيه", "تم تحميل البيانات للنموذج لإجراء التعديل.", "info");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmDelete(id, plate) {
    // استخدام confirmModal الخاص بالنظام بدلاً من الـ alert الكلاسيكي
    if (window.confirmModal) {
        window.confirmModal("تأكيد الحذف", `هل أنت متأكد من حذف سجل العهدة للسيارة رقم (${plate})؟`, async () => {
            const { error } = await _supabase.from('t04_handover').delete().eq('f01_id', id);
            if (!error) {
                window.showModal("تم الحذف", "تم إزالة السجل من القاعدة.", "success");
                loadHistory();
            }
        });
    } else {
        // Fallback في حال لم يكن الـ confirmModal معرفاً بعد
        if (confirm("هل تريد الحذف؟")) {
            _supabase.from('t04_handover').delete().eq('f01_id', id).then(() => loadHistory());
        }
    }
}

// زر الـ Reset (يتم التعامل معه عبر HTML type="reset" ولكن للتأكيد)
function resetForm() {
    document.getElementById('handoverForm').reset();
    window.showModal("تمت إعادة الضبط", "تم تفريغ الحقول.", "info");
}