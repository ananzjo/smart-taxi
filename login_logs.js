/* ==================================================================
 [login_logs.js] - سجل الدخول (v1.1.0)
 ================================================================== */

 let allLogs = []; 
 let sortDirections = {}; 
 
 // [1] جلب البيانات من t15_login_logs
 async function loadData() {
     const { data, error } = await _supabase
         .from('t15_login_logs')
         .select('*')
         .order('f02_datetime', { ascending: false });
 
     if (error) { 
         console.error('Login logs fetch error:', error);
         window.showToast("تعذر جلب البيانات", "error"); 
         return; 
     }
     allLogs = data || [];
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
                 <th onclick="sortTable(0)">المستخدم</th>
                 <th onclick="sortTable(1)">تاريخ/وقت الدخول</th>
                 <th onclick="sortTable(2)">عنوان IP</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;
 
     list.forEach(item => {
         html += `<tr>
             <td><b>${item.f03_username || ''}</b></td>
             <td>${new Date(item.f02_datetime).toLocaleString('ar-EG')}</td>
             <td>${item.f06_ip_address || '-'}</td>
             <td>
                 <div class="action-btns-group">
                     <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete" title="حذف">🗑️</button>
                 </div>
             </td>
         </tr>`;
     });
     
     const container = document.getElementById('tableContainer');
     if(container) container.innerHTML = html + "</tbody></table>";
 }
 
 // [3] البحث المتقدم
 function multiColumnSearch() {
     const globalVal = (document.getElementById('globalSearch')?.value || '').toLowerCase();
     const colFilters = [
         (document.getElementById('col0Filter')?.value || '').toLowerCase(),
         (document.getElementById('col1Filter')?.value || '').toLowerCase(),
         (document.getElementById('col2Filter')?.value || '').toLowerCase()
     ];
     const fields = ['f03_username', 'f02_datetime', 'f06_ip_address'];
 
     const filtered = allLogs.filter(item => {
         const matchesGlobal = globalVal === '' || Object.values(item).some(v => String(v).toLowerCase().includes(globalVal));
         if (!matchesGlobal) return false;
         return fields.every((f, i) => colFilters[i] === '' || String(item[f] || '').toLowerCase().includes(colFilters[i]));
     });
 
     renderTable(filtered);
 }
 
 // [4] دوال مساعدة
 function deleteRecord(id) {
     window.showModal('تأكيد', 'هل تريد حذف هذا السجل؟', 'error', async () => {
         const { error } = await _supabase.from('t15_login_logs').delete().eq('f01_id', id);
         if (error) { window.showToast('فشل الحذف', 'error'); }
         else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
     });
 }
 
 function sortTable(n) {
     const tbody = document.querySelector("table tbody");
     const rows = Array.from(tbody.rows);
     const isAsc = sortDirections[n] !== true;
     
     rows.sort((a, b) => {
         let x = a.cells[n].innerText.toLowerCase();
         let y = b.cells[n].innerText.toLowerCase();
         return isAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
     });
     
     sortDirections[n] = isAsc;
     rows.forEach(row => tbody.appendChild(row));
     
     if (window.updateSortVisuals) window.updateSortVisuals(n, isAsc);
 }
/* === END OF FILE === */