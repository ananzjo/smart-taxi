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
    populateFormDropdowns();
    initTableControls();
    setupFormListener();
    resetWorkDayForm();
}

/**
 * عرض تفاصيل اليوم مع معلومات الدفع إن وجدت
 */
function viewWorkDay(id) {
    const day = allWorkDays.find(d => d.f01_id === id);
    if (!day) return;

    const driver = driversList.find(d => d.f01_id == day.f04_driver_id);
    
    // البحث عن الإيرادات المرتبطة
    const linkedRevs = revenuesList.filter(r => {
        if (r.f10_work_day_link) {
            try {
                const ids = JSON.parse(r.f10_work_day_link);
                return ids.includes(day.f01_id);
            } catch(e) { return false; }
        }
        // Fallback for date-based matching
        return !r.f10_work_day_link && r.f03_car_no === day.f03_car_no && r.f02_date === day.f02_date;
    });

    const viewData = {
        f02_date: day.f02_date,
        f03_car_no: day.f03_car_no,
        f04_driver_id: driver ? driver.f02_name : day.f04_driver_id,
        f05_daily_amount: day.f05_daily_amount + " د.أ",
        f06_is_off_day: day.f06_is_off_day ? "يوم توقف (Off Day)" : "يوم عمل نشط",
        f07_reason_if_off: day.f07_reason_if_off || "---",
        payment_info: linkedRevs.length > 0 
            ? linkedRevs.map(r => `بتاريخ ${r.f02_date} بمبلغ ${r.f06_amount} د.أ (${r.f07_method})`).join(' | ')
            : "لم يتم الدفع بعد / مكسور"
    };

    const labels = {
        f06_is_off_day: 'نوع اليوم | Day Type',
        f07_reason_if_off: 'السبب | Reason',
        payment_info: 'معلومات الدفع | Payment Info'
    };

    window.showViewModal(viewData, "تفاصيل سجل العمل | Work Day Details", labels);
}

function populateFormDropdowns() {
    fillOptions('f03_car_no', carsList, 'f02_plate_no', 'f02_plate_no', '-- اختر السيارة --');
    fillOptions('f04_driver_id', driversList, 'f01_id', 'f02_name', '-- اختر السائق --');
    
    // الفلترة للسيارات الفعالة فقط في التوليد المجمع (نفس منطق صفحة العهدة)
    const activeCars = carsList.filter(car => {
        const s = (car.f11_is_active || '').toLowerCase();
        const isExplicitlyInActive = s.includes('inactive') || s.includes('غير') || s.includes('off');
        return !isExplicitlyInActive && (s.includes('active') || s.includes('نشط') || s.includes('مشغول'));
    });
    fillOptions('bulk_car_no', activeCars, 'f02_plate_no', 'f02_plate_no', '-- اختر السيارة --');
    
    // إضافة مستمع لحدث التغيير لجلب آخر ضمان
    const bulkCarSelect = document.getElementById('bulk_car_no');
    if (bulkCarSelect) {
        bulkCarSelect.onchange = updateBulkAmount;
    }
}

async function updateBulkAmount() {
    const carNo = document.getElementById('bulk_car_no').value;
    if (!carNo) return;

    try {
        const { data, error } = await _supabase
            .from('t04_handover')
            .select('f08_daman')
            .eq('f04_car_no', carNo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data && data.f08_daman) {
            document.getElementById('bulk_amount').value = data.f08_daman;
        } else {
            // Fallback to car's standard rent if handover not found
            const car = carsList.find(c => c.f02_plate_no === carNo);
            if (car && car.f08_standard_rent) {
                document.getElementById('bulk_amount').value = car.f08_standard_rent;
            }
        }
    } catch (e) {
        console.error("Error fetching last daman:", e);
    }
}

function openBulkModal() {
    const modal = document.getElementById('bulkModal');
    if(modal) modal.style.display = 'flex';
}

function closeBulkModal() {
    const modal = document.getElementById('bulkModal');
    if(modal) modal.style.display = 'none';
}

