/* ==================================================================
 [owners.js] - إدارة الملاك (v1.1.0)
 ================================================================== */

 let allOwners = []; 
 let sortDirections = {}; 
 
 // [1] جلب البيانات من t10_owners
 async function loadData() {
     const { data, error } = await _supabase
         .from('t10_owners')
         .select('*')
         .order('f02_owner_name');
 
     if (error) { 
         console.error('Owners fetch error:', error);
         window.showToast("تعذر جلب بيانات الملاك", "error"); 
         return; 
     }
     allOwners = data || [];
     renderTable(data || []);
 }
 
 // [2] بناء الجدول — تصفية فوق العناوين
 function renderTable(list) {
     const countEl = document.getElementById('pageRecordCount');
     if (countEl) countEl.innerText = list.length;
 
     let html = `<table>
         <thead>
             <tr class="column-search-row">
                 <th><input type="text" class="column-search-input" id="col0Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col1Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th><input type="text" class="column-search-input" id="col2Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th></th>
             </tr>
             <tr>
                 <th onclick="sortTable(0)">اسم المالك</th>
                 <th onclick="sortTable(1)">رقم الهوية</th>
                 <th onclick="sortTable(2)">رقم التواصل</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;
 
     list.forEach(item => {
         html += `<tr>
             <td style="font-weight:bold;">${item.f02_owner_name || ''}</td>
             <td>${item.f03_national_id || ''}</td>
             <td>${item.f04_contact_number || ''}</td>
             <td>
                 <div class="action-btns-group">
                     <button onclick='viewRecord(${JSON.stringify(item)})' class="btn-action-sm btn-view" title="عرض">👁️</button>
                     <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action-sm btn-edit" title="تعديل">✍️</button>
                     <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete" title="حذف">🗑️</button>
                 </div>
             </td>
         </tr>`;
     });
     
     const container = document.getElementById('tableContainer');
     if(container) container.innerHTML = html + "</tbody></table>";
 }
 
 // [3] حفظ البيانات
 async function saveData() {
     const id = document.getElementById('f01_id').value;
     const payload = {};
     ['f02_owner_name', 'f03_national_id', 'f04_contact_number', 'f05_address', 'f06_notes']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
     });
 
     if (!payload.f02_owner_name || !payload.f04_contact_number) {
         window.showToast("الاسم ورقم التواصل مطلوبان", "warning");
         return;
     }
 
     const btn = document.querySelector('.btn-main');
     const originalText = btn?.innerHTML;
     if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }
 
     try {
         const { error } = id 
             ? await _supabase.from('t10_owners').update(payload).eq('f01_id', id)
             : await _supabase.from('t10_owners').insert([payload]);
             
         if (error) { 
             window.showToast(error.message, 'error'); 
         } else { 
             window.showToast('تم حفظ بيانات المالك بنجاح ✅', 'success');
             resetFieldsOnly(); loadData();
         }
     } finally {
         if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
     }
 }
 
 // [4] البحث المتقدم
 function multiColumnSearch() {
     const globalVal = (document.getElementById('globalSearch')?.value || '').toLowerCase();
     const colFilters = [
         (document.getElementById('col0Filter')?.value || '').toLowerCase(),
         (document.getElementById('col1Filter')?.value || '').toLowerCase(),
         (document.getElementById('col2Filter')?.value || '').toLowerCase()
     ];
     const fields = ['f02_owner_name', 'f03_national_id', 'f04_contact_number'];
 
     const filtered = allOwners.filter(item => {
         const matchesGlobal = globalVal === '' || Object.values(item).some(v => String(v).toLowerCase().includes(globalVal));
         if (!matchesGlobal) return false;
         return fields.every((f, i) => colFilters[i] === '' || String(item[f] || '').toLowerCase().includes(colFilters[i]));
     });
 
     const activeId = document.activeElement.id;
     renderTable(filtered);
     if (activeId) {
         const input = document.getElementById(activeId);
         if (input) { input.focus(); const v = input.value; input.value = ''; input.value = v; }
     }
 }
 
 // [5] دوال مساعدة
 function resetFieldsOnly() {
     document.getElementById('f01_id').value = '';
     document.getElementById('ownerForm').reset();
 }
 
 function confirmReset() {
     window.showModal('تنبيه', 'هل تريد إفراغ جميع الحقول؟', 'warning', () => { resetFieldsOnly(); });
 }
 
 function deleteRecord(id) {
     window.showModal('تأكيد', 'هل أنت متأكد من حذف هذا المالك؟', 'error', async () => {
         const { error } = await _supabase.from('t10_owners').delete().eq('f01_id', id);
         if (error) { window.showToast('فشل الحذف', 'error'); }
         else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
     });
 }
 
 function editRecord(item) {
     document.getElementById('f01_id').value = item.f01_id;
     ['f02_owner_name','f03_national_id','f04_contact_number','f05_address','f06_notes']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el) el.value = item[fid] || '';
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
     window.showToast('تم تحميل البيانات للتعديل', 'info');
 }
 
 function viewRecord(item) {
     let msg = `
         <div style="text-align:right; font-family:inherit;">
             <p><b>اسم المالك:</b> ${item.f02_owner_name || '-'}</p>
             <p><b>رقم الهوية:</b> ${item.f03_national_id || '-'}</p>
             <p><b>رقم التواصل:</b> ${item.f04_contact_number || '-'}</p>
             <p><b>العنوان:</b> ${item.f05_address || '-'}</p>
             <p><b>ملاحظات:</b> ${item.f06_notes || '-'}</p>
         </div>
     `;
     window.showModal('تفاصيل المالك', msg, 'info');
 }
 
 function sortTable(n) {
     const tbody = document.querySelector("table tbody");
     const rows = Array.from(tbody.rows);
     const isAsc = sortDirections[n] !== true;
     
     rows.sort((a, b) => {
         let x = a.cells[n].innerText.toLowerCase();
         let y = b.cells[n].innerText.toLowerCase();
         if (!isNaN(x) && !isNaN(y)) { x = parseFloat(x); y = parseFloat(y); }
         return isAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
     });
     
     sortDirections[n] = isAsc;
     rows.forEach(row => tbody.appendChild(row));
     
     if (window.updateSortVisuals) window.updateSortVisuals(n, isAsc);
 }
/* === END OF FILE === */
