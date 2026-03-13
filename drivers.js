/* ==================================================================
 [drivers.js] - إدارة السائقين (v1.1.0)
 ================================================================== */

 let allDrivers = []; 
 let sortDirections = {}; 
 
 // [1] جلب البيانات من t02_drivers
 async function loadData() {
     const { data, error } = await _supabase
         .from('t02_drivers')
         .select('*')
         .order('f02_name');
 
     if (error) { 
         console.error('Drivers fetch error:', error);
         window.showToast("تعذر جلب بيانات السائقين", "error"); 
         return; 
     }
     allDrivers = data || [];
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
                 <th onclick="sortTable(1)">الرقم الوطني</th>
                 <th onclick="sortTable(2)">رقم الهاتف</th>
                 <th onclick="sortTable(3)">الحالة</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;
 
     list.forEach(item => {
         html += `<tr>
             <td style="font-weight:bold;">${item.f02_name || ''}</td>
             <td>${item.f03_national_no || ''}</td>
             <td>${item.f04_mobile || ''}</td>
             <td><span class="badge ${item.f07_status === 'نشط' ? 'bg-success' : 'bg-warning'}">${item.f07_status || 'نشط'}</span></td>
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
     ['f02_name','f03_national_no','f04_mobile','f05_license_type','f06_license_expiry','f07_status','f08_notes']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
     });
 
     if (!payload.f02_name || !payload.f04_mobile) {
         window.showToast("الاسم والهاتف مطلوبان", "warning");
         return;
     }
 
     const btn = document.querySelector('.btn-main');
     const originalText = btn?.innerHTML;
     if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }
 
     try {
         const { error } = id 
             ? await _supabase.from('t02_drivers').update(payload).eq('f01_id', id)
             : await _supabase.from('t02_drivers').insert([payload]);
             
         if (error) { 
             window.showToast(error.message, 'error'); 
         } else { 
             window.showToast('تم حفظ بيانات السائق بنجاح ✅', 'success');
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
     const fields = ['f02_name', 'f03_national_no', 'f04_mobile', 'f07_status'];
 
     const filtered = allDrivers.filter(item => {
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
     document.getElementById('driverForm').reset();
 }
 
 function confirmReset() {
     window.showModal('تنبيه', 'هل تريد إفراغ جميع الحقول؟', 'warning', () => { resetFieldsOnly(); });
 }
 
 function deleteRecord(id) {
     window.showModal('تأكيد', 'هل أنت متأكد من حذف هذا السائق؟', 'error', async () => {
         const { error } = await _supabase.from('t02_drivers').delete().eq('f01_id', id);
         if (error) { window.showToast('فشل الحذف', 'error'); }
         else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
     });
 }
 
 function editRecord(item) {
     document.getElementById('f01_id').value = item.f01_id;
     ['f02_name','f03_national_no','f04_mobile','f05_license_type','f06_license_expiry','f07_status','f08_notes']
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
             <p><b>الاسم:</b> ${item.f02_name || '-'}</p>
             <p><b>الرقم الوطني:</b> ${item.f03_national_no || '-'}</p>
             <p><b>رقم الهاتف:</b> ${item.f04_mobile || '-'}</p>
             <p><b>فئة الرخصة:</b> ${item.f05_license_type || '-'}</p>
             <p><b>انتهاء الرخصة:</b> ${item.f06_license_expiry || '-'}</p>
             <p><b>الحالة:</b> ${item.f07_status || '-'}</p>
             <p><b>ملاحظات:</b> ${item.f08_notes || '-'}</p>
         </div>
     `;
     window.showModal('تفاصيل السائق', msg, 'info');
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