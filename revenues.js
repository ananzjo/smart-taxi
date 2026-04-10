/* === START OF FILE: revenues.js === */
/**
 * File: revenues.js
 * Version: v1.4.0
 * Function: إدارة الإيرادات والتحصيلات (إصلاح الفرز والحفظ)
 * Adhering to Schema: t05_revenues (f01_id to f09_notes)
 */

let allRevenues = [];
let filteredRevenues = [];
let sortOrder = true; // true = تصاعدي, false = تنازلي
let lastField = '';

// التحقق من اسم كائن سوبابيس المستخدم في المشروع
const _db = typeof _supabase !== 'undefined' ? _supabase : supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    await fillRevenueDropdowns();
    await loadData();
    initTableControls();
    setupFormListener();
}

// [1] دالة الفرز المصلحة (Smart Sort)
function sortData(fieldName) {
    if (!filteredRevenues || filteredRevenues.length === 0) return;

    // تبديل اتجاه الفرز إذا تم النقر على نفس الحقل مرتين
    sortOrder = (lastField === fieldName) ? !sortOrder : true;
    lastField = fieldName;

    filteredRevenues.sort((a, b) => {
        let valA = a[fieldName] || '';
        let valB = b[fieldName] || '';

        // فرز الأرقام (مثل المبلغ f06_amount)
        if (fieldName === 'f06_amount') {
            return sortOrder ? valA - valB : valB - valA;
        }

        // فرز النصوص والتواريخ
        return sortOrder 
            ? String(valA).localeCompare(String(valB), 'ar') 
            : String(valB).localeCompare(String(valA), 'ar');
    });

    renderTable();
    console.log(`✅ تم الفرز حسب ${fieldName} (${sortOrder ? 'تصاعدي' : 'تنازلي'})`);
}

// [2] دالة الحفظ المصلحة (Safe Save)
async function saveData(e) {
    if (e) e.preventDefault();

    // التأكد من صحة البيانات قبل الإرسال
    const amount = parseFloat(document.getElementById('f06_amount').value);
    if (isNaN(amount) || amount <= 0) {
        showToast("يرجى إدخال مبلغ صحيح", "error");
        return;
    }

    safeSubmit(async () => {
        const id = document.getElementById('f01_id').value;
        
        // بناء الكائن بناءً على المخطط t05_revenues بدقة
        const payload = {
            f02_date: document.getElementById('f02_date').value,
            f03_car_no: document.getElementById('f03_car_no').value,
            f04_driver_name: document.getElementById('f04_driver_name').value,
            f05_category: document.getElementById('f05_category').value,
            f06_amount: amount,
            f07_method: document.getElementById('f07_method').value,
            f08_collector: document.getElementById('f08_collector').value,
            f09_notes: document.getElementById('f09_notes').value.trim()
            // f10_work_day_link مستثنى لعدم وجوده في جدول t05 في المخطط
        };

        try {
            let res;
            if (id) {
                res = await _db.from('t05_revenues').update(payload).eq('f01_id', id);
            } else {
                res = await _db.from('t05_revenues').insert([payload]);
            }

            if (res.error) throw res.error;

            showToast("تم حفظ السجل المالي بنجاح ✅", "success");
            resetForm();
            await loadData();
        } catch (err) {
            console.error("Save Error:", err.message);
            showToast(`خطأ أثناء الحفظ: ${err.message}`, "error");
        }
    });
}

// [3] جلب البيانات الأصلية
async function loadData() {
    try {
        const { data, error } = await _db
            .from('t05_revenues')
            .select('*')
            .order('f02_date', { ascending: false });

        if (error) throw error;
        allRevenues = data || [];
        filteredRevenues = [...allRevenues];
        renderTable();
    } catch (err) {
        console.error("Load Error:", err);
        if (typeof showToast === 'function') showToast("تعذر جلب البيانات", "error");
    }
}

// [4] تعبئة القوائم المنسدلة بناءً على المخطط
async function fillRevenueDropdowns() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _db.from('t01_cars').select('f02_plate_no').eq('f12_is_active', 'نشط'),
            _db.from('t02_drivers').select('f02_name'),
            _db.from('t11_staff').select('f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_name');
        const staffSelect = document.getElementById('f08_collector');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driversRes.data && driverSelect) {
            const uniqueDrivers = [...new Set(driversRes.data.map(d => d.f02_name))].sort();
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' + 
                uniqueDrivers.map(name => `<option value="${name}">${name}</option>`).join('');
        }
        if (staffRes.data && staffSelect) {
            staffSelect.innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }
    } catch (err) {
        console.error("Dropdown Fill Error:", err);
    }
}

