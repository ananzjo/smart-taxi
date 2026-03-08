let allStaff = [];
let sortDirections = {};

async function loadData() {
    const { data, error } = await _supabase.from('t11_staff').select('*').order('f02_full_name');
    if (error) {
        window.showModal("خطأ", "تعذر جلب البيانات");
        return;
    }
    allStaff = data;
    renderTable(data);
}

function renderTable(list) {
    if (window.updateRecordCounter) {
        window.updateRecordCounter(list.length);
    }

    let html = `<table><thead><tr>
        <th onclick="sortTable(0)">الاسم</th>
        <th onclick="sortTable(1)">الوظيفة</th>
        <th onclick="sortTable(2)">رقم الجوال</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(item => {
        html += `<tr>
            <td style="font-weight:bold;">${item.f02_full_name}</td>
            <td>${item.f06_job_title}</td>
            <td>${item.f04_mobile_number}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action edit-btn">📝</button>
                <button onclick="deleteRecord(${item.f01_id})" class="btn-action delete-btn">🗑️</button>
            </td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
    updateSortVisuals();
}

function sortTable(columnIndex) {
    const sortKey = Object.keys(allStaff[0])[columnIndex + 1]; 
    sortDirections[sortKey] = sortDirections[sortKey] === 'asc' ? 'desc' : 'asc';

    allStaff.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortDirections[sortKey] === 'asc' ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortDirections[sortKey] === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(allStaff);
    updateSortVisuals(columnIndex);
}

function updateSortVisuals(columnIndex) {
    document.querySelectorAll('th').forEach((th, i) => {
        th.classList.remove('sort-asc', 'sort-desc');
        const sortKey = Object.keys(allStaff[0])[i + 1];
        if (i === columnIndex) {
            th.classList.add(sortDirections[sortKey] === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allStaff.filter(o => 
        o.f02_full_name.toLowerCase().includes(val) || 
        o.f03_id_number.includes(val) ||
        o.f04_mobile_number.includes(val)
    );
    renderTable(filtered);
}

async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {
        f02_full_name: document.getElementById('f02_full_name').value,
        f03_id_number: document.getElementById('f03_id_number').value,
        f04_mobile_number: document.getElementById('f04_mobile_number').value,
        f05_nationality: document.getElementById('f05_nationality').value,
        f06_job_title: document.getElementById('f06_job_title').value,
        f07_salary: document.getElementById('f07_salary').value,
        f08_notes: document.getElementById('f08_notes').value
    };

    if (!payload.f02_full_name || !payload.f04_mobile_number) {
        window.showModal("تنبيه", "الاسم ورقم الجوال مطلوبان");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t11_staff').update(payload).eq('f01_id', id)
        : await _supabase.from('t11_staff').insert([payload]);

    if (!error) {
        window.showModal("تم بنجاح", "تم حفظ البيانات ✅");
        resetForm();
        loadData();
    } else {
        window.showModal("خطأ", error.message);
    }
}

async function deleteRecord(id) {
    window.showModal("تأكيد", "هل تريد مسح هذا الموظف؟", true, async () => {
        const { error } = await _supabase.from('t11_staff').delete().eq('f01_id', id);
        if (!error) loadData();
    });
}

function editRecord(item) {
    document.getElementById('f01_id').value = item.f01_id;
    document.getElementById('f02_full_name').value = item.f02_full_name;
    document.getElementById('f03_id_number').value = item.f03_id_number;
    document.getElementById('f04_mobile_number').value = item.f04_mobile_number;
    document.getElementById('f05_nationality').value = item.f05_nationality;
    document.getElementById('f06_job_title').value = item.f06_job_title;
    document.getElementById('f07_salary').value = item.f07_salary;
    document.getElementById('f08_notes').value = item.f08_notes;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmReset() {
    window.showModal("تأكيد", "مسح الحقول؟", true, () => resetForm());
}

function resetForm() {
    document.getElementById('staffForm').reset();
    document.getElementById('f01_id').value = "";
}

window.onload = () => {
    loadData();
};