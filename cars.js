/* START OF FILE: cars.js */
/**
 * File: cars.js
 * Version: v1.3.0
 * Function: إدارة أسطول السيارات مع تتبع الحالة والسائق الحالي
 * Components: Supabase Client, Luxury Grid, Status Controller
 * Inputs: t01_cars, t10_owners, t02_drivers
 */

// --- [1] إعدادات الصفحة والحالة ---
let allCars = [];
let filteredCars = [];
let ownersList = [];
let driversList = [];
let staffList = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    if (typeof LookupEngine !== 'undefined') {
        await Promise.all([
            LookupEngine.fillSelect('fuel_type', 'f13_fuel_type', { placeholder: '-- فئة الوقود --' })
        ]);
    }
    await Promise.all([
        fetchOwners(),
        fetchDrivers(),
        fetchStaff(),
        fetchCars()
    ]);
    initTableControls();
    setupEventListeners();
}

// --- [2] جلب البيانات ---
async function fetchOwners() {
    const { data } = await _supabase.from('t10_owners').select('f01_id, f02_owner_name');
    ownersList = data || [];
    const sel = document.getElementById('f10_owner_id');
    if (sel) {
        sel.innerHTML = '<option value="">-- اختر المالك --</option>' +
            ownersList.map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');
    }
}

async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name, f08_car_no');
    driversList = data || [];
}

async function fetchStaff() {
    const { data } = await _supabase.from('t11_staff').select('f01_id, f02_name');
    staffList = data || [];
    const sel = document.getElementById('f14_staff_id');
    if (sel) {
        sel.innerHTML = '<option value="">-- المحصل / المسؤول --</option>' +
            staffList.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
    }
}

async function fetchCars() {
    try {
        const { data, error } = await _supabase
            .from('t01_cars')
            .select('*')
            .order('f02_plate_no', { ascending: true });

        if (error) throw error;
        allCars = data || [];
        
        const searchInput = document.getElementById('globalSearch');
        if (searchInput && searchInput.value) {
            filterLocal();
        } else {
            filteredCars = [...allCars];
            renderTable();
        }
    } catch (err) {
        showToast("فشل في تحميل بيانات السيارات", "error");
    }
}

