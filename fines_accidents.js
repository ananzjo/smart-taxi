/* START OF FILE: fines_accidents.js */
/**
 * File: fines_accidents.js
 * Version: v1.3.0
 * Function: إدارة المخالفات والحوادث والذمم المالية
 */

let allRecords = [];
let filteredRecords = [];
let currentSort = { col: 'f02_date', asc: false };

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    if (typeof LookupEngine !== 'undefined') {
        await Promise.all([
            LookupEngine.fillSelect('incident_type', 'f06_type', { placeholder: '-- اختر النوع --' }),
            LookupEngine.fillSelect('financial_status', 'f07_status', { placeholder: '-- اختر الحالة --' })
        ]);
    }
    await fillDropdowns();
    await fetchRecords();
    initTableControls();
    setupFormListener();
}

async function fillDropdowns() {
    try {
        const [carsRes, driversRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no, f11_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status')
        ]);

        const carSel = document.getElementById('f03_car_no');
        const drvSel = document.getElementById('f04_driver_id');

        // تصفية بمرونة للنشط فقط
        const activeCars = (carsRes.data || []).filter(c => 
            !c.f11_is_active || c.f11_is_active.includes('نشط') || c.f11_is_active.toLowerCase().includes('active')
        );
        const activeDrivers = (driversRes.data || []).filter(d => 
            !d.f06_status || d.f06_status.includes('نشط') || d.f06_status.toLowerCase().includes('active')
        );

        if (carSel) {
            carSel.innerHTML = '<option value="">-- اختر السيارة --</option>' + activeCars.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (drvSel) {
            drvSel.innerHTML = '<option value="">-- اختر السائق --</option>' + activeDrivers.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Error:", err);
    }
}

async function fetchRecords() {
    try {
        const { data, error } = await _supabase
            .from('t09_fines_accidents')
            .select(`*, t02_drivers(f02_name)`)
            .order('f02_date', { ascending: false });

        if (error) throw error;
        allRecords = data || [];
        filteredRecords = [...allRecords];
        renderTable();
    } catch (err) {
        showToast("فشل تحميل البيانات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('finesTableContainer');
    if (!container) return;

    if (filteredRecords.length === 0) {
        container.innerHTML = '<div class="loading-state">⚠️ لا توجد سجلات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_date')" style="cursor:pointer">التاريخ | Date ↕</th>
                    <th onclick="sortData('f03_car_no')" style="cursor:pointer">السيارة | Plate ↕</th>
                    <th onclick="sortData('f04_driver_id')" style="cursor:pointer">السائق | Driver ↕</th>
                    <th onclick="sortData('f06_type')" style="cursor:pointer">النوع | Type ↕</th>
                    <th onclick="sortData('f05_amount')" style="cursor:pointer">المبلغ | Amt ↕</th>
                    <th onclick="sortData('f07_status')" style="cursor:pointer">الحالة | Status ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredRecords.map(r => {
                    const statusClass = r.f07_status === 'Paid' ? 'badge-paid' : (r.f07_status === 'Pending' ? 'badge-pending' : 'badge-off');
                    const dayName = new Date(r.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });
                    return `
                        <tr>
                            <td style="font-weight:700;">
                                <div style="font-size:0.75rem; color:var(--taxi-gold);">${dayName}</div>
                                <div>${r.f02_date}</div>
                            </td>
                            <td>${window.formatJordanPlate(r.f03_car_no, true)}</td>
                            <td>${r.t02_drivers ? r.t02_drivers.f02_name : '---'}</td>
                            <td>${r.f06_type}</td>
                            <td style="font-weight:900; color:var(--taxi-red)">${r.f05_amount}</td>
                            <td><span class="badge-status ${statusClass}">${r.f07_status}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    ${r.f09_attachment_url ? `<a href="${r.f09_attachment_url}" target="_blank" class="btn-action-sm" title="عرض المرفق">📎</a>` : ''}
                                    <button class="btn-action-sm btn-edit" onclick="editRecord('${r.f01_id}')" title="تعديل">✏️</button>
                                    <button class="btn-action-sm btn-delete" onclick="confirmDelete('${r.f01_id}')" title="حذف">🗑️</button>
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

async function handleFormSubmit(e) {
    e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_id: document.getElementById('f04_driver_id').value,
            f05_amount: document.getElementById('f05_amount').value,
            f06_type: document.getElementById('f06_type').value,
            f07_status: document.getElementById('f07_status').value,
            f08_description: document.getElementById('f08_description').value.trim(),
            f09_attachment_url: document.getElementById('f09_attachment_url').value.trim()
        };

        try {
            const res = id 
                ? await _supabase.from('t09_fines_accidents').update(payload).eq('f01_id', id)
                : await _supabase.from('t09_fines_accidents').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ السجل بنجاح ✅", "success");
            resetForm();
            fetchRecords();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

function editRecord(id) {
    const r = allRecords.find(x => x.f01_id == id);
    if (!r) return;

    document.getElementById('f01_id').value = r.f01_id;
    document.getElementById('f02_date').value = r.f02_date;
    document.getElementById('f03_car_no').value = r.f03_car_no;
    document.getElementById('f04_driver_id').value = r.f04_driver_id;
    document.getElementById('f05_amount').value = r.f05_amount;
    document.getElementById('f06_type').value = r.f06_type;
    document.getElementById('f07_status').value = r.f07_status || 'Pending';
    document.getElementById('f08_description').value = r.f08_description || '';
    document.getElementById('f09_attachment_url').value = r.f09_attachment_url || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmDelete(id) {
    showModal("حذف سجل التزام ⚠️", "هل أنت متأكد من حذف هذا السجل؟", 'warning', async () => {
        const { error } = await _supabase.from('t09_fines_accidents').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            fetchRecords();
        }
    });
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي الحالات: <span id="count">${allRecords.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالسيارة، السائق، أو النوع..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredRecords = allRecords.filter(r => 
        Object.values(r).some(v => String(v).toLowerCase().includes(term)) ||
        (r.t02_drivers && r.t02_drivers.f02_name.toLowerCase().includes(term))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredRecords.length;
}

function resetForm() {
    document.getElementById('finesForm').reset();
    document.getElementById('f01_id').value = '';
}

function setupFormListener() {
    document.getElementById('finesForm').addEventListener('submit', handleFormSubmit);
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredRecords.sort((a, b) => {
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

/* END OF FILE: fines_accidents.js */
