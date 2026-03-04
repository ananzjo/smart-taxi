/* [expenses.js] - المنطق البرمجي الكامل لإدارة المصاريف */

// 1. تحميل البيانات الأولية عند فتح الصفحة
async function loadInitialData() {
    try {
        const [cars, drivers, staff] = await Promise.all([
            _supabase.from('t01_cars').select('f02_plate_no'),
            _supabase.from('t02_drivers').select('f01_id, f02_name'),
            _supabase.from('t11_staff').select('f01_id, f02_name')
        ]);

        if (cars.data) {
            document.getElementById('f03_car_no').innerHTML = '<option value="">-- اختر السيارة --</option>' + 
                cars.data.map(c => `<option value="${c.f02_plate_no}">${c.f02_plate_no}</option>`).join('');
        }
        if (drivers.data) {
            document.getElementById('f04_driver_id').innerHTML = '<option value="">-- اختر السائق --</option>' + 
                drivers.data.map(d => `<option value="${d.f01_id}">${d.f02_name}</option>`).join('');
        }
        if (staff.data) {
            document.getElementById('f09_user_id').innerHTML = '<option value="">-- اختر الموظف --</option>' + 
                staff.data.map(s => `<option value="${s.f01_id}">${s.f02_name}</option>`).join('');
        }
        renderTable();
    } catch (e) {
        console.error("Error loading IDs:", e);
        showModal("خطأ | Error", "فشل في تحميل قوائم البيانات", "error");
    }
}

// 2. معالجة إرسال النموذج (Insert)
document.getElementById('expenseForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
        f02_date: document.getElementById('f02_date').value,
        f03_car_no: document.getElementById('f03_car_no').value,
        f04_driver_id: parseInt(document.getElementById('f04_driver_id').value),
        f05_expense_type: document.getElementById('f05_expense_type').value,
        f06_seller: document.getElementById('f06_seller').value,
        f07_amount: parseFloat(document.getElementById('f07_amount').value),
        f08_ref_no: document.getElementById('f08_ref_no').value,
        f09_user_id: parseInt(document.getElementById('f09_user_id').value),
        f10_status: document.getElementById('f10_status').value,
        f11_notes: document.getElementById('f11_notes').value
    };

    const { error } = await _supabase.from('t06_expenses').insert([payload]);

    if (!error) {
        showModal("تم الحفظ | Saved", "تم تسجيل قيد المصروف بنجاح", "success");
        e.target.reset();
        renderTable();
    } else {
        showModal("خطأ | Error", error.message, "error");
    }
};

// 3. عرض جدول البيانات
async function renderTable() {
    const { data, error } = await _supabase
        .from('t06_expenses')
        .select(`*, t02_drivers!f04_driver_id(f02_name), t11_staff!f09_user_id(f02_name)`)
        .order('f02_date', { ascending: false });

    const container = document.getElementById('expensesTableContainer');
    
    if (data) {
        let html = `<table><thead><tr>
            <th>التاريخ | Date</th>
            <th>السيارة | Car</th>
            <th>البيان | Type</th>
            <th>المبلغ | Amount</th>
            <th>الموظف | Staff</th>
            <th>الحالة | Status</th>
            <th>إدارة | Action</th>
        </tr></thead><tbody>`;
        
        data.forEach(row => {
            const statusClass = `badge-${row.f10_status.toLowerCase()}`;
            html += `<tr>
                <td>${row.f02_date}</td>
                <td><b>${row.f03_car_no}</b></td>
                <td>${row.f05_expense_type}</td>
                <td class="amt">${row.f07_amount.toLocaleString()}</td>
                <td>${row.t11_staff?.f02_name || '---'}</td>
                <td><span class="badge ${statusClass}">${row.f10_status}</span></td>
                <td><button onclick="deleteExpense(${row.f01_id})" class="btn-del">🗑️</button></td>
            </tr>`;
        });
        container.innerHTML = html + '</tbody></table>';
    }
}

// 4. دالة الحذف
async function deleteExpense(id) {
    if (confirm("هل أنت متأكد من حذف هذا القيد؟ | Are you sure?")) {
        const { error } = await _supabase.from('t06_expenses').delete().eq('f01_id', id);
        if (!error) {
            renderTable();
        } else {
            showModal("خطأ | Error", "لا يمكن حذف القيد لارتباطه ببيانات أخرى", "error");
        }
    }
}

// 5. نظام الـ Modal (لحل مشكلة Uncaught ReferenceError)
function showModal(title, message, type) {
    const modal = document.getElementById('systemModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    // تغيير لون العنوان بناءً على النوع
    document.getElementById('modalTitle').style.color = (type === 'error') ? '#e74c3c' : '#27ae60';
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('systemModal').style.display = 'none';
}

// إغلاق المودال عند الضغط خارج المحتوى
window.onclick = function(event) {
    const modal = document.getElementById('systemModal');
    if (event.target == modal) {
        closeModal();
    }
}