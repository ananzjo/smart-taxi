/* START OF FILE: suppliers.js */
/**
 * File: suppliers.js
 * Version: v1.3.0
 * Function: إدارة جهات الصيانة والموردين
 */

let allSuppliers = [];
let filteredSuppliers = [];
let currentSort = { col: 'f02_supplier_name', asc: true };

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fetchSuppliers();
    initTableControls();
    setupFormListener();
}

async function fetchSuppliers() {
    try {
        const { data, error } = await _supabase
            .from('t12_suppliers')
            .select('*')
            .order('f02_supplier_name', { ascending: true });

        if (error) throw error;
        allSuppliers = data || [];
        filteredSuppliers = [...allSuppliers];
        renderTable();
    } catch (err) {
        showToast("فشل تحميل الموردين", "error");
    }
}

function renderTable() {
    const container = document.getElementById('suppliersTableContainer');
    if (!container) return;

    if (filteredSuppliers.length === 0) {
        container.innerHTML = '<div class="loading-state">👤 لا توجد بيانات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_supplier_name')" style="cursor:pointer">المورد | Supplier ↕</th>
                    <th onclick="sortData('f03_contact_person')" style="cursor:pointer">المسؤول | Contact ↕</th>
                    <th onclick="sortData('f04_phone')" style="cursor:pointer">الهاتف | Phone ↕</th>
                    <th onclick="sortData('f05_address')" style="cursor:pointer">العنوان | Address ↕</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSuppliers.map(s => `
                    <tr>
                        <td style="font-weight:900; color:var(--taxi-dark)">${s.f02_supplier_name}</td>
                        <td>${s.f03_contact_person || '---'}</td>
                        <td dir="ltr">${s.f04_phone || '---'}</td>
                        <td>${s.f05_address || '---'}</td>
                        <td>
                            <div class="action-btns-group">
                                <button class="btn-action-sm btn-view" onclick='showViewModal(${JSON.stringify(s)}, "بيانات المورد | Supplier Info")' title="عرض">👁️</button>
                                <button class="btn-action-sm btn-edit" onclick="editRecord('${s.f01_id}')" title="تعديل">✏️</button>
                                <button class="btn-action-sm btn-delete" onclick="confirmDelete('${s.f01_id}')" title="حذف">🗑️</button>
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
    e.preventDefault();
    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        const payload = {
            f02_supplier_name: document.getElementById('f02_supplier_name').value.trim(),
            f03_contact_person: document.getElementById('f03_contact_person').value.trim(),
            f04_phone: document.getElementById('f04_phone').value.trim(),
            f05_address: document.getElementById('f05_address').value.trim(),
            f06_tax_info: document.getElementById('f06_tax_info').value.trim(),
            f07_notes: document.getElementById('f07_notes').value.trim()
        };

        try {
            const res = id 
                ? await _supabase.from('t12_suppliers').update(payload).eq('f01_id', id)
                : await _supabase.from('t12_suppliers').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ بيانات المورد بنجاح ✅", "success");
            resetForm();
            fetchSuppliers();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

function editRecord(id) {
    const s = allSuppliers.find(x => x.f01_id == id);
    if (!s) return;

    document.getElementById('f01_id').value = s.f01_id;
    document.getElementById('f02_supplier_name').value = s.f02_supplier_name;
    document.getElementById('f03_contact_person').value = s.f03_contact_person || '';
    document.getElementById('f04_phone').value = s.f04_phone || '';
    document.getElementById('f05_address').value = s.f05_address || '';
    document.getElementById('f06_tax_info').value = s.f06_tax_info || '';
    document.getElementById('f07_notes').value = s.f07_notes || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmDelete(id) {
    showModal("حذف مورد ⚠️", "هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.", 'warning', async () => {
        const { error } = await _supabase.from('t12_suppliers').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            fetchSuppliers();
        }
    });
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي الموردين: <span id="count">${allSuppliers.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالاسم أو الهاتف..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredSuppliers = allSuppliers.filter(s => Object.values(s).some(v => String(v).toLowerCase().includes(term)));
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredSuppliers.length;
}

function resetForm() {
    document.getElementById('supplierForm').reset();
    document.getElementById('f01_id').value = '';
}

function setupFormListener() {
    document.getElementById('supplierForm').addEventListener('submit', handleFormSubmit);
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredSuppliers.sort((a, b) => {
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

/* END OF FILE: suppliers.js */
