/* ==================================================================
 [payments.js] - إدارة المدفوعات
 ================================================================== */

 let allPayments = []; 
 let sortDirections = {}; 
 
 // [1] تعبئة القوائم المنسدلة
 async function fillPaymentDropdowns() {
     try {
         const [driversRes, staffRes] = await Promise.all([
             _supabase.from('t02_drivers').select('f02_name'),
             _supabase.from('t11_staff').select('f02_name')
         ]);
 
         const payeeSelect = document.getElementById('f03_payee_name');
         const officerSelect = document.getElementById('f07_officer');

         let combinedPayees = [];
         if (driversRes.data) combinedPayees.push(...driversRes.data.map(d => d.f02_name));
         if (staffRes.data) combinedPayees.push(...staffRes.data.map(s => s.f02_name));
         // إزالة التكرار
         const uniquePayees = [...new Set(combinedPayees)];

         if (payeeSelect) {
             payeeSelect.innerHTML = '<option value="">-- اختر المستلم --</option>' + 
                 uniquePayees.map(p => `<option value="${p}">${p}</option>`).join('');
         }

         if (staffRes.data && officerSelect) {
             officerSelect.innerHTML = '<option value="">-- اختر المسؤول --</option>' + 
                 staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
         }
     } catch (err) {
         console.error("Dropdown Fill Error:", err);
     }
 }
 
 // [2] جلب البيانات
 async function loadData() {
     const { data, error } = await _supabase
         .from('t06_payments')
         .select('*')
         .order('f02_date', { ascending: false });
 
     if (error) { 
         window.showModal("خطأ", "تعذر جلب البيانات", "error"); 
         return; 
     }
     allPayments = data;
     renderTable(data);
 }
 
 // [3] بناء الجدول وتحديث العداد
 function renderTable(list) {
     if (window.updateRecordCounter) {
         window.updateRecordCounter(list.length);
     }
 
     let html = `<table><thead><tr>
         <th onclick="sortTable(0)" style="cursor:pointer">التاريخ <span id="sortIcon0" class="sort-icon">↕</span></th>
         <th onclick="sortTable(1)" style="cursor:pointer">المستلم <span id="sortIcon1" class="sort-icon">↕</span></th>
         <th onclick="sortTable(2)" style="cursor:pointer">المبلغ <span id="sortIcon2" class="sort-icon">↕</span></th>
         <th onclick="sortTable(3)" style="cursor:pointer">المسؤول <span id="sortIcon3" class="sort-icon">↕</span></th>
         <th>إجراءات</th>
     </tr></thead><tbody>`;
 
     list.forEach(item => {
         html += `<tr>
             <td>${item.f02_date}</td>
             <td><b>${item.f03_payee_name}</b></td>
             <td style="color:var(--taxi-red); font-weight:bold;">${item.f05_amount}</td>
             <td>${item.f07_officer || '-'}</td>
             <td>
                 <button onclick='editRecord(${JSON.stringify(item)})' class="btn-action edit-btn" title="تعديل">📝</button>
                 <button onclick="deleteRecord('${item.f01_id}')" class="btn-action delete-btn" title="حذف">🗑️</button>
             </td>
         </tr>`;
     });
     
     const container = document.getElementById('tableContainer');
     if(container) container.innerHTML = html + "</tbody></table>";
 }
 
 async function saveData() {
     const id = document.getElementById('f01_id').value;
     const payload = {};
     document.querySelectorAll('[id^="f"]').forEach(el => {
         if (el.value.trim() !== "") payload[el.id] = el.value.trim();
     });
     if (!payload.f03_payee_name || !payload.f05_amount) {
         window.showModal("نواقص", "يرجى اختيار المستلم والمبلغ", "warning");
         return;
     }
     const { error } = id 
         ? await _supabase.from('t06_payments').update(payload).eq('f01_id', id)
         : await _supabase.from('t06_payments').insert([payload]);
     if (error) { window.showModal("فشل", error.message, "error"); } 
     else { 
         window.showModal("نجاح", "تم حفظ السجل بنجاح ✅", "success");
         resetFieldsOnly(); loadData();
     }
 }
 
 function sortTable(n) {
     const tbody = document.querySelector("table tbody");
     if (!tbody) return;
     let rows = Array.from(tbody.rows);
     sortDirections[n] = !sortDirections[n];
     const direction = sortDirections[n] ? 1 : -1;
     if(window.updateSortVisuals) window.updateSortVisuals(n, sortDirections[n]);
     rows.sort((a, b) => {
         let aT = a.cells[n].innerText.trim();
         let bT = b.cells[n].innerText.trim();
         return (isNaN(aT) || isNaN(bT)) 
             ? aT.localeCompare(bT, 'ar', { numeric: true }) * direction
             : (parseFloat(aT) - parseFloat(bT)) * direction;
     });
     tbody.append(...rows);
 }
 
 function excelFilter() {
     const val = document.getElementById('excelSearch').value.toLowerCase();
     const filtered = allPayments.filter(item => {
         return (
             String(item.f03_payee_name || "").toLowerCase().includes(val) ||
             String(item.f07_officer || "").toLowerCase().includes(val) ||
             String(item.f02_date || "").includes(val)
         );
     });
     renderTable(filtered);
 }
 
 function deleteRecord(id) {
     window.showModal("تأكيد", "هل أنت متأكد من حذف السجل نهائياً؟", "error", async () => {
         const { error } = await _supabase.from('t06_payments').delete().eq('f01_id', id);
         if (error) window.showModal("خطأ", "فشل الحذف", "error"); else loadData();
     });
 }
 
 function editRecord(item) {
     Object.keys(item).forEach(key => { 
         const el = document.getElementById(key);
         if(el) el.value = item[key]; 
     });
     window.scrollTo({ top: 0, behavior: 'smooth' });
 }
 
 function resetFieldsOnly() {
     const form = document.getElementById('paymentForm');
     if(form) form.reset();
     document.getElementById('f01_id').value = "";
     document.getElementById('f02_date').valueAsDate = new Date();
 }
 
 function confirmReset() {
     window.showModal("تنبيه", "هل تريد تفريغ جميع الحقول؟", "info", () => resetFieldsOnly());
 }