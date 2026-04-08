/* START OF FILE: settings.js */
/**
 * File: settings.js
 * Version: v1.3.0
 * Function: إدارة متغيرات النظام
 */

let allSettings = [];
let filteredSettings = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fetchSettings();
    initTableControls();
    setupFormListener();
}

async function fetchSettings() {
    try {
        const { data, error } = await _supabase
            .from('t14_system_settings')
            .select('*')
            .order('f02_key', { ascending: true });

        if (error) throw error;
        allSettings = data || [];
        filteredSettings = [...allSettings];
        renderTable();
    } catch (err) {
        showToast("فشل تحميل الإعدادات", "error");
    }
}

function renderTable() {
    const container = document.getElementById('settingsContainer');
    if (!container) return;

    if (filteredSettings.length === 0) {
        container.innerHTML = '<div class="loading-state">⚙️ لا توجد إعدادات مطابقة</div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th onclick="sortData('f02_key')">المفتاح | Key ↕</th>
                    <th onclick="sortData('f03_value')">القيمة | Value ↕</th>
                    <th>الوصف | Description</th>
                    <th>إجراءات | Acts</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSettings.map(s => `
                    <tr>
                        <td style="font-weight:bold; color:var(--taxi-dark)">${s.f02_key}</td>
                        <td style="color:var(--taxi-green); font-family:monospace;">${s.f03_value}</td>
                        <td style="font-size:0.9rem; color:#666;">${s.f04_description || '---'}</td>
                        <td>
                            <div class="action-btns-group">
                                <button class="btn-action-sm btn-edit" onclick="editRecord(${s.f01_id})" title="تعديل">✏️</button>
                                <button class="btn-action-sm btn-delete" onclick="confirmDelete(${s.f01_id})" title="حذف">🗑️</button>
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
            f02_key: document.getElementById('f02_key').value.trim(),
            f03_value: document.getElementById('f03_value').value.trim(),
            f04_description: document.getElementById('f04_description').value.trim()
        };

        try {
            const res = id 
                ? await _supabase.from('t14_system_settings').update(payload).eq('f01_id', id)
                : await _supabase.from('t14_system_settings').insert([payload]);

            if (res.error) throw res.error;

            showToast("تم حفظ الإعداد بنجاح ✅", "success");
            resetForm();
            fetchSettings();
        } catch (err) {
            showToast("خطأ أثناء الحفظ", "error");
        }
    });
}

function editRecord(id) {
    const s = allSettings.find(x => x.f01_id == id);
    if (!s) return;

    document.getElementById('f01_id').value = s.f01_id;
    document.getElementById('f02_key').value = s.f02_key;
    document.getElementById('f03_value').value = s.f03_value;
    document.getElementById('f04_description').value = s.f04_description || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmDelete(id) {
    showModal("حذف إعداد ⚠️", "هل تريد حذف هذا المتغير من النظام؟ قد يؤثر ذلك على سير العمل.", 'warning', async () => {
        const { error } = await _supabase.from('t14_system_settings').delete().eq('f01_id', id);
        if (!error) {
            showToast("تم الحذف بنجاح", "success");
            fetchSettings();
        }
    });
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    placeholder.innerHTML = `
        <div class="table-header-controls">
            <div class="record-badge">إجمالي الإعدادات: <span id="count">${allSettings.length}</span></div>
            <div class="global-search-wrapper">
                <input type="text" id="globalSearch" class="global-search-input" placeholder="بحث بالمفتاح أو الوصف..." onkeyup="filterLocal()">
                <span class="search-icon">🔍</span>
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredSettings = allSettings.filter(s => Object.values(s).some(v => String(v).toLowerCase().includes(term)));
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredSettings.length;
}

function resetForm() {
    document.getElementById('settingsForm').reset();
    document.getElementById('f01_id').value = '';
}

function setupFormListener() {
    document.getElementById('settingsForm').addEventListener('submit', handleFormSubmit);
}

/* END OF FILE: settings.js */
