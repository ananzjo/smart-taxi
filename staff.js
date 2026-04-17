/* ==================================================================
   [staff.js] - إدارة الموظفين (النسخة النهائية الموحدة)
   ================================================================== */

let allStaff = [];
let filteredStaff = [];
let currentSort = { col: 'f02_name', asc: true };

// [1] جلب البيانات من جدول t11_staff
async function initPage() {
    await loadData();
    setupFormListener();
}

document.addEventListener('DOMContentLoaded', initPage);

async function loadData() {
    const { data, error } = await _supabase
        .from('t11_staff')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { 
        window.showModal("خطأ", "تعذر جلب بيانات الموظفين", "error");
        return; 
    }
    allStaff = data;
    filteredStaff = [...data];
    renderTable();
}

// [2] بناء الجدول مع دعم الأسهم المركزية (السهم الأصفر)
function renderTable() {
    const data = filteredStaff;
    let html = `<table>
        <thead>
            <tr>
                <th onclick="sortData('f02_name')" style="cursor:pointer">الاسم الكامل ↕</th>
                <th onclick="sortData('f05_title')" style="cursor:pointer">المسمى الوظيفي ↕</th>
                <th onclick="sortData('f04_mobile')" style="cursor:pointer">رقم الهاتف ↕</th>
                <th onclick="sortData('f06_authority')" style="cursor:pointer">الصلاحية ↕</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(item => {
        const authRaw = (item.f06_authority || '').toLowerCase();
        let badgeClass = 'user';
        if (authRaw.includes('admin')) badgeClass = 'admin';
        if (authRaw.includes('owner')) badgeClass = 'owner';
        
        html += `<tr>
            <td><b style="color:var(--taxi-dark)">${item.f02_name}</b></td>
            <td>${item.f05_title || '-'}</td>
            <td>${item.f04_mobile || '-'}</td>
            <td><span class="badge-${badgeClass}">${item.f06_authority}</span></td>
            <td>
                <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${item.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
    updateCounter();
}

// [3] حفظ البيانات (Insert / Update)
async function saveData(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {};
        
        // جمع الحقول التي تبدأ بـ f حسب الدستور
        document.querySelectorAll('[id^="f"]').forEach(el => {
            if(el.id !== 'f01_id' && el.value.trim() !== "") payload[el.id] = el.value.trim();
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
    });
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
function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredStaff.sort((a, b) => {
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
    filteredStaff = allStaff.filter(item => 
        Object.values(item).some(v => String(v).toLowerCase().includes(val))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('recordCount');
    if (el) el.innerText = filteredStaff.length;
}

function setupFormListener() {
    const form = document.getElementById('staffForm');
    if (form) form.addEventListener('submit', saveData);
}

function togglePassword() {
    const p = document.getElementById('f03_password');
    if(p) p.type = p.type === 'password' ? 'text' : 'password';
}