/* ==================================================================
 [revenues.js] - إدارة الإيرادات (النسخة المنظفة والموحدة)
 ================================================================== */

let allRevenues = [];
let sortDirections = {}; 

// [1] جلب البيانات
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

// [2] بناء الجدول مع دعم الأسهم العالمية
function renderTable(list) {
    let html = `<table><thead><tr>
        <th onclick="sortTable(0)" style="cursor:pointer">التاريخ <span id="sortIcon0" class="sort-icon">↕</span></th>
        <th onclick="sortTable(1)" style="cursor:pointer">السيارة <span id="sortIcon1" class="sort-icon">↕</span></th>
        <th onclick="sortTable(2)" style="cursor:pointer">السائق <span id="sortIcon2" class="sort-icon">↕</span></th>
        <th onclick="sortTable(3)" style="cursor:pointer">المبلغ <span id="sortIcon3" class="sort-icon">↕</span></th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(rev => {
        html += `<tr>
            <td>${rev.f02_date}</td>
            <td><b>${rev.f03_car_no}</b></td>
            <td>${rev.f04_driver_name}</td>
            <td style="color:var(--taxi-green); font-weight:bold;">${rev.f06_amount}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(rev)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord('${rev.f01_id}')" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
}

function sortTable(n) {
    // الوصول الصحيح لجسم الجدول
    const tbody = document.querySelector("table tbody");
    if (!tbody) return; // حماية في حال عدم وجود جدول

    let rows = Array.from(tbody.rows);
    
    // عكس الاتجاه
    sortDirections[n] = !sortDirections[n];
    const direction = sortDirections[n] ? 1 : -1;

    // تحديث الأسهم الصفراء من الجلوبال
    if (window.updateSortVisuals) {
        window.updateSortVisuals(n, sortDirections[n]);
    }

    rows.sort((a, b) => {
        let aT = a.cells[n].innerText.trim();
        let bT = b.cells[n].innerText.trim();
        
        // فرز ذكي: هل المحتوى رقم؟ (مثل المبالغ المالية)
        if (!isNaN(aT) && !isNaN(bT) && aT !== "" && bT !== "") {
            return (parseFloat(aT) - parseFloat(bT)) * direction;
        }
        // فرز نصوص (يدعم العربية)
        return aT.localeCompare(bT, 'ar', { numeric: true }) * direction;
    });

    // إعادة ترتيب الصفوف في الجدول
    tbody.append(...rows);
}
// [4] حفظ البيانات
async function saveData() {
    const idValue = document.getElementById('f01_id').value;
    const payload = {};
    
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value && el.value.trim() !== "") payload[el.id] = el.value;
    });

    if (!payload.f03_car_no || !payload.f06_amount) {
        window.showModal("بيانات ناقصة", "يرجى إكمال الحقول الإجبارية", "warning");
        return;
    }

    // تصحيح الجدول ليكون دائماً t05_revenues
    const { error } = idValue 
        ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', idValue)
        : await _supabase.from('t05_revenues').insert([payload]);

    if (error) {
        window.showModal("خطأ", "فشل الحفظ: " + error.message, "error");
    } else { 
        window.showModal("نجاح", "تم حفظ الإيراد بنجاح ✅", "success");
        resetFieldsOnly();
        loadData();
    }
}

// [5] الحذف عبر المودال العالمي
function deleteRecord(id) {
    if(window.showModal) {
        window.showModal("⚠️ تأكيد الحذف", "هل أنت متأكد من مسح هذا السجل؟", "error", async () => {
            const { error } = await _supabase.from('t05_revenues').delete().eq('f01_id', id);
            if (!error) loadData();
        });
    }
}

function confirmReset() {
    window.showModal("تأكيد", "هل تريد تفريغ جميع الحقول؟", "warning", () => resetFieldsOnly());
}

function resetFieldsOnly() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = "";
    if(document.getElementById('f02_date')) document.getElementById('f02_date').valueAsDate = new Date();
}

function editRecord(rev) {
    Object.keys(rev).forEach(key => { 
        if(document.getElementById(key)) document.getElementById(key).value = rev[key]; 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    renderTable(allRevenues.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(val))));
}