function renderTable() {
    const container = document.getElementById('tableContainer');
    if (!container) return;

    if (filteredRevenues.length === 0) {
        container.innerHTML = '<div class="p-10 text-center text-slate-400">💰 لا توجد بيانات مطابقة</div>';
        return;
    }

    let html = `
        <table class="w-full text-right border-collapse">
            <thead>
                <tr class="bg-slate-800 text-white">
                    <th class="p-4 cursor-pointer hover:bg-slate-700" onclick="sortData('f02_date')">التاريخ ↕</th>
                    <th class="p-4 cursor-pointer hover:bg-slate-700" onclick="sortData('f03_car_no')">السيارة ↕</th>
                    <th class="p-4 cursor-pointer hover:bg-slate-700" onclick="sortData('f04_driver_name')">السائق ↕</th>
                    <th class="p-4">الفئة</th>
                    <th class="p-4 cursor-pointer hover:bg-slate-700" onclick="sortData('f06_amount')">المبلغ ↕</th>
                    <th class="p-4">الطريقة</th>
                    <th class="p-4">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${filteredRevenues.map(rev => `
                    <tr class="border-b border-white/5 hover:bg-white/5">
                        <td class="p-4">${rev.f02_date}</td>
                        <td class="p-4 font-bold">${rev.f03_car_no}</td>
                        <td class="p-4">${rev.f04_driver_name}</td>
                        <td class="p-4"><span class="px-2 py-1 bg-slate-700 rounded text-xs">${rev.f05_category}</span></td>
                        <td class="p-4 font-black text-green-400">${parseFloat(rev.f06_amount).toLocaleString()}</td>
                        <td class="p-4">${rev.f07_method}</td>
                        <td class="p-4">
                            <button onclick="editRecord(${rev.f01_id})" class="text-blue-400 hover:text-blue-200 ml-2">✏️</button>
                            <button onclick="deleteRecord(${rev.f01_id})" class="text-red-400 hover:text-red-200">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    updateCounter();
}

function initTableControls() {
    const placeholder = document.getElementById('tableControlsPlaceholder');
    if (!placeholder) return;
    placeholder.innerHTML = `
        <div class="flex justify-between items-center mb-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div class="text-sm font-bold">إجمالي السجلات: <span id="count" class="text-yellow-400">0</span></div>
            <div class="relative">
                <input type="text" id="globalSearch" class="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-64" placeholder="بحث سريع..." onkeyup="filterLocal()">
            </div>
        </div>
    `;
}

function filterLocal() {
    const term = document.getElementById('globalSearch').value.toLowerCase();
    filteredRevenues = allRevenues.filter(r => 
        Object.values(r).some(v => String(v).toLowerCase().includes(term))
    );
    renderTable();
}

function updateCounter() {
    const el = document.getElementById('count');
    if (el) el.innerText = filteredRevenues.length;
}

function resetForm() {
    const form = document.getElementById('revenueForm');
    if (form) form.reset();
    document.getElementById('f01_id').value = '';
    document.getElementById('f02_date').valueAsDate = new Date();
}

function setupFormListener() {
    const form = document.getElementById('revenueForm');
    if (form) form.addEventListener('submit', saveData);
}

// دوال فارغة مؤقتاً لمنع أخطاء النقر
function editRecord(id) { 
    const rev = allRevenues.find(x => x.f01_id == id);
    if (!rev) return;
    document.getElementById('f01_id').value = rev.f01_id;
    document.getElementById('f02_date').value = rev.f02_date;
    document.getElementById('f03_car_no').value = rev.f03_car_no;
    document.getElementById('f04_driver_name').value = rev.f04_driver_name;
    document.getElementById('f05_category').value = rev.f05_category;
    document.getElementById('f06_amount').value = rev.f06_amount;
    document.getElementById('f07_method').value = rev.f07_method;
    document.getElementById('f08_collector').value = rev.f08_collector;
    document.getElementById('f09_notes').value = rev.f09_notes || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteRecord(id) {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    const { error } = await _db.from('t05_revenues').delete().eq('f01_id', id);
    if (!error) {
        showToast("تم الحذف بنجاح", "success");
        loadData();
    }
}

/* === END OF FILE: revenues.js === */
