/* ==================================================================
 [cars.js] - إدارة أسطول السيارات (متوافق مع العداد العالمي)
 ================================================================== */

 let allCars = [];
 let sortDirections = {}; 
 
 // [1] جلب البيانات من الجدول t01_cars
 async function loadData() {
     const { data, error } = await _supabase
         .from('t01_cars')
         .select('*')
         .order('f02_plate_no', { ascending: true });
     
     if (error) { 
         window.showModal("خطأ في الاتصال", error.message, "error");
         return; 
     }
     
     allCars = data; 
     renderTable(data);
 }
 
 // [1.1] تعبئة القوائم المنسدلة (المالك والسائق)
 async function fillDropdowns() {
     try {
         const { data: owners } = await _supabase.from('t10_owners').select('f01_id, f02_owner_name');
         const { data: drivers } = await _supabase.from('t02_drivers').select('f01_id, f02_name');
 
         const ownerSelect = document.getElementById('f11_owner_id');
         const driverSelect = document.getElementById('f13_current_driver_id');
 
         if (owners && ownerSelect) {
             ownerSelect.innerHTML = '<option value="">-- اختر المالك --</option>';
             owners.forEach(o => ownerSelect.innerHTML += `<option value="${o.f01_id}">${o.f02_owner_name}</option>`);
         }
         if (drivers && driverSelect) {
             driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>';
             drivers.forEach(d => driverSelect.innerHTML += `<option value="${d.f01_id}">${d.f02_name}</option>`);
         }
     } catch (err) { 
         console.error("Dropdown Fill Error:", err); 
     }
 }
 
 // [2] بناء الجدول وتحديث العداد
 function renderTable(list) {
     // --- إرسال العدد إلى العداد العالمي في global-config.js ---
     if (window.updateRecordCounter) {
         window.updateRecordCounter(list.length);
     }
     // -------------------------------------------------------
 
     const tableDiv = document.getElementById('tableContainer');
     let html = `<table><thead><tr>
         <th onclick="sortTable(0)" style="cursor:pointer">اللوحة ↕</th>
         <th onclick="sortTable(1)" style="cursor:pointer">الماركة ↕</th>
         <th onclick="sortTable(2)" style="cursor:pointer">الموديل ↕</th>
         <th onclick="sortTable(3)" style="cursor:pointer">الضمان ↕</th>
         <th onclick="sortTable(4)" style="cursor:pointer">الحالة ↕</th>
         <th>إجراءات</th>
     </tr></thead><tbody>`;
     
     list.forEach(car => {
         // تحديد لون "الحالة" بشكل احترافي
         const statusClass = car.f12_is_active === 'نشط' ? 'success' : 'warning';
         
         html += `<tr>
             <td style="font-weight:bold; color:var(--taxi-dark)">${car.f02_plate_no}</td>
             <td>${car.f04_brand || '-'}</td>
             <td>${car.f06_model || '-'}</td>
             <td style="color:var(--taxi-green); font-weight:bold;">${car.f08_standard_rent}</td>
             <td><span class="badge-${statusClass}">${car.f12_is_active || 'غير محدد'}</span></td>
             <td>
                 <button onclick='editRecord(${JSON.stringify(car)})' class="btn-action edit-btn" title="تعديل">📝</button>
                 <button onclick="deleteRecord('${car.f01_id}')" class="btn-action delete-btn" title="حذف">🗑️</button>
             </td>
         </tr>`;
     });
     tableDiv.innerHTML = html + "</tbody></table>";
 }
 
 // [3] الفرز المطور
 function sortTable(n) {
     const table = document.querySelector("table");
     const tbody = table.tBodies[0];
     let rows = Array.from(tbody.rows);
 
     sortDirections[n] = !sortDirections[n];
     const direction = sortDirections[n] ? 1 : -1;
 
     rows.sort((a, b) => {
         let aText = a.cells[n].innerText.trim();
         let bText = b.cells[n].innerText.trim();
         return aText.localeCompare(bText, 'ar', { numeric: true }) * direction;
     });
 
     tbody.append(...rows);
 }
 
 // [4] التصفية (البحث) وتحديث العداد أثناء البحث
 function excelFilter() {
     const val = document.getElementById('excelSearch').value.toLowerCase();
     const filtered = allCars.filter(c => 
         Object.values(c).some(v => String(v).toLowerCase().includes(val))
     );
     // عند استدعاء renderTable سيتم تحديث العداد تلقائياً بالرقم الجديد المفلتر
     renderTable(filtered);
 }
 
 // [5] باقي الدوال (Save, Delete, Edit, Reset) تبقى كما هي...
 async function saveData() {
     const id = document.getElementById('f01_id').value;
     const payload = {};
     document.querySelectorAll('[id^="f"]').forEach(el => {
         if (el.value && el.value.trim() !== "") payload[el.id] = el.value;
     });
     if (!payload.f02_plate_no) {
         window.showModal("تنبيه", "يرجى إدخال رقم اللوحة على الأقل", "warning");
         return;
     }
     const { error } = id 
         ? await _supabase.from('t01_cars').update(payload).eq('f01_id', id)
         : await _supabase.from('t01_cars').insert([payload]);
     if (error) { window.showModal("فشل العملية", error.message, "error"); } 
     else { window.showModal("تم الحفظ", "تم تحديث بيانات السيارة بنجاح ✅", "success"); resetForm(); loadData(); }
 }
 
 function deleteRecord(id) {
     window.showModal("تأكيد الحذف", "هل أنت متأكد من حذف هذه السيارة؟", "warning", async () => {
         const { error } = await _supabase.from('t01_cars').delete().eq('f01_id', id);
         if (error) { window.showModal("خطأ", "لا يمكن الحذف لوجود بيانات مرتبطة", "error"); }
         else { loadData(); }
     });
 }
 
 function editRecord(car) {
     Object.keys(car).forEach(key => { 
         const el = document.getElementById(key);
         if (el) el.value = car[key]; 
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
 }
 
 function resetForm() {
     const form = document.getElementById('carForm');
     if (form) form.reset();
     document.getElementById('f01_id').value = "";
 }
 
 function confirmReset() {
     window.showModal("تأكيد", "هل تريد تفريغ الحقول؟", "info", () => resetForm());
 }