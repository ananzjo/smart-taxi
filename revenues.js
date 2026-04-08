/* START OF FILE: revenues.js */
/**
 * File: revenues.js
 * Version: v1.3.0
 * Function: إدارة الإيرادات والتحصيلات
 */

let allRevenues = [];
let filteredRevenues = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fillRevenueDropdowns();
    await loadData();
    initTableControls();
    setupFormListener();
}

async function fillRevenueDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no').eq('f12_is_active', 'Active'),
            _supabase.from('t02_drivers').select('f02_name').eq('f07_status', 'فعال | Active'),
            _supabase.from('t11_staff').select('f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_name');
        const staffSelect = document.getElementById('f08_collector');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driversRes.data && driverSelect) {
            // ضمان وجود أسماء فريدة غير مكررة
            const uniqueDrivers = [...new Set(driversRes.data.map(d => d.f02_name))].sort();
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                uniqueDrivers.map(name => `<option value="${name}">${name}</option>`).join('');
        }
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

async function loadData() {
    try {
        const { data, error } = await _supabase
            .from('t05_revenues')
            .select('*')
            .order('f02_date', { ascending: false });

        if (error) throw error;
        allRevenues = data || [];
        filteredRevenues = [...allRevenues];
        renderTable();
    } catch (err) {
        showToast("تعذر جلب البيانات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    if (filteredRevenues.length === 0) {
        container.innerHTML = '<div class="loading-state">💰 لا توجد بيانات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_date')">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')">السيارة | Plate ↕</th>
                    <th onclick="sortData('f04_driver_name')">السائق | Driver ↕</th>
                    <th>الفئة | Cat</th>
                    <th onclick="sortData('f06_amount')">المبلغ | Amt ↕</th>
                    <th>الطريقة | Method</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredRevenues.map(rev => `
                    <tr>
                        <td>${rev.f02_date}</td>
                        <td>${window.formatJordanPlate(rev.f03_car_no, true)}</td>
                        <td>${rev.f04_driver_name}</td>
                        <td><span class="category-tag">${rev.f05_category}</span></td>
                        <td style="font-weight:900; color:var(--taxi-green)">${parseFloat(rev.f06_amount).toLocaleString()}</td>
                        <td>${rev.f07_method}</td>
                        <td>
                            <div class="action-btns-group">
                                <button onclick='showViewModal(${JSON.stringify(rev)}, "تفاصيل الإيراد | Revenue Info")' class="btn-action-sm btn-view">👁️</button>
                                <button onclick='editRecord(${rev.f01_id})' class="btn-action-sm btn-edit">✏️</button>
                                <button onclick="deleteRecord(${rev.f01_id})" class="btn-action-sm btn-delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    updateCounter();
}

async function saveData(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_name: document.getElementById('f04_driver_name').value,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: document.getElementById('f06_amount').value,
            f07_method: document.getElementById('f07_method').value,
            f08_collector: document.getElementById('f08_collector').value,
            f09_notes: document.getElementById('f09_notes').value.trim(),
            f10_work_day_link: document.getElementById('f10_work_day_link').value || null
        };

        try {
            const res = id 
                ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
                : await _supabase.from('t05_revenues').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ السجل بنجاح ✅", "success");
            resetForm();
            loadData();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

async function loadPendingWorkDays(carNo) {
    const wdSelect = document.getElementById('f10_work_day_link');
    const group = document.getElementById('workDayGroup');
    
    if (!carNo) {
        group.style.display = 'none';
        return;
    }

    const { data } = await _supabase.from('t08_work_days')
        .select('f01_id, f02_date, f05_daily_amount')
        .eq('f03_car_no', carNo)
        .eq('f06_is_off_day', false)
        .order('f02_date', { ascending: false });

    if (data && data.length > 0) {
        group.style.display = 'block';
        wdSelect.innerHTML = '<option value="">-- اختر ضمان للمطابقة --</option>' + 
            data.map(d => `<option value="${d.f01_id}">${d.f02_date} | ${d.f05_daily_amount} د.أ</option>`).join('');
    } else {
        group.style.display = 'none';
        wdSelect.innerHTML = '<option value="">-- اختر ضمان للمطابقة --</option>';
    }
}

function editRecord(id) {
    const rev = allRevenues.find(x => x.f01_id == id);
    if (!rev) return;

    document.getElementById('f01_id').value = rev.f01_id;
    document.getElementById('f02_date').value = rev.f02_date;
    document.getElementById('f03_car_no').value = rev.f03_car_no;
    document.getElementById('f04_driver_name').value = rev.f04_driver_name;
    document.getElementById('f05_category').value = rev.f05_category;
    document.getElementById('f06_amount').value = rev.f06_amount;
    document.getElementById('f07_method').value = rev.f07_method;
    document.getElementById('f08_collector').value = rev.f08_collector;
    document.getElementById('f09_notes').value = rev.f09_notes || '';

    if (rev.f03_car_no) {
        loadPendingWorkDays(rev.f03_car_no).then(() => {
            document.getElementById('f10_work_day_link').value = rev.f10_work_day_link || '';
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    showModal("تأكيد الحذف", "هل تريد حذف هذا السجل المالي؟", 'error', async () => {
        const { error } = await _supabase.from('t05_revenues').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            loadData();
        }
    });
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي السجلات: <span id="count">${allRevenues.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالسيارة أو السائق..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredRevenues = allRevenues.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term)));
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredRevenues.length;
}

function resetForm() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = '';
    document.getElementById('f02_date').valueAsDate = new Date();
}

function setupFormListener() {
    document.getElementById('revenueForm').addEventListener('submit', saveData);
    document.getElementById('f03_car_no').addEventListener('change', (e) => loadPendingWorkDays(e.target.value));
}

/* END OF FILE: revenues.js */