async function startBulkGeneration() {
    const carNo = document.getElementById('bulk_car_no').value;
    const startStr = document.getElementById('bulk_start_date').value;
    const endStr = document.getElementById('bulk_end_date').value;
    const amount = parseFloat(document.getElementById('bulk_amount').value) || 0;

    if (!carNo || !startStr || !endStr) {
        return showToast("يرجى تعبئة جميع الخانات", "warning");
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (start > end) return showToast("تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء", "warning");

    // Find the driver currently assigned to this car
    const driver = driversList.find(d => d.f08_car_no === carNo);
    const driverId = driver ? driver.f01_id : null;

    if (!driverId) {
        return showToast("هذه السيارة ليس لها سائق حالي مرتبط بها", "error");
    }

    const toInsert = [];
    let current = new Date(start);
    
    // Fetch existing records in this range to avoid duplicates
    const { data: existing } = await _supabase.from('t08_work_days')
        .select('f02_date')
        .eq('f03_car_no', carNo)
        .gte('f02_date', startStr)
        .lte('f02_date', endStr);
    
    const existingDates = new Set((existing || []).map(e => e.f02_date));

    while (current <= end) {
        const dStr = current.toISOString().split('T')[0];
        // Skip Fridays (index 5 in ISO/JS usually, but let's be safe with getDay())
        // getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        if (current.getDay() !== 5 && !existingDates.has(dStr)) {
            toInsert.push({
                f02_date: dStr,
                f03_car_no: carNo,
                f04_driver_id: driverId,
                f05_daily_amount: amount,
                f06_is_off_day: false
            });
        }
        current.setDate(current.getDate() + 1);
    }

    if (toInsert.length === 0) {
        return showToast("لا توجد أيام جديدة لتوليدها في هذه الفترة", "info");
    }

    const { error } = await _supabase.from('t08_work_days').insert(toInsert);
    if (!error) {
        showToast(`تم توليد ${toInsert.length} سجل بنجاح`, "success");
        closeBulkModal();
        fetchWorkDays();
    } else {
        showToast("خطأ أثناء التوليد: " + error.message, "error");
    }
}

function resetWorkDayForm() {
    const form = document.getElementById('workDayForm');
    if (!form) return;
    form.reset();
    document.getElementById('f01_id').value = '';
    document.getElementById('f02_date').valueAsDate = new Date();
    toggleOffDayReasonMain();
}

function toggleOffDayReasonMain() {
    const isOff = document.getElementById('f06_is_off_day').value === 'true';
    const group = document.getElementById('mainReasonGroup');
    const amountInput = document.getElementById('f05_daily_amount');
    if (group) group.style.display = isOff ? 'block' : 'none';
    if (isOff && amountInput) amountInput.value = 0;
    else if (!isOff && amountInput && amountInput.value == 0) amountInput.value = 15;
}

