/* ==================================================================
 [handover.js] - إدارة العهدة (النسخة الذهبية المحدثة - نظام IDs مع تحكم كامل)
 ================================================================== */

let allHandovers = [];
let filteredHandovers = [];
let currentSort = { col: 'created_at', asc: false };

let allCarsList = [];
let allDriversList = [];

async function loadFormData() {
    try {
        if (typeof LookupEngine !== 'undefined') {
            await Promise.all([
                LookupEngine.fillSelect('car_condition_tech', 'f10_car_condition', { placeholder: '-- الحالة الفنية --' })
            ]);
        }
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f01_id, f02_plate_no, f11_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        allCarsList = carsRes.data || [];
        allDriversList = driversRes.data || [];

        // تعبئة الموظفين (دائمة)
        if (staffRes.data) {
            const staffSelect = document.getElementById('f06_staff_id');
            staffSelect.innerHTML = staffRes.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
            const activeUser = sessionStorage.getItem('full_name_ar');
            if (activeUser) Array.from(staffSelect.options).forEach(opt => { if (opt.text === activeUser) opt.selected = true; });
        }

        // إعداد المستمع للتغيير في نوع العملية
        document.querySelectorAll('input[name="f07_action_type"]').forEach(radio => {
            radio.addEventListener('change', refreshDropdowns);
        });

        refreshDropdowns(); // التعبئة لأول مرة
        
        // تعيين الوقت الافتراضي
        const dInput = document.getElementById('f02_date');
        const tInput = document.getElementById('f03_time');
        if(dInput) dInput.valueAsDate = new Date();
        if(tInput) tInput.value = new Date().toLocaleTimeString('en-GB', { hour12: false });

        await loadHistory();
        initTableControls();
    } catch (err) { console.error("Initialization Error:", err); }
}

function refreshDropdowns() {
    const action = document.querySelector('input[name="f07_action_type"]:checked').value;
    const carSelect = document.getElementById('f04_car_no');
    const driverSelect = document.getElementById('f05_driver_id');

    // منطق الفلترة بمرونة: في التسليم نحتاج غير النشط، وفي الاستلام نحتاج النشط
    const isOut = action === 'OUT';
    
    const filteredCars = allCarsList.filter(c => {
        const s = (c.f11_is_active || '').toLowerCase();
        const isInActive = s.includes('inactive') || s.includes('غير نشط');
        return isOut ? isInActive : !isInActive;
    });

    const filteredDrivers = allDriversList.filter(d => {
        const s = (d.f06_status || '').toLowerCase();
        const isInActive = s.includes('inactive') || s.includes('غير نشط');
        return isOut ? isInActive : !isInActive;
    });

    carSelect.innerHTML = `<option value="">-- اختر السيارة (${action === 'OUT' ? 'المتاحة' : 'المستلمة'}) --</option>` +
        filteredCars.map(c => `<option value="${c.f02_plate_no}" data-id="${c.f01_id}">${c.f02_plate_no}</option>`).join('');

    driverSelect.innerHTML = `<option value="">-- اختر السائق (${action === 'OUT' ? 'المتاح' : 'المسلم'}) --</option>` +
        filteredDrivers.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
}

async function loadHistory() {
    let { data, error } = await _supabase
        .from('t04_handover')
        .select(`*, t02_drivers ( f02_name )`)
        .order('created_at', { ascending: false });

    if (error) {
        const backup = await _supabase.from('t04_handover').select('*').order('created_at', { ascending: false });
        data = backup.data;
    }

    allHandovers = data || [];
    filteredHandovers = [...allHandovers];
    renderTable();
}

