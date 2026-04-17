/* === START OF FILE: lookups.js === */

let currentCategory = null;
let lookupData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

/**
 * جلب جميع التصنيفات الفريدة من الجدول
 */
async function loadCategories() {
    try {
        const { data, error } = await _supabase
            .from('sys_lookup_data')
            .select('f02_category');
        
        if (error) throw error;

        // استخراج التصنيفات الفريدة فقط
        const categories = [...new Set(data.map(item => item.f02_category))];
        renderCategoryPills(categories);

    } catch (err) {
        console.error("Error loading categories:", err.message);
        showToast("فشل تحميل التصنيفات", "error");
    }
}

/**
 * رسم أزرار التصنيفات (Pills)
 */
function renderCategoryPills(categories) {
    const container = document.getElementById('categoryContainer');
    
    if (categories.length === 0) {
        container.innerHTML = `<p style="color:#888;">لا يوجد تصنيفات حالياً. أضف تصنيفاً جديداً للبدء.</p>`;
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="category-pill ${currentCategory === cat ? 'active' : ''}" 
             onclick="selectCategory('${cat}')">
            ${cat.replace(/_/g, ' ').toUpperCase()}
        </div>
    `).join('');
}

/**
 * اختيار تصنيف معين لعرض بياناته
 */
async function selectCategory(cat) {
    currentCategory = cat;
    
    // تحديث الشكل البصري للأزرار
    document.querySelectorAll('.category-pill').forEach(p => {
        p.classList.toggle('active', p.innerText.toLowerCase() === cat.replace(/_/g, ' '));
    });

    // إظهار نموذج الإدخال وتجهيزه
    document.getElementById('entryFormSection').style.display = 'block';
    document.getElementById('f02_category').value = cat;
    document.getElementById('formTitle').innerText = `📝 إضافة قيمة إلى: ${cat}`;
    resetLookupForm();

    loadLookupValues(cat);
}

/**
 * جلب القيم الخاصة بتصنيف معين
 */
async function loadLookupValues(cat) {
    const container = document.getElementById('lookupTableContainer');
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>جاري جلب القيم...</p></div>';

    try {
        const { data, error } = await _supabase
            .from('sys_lookup_data')
            .select('*')
            .eq('f02_category', cat)
            .order('f03_label_ar', { ascending: true });

        if (error) throw error;

        lookupData = data || [];
        renderLookupTable(lookupData);

    } catch (err) {
        console.error("Error loading values:", err.message);
        container.innerHTML = `<div class="empty-state">⚠️ حدث خطأ أثناء تحميل البيانات</div>`;
    }
}

/**
 * رسم جدول القيم
 */
function renderLookupTable(data) {
    const container = document.getElementById('lookupTableContainer');
    
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state">لا يوجد قيم مسجلة لهذا التصنيف حالياً.</div>`;
        return;
    }

    let html = `
        <table class="luxury-table">
            <thead>
                <tr>
                    <th>الاسم (AR)</th>
                    <th>المفتاح (Key)</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td><b>${item.f03_label_ar}</b></td>
                        <td><code>${item.f04_value_key}</code></td>
                        <td>
                            <span class="status-badge ${item.f05_is_active ? 'status-active' : 'status-inactive'}">
                                ${item.f05_is_active ? 'نشط' : 'معطل'}
                            </span>
                        </td>
                        <td>
                            <div style="display:flex; gap:5px; justify-content:center;">
                                <button onclick="editLookup('${item.f01_id}')" class="btn-edit" title="تعديل">✏️</button>
                                <button onclick="deleteLookup('${item.f01_id}')" class="btn-delete" title="حذف">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

/**
 * فلترة القيم محلياً
 */
function filterLookups() {
    const query = document.getElementById('lookupSearch').value.toLowerCase();
    const filtered = lookupData.filter(item => 
        item.f03_label_ar.toLowerCase().includes(query) || 
        item.f04_value_key.toLowerCase().includes(query)
    );
    renderLookupTable(filtered);
}

/**
 * حفظ البيانات (إضافة أو تعديل)
 */
document.getElementById('lookupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('f01_id').value;
    const category = document.getElementById('f02_category').value;
    const label = document.getElementById('f03_label_ar').value;
    const key = document.getElementById('f04_value_key').value;
    const isActive = document.getElementById('f05_is_active').value === 'true';

    const payload = {
        f02_category: category,
        f03_label_ar: label,
        f04_value_key: key,
        f05_is_active: isActive
    };

    try {
        let res;
        if (id) {
            // Edit
            res = await _supabase.from('sys_lookup_data').update(payload).eq('f01_id', id);
        } else {
            // New
            res = await _supabase.from('sys_lookup_data').insert([payload]);
        }

        if (res.error) throw res.error;

        showToast("تم حفظ البيانات بنجاح ✅");
        resetLookupForm();
        loadLookupValues(category);
        
        // إعادة تحميل التصنيفات في حالة كانت هذه أول قيمة في تصنيف جديد
        loadCategories();

    } catch (err) {
        console.error("Save Error:", err.message);
        showToast("فشل الحفظ: " + err.message, "error");
    }
});

/**
 * تجهيز النموذج للتعديل
 */
function editLookup(id) {
    const item = lookupData.find(i => i.f01_id == id);
    if (!item) return;

    document.getElementById('f01_id').value = item.f01_id;
    document.getElementById('f03_label_ar').value = item.f03_label_ar;
    document.getElementById('f04_value_key').value = item.f04_value_key;
    document.getElementById('f05_is_active').value = String(item.f05_is_active);
    
    document.getElementById('formTitle').innerText = `✏️ تعديل القيمة: ${item.f03_label_ar}`;
    window.scrollTo({ top: 150, behavior: 'smooth' });
}

/**
 * حذف قيمة
 */
async function deleteLookup(id) {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه القيمة؟")) return;

    try {
        const { error } = await _supabase
            .from('sys_lookup_data')
            .delete()
            .eq('f01_id', id);

        if (error) throw error;

        showToast("تم حذف القيمة بنجاح 🗑️");
        loadLookupValues(currentCategory);
        loadCategories();

    } catch (err) {
        console.error("Delete Error:", err.message);
        showToast("فشل الحذف: " + err.message, "error");
    }
}

/**
 * تفريغ النموذج
 */
function resetLookupForm() {
    document.getElementById('f01_id').value = '';
    document.getElementById('f03_label_ar').value = '';
    document.getElementById('f04_value_key').value = '';
    document.getElementById('f05_is_active').value = 'true';
    document.getElementById('formTitle').innerText = `📝 إضافة قيمة جديدة إلى: ${currentCategory || '...'}`;
}

/**
 * إضافة تصنيف جديد تماماً
 */
function showNewCategoryModal() {
    const newCat = prompt("أدخل اسم التصنيف الجديد (إنجليزي - بدون مسافات - مثلاً: car_brand):");
    if (!newCat) return;

    const formattedCat = newCat.trim().toLowerCase().replace(/\s+/g, '_');
    selectCategory(formattedCat);
    showToast("تم إنشاء التصنيف. أضف القيمة الأولى الآن.", "info");
}

/* === END OF FILE: lookups.js === */
