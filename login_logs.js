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

async function loginProcess() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // 1. تسجيل المحاولة فوراً (قبل التحقق من صحة البيانات)
    // هذا يضمن أنه حتى لو كان الاسم خطأ "anan"، سيتم تدوينه في t15
    await recordLoginEvent(user, 'Attempting', 'بدء محاولة الدخول');

    // 2. التحقق من وجود المستخدم في جدول الموظفين t11
    const { data, error } = await _supabase
        .from('t11_staff')
        .select('*')
        .eq('f08_login_name', user)
        .single();

    if (error || !data) {
        // تحديث السجل لحالة الفشل
        await recordLoginEvent(user, 'Failure', 'اسم المستخدم غير موجود في t11');
        window.showModal("خطأ", "اسم المستخدم غير صحيح", "error");
        return;
    }

    // 3. التحقق من كلمة المرور (بافتراض أنك تشفرها أو تقارنها)
    if (data.f09_password !== pass) {
        await recordLoginEvent(user, 'Failure', 'كلمة مرور خاطئة');
        window.showModal("خطأ", "كلمة المرور غير صحيحة", "error");
        return;
    }

    // 4. نجاح الدخول
    await recordLoginEvent(user, 'Success', 'دخول ناجح للنظام');
    sessionStorage.setItem('full_name_ar', data.f02_name);
    window.location.href = 'dashboard.html';
}