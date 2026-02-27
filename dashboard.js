/* ==================================================================
 [dashboard.js] - المحرك التحليلي الشامل والمطور
 ================================================================== */

async function loadComprehensiveDashboard() {
    try {
        // 1. تحديد النطاق الزمني من الفلتر
        const monthFilter = document.getElementById('monthFilter');
        if (!monthFilter) return;
        
        const selectedMonth = monthFilter.value; // صيغة YYYY-MM
        const startDate = `${selectedMonth}-01`;
        const lastDay = new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate();
        const endDate = `${selectedMonth}-${lastDay}`;

        // 2. جلب البيانات من Supabase
        const [revRes, carsRes, driversRes, ownersRes] = await Promise.all([
            _supabase.from('t05_revenues').select('*')
                .gte('f02_date', startDate)
                .lte('f02_date', endDate)
                .order('f02_date', { ascending: false }),
            _supabase.from('t01_cars').select('*'),
            _supabase.from('t02_drivers').select('*'),
            _supabase.from('t10_owners').select('*')
        ]);

        const revenues = revRes.data || [];
        const cars = carsRes.data || [];
        const drivers = driversRes.data || [];
        const owners = ownersRes.data || [];

        // 3. بناء بيانات الملاك
        const ownersData = owners.map(o => {
            const ownerCars = cars.filter(c => c.f11_owner_id == o.f01_id).map(c => c.f02_plate_no);
            const ownerRev = revenues.filter(r => ownerCars.includes(r.f03_car_no));
            const total = ownerRev.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
            return { 
                label: o.f02_owner_name, 
                value: total, 
                icon: '🏢', 
                sub: `إيراد الشهر: ${total.toLocaleString()}`, 
                footer: `عدد حركات المالك: ${ownerRev.length}` 
            };
        });

        // 4. بناء بيانات السيارات
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

        // 5. بناء بيانات السائقين
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

        // 6. رسم البطاقات في الأقسام المخصصة مع التمييز اللوني
        renderGroupedCards('ownersSection', ownersData, 'owner-card');
        renderGroupedCards('carsSection', carsData, 'car-card');
        renderGroupedCards('driversSection', driversData, 'driver-card');

    } catch (err) {
        console.error("Dashboard Error:", err);
        if(window.showModal) window.showModal("خطأ", "فشل في تحديث البيانات", "error");
    }
}

/**
 * دالة الرسم الموحدة - تُنشئ البطاقات مع أرقام تسلسلية دائرية
 */
function renderGroupedCards(containerId, dataList, typeClass) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = dataList.map((item, index) => `
        <div class="mini-card ${typeClass}">
            <div class="card-badge">${index + 1}</div>
            
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="font-size:0.9rem; color:#444; font-weight:bold;">${item.label}</span>
                    <span style="background:#f8f9fa; padding:5px; border-radius:8px;">${item.icon}</span>
                </div>
                <div style="font-size:1.6rem; font-weight:900; color:var(--taxi-dark);">
                    ${item.value.toLocaleString()} <small style="font-size:0.8rem; color:#888;">JOD</small>
                </div>
                <div style="font-size:0.8rem; margin-top:8px; display:inline-block; background:rgba(39, 174, 96, 0.1); color:#27ae60; padding:2px 10px; border-radius:20px; font-weight:bold;">
                    ${item.sub}
                </div>
            </div>
            <div style="margin-top:15px; padding-top:12px; border-top:1px dashed #ddd; font-size:0.75rem; color:#666; line-height:1.5;">
                ${item.footer}
            </div>
        </div>
    `).join('');
}

// دالة التعامل مع زر التحديث (Refresh) بنظام المودال
async function handleRefresh() {
    await loadComprehensiveDashboard();
    if(window.showModal) {
        window.showModal("تم التحديث", "تمت مزامنة بيانات الشهر بنجاح ✅", "success");
    }
}