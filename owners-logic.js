const SUPABASE_URL = 'https://tjntctaapsdynbywdfns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BJgdmxyFsCgzFDXh1Qn1CQ_cFRMsy2P';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function updateStatus() {
    const dot = document.getElementById('connectionStatus');
    const text = document.getElementById('statusText');
    const dateEl = document.getElementById('currentDate');

    if (navigator.onLine) {
        dot.className = "status-dot online";
        text.innerText = "متصل";
    } else {
        dot.className = "status-dot offline";
        text.innerText = "غير متصل";
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.innerText = new Date().toLocaleDateString('ar-EG', options);
}

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);

async function fetchOwners() {
    const tbody = document.getElementById('ownersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">جاري تحميل البيانات...</td></tr>';

    const { data, error } = await supabaseClient
        .from('owners')
        .select('*')
        .order('id', { ascending: false });

    if (error) return console.error(error);

    tbody.innerHTML = data.map(owner => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-6 font-mono text-xs text-slate-400">#${owner.id}</td>
            <td class="p-6 font-bold text-slate-700">${owner.name}</td>
            <td class="p-6">${owner.phone || '---'}</td>
            <td class="p-6 text-slate-500 text-xs">${owner.address || '---'}</td>
            <td class="p-6 text-center flex justify-center gap-2">
                <button onclick='editOwner(${JSON.stringify(owner)})' class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteOwner(${owner.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('ownerForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('ownerId').value;
    const ownerData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };

    let result = id 
        ? await supabaseClient.from('owners').update(ownerData).eq('id', id)
        : await supabaseClient.from('owners').insert([ownerData]);

    if (result.error) {
        Swal.fire('خطأ', result.error.message, 'error');
    } else {
        Swal.fire({ icon: 'success', title: 'تم الحفظ', timer: 1500, showConfirmButton: false });
        resetForm();
        fetchOwners();
    }
};

function editOwner(owner) {
    document.getElementById('ownerId').value = owner.id;
    document.getElementById('name').value = owner.name;
    document.getElementById('phone').value = owner.phone;
    document.getElementById('address').value = owner.address;
    document.getElementById('notes').value = owner.notes;
    document.getElementById('submitBtn').innerText = 'تحديث البيانات';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('ownerForm').reset();
    document.getElementById('ownerId').value = '';
    document.getElementById('submitBtn').innerText = 'حفظ بيانات المالك';
}

async function deleteOwner(id) {
    const { isConfirmed } = await Swal.fire({ title: 'هل أنت متأكد؟', icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، احذف' });
    if (isConfirmed) {
        await supabaseClient.from('owners').delete().eq('id', id);
        fetchOwners();
    }
}

window.onload = () => { updateStatus(); fetchOwners(); };
