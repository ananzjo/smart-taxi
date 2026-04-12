/* === START OF FILE === */
/**
 * File: cars-logic.js
 * Version: v1.2.1
 * Function: إدارة أسطول السيارات مع تصحيح الربط بين الـ UI والـ Database
 * Components: Supabase Client, Table Renderer, CRUD Operations
 * Input/Output: التعامل مع جدول t01_cars باستخدام f01_id (UUID)
 */

let allCars = [];
let filteredCars = [];
let ownersList = [];
let driversList = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    // التأكد من تحميل الملحقات قبل البيانات الأساسية
    await Promise.all([
        fetchOwners(),
        fetchDrivers()
    ]);
    await fetchCars();
    initTableControls();
    setupEventListeners();
}

// --- [2] جلب البيانات ---
async function fetchOwners() {
    // الحقل في ت01 هو f10_owner_id يربط بـ f01_id في t10
    const { data } = await _supabase.from('t10_owners').select('f01_id, f02_owner_name');
    ownersList = data || [];
    const sel = document.getElementById('f10_owner_id'); // تصحيح المعرف من f11 إلى f10
    if (sel) {
        sel.innerHTML = '<option value="">-- اختر المالك --</option>' +
            ownersList.map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');
    }
}

async function fetchDrivers() {
    const { data } = await _supabase.from('t02_drivers').select('f01_id, f02_name');
    driversList = data || [];
    const sel = document.getElementById('f13_current_driver_id');
    if (sel) {
        sel.innerHTML = '<option value="">-- اختر السائق الحالي --</option>' +
            driversList.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
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
        filteredCars = [...allCars];
        renderTable();
    } catch (err) {
        console.error("Fetch Error:", err);
        if(typeof showToast === 'function') showToast("فشل في تحميل بيانات السيارات", "error");
    }
}

// --- [3] بناء الجدول ---
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
                    <th onclick="sortData('f02_plate_no')">اللوحة | Plate ↕</th>
                    <th onclick="sortData('f04_brand')">الماركة | Brand ↕</th>
                    <th onclick="sortData('f06_model')">الموديل | Model ↕</th>
                    <th onclick="sortData('f08_standard_rent')">الضمان | Rent ↕</th>
                    <th>المالك | Owner</th>
                    <th>السائق | Driver</th>
                    <th onclick="sortData('f11_is_active')">الحالة | Status ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredCars.map(car => {
                    // الربط باستخدام الحقول الصحيحة من الـ Schema
                    let owner = ownersList.find(o => String(o.f01_id) === String(car.f10_owner_id));
                    let driver = driversList.find(d => String(d.f01_id) === String(car.f13_current_driver_id));
                    
                    const isA = (car.f11_is_active === 'Active' || car.f11_is_active === 'نشط' || car.f11_is_active === 'نشطة');
                    const statusClass = isA ? 'badge-active' : 'badge-inactive';
                    const statusText = isA ? 'نشطة | Active' : 'غير نشطة | InActive';

                    return `
                        <tr>
                            <td>${car.f02_plate_no}</td>
                            <td>${car.f04_brand || '---'}</td>
                            <td>${car.f06_model || '---'}</td>
                            <td style="font-weight:bold; color:green">${car.f08_standard_rent}</td>
                            <td>${owner ? owner.f02_owner_name : '<span style="color:#999;">(غير محدد)</span>'}</td>
                            <td>${driver ? driver.f02_name : '---'}</td>
                            <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                            <td>
                                <div class="action-btns-group">
                                    <button class="btn-edit" onclick="editRecord('${car.f01_id}')">✏️</button>
                                    <button class="btn-delete" onclick="confirmDelete('${car.f01_id}')">🗑️</button>
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
    
    const uuid = document.getElementById('f01_id').value; // المعرف الأساسي UUID

    const payload = {
        f02_plate_no: document.getElementById('f02_plate_no').value.trim(),
        f03_car_office: document.getElementById('f03_car_office').value,
        f04_brand: document.getElementById('f04_brand').value,
        f06_model: parseInt(document.getElementById('f06_model').value) || null,
        f07_license_expiry: document.getElementById('f07_license_expiry').value || null,
        f08_standard_rent: parseFloat(document.getElementById('f08_standard_rent').value) || 0,
        f09_management_fee: parseFloat(document.getElementById('f09_management_fee').value) || 50,
        f10_owner_id: document.getElementById('f10_owner_id').value || null, // UUID string
        f11_is_active: document.getElementById('f11_is_active').value,
        f13_current_driver_id: document.getElementById('f13_current_driver_id').value ? parseInt(document.getElementById('f13_current_driver_id').value) : null,
        f13_fuel_type: document.getElementById('f13_fuel_type').value
    };

    try {
        let res;
        if (uuid) {
            // تحديث باستخدام UUID
            res = await _supabase.from('t01_cars').update(payload).eq('f01_id', uuid);
        } else {
            // إضافة سجل جديد
            res = await _supabase.from('t01_cars').insert([payload]);
        }

        if (res.error) throw res.error;

        showToast("تم حفظ بيانات السيارة بنجاح", "success");
        resetForm();
        fetchCars();
    } catch (err) {
        showToast("خطأ في الحفظ: " + err.message, "error");
    }
}

function editRecord(uuid) {
    const car = allCars.find(c => c.f01_id === uuid);
    if (!car) return;

    document.getElementById('f01_id').value = car.f01_id;
    document.getElementById('f02_plate_no').value = car.f02_plate_no;
    document.getElementById('f10_owner_id').value = car.f10_owner_id || '';
    document.getElementById('f11_is_active').value = car.f11_is_active || 'Active';
    // ... باقي الحقول تملأ بنفس الطريقة ...
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmDelete(uuid) {
    const car = allCars.find(c => c.f01_id === uuid);
    if(confirm(`هل تريد حذف السيارة ${car.f02_plate_no}؟`)) {
        executeDelete(uuid);
    }
}

async function executeDelete(uuid) {
    const { error } = await _supabase.from('t01_cars').delete().eq('f01_id', uuid);
    if (!error) {
        showToast("تم الحذف", "success");
        fetchCars();
    } else {
        showToast("خطأ في الحذف: " + error.message, "error");
    }
}

// دالات مساعدة
function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredCars.length;
}

function resetForm() {
    const form = document.getElementById('carForm');
    if(form) form.reset();
    document.getElementById('f01_id').value = '';
}

function setupEventListeners() {
    const form = document.getElementById('carForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
}

function initTableControls() {
    // كود البحث المحلي
}

/* === END OF FILE === */
