/* START OF FILE: reports.js */
/**
 * File: reports.js
 * Version: v2.1.0
 * Function: المحرك التحليلي لإصدار التقارير المالية وكشوفات الحساب
 */

let cars = [];
let drivers = [];
let owners = [];
let staff = [];

document.addEventListener('DOMContentLoaded', () => {
    initReports();
});

async function initReports() {
    const now = new Date();
    document.getElementById('date_from').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('date_to').value = now.toISOString().split('T')[0];

    await Promise.all([fetchCars(), fetchDrivers(), fetchOwners(), fetchStaff()]);
}

async function fetchCars() {
    const { data } = await _supabase.from('t01_cars').select('*');
    cars = data || [];
}

async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name');
    drivers = data || [];
}

async function fetchOwners() {
    const { data } = await _supabase.from('t10_owners').select('*');
    owners = data || [];
}

async function fetchStaff() {
    const { data } = await _supabase.from('t11_staff').select('f01_id, f02_name');
    staff = data || [];
}

function toggleSecondaryFilter() {
    // 1. تعريف جميع العناصر المطلوبة
    const type = document.getElementById('report_type').value;
    const wrapper = document.getElementById('secondary_filter_wrapper');
    const label = document.getElementById('secondary_label');
    const select = document.getElementById('secondary_id');
    const staffWrapper = document.getElementById('staff_filter_wrapper');
    const staffSelect = document.getElementById('staff_filter');

    // 2. إخفاء الفلاتر مبدئياً لتنظيف الشاشة
    if (wrapper) wrapper.style.display = 'none';
    if (staffWrapper) staffWrapper.style.display = 'none';

    // 3. منطق إظهار الفلاتر حسب نوع التقرير
    if (type === 'investor_monthly') {
        // إظهار المالك والموظف معاً
        if (wrapper) wrapper.style.display = 'flex';
        if (staffWrapper) staffWrapper.style.display = 'flex';

        label.innerText = 'اختر المالك';
        select.innerHTML = owners.map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');

        // تعبئة فلتر الموظفين
        const activeStaffIds = [...new Set(cars.map(c => c.f14_staff_id).filter(s => s))];
        const activeStaff = staff.filter(s => activeStaffIds.includes(s.f01_id));
        
        if (staffSelect) {
            staffSelect.innerHTML = '<option value="all">كل الموظفين</option>' + 
                activeStaff.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
    } 
    else if (type === 'driver_soa') {
        if (wrapper) wrapper.style.display = 'flex';
        label.innerText = 'اختر السائق';
        select.innerHTML = drivers.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
    } 
    else if (type === 'car_performance') {
        if (wrapper) wrapper.style.display = 'flex';
        label.innerText = 'اختر السيارة';
        select.innerHTML = cars.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
    }
} // نهاية الدالة بشكل صحيح


async function generateLuxuryReport() {
    const type = document.getElementById('report_type').value;
    const dateFrom = document.getElementById('date_from').value;
    const dateTo = document.getElementById('date_to').value;
    const secondaryId = document.getElementById('secondary_id').value;

    if (!dateFrom || !dateTo) {
        showToast("يرجى تحديد النطاق الزمني", "warning");
        return;
    }

    document.getElementById('reportPreview').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>جاري توليد التقرير والتحقق من البيانات...</p></div>';

    try {
        switch (type) {
            case 'financial_summary': await buildFinancialSummary(dateFrom, dateTo); break;
            case 'investor_monthly': 
                const staffId = document.getElementById('staff_filter').value;
                await buildInvestorMonthlyReport(secondaryId, dateFrom, dateTo, staffId); 
                break;
            case 'driver_soa': await buildDriverSOA(secondaryId, dateFrom, dateTo); break;
            case 'broken_days': await buildBrokenDaysReport(dateFrom, dateTo); break;
            default: showToast("التقرير قيد التطوير", "info");
        }
    } catch (err) {
        console.error(err);
        showToast("فشل توليد التقرير", "error");
    }
}

function getWorkingDaysCount(from, to) {
    let count = 0;
    let curr = new Date(from);
    let end = new Date(to);
    while (curr <= end) {
        if (curr.getDay() !== 5) { count++; } // 5 is Friday
        curr.setDate(curr.getDate() + 1);
    }
    return count;
}

// --- [Investor Monthly Report] ---
async function buildInvestorMonthlyReport(ownerId, from, to, staffFilter = 'all') {
    const owner = owners.find(o => o.f01_id == ownerId);
    let investorCars = cars.filter(c => c.f10_owner_id == ownerId);

    if (staffFilter !== 'all') {
        investorCars = investorCars.filter(c => c.f14_staff_id == staffFilter);
    }
    if (investorCars.length === 0) {
        document.getElementById('reportPreview').innerHTML = "❌ لا توجد سيارات مرتبطة بهذا المستثمر";
        return;
    }

    const carPlates = investorCars.map(c => c.f02_plate_no);

    // Fetch necessary data
    const [revRes, expRes, workRes, payRes] = await Promise.all([
        _supabase.from('t05_revenues').select('*').in('f03_car_no', carPlates).gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t06_expenses').select('*').in('f03_car_no', carPlates).gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t08_work_days').select('*').in('f03_car_no', carPlates).gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t07_payments').select('*').in('f05_car_no', carPlates).gte('f02_date', from).lte('f02_date', to)
    ]);

    const allRevenues = revRes.data || [];
    const allExpenses = expRes.data || [];
    const allWorkDays = workRes.data || [];
    const allPayments = payRes.data || [];

    // Calculate Totals
    const totalAmountCollected = allRevenues.filter(r => r.f05_category === 'ضمان يومي' || !r.f05_category).reduce((s, r) => s + parseFloat(r.f06_amount), 0);
    const otherRevenues = allRevenues.filter(r => r.f05_category && r.f05_category !== 'ضمان يومي').reduce((s, r) => s + parseFloat(r.f06_amount), 0);

    const totalOil = allExpenses.filter(e => e.f05_expense_type.includes('زيوت')).reduce((s, e) => s + parseFloat(e.f07_amount), 0);
    const totalMaintenance = allExpenses.filter(e => e.f05_expense_type.includes('صيانة')).reduce((s, e) => s + parseFloat(e.f07_amount), 0);
    const totalSalaries = allExpenses.filter(e => e.f05_expense_type.includes('رواتب') || e.f05_expense_type.includes('راتب')).reduce((s, e) => s + parseFloat(e.f07_amount), 0);
    const totalAllExpensesDue = allExpenses.reduce((s, e) => s + parseFloat(e.f07_amount), 0);
    const otherExpenses = totalAllExpensesDue - (totalOil + totalMaintenance + totalSalaries);

    const ownerWithdrawals = allPayments.filter(p => p.f03_type === 'نسبة صاحب سيارة').reduce((s, p) => s + parseFloat(p.f04_amount), 0);
    const totalPaymentsToSuppliers = allPayments.filter(p => p.f03_type !== 'نسبة صاحب سيارة').reduce((s, p) => s + parseFloat(p.f04_amount), 0);

    // Expenses Due but NOT PAID
    const totalDueNotPaid = totalAllExpensesDue - totalPaymentsToSuppliers;

    const netRemaining = (totalAmountCollected + otherRevenues) - (totalPaymentsToSuppliers + ownerWithdrawals);

    const dateObj = new Date(from);
    let reportTitle = `خلاصة شهر ${dateObj.getMonth() + 1} لعام ${dateObj.getFullYear()} - (${owner.f02_owner_name})`;
    
    if (staffFilter !== 'all') {
        const staffName = staff.find(s => s.f01_id == staffFilter)?.f02_name || '';
        reportTitle += `<div style="font-size:0.9rem; font-weight:normal; margin-top:5px;">سيارات (${staffName})</div>`;
    }

    const dateRange = `الفترة من ${from} إلى ${to}`;

    let html = `
        <div class="investor-report-container">
            <table class="summary-table-luxury">
                ${totalAmountCollected ? `<tr><td class="lbl" style="color:#3498db">إجمالي الضمان المحصل | Total Amount Collected</td><td class="val" style="color:#3498db; font-size:1.8rem;">${totalAmountCollected.toLocaleString()}</td></tr>` : ''}
                ${totalPaymentsToSuppliers ? `<tr><td class="lbl" style="color:#e67e22">إجمالي المدفوعات | Total Payments</td><td class="val" style="color:#e67e22;">${totalPaymentsToSuppliers.toLocaleString()}</td></tr>` : ''}
                ${totalDueNotPaid ? `<tr><td class="lbl" style="color:#c0392b">مصاريف مستحقة غير مدفوعة | Total Due Not Paid</td><td class="val" style="color:#c0392b;">${totalDueNotPaid.toLocaleString()}</td></tr>` : ''}
                ${totalSalaries ? `<tr><td class="lbl">رواتب | Total Salaries</td><td class="val">${totalSalaries.toLocaleString()}</td></tr>` : ''}
                ${totalMaintenance ? `<tr><td class="lbl">صيانة | Total Maintenance</td><td class="val">${totalMaintenance.toLocaleString()}</td></tr>` : ''}
                ${totalOil ? `<tr><td class="lbl">زيوت | Total Oil</td><td class="val">${totalOil.toLocaleString()}</td></tr>` : ''}
                ${otherRevenues ? `<tr><td class="lbl" style="color:#2ecc71">إيرادات أخرى | Other Revenues</td><td class="val" style="color:#2ecc71;">${otherRevenues.toLocaleString()}</td></tr>` : ''}
                ${otherExpenses ? `<tr><td class="lbl">مصاريف أخرى | Other Expenses</td><td class="val">${otherExpenses.toLocaleString()}</td></tr>` : ''}
                ${ownerWithdrawals ? `<tr><td class="lbl" style="color:#8e44ad">مسحوبات المالك | Owner Withdrawals</td><td class="val" style="color:#8e44ad;">${ownerWithdrawals.toLocaleString()}</td></tr>` : ''}
                <tr class="net-row"><td class="lbl">رصيد الصندوق المتاح | Net Amount Available</td><td class="val" style="color:#e74c3c; font-size:1.8rem;">${netRemaining.toLocaleString()}</td></tr>
            </table>

            <table class="report-table" style="margin-top:30px;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>السيارة</th>
                        <th>قيمة الضمان</th>
                        <th>الايراد المتوقع</th>
                        <th>الايراد الفعلي</th>
                        <th>عدد التوقف</th>
                        <th>مصاريف (مطلوبة)</th>
                        <th>مدفوع للموردين</th>
                    </tr>
                </thead>
                <tbody>
    `;

    investorCars.forEach((car, index) => {
        const carRev = allRevenues.filter(r => r.f03_car_no === car.f02_plate_no).reduce((s, r) => s + parseFloat(r.f06_amount), 0);
        const carExpDue = allExpenses.filter(e => e.f03_car_no === car.f02_plate_no).reduce((s, e) => s + parseFloat(e.f07_amount), 0);
        const carPayMade = allPayments.filter(p => p.f05_car_no === car.f02_plate_no).reduce((s, p) => s + parseFloat(p.f04_amount), 0);
        const stopDays = allWorkDays.filter(w => w.f03_car_no === car.f02_plate_no && w.f06_is_off_day && new Date(w.f02_date).getDay() !== 5).length;
        const totalDays = getWorkingDaysCount(from, to);
        const carOtherRev = allRevenues.filter(r => r.f03_car_no === car.f02_plate_no && r.f05_category && r.f05_category !== 'ضمان يومي').reduce((s, r) => s + parseFloat(r.f06_amount), 0);
        const expectedRev = ((totalDays - stopDays) * (car.f08_standard_rent || 0)) + carOtherRev;

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${window.formatJordanPlate(car.f02_plate_no, true)}</td>
                <td>${car.f08_standard_rent || 0}</td>
                <td>${expectedRev.toLocaleString()}</td>
                <td>${carRev.toLocaleString()}</td>
                <td style="${stopDays > 0 ? 'background:#fce4e4; color:#c0392b; font-weight:bold;' : ''}">${stopDays}</td>
                <td style="color:#c0392b;">${carExpDue.toLocaleString()}</td>
                <td style="color:#e67e22; font-weight:bold;">${carPayMade.toLocaleString()}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;

    updateUIAndPrint(reportTitle, dateRange, html);
}

// --- [1] كشف حساب سائق (Statement of Account) ---
async function buildDriverSOA(driverId, from, to) {
    const driver = drivers.find(d => d.f01_id == driverId);
    if (!driver) return;

    // 1. Fetch data
    const [workRes, revRes, fineRes] = await Promise.all([
        _supabase.from('t08_work_days').select('*').eq('f04_driver_id', driverId).gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t05_revenues').select('*').eq('f04_driver_id', driverId).gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t09_fines_accidents').select('*').eq('f04_driver_id', driverId).gte('f02_date', from).lte('f02_date', to)
    ]);

    const workRecords = workRes.data || [];
    const revenueRecords = revRes.data || [];
    const fineRecords = fineRes.data || [];

    const unmatchedRevs = revenueRecords.filter(r => !r.f10_work_day_link);
    const totalUnmatched = unmatchedRevs.reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);

    // 2. Generate All Dates in Period
    const dateList = [];
    let current = new Date(from);
    const endDate = new Date(to);
    while (current <= endDate) {
        dateList.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    let totalDue = 0;
    let totalPaid = 0;
    let totalFines = fineRecords.reduce((s, f) => s + parseFloat(f.f05_amount || 0), 0);
    let workingDaysCount = 0;

    // 3. Build Table Rows (Primarily from Work Days)
    let rowsHtml = '';
    // We use dateList to ensure we show the whole period sequence as requested before
    dateList.forEach(date => {
        const dayWork = workRecords.find(w => w.f02_date === date);
        // Only include revenues linked to this day OR unlinked revenues on this specific date
        const dayRevs = revenueRecords.filter(r => {
            if (r.f02_date !== date) return false;
            if (!dayWork) return !r.f10_work_day_link; // If no work record, only show unlinked ones here
            // If there is a work record, show linked ones + unlinked ones on same day
            return true;
        });
        const dayFines = fineRecords.filter(f => f.f02_date === date);

        const dueAmount = dayWork ? parseFloat(dayWork.f05_daily_amount || 0) : 0;
        const paidAmount = dayRevs.reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
        const fineAmount = dayFines.reduce((s, f) => s + parseFloat(f.f05_amount || 0), 0);
        
        totalDue += dueAmount;
        totalPaid += paidAmount;
        if (dayWork && !dayWork.f06_is_off_day) workingDaysCount++;

        const isOff = dayWork && dayWork.f06_is_off_day;
        const isPaid = paidAmount >= dueAmount && dueAmount > 0;
        const isBroken = dueAmount > 0 && paidAmount < dueAmount;

        let statusText = '---';
        let statusStyle = '';
        if (isOff) { statusText = 'توقف'; statusStyle = 'color:#777;'; }
        else if (isPaid) { statusText = 'مدفوع ✅'; statusStyle = 'color:#27ae60; font-weight:bold;'; }
        else if (isBroken) { statusText = 'مكسور 🔴'; statusStyle = 'color:#e74c3c; font-weight:bold;'; }
        else if (!dayWork && paidAmount > 0) { statusText = 'دفعة فقط'; statusStyle = 'color:#3498db;'; }

        const dayName = new Date(date).toLocaleDateString('ar-JO', { weekday: 'long' });

        rowsHtml += `
            <tr>
                <td style="font-weight:700;">
                    <div style="font-size:0.7rem; color:var(--taxi-gold);">${dayName}</div>
                    <div>${date}</div>
                </td>
                <td>${dayWork ? 'ضمان يومي' : (paidAmount > 0 ? 'دفعة خارجية' : 'يوم غياب')}</td>
                <td class="amount-cell">${dueAmount.toLocaleString()}</td>
                <td class="amount-cell" style="color:#27ae60;">${paidAmount.toLocaleString()}</td>
                <td class="amount-cell" style="color:#e74c3c;">${fineAmount > 0 ? fineAmount.toLocaleString() : ''}</td>
                <td style="${statusStyle}">${statusText}</td>
            </tr>
        `;
    });

    const netBalance = (totalDue + totalFines) - totalPaid;

    let html = `
        <div class="report-stats-banner" style="grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 40px;">
            <div class="stat-box" style="border-top: 5px solid #3498db; padding: 15px;">
                <h4 style="font-size:0.75rem; font-weight:bold; color:#555;">إجمالي ضمان الفترة</h4>
                <div class="val" style="font-size: 1.6rem; font-weight: 900; color: #3498db;">${totalDue.toLocaleString()}</div>
            </div>
            <div class="stat-box" style="border-top: 5px solid #27ae60; padding: 15px;">
                <h4 style="font-size:0.75rem; font-weight:bold; color:#555;">إجمالي المسدد</h4>
                <div class="val" style="font-size: 1.6rem; font-weight: 900; color: #27ae60;">${totalPaid.toLocaleString()}</div>
            </div>
            <div class="stat-box" style="border-top: 5px solid #9b59b6; padding: 15px;">
                <h4 style="font-size:0.75rem; font-weight:bold; color:#555;">سداد بدون مطابقة</h4>
                <div class="val" style="font-size: 1.6rem; font-weight: 900; color: #9b59b6;">${totalUnmatched.toLocaleString()}</div>
            </div>
            <div class="stat-box" style="border-top: 5px solid #e67e22; padding: 15px;">
                <h4 style="font-size:0.75rem; font-weight:bold; color:#555;">عدد أيام العمل</h4>
                <div class="val" style="font-size: 1.6rem; font-weight: 900; color: #e67e22;">${workingDaysCount} <small style="font-size:0.8rem; font-weight:normal;">يوم</small></div>
            </div>
            <div class="stat-box" style="border-top: 5px solid #e74c3c; background: #fff8f8; padding: 15px;">
                <h4 style="font-size:0.75rem; font-weight:bold; color:#c0392b;">الذمة المتبقية</h4>
                <div class="val" style="font-size: 1.6rem; font-weight: 900; color: #e74c3c;">${netBalance.toLocaleString()}</div>
            </div>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>التاريخ واليوم</th>
                    <th>البيان</th>
                    <th>المستحق (+)</th>
                    <th>المسدد (-)</th>
                    <th>المخالفات (+)</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr style="background:#f9f9f9; font-weight:900;">
                    <td colspan="2">المجموع الكلي</td>
                    <td>${totalDue.toLocaleString()}</td>
                    <td style="color:#27ae60;">${totalPaid.toLocaleString()}</td>
                    <td style="color:#e74c3c;">${totalFines.toLocaleString()}</td>
                    <td style="font-size:1.2rem; color:${netBalance > 0 ? '#e74c3c' : '#27ae60'}">${netBalance.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    `;

    const reportTitle = `كشف حساب السائق: ${driver.f02_name}`;
    const dateRange = `الفترة من ${from} إلى ${to}`;
    updateUIAndPrint(reportTitle, dateRange, html);
}

// --- [2] مخلص مالي عام (Financial Summary) ---
async function buildFinancialSummary(from, to) {
    const [revRes, expRes, fineRes] = await Promise.all([
        _supabase.from('t05_revenues').select('f06_amount').gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t06_expenses').select('f07_amount').gte('f02_date', from).lte('f02_date', to),
        _supabase.from('t09_fines_accidents').select('f05_amount').gte('f02_date', from).lte('f02_date', to)
    ]);

    const totalRev = revRes.data.reduce((sum, r) => sum + parseFloat(r.f06_amount), 0);
    const totalExp = expRes.data.reduce((sum, e) => sum + parseFloat(e.f07_amount), 0);
    const totalFines = fineRes.data.reduce((sum, f) => sum + parseFloat(f.f05_amount), 0);
    const netProfit = totalRev - totalExp;

    const html = `
        <div class="report-stats-banner">
            <div class="stat-box"><h4>إجمالي الإيرادات</h4><div class="val">${totalRev.toLocaleString()}</div></div>
            <div class="stat-box"><h4>إجمالي المصاريف</h4><div class="val" style="color:var(--taxi-red)">${totalExp.toLocaleString()}</div></div>
            <div class="stat-box"><h4>صافي الربح التشغيلي</h4><div class="val" style="color:var(--taxi-green)">${netProfit.toLocaleString()}</div></div>
            <div class="stat-box"><h4>ذمم مخالفات معلقة</h4><div class="val">${totalFines.toLocaleString()}</div></div>
        </div>
        <p style="text-align:center; margin-top:40px; color:#666;">* تم احتساب صافي الربح بناءً على (الإيراد المحصل - المصاريف المسجلة) خلال الفترة المحددة.</p>
    `;

    updateUIAndPrint("ملخص الأداء المالي العام", `الفترة من ${from} إلى ${to}`, html);
}

// --- [3] تقرير الأيام المكسورة (Broken Days) ---
async function buildBrokenDaysReport(from, to) {
    const { data: workDays } = await _supabase
        .from('t08_work_days')
        .select('*')
        .gte('f02_date', from)
        .lte('f02_date', to)
        .eq('f06_is_off_day', false);

    // Fetch all revenues to catch late payments regardless of date
    const { data: revenues } = await _supabase
        .from('t05_revenues')
        .select('f01_id, f02_date, f03_car_no, f06_amount');

    const allRevs = revenues || [];

    // Grouping by driver
    const driverGroups = {};

    workDays.forEach(day => {
        // Calculate same-day payments
        const sameDayRev = allRevs
            .filter(r => r.f03_car_no === day.f03_car_no && r.f02_date === day.f02_date)
            .reduce((sum, r) => sum + parseFloat(r.f06_amount), 0);

        // Calculate mapped late payments
        // Late payment matching removed (f10_work_day_link column doesn't exist)
        const lateRev = 0;

        const dailyDue = parseFloat(day.f05_daily_amount);
        const initialBroken = dailyDue - sameDayRev;

        // Push EVERY day to the driver's log, whether broken or fully paid
        const driverId = day.f04_driver_id || 'unknown';
        if (!driverGroups[driverId]) driverGroups[driverId] = [];

        driverGroups[driverId].push({
            date: day.f02_date,
            car: day.f03_car_no,
            due: dailyDue,
            sameDayPaid: sameDayRev,
            brokenAmount: initialBroken < 0 ? 0 : initialBroken,
            latePaid: lateRev,
            netMissing: (initialBroken - lateRev) < 0 ? 0 : (initialBroken - lateRev)
        });
    });

    let html = '';
    let globalBroken = 0, globalLatePaid = 0, globalNetMissing = 0;

    if (Object.keys(driverGroups).length === 0) {
        html = '<div class="empty-state">لا يوجد أيام مكسورة في هذه الفترة</div>';
    } else {
        html += `<div class="investor-report-container">`;

        for (const drvId of Object.keys(driverGroups)) {
            const drvObj = drivers.find(dr => dr.f01_id == drvId);
            const drvName = drvObj ? drvObj.f02_name : 'سائق غير محدد';
            const days = driverGroups[drvId];

            let sumBroken = 0, sumLate = 0, sumMissing = 0;

            html += `
                <h3 style="background:var(--taxi-dark); color:var(--taxi-gold); padding:10px; margin-top:30px; border-radius:8px;">
                    👨‍✈️ السائق: ${drvName}
                </h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>السيارة</th>
                            <th>المطلوب</th>
                            <th>مدفوع (نفس اليوم)</th>
                            <th>تأخير / مكسور</th>
                            <th>تم السداد لاحقاً</th>
                            <th>المتبقي بالذمة</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            days.forEach(d => {
                sumBroken += d.brokenAmount;
                sumLate += d.latePaid;
                sumMissing += d.netMissing;

                const isFullyPaid = d.netMissing <= 0;

                html += `
                    <tr style="${isFullyPaid ? 'opacity:0.6; background:#f9fff9;' : ''}">
                        <td>${d.date}</td>
                        <td><b>${d.car}</b></td>
                        <td>${d.due}</td>
                        <td>${d.sameDayPaid}</td>
                        <td style="color:#c0392b; font-weight:bold;">${d.brokenAmount}</td>
                        <td style="color:#27ae60; font-weight:bold;">${d.latePaid > 0 ? d.latePaid : '-'}</td>
                        <td style="${isFullyPaid ? 'color:#27ae60;' : 'color:#e74c3c; font-weight:bold;'}">
                            ${isFullyPaid ? '0 (تم السداد ✅)' : d.netMissing}
                        </td>
                    </tr>
                `;
            });

            globalBroken += sumBroken;
            globalLatePaid += sumLate;
            globalNetMissing += sumMissing;

            html += `
                    </tbody>
                    <tfoot>
                        <tr style="background:#f1f3f5; font-weight:900;">
                            <td colspan="4" style="text-align:left;">إجمالي ذمم السائق:</td>
                            <td style="color:#c0392b;">${sumBroken}</td>
                            <td style="color:#27ae60;">${sumLate}</td>
                            <td style="color:#e74c3c; font-size:1.1rem;">${sumMissing}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        html += `
            <table class="summary-table-luxury" style="margin-top:40px; border-top:4px solid var(--taxi-dark);">
                <tr><td class="lbl" style="color:#c0392b">إجمالي الكسر العام | Total Initial Broken</td><td class="val" style="color:#c0392b;">${globalBroken.toLocaleString()}</td></tr>
                <tr><td class="lbl" style="color:#27ae60">إجمالي السداد اللاحق | Total Late Payments</td><td class="val" style="color:#27ae60;">${globalLatePaid.toLocaleString()}</td></tr>
                <tr class="net-row"><td class="lbl">إجمالي الذمم المعلقة النهائي | Net Total Missing</td><td class="val" style="color:#e74c3c; font-size:1.8rem;">${globalNetMissing.toLocaleString()}</td></tr>
            </table>
        </div>`;
    }

    updateUIAndPrint("تقرير الأيام المكسورة والذمم (تفصيلي حسب السائق)", `الفترة من ${from} إلى ${to}`, html);
}

// --- [Utility] تحديث الواجهة والطباعة ---
function updateUIAndPrint(title, range, html) {
    document.getElementById('reportPreview').innerHTML = `
        <h2 style="text-align:center; color:var(--taxi-dark); margin-bottom:10px;">${title}</h2>
        <p style="text-align:center; color:#777; margin-bottom:30px; font-weight:bold;">${range}</p>
        ${html}
    `;

    document.getElementById('print_report_title').innerHTML = title;
    document.getElementById('print_date_range').innerText = range;
    document.getElementById('print_content').innerHTML = html;
    document.getElementById('print_date').innerText = new Date().toLocaleDateString('ar-EG');
    document.getElementById('print_time').innerText = new Date().toLocaleTimeString('ar-EG');
    document.getElementById('print_staff').innerText = sessionStorage.getItem('full_name_ar') || "مدير النظام";
}

/* END OF FILE: reports.js */