/* ==================================================================
 [owners.js] - إدارة الملاك (النسخة النهائية المصلحة)
 ================================================================== */

let allOwners = [];

// [1] جلب البيانات - تم تصحيح اسم العمود إلى f02_owner_name
async function loadData() {
    try {
        const { data, error } = await _supabase
            .from('t10_owners')
            .select('*')
            .order('f02_owner_name', { ascending: true }); // التصحيح هنا

        if (error) throw error;

        allOwners = data;
        renderTable(data);
    } catch (err) {
        console.error("Supabase Error:", err);
        // نتحقق من وجود الدالة قبل استدعائها لتجنب الـ Uncaught TypeError
        if (typeof window.showModal === "function") {
            window.showModal("خطأ", "تأكد من وجود عمود f02_owner_name في الجدول", "error");
        }
    }
}

// [2] بناء الجدول وتحديث العداد
function renderTable(list) {
    if (window.updateRecordCounter) window.updateRecordCounter(list.length);

    const tableDiv = document.getElementById('tableContainer');
    if (!tableDiv) return;

    let html = `<table><thead><tr>
        <th>اسم المالك ↕</th>
        <th>رقم الهاتف ↕</th>
        <th>ملاحظات ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(owner => {
        html += `<tr>
            <td style="font-weight:bold;">${owner.f02_owner_name}</td>
            <td>${owner.f03_phone || '-'}</td>
            <td>${owner.f04_notes || '-'}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(owner)})' class="btn-action edit-btn">📝</button>
            </td>
        </tr>`;
    });
    tableDiv.innerHTML = html + "</tbody></table>";
}

// [3] آلية التشغيل الآمنة (The Safe Boot Strategy)
function initOwnersPage() {
    const systemChecker = setInterval(() => {
        // ننتظر حتى تصبح سوبابيز والدوال العالمية جاهزة
        if (window._supabase && window.bootSystem && typeof window.showModal === "function") {
            clearInterval(systemChecker); // أوقف الفحص
            window.bootSystem("إدارة الملاك");
            loadData(); // ابدأ جلب البيانات
            console.log("✅ Owners System Initialized Successfully");
        }
    }, 100); // يفحص كل 100ms
}

// البدء عند تحميل الصفحة
initOwnersPage();
