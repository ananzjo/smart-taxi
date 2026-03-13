/* ==================================================================
 [reports.js] - النسخة النهائية الشاملة (الفلاتر + الضمان f08_daman)
 ================================================================== */

// 1. حساب أيام العمل (استثناء الجمعة)
function calculateWorkDays(startDate, endDate) {
    let count = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        if (current.getDay() !== 5) count++; // 5 = الجمعة
        current.setDate(current.getDate() + 1);
    }
    return count;
}

// 2. إدارة الفلاتر (السيارات، السائقين، الملاك)
async function toggleReportFilters() {
    const type = document.getElementById('reportType').value;
    const container = document.getElementById('dynamicFilterContainer');
    const select = document.getElementById('dynamicValue');
    const label = document.getElementById('dynamicLabel');

    if (type === 'all') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    select.innerHTML = '<option value="">جاري التحميل...</option>';

    try {
        if (type === 'car') {
            label.innerText = 'رقم السيارة';
            const { data } = await _supabase.from('t01_cars').select('f01_id, f02_plate_no');
            select.innerHTML = (data || []).map(c => `<option value="${c.f01_id}">${c.f02_plate_no}</option>`).join('');
        } else if (type === 'driver') {
            label.innerText = 'اسم السائق';
            const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name');
            select.innerHTML = (data || []).map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        } else if (type === 'owner') {
            label.innerText = 'المالك';
            const { data } = await _supabase.from('t10_owners').select('f01_id, f02_owner_name');
            select.innerHTML = (data || []).map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Filter Load Error:", err);
    }
}

// 3. المحرك المالي لتوليد التقرير
async function generateReport() {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    const type = document.getElementById('reportType').value;
    const val = document.getElementById('dynamicValue').value;

    if (!from || !to) {
        window.showModal("تنبيه", "يرجى اختيار الفترة الزمنية", "warning");
        return;
    }

    await window.safeSubmit(async () => {
        let dailyRate = 0;

        // جلب قيمة الضمان f08_daman من جدول التسليم t04_handover
        try {
            let hQuery = _supabase.from('t04_handover')
                         .select('f08_daman')
                         .order('f12_created_at', { ascending: false });

            if (type === 'car') hQuery = hQuery.eq('f04_car_id', val); // val should be the car UUID if f04_car_id is UUID
            if (type === 'driver') hQuery = hQuery.eq('f05_driver_id', val); // val should be driver ID

            const { data: hData } = await hQuery;
            if (hData && hData.length > 0) {
                // البحث عن أول قيمة أكبر من صفر في السجلات
                const validEntry = hData.find(entry => parseFloat(entry.f08_daman) > 0);
                if (validEntry) dailyRate = parseFloat(validEntry.f08_daman);
            }
        } catch (e) { console.error("Daman Logic Error:", e); }

        // جلب الإيرادات (المسدد)
        let rQuery = _supabase.from('t05_revenues').select('*').gte('f02_date', from).lte('f02_date', to);
        if (type === 'car') rQuery = rQuery.eq('f03_car_no', val);
        if (type === 'driver') rQuery = rQuery.eq('f04_driver_name', val);

        const { data: payments } = await rQuery.order('f02_date', { ascending: false });

        // حسابات كشف الحساب
        const days = calculateWorkDays(from, to);
        const required = days * dailyRate;
        const paid = (payments || []).reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
        const balance = required - paid;

        // العرض النهائي
        renderOutput(days, dailyRate, required, paid, balance, payments || []);
    });
}

// 4. دالة العرض في الجدول والبانر
function renderOutput(days, rate, req, paid, bal, list) {
    const summary = document.getElementById('reportSummary');
    summary.style.display = 'flex';
    summary.innerHTML = `
        <div class="summary-item"><h4>أيام العمل</h4><div>${days}</div></div>
        <div class="summary-item"><h4>قيمة الضمان</h4><div style="color:var(--taxi-gold)">${rate.toFixed(2)}</div></div>
        <div class="summary-item"><h4>المطلوب</h4><div>${req.toFixed(2)}</div></div>
        <div class="summary-item"><h4>المسدد</h4><div style="color:var(--taxi-green)">${paid.toFixed(2)}</div></div>
        <div class="summary-item"><h4>الرصيد</h4><div style="color:${bal > 0 ? 'var(--taxi-red)' : 'var(--taxi-green)'}; font-weight:bold;">${bal.toFixed(2)}</div></div>
    `;

    let html = `<table><thead><tr><th>التاريخ</th><th>السيارة</th><th>المبلغ</th><th>المحصل</th></tr></thead><tbody>`;
    if (list.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center;">لا توجد سجلات دفع للفترة المحددة</td></tr>`;
    } else {
        list.forEach(r => {
            html += `<tr>
                <td>${r.f02_date}</td>
                <td><b>${r.f03_car_no}</b></td>
                <td style="font-weight:bold; color:var(--taxi-green);">${parseFloat(r.f06_amount).toFixed(2)}</td>
                <td>${r.f08_collector || '-'}</td>
            </tr>`;
        });
    }
    document.getElementById('reportResult').innerHTML = html + "</tbody></table>";
}