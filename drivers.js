let allDrivers = [];

// [1] ساعة ونبض
function startTaxiClock() {
    setInterval(() => {
        const el = document.getElementById('live-clock');
        if(el) el.innerText = new Date().toLocaleTimeString('ar-EG');
    }, 1000);
}

// [2] نظام المودال
function showModal(title, message, isConfirm = false, onConfirm = null) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modal.style.display = 'flex';
    cancelBtn.style.display = isConfirm ? 'inline-block' : 'none';

    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };
    cancelBtn.onclick = () => modal.style.display = 'none';
}

// [3] جلب البيانات
async function loadData() {
    const { data, error } = await _supabase.from('t02_drivers').select('*').order('created_at', { ascending: false });
    if (error) { showModal("خطأ | Error", "تعذر جلب بيانات السائقين"); return; }
    allDrivers = data;
    renderTable(data);
}

function renderTable(list) {
    document.getElementById('recordCount').innerText = list.length;
    let html = `<table><thead><tr>
        <th onclick="sortTable(0)">الاسم ↕</th>
        <th onclick="sortTable(1)">رقم الهاتف ↕</th>
        <th onclick="sortTable(2)">الموقع ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;
    list.forEach(driver => {
        const locationLink = driver.f06_location_url ? `<a href="${driver.f06_location_url}" target="_blank">📍 عرض</a>` : '-';
        html += `<tr>
            <td style="font-weight:bold;">${driver.f02_name}</td>
            <td>${driver.f04_mobile}</td>
            <td>${locationLink}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(driver)})' style="cursor:pointer; border:none; background:none;">📝</button>
                <button onclick="deleteRecord('${driver.f01_id}')" style="cursor:pointer; border:none; background:none; margin-right:8px;">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
}

// [4] الحفظ مع التحقق
async function saveData() {
    const id = document.getElementById('f01_id').value;
    
    const payload = {
        f02_name: document.getElementById('f02_name').value,
        f03_national_no: document.getElementById('f03_national_no').value,
        f04_mobile: document.getElementById('f04_mobile').value,
        f05_address: document.getElementById('f05_address').value,
        f06_location_url: document.getElementById('f06_location_url').value
    };

    // رسائل تحقق معبرة
    if (!payload.f02_name || !payload.f03_national_no || !payload.f04_mobile) {
        showModal("بيانات ناقصة | Missing Data", "يرجى تعبئة الاسم والرقم الوطني ورقم الهاتف لإتمام عملية الحفظ.");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t02_drivers').update(payload).eq('f01_id', id)
        : await _supabase.from('t02_drivers').insert([payload]);

    if (error) {
        if (error.code === '23505') {
            showModal("تنبيه تكرار | Duplicate Error", "رقم الهاتف أو الرقم الوطني مسجل مسبقاً لسائق آخر.");
        } else {
            showModal("خطأ في النظام | System Error", error.message);
        }
    } else { 
        showModal("تم بنجاح | Success", "تم حفظ بيانات السائق بنجاح ✅");
        resetFieldsOnly();
        loadData();
    }
}

function confirmReset() {
    showModal("تأكيد | Confirm", "هل تريد تفريغ جميع الحقول؟", true, () => {
        resetFieldsOnly();
    });
}

function resetFieldsOnly() {
    document.getElementById('driverForm').reset();
    document.getElementById('f01_id').value = "";
}

function deleteRecord(id) {
    showModal("تأكيد الحذف", "هل أنت متأكد من حذف هذا السائق نهائياً؟", true, async () => {
        const { error } = await _supabase.from('t02_drivers').delete().eq('f01_id', id);
        if (!error) loadData();
    });
}

function editRecord(driver) {
    Object.keys(driver).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = driver[key]; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    renderTable(allDrivers.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(val))));
}

function sortTable(n) {
    const table = document.querySelector("table");
    let rows = Array.from(table.rows).slice(1);
    let sorted = rows.sort((a, b) => a.cells[n].innerText.localeCompare(b.cells[n].innerText));
    table.tBodies[0].append(...sorted);
}