function editWorkDay(id) {
    const day = allWorkDays.find(d => d.f01_id === id);
    if (!day) return;
    
    document.getElementById('f01_id').value = day.f01_id;
    document.getElementById('f02_date').value = day.f02_date;
    document.getElementById('f03_car_no').value = day.f03_car_no;
    document.getElementById('f04_driver_id').value = day.f04_driver_id;
    document.getElementById('f05_daily_amount').value = day.f05_daily_amount;
    document.getElementById('f06_is_off_day').value = day.f06_is_off_day.toString();
    document.getElementById('f07_reason_if_off').value = day.f07_reason_if_off || '';
    
    toggleOffDayReasonMain();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchCars() {
    try {
        const { data, error } = await _supabase
            .from('t01_cars')
            .select('*, statusLookup:sys_lookup_data!f11_is_active(f03_label_ar)');
        
        if (error) {
            // Fallback if join fails (might be a direct string column)
            const backup = await _supabase.from('t01_cars').select('*');
            carsList = backup.data || [];
        } else {
            // Map the lookup label back to f11_is_active for compatibility with existing filters
            carsList = (data || []).map(car => ({
                ...car,
                f11_is_active: car.statusLookup?.f03_label_ar || car.f11_is_active
            }));
        }
    } catch (e) {
        console.error("fetchCars error:", e);
    }
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

        // Fetch revenues with a wider range to catch payments made just before or after the month
        const padStart = new Date(new Date(startDate).getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const padEnd = new Date(new Date(endDate).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: revData } = await _supabase
            .from('t05_revenues')
            .select('*')
            .gte('f02_date', padStart)
            .lte('f02_date', padEnd);

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
                    <th onclick="sortData('f02_date')" style="cursor:pointer; width: 150px;">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')" style="cursor:pointer; width: 120px;">السيارة | Car ↕</th>
                    <th onclick="sortData('f04_driver_id')" style="cursor:pointer;">السائق | Driver ↕</th>
                    <th onclick="sortData('f05_daily_amount')" style="cursor:pointer; width: 90px;">المستحق | Due ↕</th>
                    <th onclick="sortData('f06_amount')" style="cursor:pointer; width: 90px;">المسدد | Paid ↕</th>
                    <th onclick="sortData('f06_is_off_day')" style="cursor:pointer; width: 120px;">الحالة | Status ↕</th>
                    <th style="width: 140px;">إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredWorkDays.map(day => {
                    const driver = driversList.find(d => d.f01_id == day.f04_driver_id);
                    // حساب الإيرادات المرتبطة بهذا اليوم (سواء بالمطابقة المباشرة أو التاريخ)
                    const linkedRevs = revenuesList.filter(r => {
                        if (r.f10_work_day_link) {
                            try {
                                const ids = JSON.parse(r.f10_work_day_link);
                                return ids.includes(day.f01_id);
                            } catch(e) { return false; }
                        }
                        return false;
                    });

                    // إيرادات مطابقة بالتاريخ (للحالات القديمة أو غير المطابقة يدوياً)
                    const dateMatchRevs = revenuesList.filter(r => 
                        !r.f10_work_day_link && 
                        r.f03_car_no === day.f03_car_no && 
                        r.f02_date === day.f02_date
                    );

                    // مجموع الإيراد لهذا اليوم
                    // إذا كان مرتبطاً، نفترض أنه يسدد قيمة اليوم بالكامل (أو حسب منطق العمل)
                    const linkedTotal = linkedRevs.length > 0 ? day.f05_daily_amount : 0;
                    const dateMatchTotal = dateMatchRevs.reduce((sum, r) => sum + parseFloat(r.f06_amount || 0), 0);
                    
                    const dayRev = linkedTotal + dateMatchTotal;

                    const isPaid = day.f06_is_off_day || (dayRev >= day.f05_daily_amount);
                    const statusClass = day.f06_is_off_day ? 'badge-off' : (isPaid ? 'badge-paid' : 'badge-broken');
                    const statusText = day.f06_is_off_day ? 'توقف' : (isPaid ? 'مسدد ✅' : 'مكسور 🔴');

                    // الحصول على يوم الأسبوع بالعربي
                    const dayName = new Date(day.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });

                    return `
                        <tr>
                            <td style="font-weight:700;">
                                <div style="font-size:0.8rem; color:var(--taxi-gold);">${dayName}</div>
                                <div>${day.f02_date}</div>
                            </td>
                            <td>${window.formatJordanPlate(day.f03_car_no, true)}</td>
                            <td>${driver ? driver.f02_name : '---'}</td>
                            <td style="font-weight:bold;">${day.f05_daily_amount}</td>
                            <td style="color:${dayRev > 0 ? 'var(--taxi-green)' : '#999'}">${dayRev}</td>
                            <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    <button class="btn-action-sm btn-view" onclick='viewWorkDay("${day.f01_id}")' title="عرض">👁️</button>
                                    <button class="btn-action-sm btn-edit" onclick="editWorkDay('${day.f01_id}')" title="تعديل">✏️</button>
                                    <button class="btn-action-sm btn-delete" onclick="deleteWorkDay('${day.f01_id}')" title="حذف">🗑️</button>
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


function setupFormListener() {
    const form = document.getElementById('workDayForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            safeSubmit(async () => {
                const id = document.getElementById('f01_id').value;
                const payload = {
                    f02_date: document.getElementById('f02_date').value,
                    f03_car_no: document.getElementById('f03_car_no').value,
                    f04_driver_id: document.getElementById('f04_driver_id').value,
                    f05_daily_amount: parseFloat(document.getElementById('f05_daily_amount').value),
                    f06_is_off_day: document.getElementById('f06_is_off_day').value === 'true',
                    f07_reason_if_off: document.getElementById('f07_reason_if_off').value
                };

                let result;
                if (id) {
                    result = await _supabase.from('t08_work_days').update(payload).eq('f01_id', id);
                } else {
                    // التحقق من عدم وجود سجل مسبق لنفس السيارة والتاريخ
                    const { data: existing } = await _supabase.from('t08_work_days')
                        .select('f01_id')
                        .eq('f03_car_no', payload.f03_car_no)
                        .eq('f02_date', payload.f02_date)
                        .maybeSingle();
                    
                    if (existing) {
                        return showToast("هذا السجل موجود مسبقاً (نفس السيارة والتاريخ)!", "warning");
                    }

                    result = await _supabase.from('t08_work_days').insert([payload]);
                }

                if (!result.error) {
                    showToast("تم حفظ السجل بنجاح", "success");
                    resetWorkDayForm();
                    fetchWorkDays();
                } else {
                    showToast("خطأ في الحفظ: " + result.error.message, "error");
                }
            });
        });
    }
}

async function deleteWorkDay(id) {
    window.showModal("تنبيه الحذف", "هل أنت متأكد من حذف هذا السجل؟ سيفقد السجل من تقارير المديونية!", "danger", async () => {
        const { error } = await _supabase.from('t08_work_days').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            fetchWorkDays();
        } else {
            showToast("فشل الحذف: " + error.message, "error");
        }
    });
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
