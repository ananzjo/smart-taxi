/* 
 * File: dashboard-v2.js 
 * Version: v2.0.0 [NEW FILE]
 */

async function loadComprehensiveDashboard() {
    try {
        const monthFilter = document.getElementById('monthFilter').value;
        const staffFilter = document.getElementById('staffFilter').value;
        const ownerFilter = document.getElementById('ownerFilter').value;
        
        const [y, m] = monthFilter.split('-').map(Number);
        const startDate = `${monthFilter}-01`;
        const endDate = `${monthFilter}-${new Date(y, m, 0).getDate()}`;
        
        const prevMonthDate = new Date(y, m - 2, 1);
        const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const prevStart = prevMonthStr + "-01";
        const prevEnd = prevMonthStr + "-" + new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();

        // Fetching Current and Previous Month data for comparison
        const [revRes, expRes, carsRes, driversRes, ownersRes, staffRes, prevRevRes, workRes, prevExpRes, prevWorkRes] = await Promise.all([
            _supabase.from('t05_revenues').select('*').gte('f02_date', startDate).lte('f02_date', endDate),
            _supabase.from('t06_expenses').select('*').gte('f02_date', startDate).lte('f02_date', endDate),
            _supabase.from('t01_cars').select('*'),
            _supabase.from('t02_drivers').select('f01_id, f02_name, f08_car_no'),
            _supabase.from('t10_owners').select('*'),
            _supabase.from('t11_staff').select('f01_id, f02_name'),
            _supabase.from('t05_revenues').select('*').gte('f02_date', prevStart).lte('f02_date', prevEnd),
            _supabase.from('t08_work_days').select('*').gte('f02_date', startDate).lte('f02_date', endDate),
            _supabase.from('t06_expenses').select('*').gte('f02_date', prevStart).lte('f02_date', prevEnd),
            _supabase.from('t08_work_days').select('*').gte('f02_date', prevStart).lte('f02_date', prevEnd)
        ]);

        let revenues = revRes.data || [];
        let expenses = expRes.data || [];
        let workDays = workRes.data || [];
        const cars = carsRes.data || [];
        const drivers = driversRes.data || [];
        const owners = ownersRes.data || [];
        const staff = staffRes.data || [];
        
        let prevRevenues = prevRevRes.data || [];
        let prevExpenses = prevExpRes.data || [];
        let prevWorkDays = prevWorkRes.data || [];

        // Apply Filters to Cars First
        let filteredCars = cars;
        if (ownerFilter !== 'all') {
            filteredCars = filteredCars.filter(c => String(c.f10_owner_id) === String(ownerFilter));
        }
        if (staffFilter !== 'all') {
            filteredCars = filteredCars.filter(c => String(c.f14_staff_id) === String(staffFilter));
        }

        // Filter Data based on Filtered Cars
        if (ownerFilter !== 'all' || staffFilter !== 'all') {
            const validPlates = filteredCars.map(c => c.f02_plate_no);
            revenues = revenues.filter(r => validPlates.includes(r.f03_car_no));
            expenses = expenses.filter(e => validPlates.includes(e.f03_car_no));
            workDays = workDays.filter(w => validPlates.includes(w.f03_car_no));
            
            prevRevenues = prevRevenues.filter(r => validPlates.includes(r.f03_car_no));
            prevExpenses = prevExpenses.filter(e => validPlates.includes(e.f03_car_no));
            prevWorkDays = prevWorkDays.filter(w => validPlates.includes(w.f03_car_no));
        }

        // Further restrict Revenues and Expenses specifically to the staff member's actions
        if (staffFilter !== 'all') {
            const sf = String(staffFilter);
            revenues = revenues.filter(r => String(r.f08_collector_id) === sf);
            expenses = expenses.filter(e => String(e.f09_staff_id) === sf);
            prevRevenues = prevRevenues.filter(r => String(r.f08_collector_id) === sf);
            prevExpenses = prevExpenses.filter(e => String(e.f09_staff_id) === sf);
        }

        // --- Current Month Metrics ---
        const expectedRev = workDays.filter(w => !w.f06_is_off_day).reduce((s, w) => s + parseFloat(w.f05_daily_amount || 0), 0);
        const actualRev = revenues.reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
        const totalExp = expenses.reduce((s, e) => s + parseFloat(e.f07_amount || 0), 0);
        const netProfit = actualRev - totalExp;

        const rentActual = revenues.filter(r => r.f05_category === 'ضمان يومي').reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
        const driverDebt = Math.max(0, expectedRev - rentActual);
        const paidExp = expenses.filter(e => e.f10_status === 'Paid|مدفوع' || e.f10_status === 'مدفوع').reduce((s, e) => s + parseFloat(e.f07_amount || 0), 0);
        const unpaidExp = totalExp - paidExp;

        // --- Previous Month Metrics (for Comparison) ---
        const prevExpectedRev = prevWorkDays.filter(w => !w.f06_is_off_day).reduce((s, w) => s + parseFloat(w.f05_daily_amount || 0), 0);
        const prevActualRev = prevRevenues.reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
        const prevTotalExp = prevExpenses.reduce((s, e) => s + parseFloat(e.f07_amount || 0), 0);
        const prevNetProfit = prevActualRev - prevTotalExp;

        // Update Primary Stats UI
        document.getElementById('expectedRevenue').innerText = expectedRev.toLocaleString() + " JD";
        document.getElementById('totalRevenue').innerText = actualRev.toLocaleString() + " JD";
        document.getElementById('driverDebt').innerText = driverDebt.toLocaleString() + " JD";
        document.getElementById('totalExpenses').innerText = totalExp.toLocaleString() + " JD";
        document.getElementById('paidExpenses').innerText = paidExp.toLocaleString();
        document.getElementById('unpaidExpenses').innerText = unpaidExp.toLocaleString();
        document.getElementById('netProfit').innerText = netProfit.toLocaleString() + " JD";
        
        // --- Update Comparison Growth Cards ---
        updateGrowthCard('expectedGrowth', expectedRev, prevExpectedRev);
        updateGrowthCard('actualGrowth', actualRev, prevActualRev);
        updateGrowthCard('expenseGrowth', totalExp, prevTotalExp, true); // True because higher expenses are usually red
        updateGrowthCard('profitGrowth', netProfit, prevNetProfit);

        // [3] Owner Performance Table
        const ownersTable = document.getElementById('ownersTable').querySelector('tbody');
        ownersTable.innerHTML = owners.map((owner, idx) => {
            const ownerCars = filteredCars.filter(c => String(c.f10_owner_id) === String(owner.f01_id));
            const plates = ownerCars.map(c => c.f02_plate_no);
            const oRev = revenues.filter(r => plates.includes(r.f03_car_no)).reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
            const oExp = expenses.filter(e => plates.includes(e.f03_car_no)).reduce((s, e) => s + parseFloat(e.f07_amount || 0), 0);
            return `<tr><td><span class="rank-badge">${idx + 1}</span></td><td style="font-weight:bold;">${owner.f02_owner_name}</td><td>${ownerCars.length}</td><td class="amount-up">${oRev.toLocaleString()}</td><td class="amount-down">${oExp.toLocaleString()}</td><td style="font-weight:900;">${(oRev - oExp).toLocaleString()}</td></tr>`;
        }).join('');

        // [4] Top 10 Cars
        const carsData = filteredCars.map(car => {
            const cRev = revenues.filter(r => r.f03_car_no === car.f02_plate_no).reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
            const cExp = expenses.filter(e => e.f03_car_no === car.f02_plate_no).reduce((s, e) => s + parseFloat(e.f07_amount || 0), 0);
            return { plate: car.f02_plate_no, rev: cRev, exp: cExp, net: cRev - cExp };
        }).sort((a, b) => b.rev - a.rev).slice(0, 10);

        const carsTable = document.getElementById('carsTable').querySelector('tbody');
        carsTable.innerHTML = carsData.map(c => `<tr><td style="font-weight:bold;">${window.formatJordanPlate(c.plate, true)}</td><td class="amount-up">${c.rev.toLocaleString()}</td><td class="amount-down">${c.exp.toLocaleString()}</td><td style="font-weight:900; background:#f0f9f4;">${c.net.toLocaleString()}</td></tr>`).join('');

        // [5] Top Drivers List
        const driversData = drivers.map(d => {
            const dRev = revenues.filter(r => r.f04_driver_id === d.f01_id).reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
            return { name: d.f02_name, rev: dRev };
        }).sort((a, b) => b.rev - a.rev).slice(0, 5);

        document.getElementById('driversList').innerHTML = driversData.map(d => `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 5px; border-bottom:1px solid #f5f5f5;"><span style="font-weight:bold;">👨‍✈️ ${d.name}</span><span class="amount-up">${d.rev.toLocaleString()} <small>د.أ</small></span></div>`).join('');

        const staffData = staff.map(s => {
            const sRev = revenues.filter(r => String(r.f08_collector_id) === String(s.f01_id)).reduce((s, r) => s + parseFloat(r.f06_amount || 0), 0);
            return { name: s.f02_name, rev: sRev };
        }).sort((a, b) => b.rev - a.rev);

        document.getElementById('staffList').innerHTML = staffData.map(s => `
            <div style="margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:5px;"><span>${s.name}</span><span style="font-weight:bold;">${s.rev.toLocaleString()} JD</span></div>
                <div style="height:6px; background:#eee; border-radius:10px; overflow:hidden;"><div style="width:${actualRev > 0 ? (s.rev / actualRev * 100) : 0}%; height:100%; background:#d4af37;"></div></div>
            </div>`).join('');

        document.getElementById('updateTime').innerText = "آخر تحديث: " + new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

    } catch (err) {
        console.error("Aggregation Error:", err);
    }
}

function updateGrowthCard(elementId, current, previous, inverse = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (previous === 0) {
        el.innerText = current > 0 ? "+100%" : "0%";
        el.style.color = "#888";
        return;
    }
    
    const growth = (((current - previous) / previous) * 100).toFixed(1);
    const sign = growth > 0 ? "+" : "";
    el.innerText = `${sign}${growth}%`;
    
    // Logic for color: usually growth is green, decline is red. 
    // If inverse=true (like for expenses), growth is red.
    const isPositive = parseFloat(growth) >= 0;
    if (inverse) {
        el.style.color = isPositive ? "#e74c3c" : "#27ae60";
    } else {
        el.style.color = isPositive ? "#27ae60" : "#e74c3c";
    }
}

window.loadComprehensiveDashboard = loadComprehensiveDashboard;
