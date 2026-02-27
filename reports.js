/* ==================================================================
 [reports.js] - محرك التقارير الذكية
 ================================================================== */

// تبديل الفلاتر حسب نوع التقرير المختار
async function toggleReportFilters() {
    const type = document.getElementById('reportType').value;
    const container = document.getElementById('dynamicFilterContainer');
    const label = document.getElementById('dynamicLabel');
    const select = document.getElementById('dynamicValue');

    if (type === 'all') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    select.innerHTML = '<option>جاري التحميل...</option>';

    if (type === 'car') {
        label.innerText = 'رقم السيارة';
        const { data } = await _supabase.from('t01_cars').select('f02_plate_no');
        select.innerHTML = data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
    } else if (type === 'driver') {
        label.innerText = 'اسم السائق';
        const { data } = await _supabase.from('t02_drivers').select('f02_name');
        select.innerHTML = data.map(d => `<option value="${d.f02_name}">${d.f02_name}</option>`).join('');
    } else if (type === 'owner') {
        label.innerText = 'المالك';
        const { data } = await _supabase.from('t10_owners').select('f01_id, f02_owner_name');
        select.innerHTML = data.map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');
    }
}

async function generateReport() {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    const type = document.getElementById('reportType').value;
    const val = document.getElementById('dynamicValue').value;

    let query = _supabase.from('t05_revenues').select('*').gte('f02_date', from).lte('f02_date', to);

    // تطبيق الفلترة حسب النوع
    if (type === 'car') query = query.eq('f03_car_no', val);
    if (type === 'driver') query = query.eq('f04_driver_name', val);
    
    // فلترة المالك تحتاج حركة ذكية (جلب سيارات المالك أولاً)
    if (type === 'owner') {
        const { data: ownerCars } = await _supabase.from('t01_cars').select('f02_plate_no').eq('f11_owner_id', val);
        const plates = ownerCars.map(c => c.f02_plate_no);
        query = query.in('f03_car_no', plates);
    }

    const { data, error } = await query.order('f02_date', { ascending: false });

    if (data) {
        renderReportTable(data);
        updateSummary(data);
    }
}

function updateSummary(data) {
    const total = data.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
    document.getElementById('reportSummary').style.display = 'flex';
    document.getElementById('resTotal').innerText = total.toLocaleString() + " JOD";
    document.getElementById('resCount').innerText = data.length;
}

function renderReportTable(list) {
    let html = `<table><thead><tr>
        <th>التاريخ</th><th>السيارة</th><th>السائق</th><th>المبلغ</th><th>المحصل</th>
    </tr></thead><tbody>`;
    
    list.forEach(r => {
        html += `<tr>
            <td>${r.f02_date}</td>
            <td><b>${r.f03_car_no}</b></td>
            <td>${r.f04_driver_name}</td>
            <td style="font-weight:bold;">${r.f06_amount}</td>
            <td>${r.f08_collector || '-'}</td>
        </tr>`;
    });
    document.getElementById('reportResult').innerHTML = html + "</tbody></table>";
}