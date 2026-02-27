/* ==================================================================
 [revenues.js] - إدارة الإيرادات (النسخة النهائية المربوطة)
 ================================================================== */

let allRevenues = [];
let sortDirections = {}; 

// [1] تعبئة القوائم الثلاث من قاعدة البيانات
async function fillRevenueDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f02_name'),
            _supabase.from('t11_staff').select('f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_name');
        const staffSelect = document.getElementById('f08_collector');

        if (carsRes.data) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        
        if (driversRes.data) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                driversRes.data.map(d => `<option value="${d.f02_name}">${d.f02_name}</option>`).join('');
        }

        if (staffRes.data) {
            staffSelect.innerHTML = '<option value="">-- اختر المحصل --</option>' + 
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

// [2] جلب البيانات للجدول
async function loadData() {
    const { data, error } = await _supabase
        .from('t05_revenues')
        .select('*')
        .order('f02_date', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب البيانات", "error"); 
        return; 
    }
    allRevenues = data;
    renderTable(data);
}

// [3] بناء الجدول مع السهم الأصفر
function renderTable(list) {
    let html = `<table><thead><tr>
        <th onclick="sortTable(0)">التاريخ <span id="sortIcon0" class="sort-icon">↕</span></th>
        <th onclick="sortTable(1)">السيارة <span id="sortIcon1" class="sort-icon">↕</span></th>
        <th onclick="sortTable(2)">السائق <span id="sortIcon2" class="sort-icon">↕</span></th>
        <th onclick="sortTable(3)">المبلغ <span id="sortIcon3" class="sort-icon">↕</span></th>
        <th onclick="sortTable(4)">المحصل <span id="sortIcon4" class="sort-icon">↕</span></th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(rev => {
        html += `<tr>
            <td>${rev.f02_date}</td>
            <td><b>${rev.f03_car_no}</b></td>
            <td>${rev.f04_driver_name}</td>
            <td style="color:var(--taxi-green); font-weight:bold;">${rev.f06_amount}</td>
            <td>${rev.f08_collector || '-'}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(rev)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${rev.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
}

// [4] الحفظ التلقائي (حسب الدستور f)
async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value.trim() !== "") payload[el.id] = el.value.trim();
    });

    if (!payload.f03_car_no || !payload.f06_amount) {
        window.showModal("نواقص", "يرجى اختيار السيارة والمبلغ", "warning");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
        : await _supabase.from('t05_revenues').insert([payload]);

    if (error) {
        window.showModal("فشل", error.message, "error");
    } else { 
        window.showModal("نجاح", "تم حفظ السجل بنجاح ✅", "success");
        resetFieldsOnly();
        loadData();
    }
}

// [5] محرك الفرز
function sortTable(n) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    let rows = Array.from(tbody.rows);
    sortDirections[n] = !sortDirections[n];
    const direction = sortDirections[n] ? 1 : -1;
    if(window.updateSortVisuals) window.updateSortVisuals(n, sortDirections[n]);

    rows.sort((a, b) => {
        let aT = a.cells[n].innerText.trim();
        let bT = b.cells[n].innerText.trim();
        return (isNaN(aT) || isNaN(bT)) 
            ? aT.localeCompare(bT, 'ar', { numeric: true }) * direction
            : (parseFloat(aT) - parseFloat(bT)) * direction;
    });
    tbody.append(...rows);
}

// [6] دوال مساعدة
function deleteRecord(id) {
    window.showModal("تأكيد", "حذف السجل نهائياً؟", "error", async () => {
        await _supabase.from('t05_revenues').delete().eq('f01_id', id);
        loadData();
    });
}

function editRecord(rev) {
    Object.keys(rev).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = rev[key]; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFieldsOnly() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
}

function confirmReset() {
    window.showModal("تنبيه", "تفريغ الحقول؟", "info", () => resetFieldsOnly());
}

// [دالة مضافة] للبحث السريع داخل جدول الإيرادات
function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    
    // فلترة المصفوفة الأصلية بناءً على السيارة أو السائق أو المحصل
    const filtered = allRevenues.filter(item => {
        return (
            String(item.f03_car_no).toLowerCase().includes(val) ||
            String(item.f04_driver_name).toLowerCase().includes(val) ||
            String(item.f08_collector).toLowerCase().includes(val) ||
            String(item.f02_date).includes(val)
        );
    });

    // إعادة بناء الجدول بالنتائج المفلترة فقط
    renderTable(filtered);
}
