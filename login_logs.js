/* ==================================================================
 [login_logs.js] - سجل الدخول
 ================================================================== */

let allLogs = [];
let sortDirections = {};

async function loadData() {
    const { data, error } = await _supabase
        .from('t15_login_logs')
        .select('*')
        .order('f02_datetime', { ascending: false });

    if (error) {
        window.showModal("خطأ", `تعذر جلب البيانات: ${error.message}`);
        return;
    }
    allLogs = data;
    renderTable(data);
}

function renderTable(list) {
    if (window.updateRecordCounter) {
        window.updateRecordCounter(list.length);
    }

    let html = `<table><thead><tr>
        <th onclick="sortTable(0)">التاريخ والوقت</th>
        <th onclick="sortTable(1)">المستخدم</th>
        <th onclick="sortTable(2)">الحالة</th>
    </tr></thead><tbody>`;

    list.forEach(item => {
        html += `<tr>
            <td>${new Date(item.f02_datetime).toLocaleString()}</td>
            <td>${item.f03_username}</td>
            <td>${item.f04_status}</td>
        </tr>`;
    });
    document.getElementById('tableContainer').innerHTML = html + "</tbody></table>";
    updateSortVisuals();
}

function sortTable(columnIndex) {
    if (allLogs.length === 0) return;
    const sortKey = Object.keys(allLogs[0])[columnIndex + 1];
    sortDirections[sortKey] = sortDirections[sortKey] === 'asc' ? 'desc' : 'asc';

    allLogs.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortDirections[sortKey] === 'asc' ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortDirections[sortKey] === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(allLogs);
    updateSortVisuals(columnIndex);
}

function updateSortVisuals(columnIndex) {
    document.querySelectorAll('th').forEach((th, i) => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (allLogs.length > 0) {
            const sortKey = Object.keys(allLogs[0])[i + 1];
            if (i === columnIndex) {
                th.classList.add(sortDirections[sortKey] === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        }
    });
}

function excelFilter() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allLogs.filter(o =>
        new Date(o.f02_datetime).toLocaleString().toLowerCase().includes(val) ||
        o.f03_username.toLowerCase().includes(val) ||
        o.f04_status.toLowerCase().includes(val)
    );
    renderTable(filtered);
}

window.onload = () => {
    bootSystem('سجلات الدخول');
    loadData();
};