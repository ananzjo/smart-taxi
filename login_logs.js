/* ==================================================================
 [login_logs.js] - إدارة سجلات الأمان
 ================================================================== */

 async function loadLoginLogs() {
    const { data, error } = await _supabase
        .from('t15_login_logs')
        .select('*')
        .order('f02_datetime', { ascending: false });

    if (data) {
        renderLogsTable(data);
    }
}

function renderLogsTable(data) {
    const tbody = document.getElementById('logsBody');
    tbody.innerHTML = data.map(log => {
        // تنسيق الحالة بالألوان
        const statusStyle = log.f04_status === 'Success' 
            ? 'color: #27ae60; font-weight: bold;' 
            : 'color: #e74c3c; font-weight: bold;';

        return `
            <tr>
                <td>${new Date(log.f02_datetime).toLocaleString('ar-EG')}</td>
                <td>${log.f03_username}</td>
                <td style="${statusStyle}">${log.f04_status === 'Success' ? '✅ ناجح' : '❌ فاشل'}</td>
                <td>${log.f05_failure_reason || '-'}</td>
                <td>${log.f06_ip_address || 'Unknown'}</td>
                <td>${log.f07_location || '-'}</td>
                <td style="font-size: 0.75rem; color: #777;">${log.f08_device_info || '-'}</td>
            </tr>
        `;
    }).join('');
}

function filterLogs() {
    const val = document.getElementById('logSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#logsBody tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
}