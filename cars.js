/* ==================================================================
 [cars.js] - إدارة السيارات (v1.1.0)
 ================================================================== */

 let allCars = [];
 let sortDirections = {};

 // [1] تعبئة القوائم المنسدلة
 async function fillDropdowns() {
     try {
         const [ownersRes, driversRes] = await Promise.all([
             _supabase.from('t10_owners').select('f01_id, f02_owner_name'),
             _supabase.from('t02_drivers').select('f01_id, f02_name')
         ]);

         const ownerSelect = document.getElementById('f11_owner_id');
         const driverSelect = document.getElementById('f13_current_driver_id');

         if (ownersRes.data && ownerSelect) {
             ownerSelect.innerHTML = '<option value="">-- اختر المالك --</option>' +
                 ownersRes.data.map(o => `<option value="${o.f01_id}">${o.f02_owner_name}</option>`).join('');
         }

         if (driversRes.data && driverSelect) {
             driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' +
                 driversRes.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
         }
     } catch (err) {
         console.error('Dropdown Error:', err);
     }
 }

 // [2] جلب البيانات
 async function loadData() {
     const { data, error } = await _supabase.from('t01_cars').select('*').order('f02_plate_no');
     if (error) {
         window.showToast("تعذر جلب بيانات السيارات", "error");
         return;
     }
     allCars = data || [];
     renderTable(allCars);
 }

 // [3] بناء الجدول — تصفية فوق العناوين
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
                 <th><input type="text" class="column-search-input" id="col4Filter" onkeyup="multiColumnSearch()" placeholder="بحث..."></th>
                 <th></th>
             </tr>
             <tr>
                 <th onclick="sortTable(0)">رقم اللوحة</th>
                 <th onclick="sortTable(1)">الماركة</th>
                 <th onclick="sortTable(2)">الموديل</th>
                 <th onclick="sortTable(3)">الضمان اليومي</th>
                 <th onclick="sortTable(4)">الحالة</th>
                 <th>إجراءات</th>
             </tr>
         </thead>
         <tbody>`;

     list.forEach(item => {
         html += `<tr>
             <td style="font-weight:bold;">${item.f02_plate_no || ''}</td>
             <td>${item.f04_brand || ''}</td>
             <td>${item.f06_model || ''}</td>
             <td>${item.f08_standard_rent || '0'}</td>
             <td><span class="badge ${item.f12_is_active === 'نشط' ? 'bg-success' : 'bg-danger'}">${item.f12_is_active || 'نشط'}</span></td>
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
     if (container) container.innerHTML = html + "</tbody></table>";
 }

 // [4] حفظ البيانات
 async function saveData() {
     const id = document.getElementById('f01_id').value;
     const payload = {};
     ['f02_plate_no','f03_car_office','f04_brand','f06_model','f07_license_expiry','f08_standard_rent','f11_owner_id','f13_current_driver_id','f15_fuel_type','f12_is_active','f14_car_notes']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el && el.value.trim() !== '') payload[fid] = el.value.trim();
     });

     if (!payload.f02_plate_no) {
         window.showToast("رقم اللوحة مطلوب", "warning");
         return;
     }

     const btn = document.querySelector('.btn-main');
     const originalText = btn?.innerHTML;
     if (btn) { btn.innerHTML = '🔄 جاري الحفظ...'; btn.disabled = true; }

     try {
         const { error } = id 
             ? await _supabase.from('t01_cars').update(payload).eq('f01_id', id)
             : await _supabase.from('t01_cars').insert([payload]);
             
         if (error) { 
             window.showToast(error.message, 'error'); 
         } else { 
             window.showToast('تم حفظ بيانات السيارة ✅', 'success');
             resetFieldsOnly(); loadData();
         }
     } finally {
         if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
     }
 }

 // [5] البحث المتقدم
 function multiColumnSearch() {
     const globalVal = (document.getElementById('globalSearch')?.value || '').toLowerCase();
     const colFilters = [
         (document.getElementById('col0Filter')?.value || '').toLowerCase(),
         (document.getElementById('col1Filter')?.value || '').toLowerCase(),
         (document.getElementById('col2Filter')?.value || '').toLowerCase(),
          (document.getElementById('col3Filter')?.value || '').toLowerCase(),
         (document.getElementById('col4Filter')?.value || '').toLowerCase()
     ];
     const fields = ['f02_plate_no', 'f04_brand', 'f06_model', 'f08_standard_rent', 'f12_is_active'];

     const filtered = allCars.filter(item => {
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

 // [6] دوال مساعدة
 function resetFieldsOnly() {
     document.getElementById('f01_id').value = '';
     document.getElementById('carForm').reset();
 }

 function confirmReset() {
     window.showModal('تنبيه', 'هل تريد إفراغ جميع الحقول؟', 'warning', () => { resetFieldsOnly(); });
 }

 function deleteRecord(id) {
     window.showModal('تأكيد', 'هل أنت متأكد من حذف هذه السيارة؟', 'error', async () => {
         const { error } = await _supabase.from('t01_cars').delete().eq('f01_id', id);
         if (error) { window.showToast('فشل الحذف', 'error'); }
         else { window.showToast('تم الحذف بنجاح 🗑️', 'success'); loadData(); }
     });
 }

 function editRecord(item) {
     document.getElementById('f01_id').value = item.f01_id;
     ['f02_plate_no','f03_car_office','f04_brand','f06_model','f07_license_expiry','f08_standard_rent','f11_owner_id','f13_current_driver_id','f15_fuel_type','f12_is_active','f14_car_notes']
     .forEach(fid => {
         const el = document.getElementById(fid);
         if (el) el.value = item[fid] || '';
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
     window.showToast('تم تحميل البيانات للتعديل', 'info');
 }

 function viewRecord(item) {
     let msg = `
         <div style="text-align:right; direction:rtl;">
             <p><b>رقم اللوحة:</b> ${item.f02_plate_no || '-'}</p>
             <p><b>الماركة:</b> ${item.f04_brand || '-'}</p>
             <p><b>الموديل:</b> ${item.f06_model || '-'}</p>
             <p><b>الضمان اليومي:</b> ${item.f08_standard_rent || '-'}</p>
             <p><b>الحالة:</b> ${item.f12_is_active || '-'}</p>
             <p><b>مكتب التاكسي:</b> ${item.f03_car_office || '-'}</p>
             <p><b>انتهاء الترخيص:</b> ${item.f07_license_expiry || '-'}</p>
             <p><b>نوع الوقود:</b> ${item.f15_fuel_type || '-'}</p>
             <p><b>ملاحظات:</b> ${item.f14_car_notes || '-'}</p>
         </div>
     `;
     window.showModal('تفاصيل السيارة', msg, 'info');
 }

 function sortTable(n) {
     const tbody = document.querySelector("table tbody");
     if (!tbody) return;
     const rows = Array.from(tbody.rows);
     const isAsc = sortDirections[n] !== true;
     
     rows.sort((a, b) => {
         let x = a.cells[n].innerText.toLowerCase();
         let y = b.cells[n].innerText.toLowerCase();
         if (!isNaN(parseFloat(x)) && isFinite(x) && !isNaN(parseFloat(y)) && isFinite(y)) {
             x = parseFloat(x);
             y = parseFloat(y);
         }
         return isAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
     });
     
     sortDirections[n] = isAsc;
     rows.forEach(row => tbody.appendChild(row));
     
     if (window.updateSortVisuals) window.updateSortVisuals(n, isAsc);
 }
/* === END OF FILE === */