// --- [3] بناء الجدول الفاخر ---
function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    if (filteredCars.length === 0) {
        container.innerHTML = '<div class="loading-state">🚗 لا توجد سيارات مطابقة للبحث</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_plate_no')" style="cursor:pointer">اللوحة | Plate ↕</th>
                    <th onclick="sortData('f03_car_office')" style="cursor:pointer">المكتب | Office ↕</th>
                    <th onclick="sortData('f06_model')" style="cursor:pointer">الموديل | Model ↕</th>
                    <th onclick="sortData('f08_standard_rent')" style="cursor:pointer">الضمان | Rent ↕</th>
                    <th onclick="sortData('f10_owner_id')" style="cursor:pointer">المالك | Owner ↕</th>
                    <th>السائق | Driver</th>
                    <th onclick="sortData('f11_is_active')" style="cursor:pointer">الحالة | Status ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredCars.map(car => {
                    let owner = ownersList.find(o => String(o.f01_id) === String(car.f10_owner_id));
                    // Derive current driver from t02_drivers where f08_car_no matches this car's plate
                    const driver = driversList.find(d => d.f08_car_no === car.f02_plate_no);
                    
                    const isA = (car.f11_is_active === 'نشطة | Active' || car.f11_is_active === 'Active' || car.f11_is_active === 'نشطة' || car.f11_is_active === 'نشط' || car.f11_is_active === 'مشغول');
                    const statusClass = isA ? 'badge-active' : 'badge-inactive';
                    const statusText = isA ? 'نشطة | Active' : 'غير نشطة | InActive';

                    return `
                        <tr>
                            <td>${window.formatJordanPlate(car.f02_plate_no, true)}</td>
                            <td>${car.f03_car_office || '---'}</td>
                            <td>${car.f06_model || '---'}</td>
                            <td style="font-weight:bold; color:var(--taxi-green)">${car.f08_standard_rent}</td>
                            <td style="font-weight:600;">${owner ? owner.f02_owner_name : '<span style="color:#95a5a6; font-size:0.8rem;">(غير محدد)</span>'}</td>
                            <td style="font-weight:600;">${driver ? driver.f02_name : '<span style="color:#95a5a6; font-size:0.8rem;">---</span>'}</td>
                            <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    <button class="btn-action-sm btn-view" onclick='showViewModal(${JSON.stringify(car)}, "تفاصيل السيارة | Car Details")' title="عرض">👁️</button>
                                    <button class="btn-action-sm btn-edit" onclick="editRecord('${car.f01_id}')" title="تعديل">✏️</button>
                                    <button class="btn-action-sm btn-delete" onclick="confirmDelete('${car.f01_id}')" title="حذف">🗑️</button>
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

// --- [4] العمليات (CRUD) ---
async function handleFormSubmit(e) {
    e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;

        const payload = {
            f02_plate_no: document.getElementById('f02_plate_no').value.trim(),
            f03_car_office: document.getElementById('f03_car_office').value,
            f04_brand: document.getElementById('f04_brand').value,
            f05_brand_type: document.getElementById('f05_brand_type').value.trim(),
            f06_model: parseInt(document.getElementById('f06_model').value),
            f07_license_expiry: document.getElementById('f07_license_expiry').value,
            f08_standard_rent: parseFloat(document.getElementById('f08_standard_rent').value),
            f09_management_fee: parseFloat(document.getElementById('f09_management_fee').value),
            f10_owner_id: document.getElementById('f10_owner_id').value || null,
            f14_staff_id: document.getElementById('f14_staff_id').value || null,
            f11_is_active: document.getElementById('f11_is_active').value,
            f13_fuel_type: document.getElementById('f13_fuel_type').value
        };

        try {
            let res;
            if (id) {
                res = await _supabase.from('t01_cars').update(payload).eq('f01_id', id);
            } else {
                res = await _supabase.from('t01_cars').insert([payload]);
            }

            if (res.error) throw res.error;

            showToast("تم حفظ بيانات السيارة بنجاح", "success");
            resetForm();
            fetchCars();
        } catch (err) {
            showToast("حدث خطأ أثناء الحفظ: " + err.message, "error");
        }
    });
}

function confirmDelete(id) {
    const car = allCars.find(c => c.f01_id == id);
    showModal(
        "حذف سيارة ⚠️",
        `هل أنت متأكد من حذف السيارة رقم <b>(${car.f02_plate_no})</b>؟ لا يمكن التراجع عن هذا الإجراء.`,
        'warning',
        async () => {
            const { error } = await _supabase.from('t01_cars').delete().eq('f01_id', id);
            if (!error) {
                showToast("تم الحذف بنجاح", "success");
                fetchCars();
            } else {
                showToast("لا يمكن الحذف لارتباط بيانات أخرى بهذه السيارة", "error");
            }
        }
    );
}

function editRecord(id) {
    const car = allCars.find(c => c.f01_id == id);
    if (!car) return;

    document.getElementById('f01_id').value = car.f01_id || '';
    document.getElementById('f02_plate_no').value = car.f02_plate_no;
    document.getElementById('f03_car_office').value = car.f03_car_office || '';
    document.getElementById('f04_brand').value = car.f04_brand || '';
    document.getElementById('f05_brand_type').value = car.f05_brand_type || '';
    document.getElementById('f06_model').value = car.f06_model || '';
    document.getElementById('f07_license_expiry').value = car.f07_license_expiry || '';
    document.getElementById('f08_standard_rent').value = car.f08_standard_rent || 0;
    document.getElementById('f09_management_fee').value = car.f09_management_fee || 50;
    document.getElementById('f10_owner_id').value = car.f10_owner_id || '';
    document.getElementById('f14_staff_id').value = car.f14_staff_id || '';
    document.getElementById('f11_is_active').value = car.f11_is_active || 'نشطة | Active';
    document.getElementById('f13_fuel_type').value = car.f13_fuel_type || 'بنزين';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- [5] الميزات الإضافية (البحث والترتيب) ---
function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي الأسطول: <span id="count">${allCars.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث باللوحة، الماركة، أو السائق..." onkeyup="filterLocal()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        `;
    }
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredCars = allCars.filter(c =>
        c.f02_plate_no.toLowerCase().includes(term) ||
        (c.f04_brand && c.f04_brand.toLowerCase().includes(term)) ||
        Object.values(c).some(v => String(v).toLowerCase().includes(term))
    );
    renderTable();
}

let currentSort = { col: 'f02_plate_no', asc: true };
function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredCars.sort((a, b) => {
        let vA = a[col] || '';
        let vB = b[col] || '';
        
        // Use numeric comparison if both are numbers
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
    if (el) el.innerText = filteredCars.length;
}

function resetForm() {
    document.getElementById('carForm').reset();
    document.getElementById('f01_id').value = '';
}

function setupEventListeners() {
    const form = document.getElementById('carForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
}

/* END OF FILE: cars.js */