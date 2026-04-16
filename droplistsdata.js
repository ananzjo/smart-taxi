/* === START OF FILE === */
/**
 * File: droplistsdata.js
 * Version: v1.0.1
 * Function: محرك جلب بيانات القوائم المنسدلة من جدول sys_lookup_data
 * Components: Supabase Client
 * Input: category (string), elementId (string), optional defaultText (string)
 */

const LookupEngine = {
    // تخزين البيانات محلياً لمنع تكرار الطلبات للسيرفر في نفس الجلسة
    cache: {},

    /**
     * جلب البيانات وتعبئة القائمة المنسدلة
     */

async fillSelect(category, elementId, config = {}) {
        const {
            placeholder = "-- اختر --",
            selectedValue = null,
            filterActive = true
        } = config;

        const selectElement = document.getElementById(elementId);
        if (!selectElement) {
            console.warn(`LookupEngine: Element #${elementId} not found.`);
            return;
        }

        try {
            let data = this.cache[category];

            // إذا لم تكن البيانات في الكاش، نجلبها من Supabase
            if (!data) {
                const query = _supabase
                    .from('sys_lookup_data')
                    .select('f03_label_ar, f04_value_key')
                    .eq('f02_category', category);
                
                if (filterActive) query.eq('f05_is_active', true);
                
                const { data: fetchRes, error } = await query.order('f03_label_ar', { ascending: true });
                if (error) {
                    console.error(`LookupEngine [${category}] fetch error:`, error.message);
                    data = [];
                } else {
                    data = fetchRes || [];
                    this.cache[category] = data; 
                }
            }

            // بناء خيارات الـ HTML
            let html = `<option value="">${placeholder}</option>`;
            data.forEach(item => {
                const selected = String(item.f03_label_ar) === String(selectedValue) ? 'selected' : '';
                html += `<option value="${item.f03_label_ar}" ${selected}>${item.f03_label_ar}</option>`;
            });

            selectElement.innerHTML = html;

        } catch (err) {
            console.error(`LookupEngine Error [${category}]:`, err.message);
            selectElement.innerHTML = `<option value="">⚠️ خطأ في التحميل</option>`;
        }
    }
};

/* === END OF FILE === */