/* ==================================================================
 [revenues.js] - النسخة الكاملة الموحدة (إصدار الأزرار الأربعة)
 ================================================================== */

let allRevenues = [];
let sortDirections = {};

// [1] الدالة الموحدة لتحميل القوائم والبيانات
async function loadData() {
    try {
        const [carsRes, driversRes, staffRes] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f02_name'),
            _supabase.from('t11_staff').select('f02_name')
        ]);

        const carSelect = document.getElementById('f03_car_no');
        const driverSelect = document.getElementById('f04_driver_name');
        const collectorSelect = document.getElementById('f08_collector');

        if (carsRes.data && carSelect) {
            carSelect.innerHTML = '<option value="">-- اختر السيارة --</option>' +
                carsRes.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (driversRes.data && driverSelect) {
            driverSelect.innerHTML = '<option value="">-- اختر السائق --</option>' +
                driversRes.data.map(d => `<option value="${d.f02_name}">${d.f02_name}</option>`).join('');
        }
        if (staffRes.data && collectorSelect) {
            collectorSelect.innerHTML = '<option value="">-- اختر المحصل --</option>' +
                staffRes.data.map(s => `<option value="${s.f02_name}">${s.f02_name}</option>`).join('');
        }

        // جلب بيانات الإيرادات
        const { data, error } = await _supabase.from('t05_revenues').select('*');
        if (error) throw error;

        allRevenues = data || [];
        renderTable(allRevenues);

    } catch (err) {
        console.error("Load Error:", err);
        if (window.showToast) window.showToast("فشل تحميل البيانات", "error");
    }
}

