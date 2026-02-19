/**
 * إعدادات الاتصال بقاعدة البيانات
 */
const SUPABASE_URL = 'https://tjntctaapsdynbywdfns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BJgdmxyFsCgzFDXh1Qn1CQ_cFRMsy2P'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentEditId = null;

/**
 * تحديث مؤشر حالة الاتصال بالإنترنت
 */
function updateOnlineStatus() {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (navigator.onLine) {
        statusDot.className = "status-dot online";
        statusText.innerText = "متصل";
        statusText.className = "text-slate-700 font-bold text-sm";
    } else {
        statusDot.className = "status-dot offline";
        statusText.innerText = "غير متصل";
        statusText.className = "text-red-500 font-bold text-sm";
    }
}

// مراقبة أحداث الشبكة
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

/**
 * تحميل قائمة الملاك في القائمة المنسدلة
 */
async function loadOwners() {
    try {
        const { data } = await _supabase.from('owners').select('id, name');
        const select = document.getElementById('owner_id');
        data?.forEach(o => {
            select.innerHTML += `<option value="${o.id}">${o.name}</option>`;
        });
    } catch (err) {
        console.error("خطأ في تحميل الملاك:", err);
    }
}

/**
 * جلب وعرض قائمة السيارات
 */
async function fetchCars() {
    const tableBody = document.getElementById('carsList');
    tableBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">جاري التحديث...</td></tr>';
    
    const { data, error } = await _supabase
        .from('cars')
        .select('*, owners(name)')
        .order('id', { ascending: false });

    if (error) return console.error(error);

    tableBody.innerHTML = '';
    data?.forEach(car => {
        tableBody.innerHTML += `
            <tr class="hover:bg-yellow-50/30 transition">
                <td class="p-4 font-bold text-blue-700">${car.plate_no}</td>
                <td class="p-4 text-slate-600">${car.brand} / ${car.model}</td>
                <td class="p-4 font-medium">${car.owners?.name || '---'}</td>
                <td class="p-4 text-green-700 font-bold">${car.standard_rent} د.أ</td>
                <td class="p-4 text-xs font-mono text-slate-500">${car.license_expiry || '---'}</td>
                <td class="p-4 text-center flex justify-center gap-4">
                    <button onclick='editCar(${JSON.stringify(car)})' class="text-blue-500 hover:text-blue-700">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteCar(${car.id})" class="text-red-400 hover:text-red-600">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>`;
    });
}

/**
 * حفظ البيانات (إضافة أو تحديث)
 */
async function saveCar() {
    const carData = {
        plate_no: document.getElementById('plate_no').value,
        car_office: document.getElementById('car_office').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        license_expiry: document.getElementById('license_expiry').value || null,
        standard_rent: parseFloat(document.getElementById('standard_rent').value) || 0,
        management_fee: parseFloat(document.getElementById('management_fee').value) || 0,
        owner_id: document.getElementById('owner_id').value || null,
        car_notes: document.getElementById('car_notes').value
    };

    if (!carData.plate_no) return Swal.fire('تنبيه', 'رقم اللوحة مطلوب', 'warning');

    let response;
    if (currentEditId) {
        response = await _supabase.from('cars').update(carData).eq('id', currentEditId);
    } else {
        response = await _supabase.from('cars').insert([carData]);
    }

    if (response.error) {
        Swal.fire('خطأ', response.error.message, 'error');
    } else {
        Swal.fire({ icon: 'success', title: 'تم حفظ البيانات', timer: 1000, showConfirmButton: false });
        resetForm();
        fetchCars();
    }
}

/**
 * تعبئة النموذج للتعديل
 */
function editCar(car) {
    currentEditId = car.id;
    document.getElementById('plate_no').value = car.plate_no;
    document.getElementById('car_office').value = car.car_office;
    document.getElementById('brand').value = car.brand;
    document.getElementById('model').value = car.model;
    document.getElementById('license_expiry').value = car.license_expiry;
    document.getElementById('standard_rent').value = car.standard_rent;
    document.getElementById('management_fee').value = car.management_fee;
    document.getElementById('owner_id').value = car.owner_id;
    document.getElementById('car_notes').value = car.car_notes;

    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-blue-500"></i> تعديل بيانات المركبة';
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> تحديث البيانات الآن';
    saveBtn.classList.replace('bg-[#0f172a]', 'bg-blue-600');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * إعادة تعيين النموذج
 */
function resetForm() {
    currentEditId = null;
    document.getElementById('carForm').reset();
    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-circle-plus text-yellow-500"></i> تسجيل مركبة جديدة';
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ وإضافة السيارة للأسطول';
    saveBtn.classList.remove('bg-blue-600');
    saveBtn.classList.add('bg-[#0f172a]');
}

/**
 * حذف مركبة
 */
async function deleteCar(id) {
    const { isConfirmed } = await Swal.fire({ 
        title: 'هل أنت متأكد؟', 
        text: "لا يمكن التراجع عن حذف السيارة", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonText: 'نعم، احذف' 
    });
    
    if (isConfirmed) { 
        await _supabase.from('cars').delete().eq('id', id); 
        fetchCars(); 
    }
}

/**
 * التشغيل عند تحميل الصفحة
 */
window.onload = () => {
    updateOnlineStatus();
    loadOwners();
    fetchCars();
    
    // تحديث التاريخ
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('ar-EG', dateOptions);
};
