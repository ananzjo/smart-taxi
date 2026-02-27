let allOwners = [];

// [1] جلب البيانات
async function loadData() {
    const { data, error } = await _supabase.from('t10_owners').select('*').order('f02_owner_name');
    if (error) {
        showLocalModal("خطأ", "تعذر جلب البيانات من السحابة");
        return;
    }
    allOwners = data;
    renderTable(data);
}

// [2] رسم الجدول
function renderTable(list) {
    let html = `<table><thead><tr>
        <th>الاسم | Name</th>
        <th>الهاتف | Phone</th>
        <th>النوع | Type</th>
        <th>إجراءات | Actions</th>
    </tr></thead><tbody>`;

    list.forEach(item => {
        html += `<tr>
            <td style="font-weight:bold;">${item.f02_owner_name}</td>
            <td>${item.f04_contact_number}</td>
            <td>${item.f03_owner_type}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(item)})' class="btn-icon">📝</button>
                <button onclick="deleteRecord(${item.f01_id})" class="btn-icon delete">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
}

// [3] فلتر الإكسل (البحث السريع)
function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allOwners.filter(o => 
        o.f02_owner_name.toLowerCase().includes(val) || 
        o.f04_contact_number.includes(val)
    );
    renderTable(filtered);
}

// [4] الحفظ (إضافة وتعديل)
async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value) payload[el.id] = el.value;
    });

    if (!payload.f02_owner_name || !payload.f04_contact_number) {
        showLocalModal("تنبيه", "الاسم والهاتف مطلوبان");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t10_owners').update(payload).eq('f01_id', id)
        : await _supabase.from('t10_owners').insert([payload]);

    if (!error) {
        showLocalModal("تم بنجاح", "تم حفظ البيانات ✅");
        resetForm();
        loadData();
    }
}

// [5] الحذف والتعديل والمودال
async function deleteRecord(id) {
    showLocalModal("تأكيد", "هل تريد مسح هذا المالك؟", true, async () => {
        const { error } = await _supabase.from('t10_owners').delete().eq('f01_id', id);
        if (!error) loadData();
    });
}

function editRecord(item) {
    Object.keys(item).forEach(key => {
        if(document.getElementById(key)) document.getElementById(key).value = item[key];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLocalModal(title, msg, isConfirm = false, onConfirm = null) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = msg;
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modal.style.display = 'flex';
    cancelBtn.style.display = isConfirm ? 'inline-block' : 'none';

    confirmBtn.onclick = () => { modal.style.display = 'none'; if(onConfirm) onConfirm(); };
    cancelBtn.onclick = () => modal.style.display = 'none';
}

function confirmReset() {
    showLocalModal("تأكيد", "مسح الحقول؟", true, () => resetForm());
}

function resetForm() {
    document.getElementById('ownerForm').reset();
    document.getElementById('f01_id').value = "";
}