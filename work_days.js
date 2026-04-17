/* START OF FILE: work_days.js */
/**
 * File: work_days.js
 * Version: v1.3.2
 * Function: المحرك المالي لتوليد المديونية اليومية ومطابقتها (الأيام المكسورة)
 */

let allWorkDays = [];
let filteredWorkDays = [];
let currentSort = { col: 'f02_date', asc: false };
let carsList = [];
let driversList = [];
let revenuesList = [];

document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filter = document.getElementById('monthFilter');
    if (filter) filter.value = currentMonth;

    initSystem();
});

async function initSystem() {
    await Promise.all([
        fetchCars(),
        fetchDrivers(),
        fetchWorkDays()
    ]);
    populateFilters();
    initTableControls();
    setupFormListener();
}

async function fetchCars() {
    const { data } = await _supabase.from('t01_cars').select('*');
    carsList = data || [];
}

async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('*');
    driversList = data || [];
}

async function fetchWorkDays() {
    const month = document.getElementById('monthFilter').value;
    if (!month) return;

    const startDate = `${month}-01`;
    const lastDay = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
    const endDate = `${month}-${lastDay}`;

    try {
        const { data: workData, error: wErr } = await _supabase
            .from('t08_work_days')
            .select('*')
            .gte('f02_date', startDate)
            .lte('f02_date', endDate)
            .order('f02_date', { ascending: false });

        if (wErr) throw wErr;

        const { data: revData } = await _supabase
            .from('t05_revenues')
            .select('*')
            .gte('f02_date', startDate)
            .lte('f02_date', endDate);

        allWorkDays = workData || [];
        filteredWorkDays = [...allWorkDays];
        revenuesList = revData || [];

        renderTable();
        calculateStats();
    } catch (err) {
        showToast("خطأ في تحميل البيانات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('workDaysTableContainer');
    if (!container) return;

    if (filteredWorkDays.length === 0) {
        container.innerHTML = '<div class="loading-state">📅 لا توجد سجلات.</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')" style="cursor:pointer">السيارة | Car ↕</th>
                    <th onclick="sortData('f04_driver_id')" style="cursor:pointer">السائق | Driver ↕</th>
                    <th onclick="sortData('f05_daily_amount')" style="cursor:pointer">المستحق | Due ↕</th>
                    <th onclick="sortData('f06_is_off_day')" style="cursor:pointer">الحالة | Status ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredWorkDays.map(day => {
                    const driver = driversList.find(d => d.f01_id == day.f04_driver_id);
                    const dayRev = revenuesList.filter(r => 
                        r.f03_car_no === day.f03_car_no && 
                        r.f02_date === day.f02_date
                    ).reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);

                    const isPaid = day.f06_is_off_day || (dayRev >= day.f05_daily_amount);
                    const statusClass = day.f06_is_off_day ? 'badge-off' : (isPaid ? 'badge-paid' : 'badge-broken');
                    const statusText = day.f06_is_off_day ? 'توقف' : (isPaid ? 'مسدد ✅' : 'مكسور 🔴');

                    return `
                        <tr>
                            <td style="font-weight:700;">${day.f02_date}</td>
                            <td>${window.formatJordanPlate(day.f03_car_no, true)}</td>
                            <td>${driver ? driver.f02_name : '---'}</td>
                            <td style="font-weight:bold;">${day.f05_daily_amount}</td>
                            <td style="color:${dayRev > 0 ? 'var(--taxi-green)' : '#999'}">${dayRev}</td>
                            <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    <button class="btn-action-sm btn-view" onclick='showViewModal(${JSON.stringify(day)}, "تفاصيل اليوم | Day Details")' title="عرض">👁️</button>
                                    <button class="btn-action-sm btn-edit" onclick="openAdjustmentModal(${day.f01_id})" title="تعديل">🛠️</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    updateCounter();
}

function calculateStats() {
    const totalDays = allWorkDays.length;
    const totalDaman = allWorkDays.reduce((sum, d) => sum + parseFloat(d.f05_daily_amount || 0), 0);
    
    let brokenCount = 0;
    allWorkDays.forEach(day => {
        if (!day.f06_is_off_day) {
            const dayRev = revenuesList.filter(r => r.f03_car_no === day.f03_car_no && r.f02_date === day.f02_date)
                                      .reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
            if (dayRev < day.f05_daily_amount) brokenCount++;
        }
    });

    const s1 = document.getElementById('stat_total_days');
    const s2 = document.getElementById('stat_broken_days');
    const s3 = document.getElementById('stat_total_daman');
    if(s1) s1.innerText = totalDays;
    if(s2) s2.innerText = brokenCount;
    if(s3) s3.innerText = totalDaman.toLocaleString();
}

async function triggerAutoGeneration() {
    const today = new Date();
    if (today.getDay() === 5) { // Friday
        showToast("اليوم هو الجمعة، لا يتم توليد مديونية تلقائياً ✅", "info");
        return;
    }

    const todayStr = today.toISOString().split('T')[0];
    const btn = document.getElementById('generateBtn');
    if(btn) btn.disabled = true;

    try {
        const { data: allCars } = await _supabase.from('t01_cars').select('*');
        const cars = (allCars || []).filter(c => 
            !c.f11_is_active || c.f11_is_active.includes('نشط') || c.f11_is_active.toLowerCase().includes('active')
        );
        if (!cars || cars.length === 0) {
            showToast("لا يوجد سيارات فعالة حالياً", "warning");
            return;
        }

        const { data: existing } = await _supabase.from('t08_work_days').select('f03_car_no').eq('f02_date', todayStr);
        const existingPlates = (existing || []).map(e => e.f03_car_no);

        const toInsert = [];
        for (const car of cars) {
            if (!existingPlates.includes(car.f02_plate_no)) {
                // Find driver assigned to this car
                const { data: drv } = await _supabase.from('t02_drivers').select('f01_id').eq('f08_car_no', car.f02_plate_no).maybeSingle();
                
                if (drv) {
                    toInsert.push({
                        f02_date: todayStr,
                        f03_car_no: car.f02_plate_no,
                        f04_driver_id: drv.f01_id,
                        f05_daily_amount: car.f08_standard_rent || 0,
                        f06_is_off_day: false
                    });
                }
            }
        }

        if (toInsert.length > 0) {
            const { error } = await _supabase.from('t08_work_days').insert(toInsert);
            if (error) throw error;
            showToast(`تم توليد (${toInsert.length}) سجلاً بنجاح ✅`, "success");
            fetchWorkDays();
        } else {
            showToast("تم توليد جميع سجلات اليوم مسبقاً ✨", "info");
        }
    } catch (err) {
        console.error(err);
        showToast("فشل في توليد السجلات", "error");
    } finally {
        if(btn) btn.disabled = false;
    }
}

function openAdjustmentModal(id) {
    const day = allWorkDays.find(d => d.f01_id === id);
    if (!day) return;

    document.getElementById('f01_id').value = day.f01_id;
    document.getElementById('adj_type').value = day.f06_is_off_day ? 'off' : 'active';
    document.getElementById('f05_amount').value = day.f05_daily_amount;
    document.getElementById('f07_reason').value = day.f07_reason_if_off || '';
    
    toggleOffDayReason();
    const modal = document.getElementById('adjustmentModal');
    if(modal) modal.classList.add('open');
}

function toggleOffDayReason() {
    const isOff = document.getElementById('adj_type').value === 'off';
    const reasonGrp = document.getElementById('reasonGroup');
    const fAmt = document.getElementById('f05_amount');
    
    if(reasonGrp) reasonGrp.style.display = isOff ? 'block' : 'none';
    if(isOff && fAmt) fAmt.value = 0;
}

function closeModal() {
    const modal = document.getElementById('adjustmentModal');
    if(modal) modal.classList.remove('open');
}

function setupFormListener() {
    const form = document.getElementById('adjustmentForm');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            safeSubmit(async () => {
                const id = document.getElementById('f01_id').value;
                const payload = {
                    f06_is_off_day: document.getElementById('adj_type').value === 'off',
                    f05_daily_amount: parseFloat(document.getElementById('f05_amount').value),
                    f07_reason_if_off: document.getElementById('f07_reason').value
                };

                const { error } = await _supabase.from('t08_work_days').update(payload).eq('f01_id', id);
                if (!error) {
                    showToast("تم تحديث السجل بنجاح", "success");
                    closeModal();
                    fetchWorkDays();
                }
            });
        });
    }
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">سجلات العمل: <span id="count">${allWorkDays.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالتاريخ أو السيارة..." onkeyup="filterLocal()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        `;
    }
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredWorkDays = allWorkDays.filter(d => 
        (d.f02_date && d.f02_date.toLowerCase().includes(term)) || 
        (d.f03_car_no && d.f03_car_no.toLowerCase().includes(term))
    );
    renderTable();
}

function populateFilters() {
    const carSel = document.getElementById('carFilter');
    const driverSel = document.getElementById('driverFilter');
    if(carSel && carsList.length > 0) {
        carSel.innerHTML = '<option value="all">كل السيارات | All Cars</option>' + 
            carsList.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
    }
    if(driverSel && driversList.length > 0) {
        driverSel.innerHTML = '<option value="all">كل السائقين | All Drivers</option>' + 
            driversList.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
    }
}

function filterLocalData() {
    const car = document.getElementById('carFilter').value;
    const driver = document.getElementById('driverFilter').value;
    filteredWorkDays = allWorkDays.filter(d => {
        const carMatch = car === 'all' || d.f03_car_no === car;
        const driverMatch = driver === 'all' || String(d.f04_driver_id) === driver;
        return carMatch && driverMatch;
    });
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredWorkDays.length;
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredWorkDays.sort((a, b) => {
        let vA = a[col] || '';
        let vB = b[col] || '';
        
        if (!isNaN(vA) && !isNaN(vB) && vA !== "" && vB !== "") {
            vA = parseFloat(vA);
            vB = parseFloat(vB);
        }

        if (vA < vB) return currentSort.asc ? -1 : 1;
        if (vA > vB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    renderTable();
}

/* END OF FILE: work_days.js */
