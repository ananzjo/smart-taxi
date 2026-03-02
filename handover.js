/* ==================================================================
 [handover.js] - إدارة العهدة (نسخة القالب الذهبي)
 ================================================================== */

async function loadFormData() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no, f12_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        if (carsRes.data) {
            document.getElementById('f04_car_id').innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}" data-status="${c.f12_is_active}">${c.f02_plate_no} [${c.f12_is_active}]</option>`).join('');
        }
        
        if (driversRes.data) {
            document.getElementById('f05_driver_id').innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }

        if (staffRes.data) {
            const staffSelect = document.getElementById('f06_staff_id');
            staffSelect.innerHTML = staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
            const activeUser = sessionStorage.getItem('full_name_ar');
            if(activeUser) Array.from(staffSelect.options).forEach(opt => { if(opt.text === activeUser) opt.selected = true; });
        }
        loadHistory();
    } catch (err) { console.error("Initialization Error:", err); }
}

async function loadHistory() {
    const { data } = await _supabase.from('t04_handover').select('*').order('f12_created_at', { ascending: false }).limit(10);
    if (data) {
        let html = `<table><thead><tr><th>النوع</th><th>السيارة</th><th>العداد الحلي</th><th>التاريخ</th></tr></thead><tbody>`;
        
        data.forEach(h => {
            const typeColor = h.f07_action_type === 'OUT' ? '#e67e22' : '#27ae60';
            html += `
                <tr>
                    <td style="color:${typeColor}; font-weight:bold;">${h.f07_action_type === 'OUT' ? '📤 تسليم' : '📥 استلام'}</td>
                    <td><strong>${h.f04_car_id}</strong></td>
                    <td><span class="odometer-red">${h.f09_km_reading.toLocaleString()}</span></td> 
                    <td>${new Date(h.f12_created_at).toLocaleDateString('ar-EG')}</td>
                </tr>`;
        });
        document.getElementById('handoverList').innerHTML = html + "</tbody></table>";
    }
}
document.getElementById('handoverForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // جلب النصوص المختارة للرسالة
    const carId = document.getElementById('f04_car_id').value;
    const driverSelect = document.getElementById('f05_driver_id');
    const driverName = driverSelect.options[driverSelect.selectedIndex].text;
    const action = document.querySelector('input[name="f07_action_type"]:checked').value;

    const payload = {
        f04_car_id: carId,
        f05_driver_id: parseInt(driverSelect.value),
        f06_staff_id: 1, 
        f07_action_type: action,
        f08_daman: parseFloat(document.getElementById('f08_daman').value) || 0,
        f09_km_reading: parseInt(document.getElementById('f09_km_reading').value),
        f10_car_condition: document.getElementById('f10_car_condition').value,
        f11_notes: document.getElementById('f11_notes').value
    };

    const { error } = await _supabase.from('t04_handover').insert([payload]);
    
    if (!error) {
        // تحديث الحالة في جدول السيارات
        const newStatus = (action === 'OUT') ? 'مشغول' : 'نشط';
        await _supabase.from('t01_cars').update({ f12_is_active: newStatus }).eq('f02_plate_no', carId);

        // صياغة الرسالة المطلوبة
        const verb = (action === 'OUT') ? 'تسليم' : 'استلام';
        const prep = (action === 'OUT') ? 'للسائق' : 'من السائق';
        const successMsg = `تم ${verb} سيارة (${carId}) ${prep} (${driverName}) بنجاح ✅`;

        // إظهار المودال بالرسالة المخصصة
        window.showModal("تمت العملية", successMsg, "success");
        
        document.getElementById('handoverForm').reset();
        loadFormData();
    } else {
        window.showModal("خطأ", error.message, "error");
    }
};