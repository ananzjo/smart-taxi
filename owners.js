/* START OF FILE: owners.js */
/**
 * File: owners.js
 * Version: v1.3.1
 * Function: إدارة بيانات مالكي السيارات
 */

let allOwners = [];
let filteredOwners = [];
let currentSort = { col: 'f02_owner_name', asc: true };

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    if (typeof LookupEngine !== 'undefined') {
        await LookupEngine.fillSelect('owner_type', 'f03_owner_type', { placeholder: '-- فئة المالك --' });
    }
    await loadData();
    initTableControls();
    setupFormListener();
}

async function loadData() {
    try {
        const { data, error } = await _supabase.from('t10_owners').select('*').order('f02_owner_name');
        if (error) throw error;
        allOwners = data || [];
        filteredOwners = [...allOwners];
        renderTable();
    } catch (err) {
        showToast("خطأ في تحميل البيانات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    if (filteredOwners.length === 0) {
        container.innerHTML = '<div class="loading-state">👤 لا توجد بيانات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_owner_name')" style="cursor:pointer">الاسم | Name ↕</th>
                    <th onclick="sortData('f04_contact_number')" style="cursor:pointer">الهاتف | Phone ↕</th>
                    <th onclick="sortData('f03_owner_type')" style="cursor:pointer">النوع | Type ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredOwners.map(item => `
                    <tr>
                        <td style="font-weight:bold;">${item.f02_owner_name}</td>
                        <td dir="ltr">${item.f04_contact_number}</td>
                        <td>${item.f03_owner_type}</td>
                        <td>
                            <div class="action-btns-group">
                                <button onclick='showViewModal(${JSON.stringify(item)}, "بيانات المالك | Owner Info")' class="btn-action-sm btn-view">👁️</button>
                                <button onclick="editRecord('${item.f01_id}')" class="btn-action-sm btn-edit">✏️</button>
                                <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    updateCounter();
}

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_owner_name: document.getElementById('f02_owner_name').value.trim(),
            f03_owner_type: document.getElementById('f03_owner_type').value,
            f04_contact_number: document.getElementById('f04_contact_number').value.trim(),
            f05_national_id: document.getElementById('f05_national_id').value.trim(),
            f06_bank_account: document.getElementById('f06_bank_account').value.trim(),
            f07_owner_notes: document.getElementById('f07_owner_notes').value.trim()
        };

        if (!payload.f02_owner_name || !payload.f04_contact_number) {
            showToast("الاسم والهاتف مطلوبان", "warning");
            return;
        }

        try {
            const res = id 
                ? await _supabase.from('t10_owners').update(payload).eq('f01_id', id)
                : await _supabase.from('t10_owners').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم الحفظ بنجاح ✅", "success");
            resetForm();
            loadData();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

function editRecord(id) {
    const item = allOwners.find(x => x.f01_id == id);
    if (!item) return;

    Object.keys(item).forEach(key => {
        const el = document.getElementById(key);
        if(el) el.value = item[key] || '';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    showModal("تأكيد الحذف", "هل تريد مسح هذا المالك نهائياً؟", 'error', async () => {
        const { error } = await _supabase.from('t10_owners').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف", "success");
            loadData();
        }
    });
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="table-header-controls">
                <div class="record-badge">إجمالي المالكين: <span id="count">${allOwners.length}</span></div>
                <div class="global-search-wrapper">
                    <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالاسم أو الهاتف..." onkeyup="filterLocal()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        `;
    }
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredOwners = allOwners.filter(o => 
        o.f02_owner_name.toLowerCase().includes(term) || 
        o.f04_contact_number.includes(term)
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredOwners.length;
}

function resetForm() {
    const form = document.querySelector('form');
    if(form) form.reset();
    document.getElementById('f01_id').value = "";
}

function setupFormListener() {
    const form = document.getElementById('ownerForm') || document.querySelector('form');
    if (form) form.addEventListener('submit', handleFormSubmit);
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredOwners.sort((a, b) => {
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

/* END OF FILE: owners.js */