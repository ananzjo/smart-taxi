let allLogs = [];
let filteredLogs = [];
let currentSort = { col: 'f02_datetime', asc: false };

async function loadLoginLogs() {
    const { data, error } = await _supabase
        .from('t15_login_logs')
        .select('*')
        .order('f02_datetime', { ascending: false });

    if (data) {
        allLogs = data;
        filteredLogs = [...data];
        renderLogsTable();
    }
}


function renderLogsTable() {
    const data = filteredLogs;
    const tbody = document.getElementById('logsBody');
    if (!tbody) return;

    tbody.innerHTML = data.map(log => {
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
                <td style="font-size: 0.75rem; color: #777;">${log.f08_device_info || '-'}</td>
            </tr>
        `;
    }).join('');
    
    if (document.getElementById('recordCount')) {
        document.getElementById('recordCount').innerText = data.length;
    }
}

function sortData(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = true;
    }
    
    filteredLogs.sort((a, b) => {
        let vA = a[col] || '';
        let vB = b[col] || '';
        
        if (!isNaN(Date.parse(vA)) && !isNaN(Date.parse(vB))) {
            vA = new Date(vA);
            vB = new Date(vB);
        } else if (!isNaN(vA) && !isNaN(vB) && vA !== "" && vB !== "") {
            vA = parseFloat(vA);
            vB = parseFloat(vB);
        }

        if (vA < vB) return currentSort.asc ? -1 : 1;
        if (vA > vB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    renderLogsTable();
}

function filterLogs() {
    const val = document.getElementById('logSearch').value.toLowerCase();
    filteredLogs = allLogs.filter(log => 
        Object.values(log).some(v => String(v).toLowerCase().includes(val))
    );
    renderLogsTable();
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
    if (data.f03_password !== pass) {
        await recordLoginEvent(user, 'Failure', 'كلمة مرور خاطئة');
        window.showModal("خطأ", "كلمة المرور غير صحيحة", "error");
        return;
    }

    // 4. نجاح الدخول
    await recordLoginEvent(user, 'Success', 'دخول ناجح للنظام');
    sessionStorage.setItem('full_name_ar', data.f02_name);
    window.location.href = 'dashboard.html';
}