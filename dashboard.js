/* ==================================================================
 [dashboard.js] - النسخة المصححة والمغلقة بالكامل
 ================================================================== */

async function loadComprehensiveDashboard() {
    try {
        const monthFilter = document.getElementById('monthFilter');
        if (!monthFilter) return;
        
        const selectedMonth = monthFilter.value; 
        const year = selectedMonth.split('-')[0];
        const month = selectedMonth.split('-')[1];
        const startDate = `${selectedMonth}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${selectedMonth}-${lastDay}`;

        const ownersSection = document.getElementById('ownersSection');
        if (ownersSection) ownersSection.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">⏳ جاري تحديث البيانات...</div>';

        const [revRes, carsRes, driversRes, ownersRes] = await Promise.all([
            _supabase.from('t05_revenues').select('*').gte('f02_date', startDate).lte('f02_date', endDate).order('f02_date', { ascending: false }),
            _supabase.from('t01_cars').select('*'),
            _supabase.from('t02_drivers').select('*'),
            _supabase.from('t10_owners').select('*')
        ]);

        const revenues = revRes.data || [];
        const cars = carsRes.data || [];
        const drivers = driversRes.data || [];
        const owners = ownersRes.data || [];

        // بناء بيانات الملاك بنسبة 25/75
        if (ownersSection) {
            ownersSection.innerHTML = owners.map((owner, index) => {
                const ownerCarsList = cars.filter(c => c.f11_owner_id == owner.f01_id);
                const ownerCarPlates = ownerCarsList.map(c => c.f02_plate_no);
                const ownerRevRecords = revenues.filter(r => ownerCarPlates.includes(r.f03_car_no));
                const totalOwnerRevenue = ownerRevRecords.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);

                const carsDetailHTML = ownerCarsList.map(car => {
                    const carAmount = revenues.filter(r => r.f03_car_no === car.f02_plate_no)
                                              .reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
                    return `
                        <div class="car-item-row-grid">
                            <span>🚕 ${car.f02_plate_no}</span>
                            <span class="car-amount-tag">${carAmount.toLocaleString()} <small>د.أ</small></span>
                        </div>`;
                }).join('');

                return `
                    <div class="mini-card owner-card">
                        <div class="card-badge">${index + 1}</div>
                        <h3 class="owner-name-header-center">${owner.f02_owner_name}</h3>
                        <div class="card-split-body">
                            <div class="revenue-section-quarter">
                                <div class="revenue-display-box-compact">
                                    <span class="rev-label-tiny">إجمالي الإيراد</span>
                                    <div class="rev-value-bold">${totalOwnerRevenue.toLocaleString()}</div>
                                    <span class="currency-tag">دينار</span>
                                </div>
                            </div>
                            <div class="list-section-three-quarters">
                                <div class="cars-scroll-wrapper-wide">
                                    <div class="list-header-info">الأسطول (${ownerCarsList.length} سيارة)</div>
                                    <div class="cars-grid-layout">${carsDetailHTML || 'لا توجد سيارات'}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        // بناء بيانات السيارات
        const carsData = cars.map(c => {
            const carRev = revenues.filter(r => r.f03_car_no === c.f02_plate_no);
            const total = carRev.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
            return { 
                label: `السيارة: ${c.f02_plate_no}`, 
                value: total, 
                icon: '🚖', 
                sub: `حركات الشهر: ${carRev.length}`, 
                footer: `آخر سائق: ${carRev[0]?.f04_driver_name || 'N/A'}<br>بتاريخ: ${carRev[0]?.f02_date || '-'}` 
            };
        });

        // بناء بيانات السائقين
        const driversData = drivers.map(d => {
            const driverRev = revenues.filter(r => r.f04_driver_name === d.f02_name);
            const total = driverRev.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
            return { 
                label: d.f02_name, 
                value: total, 
                icon: '👨‍✈️', 
                sub: `إنتاجية الشهر: ${total.toLocaleString()}`, 
                footer: `آخر سيارة: ${driverRev[0]?.f03_car_no || 'N/A'}<br>بتاريخ: ${driverRev[0]?.f02_date || '-'}` 
            };
        });

        renderGroupedCards('carsSection', carsData, 'car-card');
        renderGroupedCards('driversSection', driversData, 'driver-card');

    } catch (err) {
        console.error("Dashboard Error:", err);
    }
}

function renderGroupedCards(containerId, dataList, typeClass) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = dataList.map((item, index) => `
        <div class="mini-card ${typeClass}">
            <div class="card-badge">${index + 1}</div>
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="font-size:0.95rem; color:var(--taxi-dark); font-weight:bold;">${item.label}</span>
                    <span style="background:#f8f9fa; padding:8px; border-radius:10px; font-size:1.2rem;">${item.icon}</span>
                </div>
                <div style="font-size:1.8rem; font-weight:900; color:var(--taxi-dark); line-height:1.2;">
                    ${item.value.toLocaleString()} <small style="font-size:0.8rem; color:#888;">د.أ</small>
                </div>
                <div style="font-size:0.8rem; margin-top:10px; display:inline-block; background:rgba(39, 174, 96, 0.1); color:#27ae60; padding:4px 12px; border-radius:20px; font-weight:bold;">
                    ${item.sub}
                </div>
            </div>
            <div style="margin-top:15px; padding-top:12px; border-top:1px dashed #eee; font-size:0.75rem; color:#666; line-height:1.5;">
                ${item.footer}
            </div>
        </div>
    `).join('');
}

async function handleRefresh() {
    await loadComprehensiveDashboard();
    if(window.showModal) {
        window.showModal("تم التحديث", "تمت مزامنة بيانات الشهر بنجاح ✅", "success");
    }
}