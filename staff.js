/* ==================================================================
   [staff.js] - إدارة الموظفين (النسخة النهائية الموحدة)
   ================================================================== */

let allStaff = [];
let sortDirections = {}; 

// [1] جلب البيانات من جدول t11_staff
async function loadData() {
    const { data, error } = await _supabase
        .from('t11_staff')
        .select('*')
        .order('f07_created_at', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب بيانات الموظفين", "error");
        return; 
    }
    allStaff = data;
    renderTable(data);
}

// [2] بناء الجدول مع دعم الأسهم المركزية (السهم الأصفر)
function renderTable(list) {
    let html = `<table>
        <thead>
            <tr>
                <th onclick="sortTable(0)" style="cursor:pointer">الاسم الكامل <span id="sortIcon0" class="sort-icon">↕</span></th>
                <th onclick="sortTable(1)" style="cursor:pointer">المسمى الوظيفي <span id="sortIcon1" class="sort-icon">↕</span></th>
                <th onclick="sortTable(2)" style="cursor:pointer">رقم الهاتف <span id="sortIcon2" class="sort-icon">↕</span></th>
                <th onclick="sortTable(3)" style="cursor:pointer">الصلاحية <span id="sortIcon3" class="sort-icon">↕</span></th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    list.forEach(item => {
        html += `<tr>
            <td><b style="color:var(--taxi-dark)">${item.f02_name}</b></td>
            <td>${item.f05_title || '-'}</td>
            <td>${item.f04_mobile || '-'}</td>
            <td><span class="badge-${item.f06_authority}">${item.f06_authority.toUpperCase()}</span></td>
            <td>
                <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${item.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
}

// [3] حفظ البيانات (Insert / Update)
async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    
    // جمع الحقول التي تبدأ بـ f حسب الدستور
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if(el.value.trim() !== "") payload[el.id] = el.value.trim();
    });

    if (!payload.f02_name || !payload.f03_password) {
        window.showModal("تنبيه", "يرجى إدخال الاسم وكلمة المرور", "warning");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t11_staff').update(payload).eq('f01_id', id)
        : await _supabase.from('t11_staff').insert([payload]);

    if (error) {
        window.showModal("خطأ", "فشل الحفظ: " + error.message, "error");
    } else {
        window.showModal("نجاح", "تم حفظ بيانات الموظف بنجاح ✅", "success");
        resetFieldsOnly();
        loadData();
    }
}

// [4] الحذف باستخدام المودال العالمي
function deleteRecord(id) {
    window.showModal("⚠️ تأكيد الحذف", "هل أنت متأكد من مسح بيانات الموظف نهائياً؟", "error", async () => {
        const { error } = await _supabase.from('t11_staff').delete().eq('f01_id', id);
        if (error) {
            window.showModal("خطأ", "فشل الحذف، قد يكون الموظف مرتبط بسجلات أخرى", "error");
        } else {
            loadData();
        }
    });
}

// [5] محرك الفرز الذكي (مرتبط بالجلوبال)
function sortTable(n) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    let rows = Array.from(tbody.rows);
    sortDirections[n] = !sortDirections[n];
    const direction = sortDirections[n] ? 1 : -1;

    // تحديث الأسهم الصفراء (المخ المركزي)
    if (window.updateSortVisuals) {
        window.updateSortVisuals(n, sortDirections[n]);
    }

    rows.sort((a, b) => {
        let aT = a.cells[n].innerText.trim();
        let bT = b.cells[n].innerText.trim();
        
        // فرز الأرقام والنصوص
        if (!isNaN(aT) && !isNaN(bT) && aT !== "" && bT !== "") {
            return (parseFloat(aT) - parseFloat(bT)) * direction;
        }
        return aT.localeCompare(bT, 'ar', { numeric: true }) * direction;
    });

    tbody.append(...rows);
}

// [6] دوال مساعدة (تعديل وتفريغ)
function editRecord(item) {
    Object.keys(item).forEach(key => {
        const el = document.getElementById(key);
        if(el) el.value = item[key];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFieldsOnly() {
    const form = document.getElementById('staffForm');
    if(form) form.reset();
    document.getElementById('f01_id').value = "";
}

function confirmReset() {
    window.showModal("تأكيد", "هل تريد مسح جميع الحقول؟", "info", () => resetFieldsOnly());
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allStaff.filter(item => 
        Object.values(item).some(v => String(v).toLowerCase().includes(val))
    );
    renderTable(filtered);
}