function renderTable() {
    const container = document.getElementById('handoverList');
    if (!container) return;

    if (filteredHandovers.length === 0) {
        container.innerHTML = '<div class="loading-state">🔍 لا توجد سجلات مطابقة</div>';
        return;
    }

    let html = `<table><thead><tr>
        <th onclick="sortData('f07_action_type')" style="cursor:pointer">العملية | Type ↕</th>
        <th onclick="sortData('f04_car_no')" style="cursor:pointer">السيارة | Plate ↕</th>
        <th onclick="sortData('f05_driver_id')" style="cursor:pointer">السائق | Driver ↕</th>
        <th onclick="sortData('f09_km_reading')" style="cursor:pointer">العداد | KM ↕</th>
        <th onclick="sortData('f08_daman')" style="cursor:pointer">الضمان | Rent ↕</th>
        <th onclick="sortData('created_at')" style="cursor:pointer">التاريخ | Date ↕</th>
        <th>إجراءات | Acts</th>
    </tr></thead><tbody>`;
    filteredHandovers.forEach(h => {
        const typeColor = h.f07_action_type === 'OUT' ? '#27ae60' : '#e74c3c';
        const driverName = (h.t02_drivers && h.t02_drivers.f02_name) ? h.t02_drivers.f02_name : `ID: ${h.f05_driver_id}`;
        const dateObj = new Date(h.created_at);
        html += `<tr>
            <td style="color:${typeColor}; font-weight:bold;">${h.f07_action_type === 'OUT' ? '📤 تسليم | OUT' : '📥 استلام | IN'}</td>
            <td>${window.formatJordanPlate(h.f04_car_no, true)}</td>
            <td style="font-weight:600;">${driverName}</td>
            <td><span class="odometer-red">${(h.f09_km_reading || 0).toLocaleString()}</span></td>
            <td style="font-weight:bold; color:var(--taxi-green)">${h.f08_daman || '---'}</td>
            <td style="font-size:0.85rem; color:#666;">${dateObj.toLocaleDateString('ar-EG')} | <strong>${dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></td>
            <td>
                <div class="action-btns-group">
                    <button class="btn-action-sm btn-view" onclick='showViewModal(${JSON.stringify(h)}, "تفاصيل الحركة | Mov Details")' title="عرض">👁️</button>
                    <button class="btn-action-sm btn-edit" onclick="editRecord('${h.f01_id}')" title="تعديل">✏️</button>
                    <button class="btn-action-sm btn-delete" onclick="deleteRecord('${h.f01_id}')" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>`;
    });
    container.innerHTML = html + "</tbody></table>";
    updateCounter();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (!placeholder) return;
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي الحركات: <span id="count">${allHandovers.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالسيارة، السائق..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredHandovers = allHandovers.filter(h => 
        (h.f04_car_no && h.f04_car_no.toLowerCase().includes(term)) || 
        (h.t02_drivers && h.t02_drivers.f02_name && h.t02_drivers.f02_name.toLowerCase().includes(term))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredHandovers.length;
}

document.getElementById('handoverForm').onsubmit = async (e) => {
    e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const carSelect = document.getElementById('f04_car_no');
        const carNo = carSelect.value;
        if(!carNo) return showToast("يرجى اختيار السيارة", "warning");

        const carUUID = carSelect.options[carSelect.selectedIndex].dataset.id;
        const driverSelect = document.getElementById('f05_driver_id');
        const driverUUID = driverSelect.value;
        if(!driverUUID) return showToast("يرجى اختيار السائق", "warning");

        const action = document.querySelector('input[name="f07_action_type"]:checked').value;

        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_time: document.getElementById('f03_time').value,
            f04_car_no: carNo,
            f05_driver_id: driverUUID,
            f06_staff_id: document.getElementById('f06_staff_id').value,
            f07_action_type: action === 'OUT' ? 'تسليم للسائق' : 'استلام من السائق',
            f08_daman: parseFloat(document.getElementById('f08_daman').value) || 0,
            f09_km_reading: parseInt(document.getElementById('f09_km_reading').value),
            f10_car_condition: document.getElementById('f10_car_condition').value,
            f11_notes: document.getElementById('f11_notes').value
        };

        try {
            let res;
            if (id) {
                res = await _supabase.from('t04_handover').update(payload).eq('f01_id', id);
            } else {
                res = await _supabase.from('t04_handover').insert([payload]);
            }

            if (res.error) throw res.error;

            if (!id) {
                let carUpdate, driverUpdate;
                if (action === 'OUT') {
                    carUpdate = await _supabase.from('t01_cars').update({ f11_is_active: 'نشطة | Active' }).eq('f01_id', carUUID);
                    driverUpdate = await _supabase.from('t02_drivers').update({ f06_status: 'نشط | Active', f08_car_no: carNo }).eq('f01_id', driverUUID);
                } else {
                    carUpdate = await _supabase.from('t01_cars').update({ f11_is_active: 'غير نشطة | InActive' }).eq('f01_id', carUUID);
                    driverUpdate = await _supabase.from('t02_drivers').update({ f06_status: 'غير نشط | InActive', f08_car_no: null }).eq('f01_id', driverUUID);
                }
            }

            window.showToast("تم الحفظ بنجاح ✅", "success");
            resetForm();
            loadHistory();
            loadFormData(); // Refresh lists
        } catch (err) {
            window.showModal("خطأ في الحفظ", err.message, "error");
        }
    });
};

function editRecord(id) {
    const h = allHandovers.find(x => x.f01_id == id);
    if (!h) return;

    document.getElementById('f01_id').value = h.f01_id;
    document.getElementById('f02_date').value = h.f02_date || '';
    document.getElementById('f03_time').value = h.f03_time || '';
    document.getElementById(h.f07_action_type.toLowerCase()).checked = true;
    document.getElementById('f04_car_no').value = h.f04_car_no;
    document.getElementById('f05_driver_id').value = h.f05_driver_id;
    document.getElementById('f09_km_reading').value = h.f09_km_reading;
    document.getElementById('f08_daman').value = h.f08_daman;
    document.getElementById('f06_staff_id').value = h.f06_staff_id;
    document.getElementById('f10_car_condition').value = h.f10_car_condition || '';
    document.getElementById('f11_notes').value = h.f11_notes || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    window.showModal("تأكيد الحذف", "هل تريد حذف هذا السجل؟ لن يتم تغيير حالة السيارة تلقائياً.", "warning", async () => {
        const { error } = await _supabase.from('t04_handover').delete().eq('f01_id', id);
        if (!error) {
            window.showToast("تم الحذف بنجاح", "success");
            loadHistory();
        }
    });
}

function resetForm() {
    document.getElementById('handoverForm').reset();
    document.getElementById('f01_id').value = '';
    const dInput = document.getElementById('f02_date');
    const tInput = document.getElementById('f03_time');
    if(dInput) dInput.valueAsDate = new Date();
    if(tInput) tInput.value = new Date().toLocaleTimeString('en-GB', { hour12: false });
}
function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredHandovers.sort((a, b) => {
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