/* ==================================================================
 [staff.js] - إدارة الموظفين (v1.1.0)
 ================================================================== */

 let allStaff = []; 
 let sortDirections = {}; 
 
 // [1] جلب البيانات من t11_staff
 async function loadData() {
     const { data, error } = await _supabase
         .from('t11_staff')
         .select('*')
         .order('f02_name');
 
     if (error) { 
         console.error('Staff fetch error:', error);
         window.showToast("تعذر جلب بيانات الموظفين", "error"); 
         return; 
     }
     allStaff = data || [];
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
                 <th><input type="text" class="column-search-input" id="col3Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th></th>
             </tr>
             <tr>
                 <th onclick="sortTable(0)">الاسم</th>
                 <th onclick="sortTable(1)">اسم المستخدم</th>
                 <th onclick="sortTable(2)">الوظيفة</th>
                 <th onclick="sortTable(3)">رقم الجوال</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;
 
     list.forEach(item => {
         html += `<tr>
             <td style="font-weight:bold;">${item.f02_name || ''}</td>
             <td>${item.f08_login_name || ''}</td>
             <td>${item.f05_title || ''}</td>
             <td>${item.f04_mobile || ''}</td>
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
     ['f02_name','f03_password','f04_mobile','f05_title', 'f06_authority', 'f08_login_name']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
     });
 
     if (!payload.f02_name || !payload.f08_login_name) {
         window.showToast("الاسم واسم المستخدم مطلوبان", "warning");
         return;
     }
 
     const btn = document.querySelector('.btn-main');
     const originalText = btn?.innerHTML;
     if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }
 
     try {
         const { error } = id 
             ? await _supabase.from('t11_staff').update(payload).eq('f01_id', id)
             : await _supabase.from('t11_staff').insert([payload]);
             
         if (error) { 
             window.showToast(error.message, 'error'); 
         } else { 
             window.showToast('تم حفظ بيانات الموظف بنجاح ✅', 'success');
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
         (document.getElementById('col2Filter')?.value || '').toLowerCase(),
         (document.getElementById('col3Filter')?.value || '').toLowerCase()
     ];
     const fields = ['f02_name', 'f08_login_name', 'f05_title', 'f04_mobile'];
 
     const filtered = allStaff.filter(item => {
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
     document.getElementById('staffForm').reset();
 }
 
 function confirmReset() {
     window.showModal('تنبيه', 'هل تريد إفراغ جميع الحقول؟', 'warning', () => { resetFieldsOnly(); });
 }
 
 function deleteRecord(id) {
     window.showModal('تأكيد', 'هل أنت متأكد من حذف هذا الموظف؟', 'error', async () => {
         const { error } = await _supabase.from('t11_staff').delete().eq('f01_id', id);
         if (error) { window.showToast('فشل الحذف', 'error'); }
         else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
     });
 }
 
 function editRecord(item) {
     document.getElementById('f01_id').value = item.f01_id;
     ['f02_name','f04_mobile','f05_title', 'f06_authority', 'f08_login_name']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el) el.value = item[fid] || '';
     });
     // Don't populate password field
     document.getElementById('f03_password').value = '';
     
     window.scrollTo({ top: 0, behavior: 'smooth' });
     window.showToast('تم تحميل البيانات للتعديل', 'info');
 }
 
 function viewRecord(item) {
     let msg = `
         <div style="text-align:right; font-family:inherit;">
             <p><b>الاسم الكامل:</b> ${item.f02_name || '-'}</p>
             <p><b>اسم المستخدم:</b> ${item.f08_login_name || '-'}</p>
             <p><b>المسمى الوظيفي:</b> ${item.f05_title || '-'}</p>
             <p><b>رقم الجوال:</b> ${item.f04_mobile || '-'}</p>
             <p><b>الصلاحية:</b> ${item.f06_authority || '-'}</p>
         </div>
     `;
     window.showModal('تفاصيل الموظف', msg, 'info');
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
 
 window.onload = () => {
     bootSystem("إدارة الموظفين");
     loadData();
 };
/* === END OF FILE === */