/* ==================================================================
 [owners.js] - إدارة الملاك (الإصدار المعتمد بناءً على Schema t10_owners)
 ================================================================== */

let allOwners = [];

// [1] جلب البيانات - استخدام المسميات الصحيحة من الـ Schema
async function loadData() {
    try {
        const { data, error } = await _supabase
            .from('t10_owners')
            .select('*')
            .order('f02_owner_name', { ascending: true });

        if (error) throw error;
        allOwners = data;
        renderTable(data);
    } catch (err) {
        console.error("Supabase Error:", err);
        if (window.showModal) window.showModal("خطأ", "تعذر جلب بيانات الملاك", "error");
    }
}

// [2] بناء الجدول - ربط الأعمدة (اسم، نوع، هاتف، حساب بنكي)
function renderTable(list) {
    if (window.updateRecordCounter) window.updateRecordCounter(list.length);
    const tableDiv = document.getElementById('tableContainer');
    if (!tableDiv) return;

    let html = `<table><thead><tr>
        <th>اسم المالك ↕</th>
        <th>النوع ↕</th>
        <th>رقم الهاتف ↕</th>
        <th>الحساب البنكي ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(owner => {
        html += `<tr>
            <td style="font-weight:bold; color:var(--taxi-dark)">${owner.f02_owner_name}</td>
            <td>${owner.f03_owner_type || '-'}</td>
            <td dir="ltr" style="text-align:right">${owner.f04_contact_number || '-'}</td>
            <td>${owner.f06_bank_account || '-'}</td>
            <td>
                <button onclick='editRecord(${JSON.stringify(owner)})' class="btn-action edit-btn" title="تعديل">📝</button>
                <button onclick="deleteRecord(${owner.f01_id})" class="btn-action delete-btn" title="حذف">🗑️</button>
            </td>
        </tr>`;
    });
    tableDiv.innerHTML = html + "</tbody></table>";
}

// [3] حفظ وتحديث البيانات (saveData)
window.saveData = async function() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    
    // جمع المدخلات بناءً على IDs الحقول في الـ HTML (يجب أن تطابق f02, f03... إلخ)
    document.querySelectorAll('[id^="f"]').forEach(el => {
        if (el.value.trim() !== "") payload[el.id] = el.value.trim();
    });

    if (!payload.f02_owner_name || !payload.f04_contact_number) {
        window.showModal("تنبيه", "الاسم ورقم الهاتف حقول إجبارية", "warning");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t10_owners').update(payload).eq('f01_id', id)
        : await _supabase.from('t10_owners').insert([payload]);

    if (error) {
        window.showModal("فشل العملية", error.message, "error");
    } else {
        window.showModal("تم الحفظ", "تم تحديث بيانات المالك بنجاح ✅", "success");
        resetForm();
        loadData();
    }
};

// [4] التعديل (تعبئة النموذج)
window.editRecord = function(owner) {
    Object.keys(owner).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = owner[key];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// [5] الحذف (باستخدام المودال العالمي)
window.deleteRecord = function(id) {
    window.showModal("تأكيد الحذف", "هل أنت متأكد من حذف هذا المالك؟ لا يمكن التراجع!", "warning", async () => {
        const { error } = await _supabase.from('t10_owners').delete().eq('f01_id', id);
        if (error) {
            window.showModal("خطأ", "لا يمكن الحذف لوجود سجلات مرتبطة", "error");
        } else {
            loadData();
        }
    });
};

// [6] البحث والتنظيف
window.excelFilter = function() {
    const val = document.getElementById('excelSearch').value.toLowerCase();
    const filtered = allOwners.filter(o => 
        String(o.f02_owner_name).toLowerCase().includes(val) || 
        String(o.f04_contact_number).includes(val)
    );
    renderTable(filtered);
};

window.resetForm = function() {
    const form = document.getElementById('ownerForm');
    if (form) form.reset();
    document.getElementById('f01_id').value = "";
};

window.confirmReset = function() {
    window.showModal("تأكيد", "هل تريد تفريغ جميع الحقول؟", "info", () => resetForm());
};

// [7] تشغيل النظام
document.addEventListener("DOMContentLoaded", () => {
    const systemChecker = setInterval(() => {
        if (window._supabase && window.bootSystem) {
            clearInterval(systemChecker);
            window.bootSystem("إدارة الملاك");
            loadData();
        }
    }, 100);
});
