/* START OF FILE: drivers.js */
/**
 * File: drivers.js
 * Version: v1.3.0
 * Function: إدارة بيانات السائقين وتتبع الحالة الوظيفية
 * Components: Supabase Client, Identity Validation, Status Tracker
 * Inputs: t02_drivers
 */

let allDrivers = [];
let filteredDrivers = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fetchDrivers();
    initTableControls();
    setupFormListener();
}

// --- [1] جلب البيانات ---
async function fetchDrivers() {
    try {
        const [drvRes, carRes] = await Promise.all([
            _supabase.from('t02_drivers').select('*').order('f02_name', { ascending: true }),
            _supabase.from('t01_cars').select('f02_plate_no, f11_is_active')
        ]);

        if (carRes.data) {
            const activeCars = carRes.data.filter(c => 
                !c.f11_is_active || c.f11_is_active.includes('نشط') || c.f11_is_active.toLowerCase().includes('active')
            );
            const sel = document.getElementById('f08_car_no');
            if (sel) {
                sel.innerHTML = '<option value="">-- بلا سيارة حالياً --</option>' +
                    activeCars.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
            }
        }

        if (drvRes.error) throw drvRes.error;
        allDrivers = drvRes.data || [];
        
        const searchInput = document.getElementById('globalSearch');
        if (searchInput && searchInput.value) {
            filterLocal();
        } else {
            filteredDrivers = [...allDrivers];
            renderTable();
        }
    } catch (err) {
        showToast("فشل في تحميل البيانات", "error");
    }
}

// --- [2] العرض الفاخر ---
function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    if (filteredDrivers.length === 0) {
        container.innerHTML = '<div class="loading-state">👨‍✈️ لا يوجد سائقون مطابقون للبحث</div>';
        return; 
    }

    let html = `
        <table>
            <thead>
                    <th onclick="sortData('f02_name')" style="cursor:pointer">الاسم | Name ↕</th>
                    <th onclick="sortData('f03_national_no')" style="cursor:pointer">الهوية | ID ↕</th>
                    <th onclick="sortData('f04_mobile')" style="cursor:pointer">الهاتف | Phone ↕</th>
                    <th onclick="sortData('f08_car_no')" style="cursor:pointer">السيارة | Car ↕</th>
                    <th onclick="sortData('f06_status')" style="cursor:pointer">الحالة | Status ↕</th>
                    <th>إجراءات | Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDrivers.map(d => {
                    const s = (d.f06_status || '').trim();
                    const hasCar = (d.f08_car_no && d.f08_car_no.trim() !== '');
                    const isActive = (s === 'نشط | Active' || s === 'Active' || s === 'نشط' || s === 'فعال | Active' || hasCar);
                    
                    const statusClass = isActive ? 'badge-active' : 'badge-inactive';
                    const statusText = isActive ? 'نشط | Active' : 'غير نشط | InActive';
                    return `
                        <tr>
                            <td style="font-weight:900; color:var(--taxi-dark)">${d.f02_name}</td>
                            <td>${d.f03_national_no}</td>
                            <td dir="ltr">${d.f04_mobile}</td>
                             <td>${d.f08_car_no ? window.formatJordanPlate(d.f08_car_no, true) : '<span style="color:#ccc">---</span>'}</td>
                            <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    <button class="btn-action-sm btn-view" onclick='showViewModal(${JSON.stringify(d)}, "بيانات السائق | Driver Info")' title="عرض">👁️</button>
                                    <button class="btn-action-sm btn-edit" onclick="editRecord('${d.f01_id}')" title="تعديل">✏️</button>
                                    <button class="btn-action-sm btn-delete" onclick="confirmDelete('${d.f01_id}')" title="حذف">🗑️</button>
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

// --- [3] العمليات (CRUD) ---
async function handleFormSubmit(e) {
    e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_name: document.getElementById('f02_name').value.trim(),
            f03_national_no: document.getElementById('f03_national_no').value.trim(),
            f04_mobile: document.getElementById('f04_mobile').value.trim(),
            f05_address: document.getElementById('f05_address').value.trim(),
            f06_status: document.getElementById('f06_status').value,
            f08_car_no: document.getElementById('f08_car_no').value || null,
            f07_status_date: new Date()
        };

        if (payload.f03_national_no.length < 5) {
            showToast("الرقم الوطني غير صحيح", "warning");
            return;
        }

        try {
            let res;
            if (id) {
                res = await _supabase.from('t02_drivers').update(payload).eq('f01_id', id);
            } else {
                res = await _supabase.from('t02_drivers').insert([payload]);
            }

            if (res.error) throw res.error;

            showToast("تم حفظ بيانات السائق بنجاح ✅", "success");
            resetForm();
            fetchDrivers();
        } catch (err) {
            if (err.code === '23505') {
                showToast("الرقم الوطني أو الهاتف مسجل مسبقاً", "error");
            } else {
                showToast("خطأ أثناء الحفظ: " + err.message, "error");
            }
        }
    });
}

function confirmDelete(id) {
    const driver = allDrivers.find(x => x.f01_id == id);
    showModal(
        "حذف سائق ⚠️",
        `هل تريد حذف السائق <b>(${driver.f02_name})</b>؟ تأكد من عدم وجود سيارات في عهدته حالياً.`,
        'warning',
        async () => {
            const { error } = await _supabase.from('t02_drivers').delete().eq('f01_id', id);
            if (!error) {
                showToast("تم الحذف بنجاح", "success");
                fetchDrivers();
            } else {
                showToast("لا يمكن حذف السائق لارتباطه بسجلات أخرى في النظام", "error");
            }
        }
    );
}

function editRecord(id) {
    const d = allDrivers.find(x => x.f01_id == id);
    if (!d) return;

    document.getElementById('f01_id').value = d.f01_id;
    document.getElementById('f02_name').value = d.f02_name;
    document.getElementById('f03_national_no').value = d.f03_national_no;
    document.getElementById('f04_mobile').value = d.f04_mobile;
    document.getElementById('f05_address').value = d.f05_address || '';
    document.getElementById('f06_status').value = d.f06_status || 'غير نشط | InActive';
    document.getElementById('f08_car_no').value = d.f08_car_no || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- [4] التحكم والبحث ---
function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي السائقين: <span id="count">${allDrivers.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالاسم، الهاتف، أو الرقم الوطني..." onkeyup="filterLocal()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        `;
    }
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredDrivers = allDrivers.filter(d => 
        Object.values(d).some(v => String(v).toLowerCase().includes(term))
    );
    renderTable();
}

let currentSort = { col: 'f02_name', asc: true };
function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredDrivers.sort((a,b) => {
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

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredDrivers.length;
}

function resetForm() {
    document.getElementById('driverForm').reset();
    document.getElementById('f01_id').value = '';
}

function setupFormListener() {
    const form = document.getElementById('driverForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
}

/* END OF FILE: drivers.js */