// [2] بناء الجدول مع الأزرار الأربعة والفلاتر
function renderTable(list) {
    const container = document.getElementById('tableContainer');
    const countEl = document.getElementById('pageRecordCount');
    if (!container) return;
    if (countEl) countEl.innerText = list.length;

    const colValues = [0, 1, 2, 3, 4, 5].map(i => document.getElementById(`col${i}Filter`)?.value || '');

    let html = `<table>
        <thead>
            <tr class="column-search-row">
                ${[0, 1, 2, 3, 4, 5].map(i => `<th><input type="text" class="column-search-input" id="col${i}Filter" onkeyup="excelFilter()" placeholder="بحث..." value="${colValues[i]}"></th>`).join('')}
                <th></th>
            </tr>
            <tr>
                <th onclick="sortTable(0)">التاريخ ↕️</th>
                <th onclick="sortTable(1)">السيارة ↕️</th>
                <th onclick="sortTable(2)">السائق ↕️</th>
                <th onclick="sortTable(3)">المبلغ ↕️</th>
                <th onclick="sortTable(4)">الفئة ↕️</th>
                <th onclick="sortTable(5)">الطريقة ↕️</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>`;

    list.forEach(item => {
        const itemData = JSON.stringify(item).replace(/'/g, "&apos;");

        html += `<tr>
            <td>${item.f02_date || ''}</td>
            <td><b>${item.f03_car_no || ''}</b></td>
            <td>${item.f04_driver_name || ''}</td>
            <td style="color:var(--taxi-green); font-weight:bold;">${parseFloat(item.f06_amount || 0).toFixed(2)}</td>
            <td><span class="record-badge">${item.f05_category || ''}</span></td>
            <td>${item.f07_method || ''}</td>
            <td>
                <div class="action-btns-group" style="display:flex; gap:4px; justify-content:center;">
                    <button onclick='viewRecord(${itemData})' class="btn-action-sm btn-view" title="عرض">👁️</button>
                    <button onclick='printReceipt(${itemData})' class="btn-action-sm btn-print" title="طباعة">🖨️</button>
                    <button onclick='editRecord(${itemData})' class="btn-action-sm btn-edit" title="تعديل">✍️</button>
                    <button onclick="deleteRecord('${item.f01_id}')" class="btn-action-sm btn-delete" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>`;
    });

    container.innerHTML = html + "</tbody></table>";
}

// [3] الفلترة المزدوجة (العامة والأعمدة)
function excelFilter() {
    const globalVal = (document.getElementById('excelSearch')?.value || '').toLowerCase();
    const colFilters = {
        date: (document.getElementById('col0Filter')?.value || '').toLowerCase(),
        car: (document.getElementById('col1Filter')?.value || '').toLowerCase(),
        driver: (document.getElementById('col2Filter')?.value || '').toLowerCase(),
        amount: (document.getElementById('col3Filter')?.value || '').toLowerCase(),
        cat: (document.getElementById('col4Filter')?.value || '').toLowerCase(),
        method: (document.getElementById('col5Filter')?.value || '').toLowerCase()
    };

    const filtered = allRevenues.filter(item => {
        const matchesGlobal = globalVal === '' || Object.values(item).some(v => String(v || '').toLowerCase().includes(globalVal));
        const matchesCols =
            String(item.f02_date || '').toLowerCase().includes(colFilters.date) &&
            String(item.f03_car_no || '').toLowerCase().includes(colFilters.car) &&
            String(item.f04_driver_name || '').toLowerCase().includes(colFilters.driver) &&
            String(item.f06_amount || '').toLowerCase().includes(colFilters.amount) &&
            String(item.f05_category || '').toLowerCase().includes(colFilters.cat) &&
            String(item.f07_method || '').toLowerCase().includes(colFilters.method);
        return matchesGlobal && matchesCols;
    });

    renderTable(filtered);
}

// [4] حفظ البيانات (Insert / Update)
async function saveData() {
    const id = document.getElementById('f01_id').value;
    const payload = {};
    const fields = ['f02_date', 'f03_car_no', 'f04_driver_name', 'f05_category', 'f06_amount', 'f07_method', 'f08_collector', 'f09_notes'];

    fields.forEach(fid => {
        const el = document.getElementById(fid);
        if (el) payload[fid] = el.value;
    });

    if (!payload.f03_car_no || !payload.f06_amount) {
        if (window.showToast) window.showToast("يرجى إكمال البيانات", "warning");
        return;
    }

    const { error } = id
        ? await _supabase.from('t05_revenues').update(payload).eq('f01_id', id)
        : await _supabase.from('t05_revenues').insert([payload]);

    if (error) {
        if (window.showToast) window.showToast(error.message, 'error');
    } else {
        if (window.showModal) window.showModal("تمت العملية", "تم حفظ البيانات بنجاح ✅", "success");
        confirmReset();
        loadData();
    }
}

// [5] وظائف الأزرار الأربعة
function viewRecord(item) {
    const details = `<b>التاريخ:</b> ${item.f02_date}<br>
                    <b>السيارة:</b> ${item.f03_car_no}<br>
                    <b>السائق:</b> ${item.f04_driver_name}<br>
                    <b>المبلغ:</b> ${item.f06_amount} د.أ<br>
                    <b>الفئة:</b> ${item.f05_category}<br>
                    <b>الطريقة:</b> ${item.f07_method}<br>
                    <b>المحصل:</b> ${item.f08_collector}<br>
                    <b>الملاحظات:</b> ${item.f09_notes}`;
    if (window.showModal) window.showModal('تفاصيل استلام المبلغ', details, 'info');
}

// --- التعديل هنا لضمان جلب اسم المالك ---
async function printReceipt(item) {
    let ownerName = "إدارة الشركة";

    try {
        // الربط مع جدول الملاك t10_owners بناءً على السكيما
        const { data } = await _supabase
            .from('t01_cars')
            .select(`f11_owner_id, t10_owners ( f02_owner_name )`)
            .eq('f02_plate_no', item.f03_car_no)
            .maybeSingle();

        if (data && data.t10_owners) {
            ownerName = data.t10_owners.f02_owner_name;
        }
    } catch (err) {
        console.error("Owner Fetch Error:", err);
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const receiptHtml = `
        <html>
        <head>
            <title>إيصال - ${item.f03_car_no}</title>
            <style>
                /* تحميل خطوط Dot Matrix و Amiri */
                @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=VT323&family=Cairo:wght@700&display=swap');
                
                body { 
                    /* خط VT323 هو الأقرب لشكل طابعات Dot Matrix النقطية */
                    font-family: 'VT323', monospace; 
                    direction: rtl; 
                    padding: 40px; 
                    background: #fff;
                    color: #000;
                }

                .receipt-container {
                    border: 2px solid #000;
                    padding: 40px;
                    width: 520px;
                    margin: auto;
                    position: relative;
                }

                .header { text-align: center; margin-bottom: 30px; }
                
                /* خط المالك: Elegant & Royal */
                .header h1 { 
                    font-family: 'Amiri', serif; 
                    margin: 0; 
                    font-size: 45px; 
                    font-weight: 700; 
                    line-height: 1;
                    letter-spacing: 1px;
                }
                
                .header p { 
                    font-family: 'VT323', monospace;
                    margin: 10px 0 0; 
                    font-size: 24px; 
                    text-transform: uppercase;
                    border-top: 1px dashed #000;
                    display: inline-block;
                }

                .divider { border-top: 2px dashed #000; margin: 20px 0; }

                .data-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    border-bottom: 1px dotted #ccc;
                    padding-bottom: 2px;
                    font-size: 26px; /* تكبير حجم الخط النقطي للوضوح */
                }

                .label { font-weight: normal; }
                .value { font-weight: bold; text-align: left; }

                /* تمييز المبلغ بخط نقطي عريض */
                .amount-row .value { 
                    font-size: 32px; 
                    text-decoration: underline;
                }

                .paid-stamp-outline {
                    position: absolute; top: 40%; left: 25%;
                    font-size: 90px; font-weight: 900; color: transparent;
                    -webkit-text-stroke: 2px rgba(255, 0, 0, 0.4); 
                    transform: rotate(-25deg); 
                    z-index: 100; pointer-events: none;
                    font-family: sans-serif;
                }

                .footer {
                    margin-top: 50px; text-align: center; font-size: 18px;
                    border-top: 1px dashed #000; padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <h1>${ownerName}</h1>
                    <p>OFFICIAL CASH RECEIPT</p>
                </div>

                <div class="divider"></div>

                <div class="data-row"><span class="label">DATE:</span><span class="value">${item.f02_date}</span></div>
                <div class="data-row"><span class="label">CAR NO:</span><span class="value">${item.f03_car_no}</span></div>
                <div class="data-row"><span class="label">DRIVER:</span><span class="value">${item.f04_driver_name}</span></div>
                <div class="data-row amount-row"><span class="label">AMOUNT:</span><span class="value">${parseFloat(item.f06_amount).toFixed(2)} JOD</span></div>
                <div class="data-row"><span class="label">COLLECTOR:</span><span class="value">${item.f08_collector}</span></div>
                <div class="data-row"><span class="label">METHOD:</span><span class="value">${item.f07_method}</span></div>
                
                <div class="paid-stamp-outline">PAID</div>

                <div class="footer">
                    SMART TAXI SYSTEM - AMMAN, JORDAN<br>
                    PRINTED: ${new Date().toLocaleString('ar-JO')}
                </div>
            </div>
            <script>
                window.onload = function() { setTimeout(() => { window.print(); }, 600); }
            <\/script>
        </body>
        </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
}
function editRecord(item) {
    document.getElementById('f01_id').value = item.f01_id;
    const fields = ['f02_date', 'f03_car_no', 'f04_driver_name', 'f05_category', 'f06_amount', 'f07_method', 'f08_collector', 'f09_notes'];
    fields.forEach(fid => {
        const el = document.getElementById(fid);
        if (el) el.value = item[fid] || '';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteRecord(id) {
    if (confirm("هل تريد حذف هذا السجل نهائياً؟")) {
        await _supabase.from('t05_revenues').delete().eq('f01_id', id);
        loadData();
    }
}

// [6] دوال المساعدة
function confirmReset() {
    document.getElementById('revenueForm').reset();
    document.getElementById('f01_id').value = "";
    document.getElementById('f02_date').valueAsDate = new Date();
}

function sortTable(n) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.rows);
    const isAsc = sortDirections[n] !== true;
    rows.sort((a, b) => {
        let x = a.cells[n].innerText.toLowerCase();
        let y = b.cells[n].innerText.toLowerCase();
        if (!isNaN(x) && !isNaN(y)) return isAsc ? x - y : y - x;
        return isAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
    sortDirections[n] = isAsc;
    rows.forEach(row => tbody.appendChild(row));
}