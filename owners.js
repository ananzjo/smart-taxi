/*
==================================================================
 [owners.js] - إدارة الملاك (النسخة الكاملة والمصححة بناءً على Schema)
================================================================== 

 */

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
        if (window.showModal) window.showModal("خطأ في الاتصال", "تعذر جلب بيانات الملاك من السيرفر", "error");
    }
}

// [2] بناء الجدول - ربط الأعمدة (اسم، نوع، هاتف، ملاحظات)
function renderTable(list) {
    if (window.updateRecordCounter) window.updateRecordCounter(list.length);
    const tableDiv = document.getElementById('tableContainer');
    if (!tableDiv) return;

    let html = `<table><thead><tr>
        <th>اسم المالك ↕</th>
        <th>النوع ↕</th>
        <th>رقم الهاتف ↕</th>
        <th>الملاحظات ↕</th>
        <th>إجراءات</th>
    </tr></thead><tbody>`;

    list.forEach(owner => {
        // تحويل الكائن لنص آمن لاستخدامه في زر التعديل لمنع مشاكل الرموز
        const ownerData = JSON.stringify(owner).replace(/'/g, "&apos;");
        
        html += `<tr>
            <td style="font-weight:bold; color:var(--taxi-dark)">${owner.f02_owner_name}</td>
            <td>${owner.f03_owner_type || 'فرد'}</td>
            <td dir="ltr" style="text-align:right">${owner.f04_contact_number || '-'}</td>
            <td style="font-size: 0.85rem; color: #666;">${owner.f07_owner_notes || '-'}</td>
            <td>
                <button onclick='editRecord(${ownerData})' class="btn-action edit-btn" title="تعديل">📝</button>
                <button onclick="deleteRecord(${owner.f01_id})" class="btn-action delete-btn" title="حذف">🗑️</button>
            </td>
        </tr>`;
    });
    tableDiv.innerHTML = html + "</tbody></table>";
}

// [3] حفظ وتحديث البيانات (saveData)
window.saveData = async function() {
    const id = document.getElementById('f01_id').value;
    const payload = {
        f02_owner_name: document.getElementById('f02_owner_name').value.trim(),
        f03_owner_type: document.getElementById('f03_owner_type').value,
        f04_contact_number: document.getElementById('f04_contact_number').value.trim(),
        f07_owner_notes: document.getElementById('f07_owner_notes').value.trim()
    };

    if (!payload.f02_owner_name || !payload.f04_contact_number) {
        window.showModal("تنبيه", "الاسم ورقم الهاتف حقول إجبارية", "warning");
        return;
    }

    const { error } = id 
        ? await _supabase.from('t10_owners').update(payload).eq('f01_id', id)
        : await _supabase.from('t10_owners').insert([payload]);

    if (error) {
        window.showModal("فشل العملية", "تأكد من عدم تكرار رقم الهاتف: " + error.message, "error");
    } else {
        window.showModal("تم الحفظ", "تم تحديث بيانات المالك بنجاح ✅", "success");
        resetForm();
        loadData();
    }
};

// [4] التعديل (تعبئة النموذج)
window.editRecord = function(owner) {
    if (document.getElementById('f01_id')) document.getElementById('f01_id').value = owner.f01_id;
    if (document.getElementById('f02_owner_name')) document.getElementById('f02_owner_name').value = owner.f02_owner_name;
    if (document.getElementById('f03_owner_type')) document.getElementById('f03_owner_type').value = owner.f03_owner_type;
    if (document.getElementById('f04_contact_number')) document.getElementById('f04_contact_number').value = owner.f04_contact_number;
    if (document.getElementById('f07_owner_notes')) document.getElementById('f07_owner_notes').value = owner.f07_owner_notes;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// [5] الحذف (باستخدام المودال العالمي)
window.deleteRecord = function(id) {
    window.showModal("تأكيد الحذف", "هل أنت متأكد من حذف هذا المالك؟ لا يمكن التراجع!", "warning", async () => {
        const { error } = await _supabase.from('t10_owners').delete().eq('f01_id', id);
        if (error) {
            window.showModal("خطأ", "لا يمكن الحذف (قد يكون المالك مرتبط بسيارات مسجلة)", "error");
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
    const fields = ['f01_id', 'f02_owner_name', 'f04_contact_number', 'f07_owner_notes'];
    fields.forEach(f => { if(document.getElementById(f)) document.getElementById(f).value = ""; });
    if(document.getElementById('f03_owner_type')) document.getElementById('f03_owner_type').value = "فرد";
};

window.confirmReset = function() {
    window.showModal("تأكيد", "هل تريد تفريغ جميع الحقول؟", "info", () => resetForm());
};

// [7] تشغيل النظام بآلية الانتظار (Safe Boot)
document.addEventListener("DOMContentLoaded", () => {
    const systemChecker = setInterval(() => {
        if (window._supabase && window.bootSystem && typeof window.showModal === "function") {
            clearInterval(systemChecker);
            window.bootSystem("إدارة الملاك");
            loadData();
        }
    }, 100);
});
