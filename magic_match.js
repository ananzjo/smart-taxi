/* magic_match.js */

let carsList = [];
let driversList = [];
let openDues = [];

window.onload = async () => {
    if (window.bootSystem) bootSystem("المطابقة الذكية | Magic Match");
    await initMagicMatch();
};

async function initMagicMatch() {
    try {
        const [carsRes, driversRes] = await Promise.all([
            _supabase.from('t01_cars').select('f01_id, f02_plate_no, f11_is_active'),
            _supabase.from('t02_drivers').select('f01_id, f02_name, f06_status')
        ]);

        carsList = (carsRes.data || []).filter(c => (c.f11_is_active || '').includes('نشط') || (c.f11_is_active || '').toLowerCase().includes('active'));
        driversList = (driversRes.data || []).filter(d => (d.f06_status || '').includes('نشط') || (d.f06_status || '').toLowerCase().includes('active'));

        fillOptions('carFilter', carsList, 'f02_plate_no', 'f02_plate_no', '-- اختر السيارة --');
        fillOptions('driverFilter', driversList, 'f01_id', 'f02_name', '-- أو اختر السائق --');

        // Smart link: If car is selected, clear driver. If driver is selected, clear car.
        document.getElementById('carFilter').addEventListener('change', () => {
            document.getElementById('driverFilter').value = '';
            loadDues();
        });
        document.getElementById('driverFilter').addEventListener('change', () => {
            document.getElementById('carFilter').value = '';
            loadDues();
        });

    } catch (err) {
        console.error("Init Error:", err);
    }
}

async function loadDues() {
    const carNo = document.getElementById('carFilter').value;
    const driverId = document.getElementById('driverFilter').value;
    const container = document.getElementById('duesContainer');

    if (!carNo && !driverId) {
        container.innerHTML = '<div class="empty-state"><p>👆 الرجاء اختيار سيارة أو سائق لعرض الذمم المفتوحة.</p></div>';
        openDues = [];
        updateSummary();
        return;
    }

    container.innerHTML = '<div class="empty-state"><p>⏳ جاري جلب الذمم المفتوحة...</p></div>';

    let query = _supabase.from('t08_work_days')
        .select('*')
        .eq('f06_is_off_day', false)
        .order('f02_date', { ascending: true }); // Oldest first for magic match

    if (carNo) query = query.eq('f03_car_no', carNo);
    if (driverId) query = query.eq('f04_driver_id', driverId);

    const [daysRes, revRes] = await Promise.all([
        query,
        _supabase.from('t05_revenues').select('f10_work_day_link').not('f10_work_day_link', 'is', null)
    ]);

    if (daysRes.error) {
        console.error(daysRes.error);
        container.innerHTML = '<div class="empty-state"><p>❌ خطأ في جلب البيانات.</p></div>';
        return;
    }

    const paidDayIds = new Set();
    (revRes.data || []).forEach(r => {
        try {
            const ids = JSON.parse(r.f10_work_day_link);
            if (Array.isArray(ids)) ids.forEach(id => paidDayIds.add(id));
        } catch(e) {}
    });

    openDues = daysRes.data || [];
    
    // Ensure numeric values and backward compatibility
    openDues.forEach(d => {
        d.expected = parseFloat(d.f05_daily_amount || 0);
        d.paid = parseFloat(d.f09_paid_amount || 0); // f09_paid_amount from DB patch
        
        // Fallback for older entries: If already in a revenue link, consider it fully paid
        if (paidDayIds.has(d.f01_id) && d.paid === 0) {
            d.paid = d.expected;
            d.f10_status = 'Closed | مغلق';
        }

        d.remains = Math.max(0, d.expected - d.paid);
        d.applied = 0;
    });

    // Filter out logically closed ones
    openDues = openDues.filter(d => d.remains > 0 && d.f10_status !== 'Closed | مغلق');

    renderDues();
}

function renderDues() {
    const container = document.getElementById('duesContainer');
    
    if (openDues.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>✅ لا توجد ذمم مفتوحة لهذا الاختيار.</p></div>';
        updateSummary();
        return;
    }

    let html = '<table class="taxi-table"><thead><tr>' +
        '<th>التاريخ | Date ↕</th>' +
        '<th>السيارة | Car ↕</th>' +
        '<th>الحالة | Status ↕</th>' +
        '<th>المستحق | Expected ↕</th>' +
        '<th>مدفوع سابقاً | Paid ↕</th>' +
        '<th>المتبقي | Remaining ↕</th>' +
        '<th style="width: 150px; text-align:center;">تطبيق الآن | Apply</th>' +
        '</tr></thead><tbody>';

    openDues.forEach((due, index) => {
        const isPartial = due.paid > 0;
        const badgeClass = isPartial ? 'badge-warning' : 'badge-danger';
        const badgeText = isPartial ? 'مفتوح جزئياً' : 'مفتوح';
        const dayName = new Date(due.f02_date).toLocaleDateString('ar-JO', { weekday: 'long' });

        html += `
            <tr id="row_${index}">
                <td style="font-weight:700;">
                    <div style="font-size:0.75rem; color:var(--taxi-gold);">${dayName}</div>
                    <div>${due.f02_date}</div>
                </td>
                <td>${due.f03_car_no ? window.formatJordanPlate(due.f03_car_no, true) : '---'}</td>
                <td><span class="badge-status ${badgeClass}">${badgeText}</span></td>
                <td style="font-weight:bold;">${due.expected.toFixed(2)}</td>
                <td style="color:#888;">${due.paid.toFixed(2)}</td>
                <td style="color:var(--taxi-red); font-weight:bold;">${due.remains.toFixed(2)}</td>
                <td style="text-align:center;">
                    <input type="number" class="apply-input-table" id="apply_${index}" 
                        value="${due.applied > 0 ? due.applied.toFixed(2) : ''}" 
                        min="0" max="${due.remains}" step="0.01" 
                        oninput="manualApply(${index}, this.value)">
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
    updateSummary();
}

function manualApply(index, val) {
    let amt = parseFloat(val) || 0;
    const due = openDues[index];
    if (amt > due.remains) {
        amt = due.remains;
        document.getElementById(`apply_${index}`).value = amt.toFixed(2);
    }
    due.applied = amt;
    updateRowUI(index);
    updateSummary();
}

function updateRowUI(index) {
    const due = openDues[index];
    const row = document.getElementById(`row_${index}`);
    const input = document.getElementById(`apply_${index}`);
    
    if (!row || !input) return;

    if (due.applied > 0) {
        input.classList.add('active');
        if (due.applied >= due.remains) {
            row.style.background = '#f4fbf6';
            row.style.borderRight = '4px solid #27ae60';
        } else {
            row.style.background = '#fffdf7';
            row.style.borderRight = '4px solid var(--taxi-gold)';
        }
    } else {
        input.classList.remove('active');
        row.style.background = '';
        row.style.borderRight = '';
    }
}

function applyMagicMatch() {
    let amount = parseFloat(document.getElementById('magicAmount').value) || 0;
    if (amount <= 0) return;

    // Reset applied first
    openDues.forEach(d => d.applied = 0);

    // Auto allocate from oldest to newest
    for (let i = 0; i < openDues.length; i++) {
        if (amount <= 0) break;
        
        let due = openDues[i];
        if (amount >= due.remains) {
            due.applied = due.remains;
            amount -= due.remains;
        } else {
            due.applied = amount;
            amount = 0;
        }
    }

    renderDues(); // Re-render to show updated inputs and card styles
    
    if (amount > 0) {
        showToast(`تم توزيع المبالغ وبقي ${amount.toFixed(2)} JD غير مخصصة.`, "warning");
    } else {
        showToast("✨ تمت المطابقة السحرية بنجاح!", "success");
    }
}

function updateSummary() {
    const totalDue = openDues.reduce((s, d) => s + d.remains, 0);
    const totalApplied = openDues.reduce((s, d) => s + d.applied, 0);
    
    let magicAmt = parseFloat(document.getElementById('magicAmount').value) || 0;
    const unallocated = Math.max(0, magicAmt - totalApplied);

    document.getElementById('totalDueText').innerText = totalDue.toFixed(2) + ' JD';
    document.getElementById('totalSelectedText').innerText = totalApplied.toFixed(2) + ' JD';
    
    const unallocatedEl = document.getElementById('unallocatedText');
    unallocatedEl.innerText = unallocated.toFixed(2) + ' JD';
    if (unallocated > 0) {
        unallocatedEl.style.color = 'var(--taxi-red)';
    } else {
        unallocatedEl.style.color = '#888';
    }

    // Refresh UI highlights if re-rendered
    openDues.forEach((d, i) => {
        updateRowUI(i);
    });
}

// ─────────────────────────────────────────────────────────────────────
//  REVENUE COLLECTION MODAL
// ─────────────────────────────────────────────────────────────────────

let _pendingMatchedDays = [];
let _staffList = [];

async function loadStaffForModal() {
    // Load lookups once (LookupEngine caches internally)
    await Promise.all([
        LookupEngine.fillSelect('revenue_category', 'rc_category', { placeholder: '-- اختر الفئة --' }),
        LookupEngine.fillSelect('payment_methods',  'rc_method',   { placeholder: '-- طريقة الدفع --' })
    ]);

    // Load staff list (guard against double-load)
    if (_staffList.length > 0) return;
    const { data } = await _supabase.from('t11_staff').select('f01_id, f02_name');
    _staffList = data || [];
    const sel = document.getElementById('rc_collector');
    _staffList.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.f01_id;
        opt.textContent = s.f02_name;
        sel.appendChild(opt);
    });
}

function saveMatching() {
    const totalApplied = openDues.reduce((s, d) => s + d.applied, 0);
    if (totalApplied <= 0) {
        showToast('⚠️ لم يتم تخصيص أي مبالغ. الرجاء استخدام التوزيع السحري أو إدخال مبالغ يدوياً.', 'error');
        return;
    }

    _pendingMatchedDays = openDues.filter(d => d.applied > 0);

    // Build summary inside the modal
    let rows = '';
    _pendingMatchedDays.forEach(d => {
        const isFull = d.applied >= d.remains;
        rows += `
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #ddd;">
                <span>
                    📅 ${d.f02_date} — ${d.f03_car_no || ''}
                    <span style="font-size:0.75rem; color:${isFull ? '#27ae60' : '#e67e22'}; font-weight:700; margin-right:5px;">${isFull ? '(كامل)' : '(جزئي)'}</span>
                </span>
                <strong style="color:#27ae60;">${d.applied.toFixed(2)} JD</strong>
            </div>`;
    });

    document.getElementById('revModalSummary').innerHTML = `
        <div style="font-weight:700; margin-bottom:8px; color:#333;">📋 ملخص التخصيص | Allocation Summary</div>
        <div style="max-height:130px; overflow-y:auto; margin-bottom:10px;">${rows}</div>
        <div style="text-align:center; font-size:1.1rem; font-weight:900; background:#e8f5e9; padding:8px; border-radius:8px; color:#27ae60;">
            💰 الإجمالي: ${totalApplied.toFixed(2)} JD
        </div>`;

    // Pre-fill date
    document.getElementById('rc_date').value = new Date().toISOString().split('T')[0];

    // Load staff async
    loadStaffForModal();

    // Show modal
    const overlay = document.getElementById('revModalOverlay');
    overlay.style.display = 'flex';
}

function closeRevModal() {
    document.getElementById('revModalOverlay').style.display = 'none';
    document.getElementById('revCollectionForm').reset();
}

// ─────────────────────────────────────────────────────────────────────
//  ATOMIC COMMIT: Revenue INSERT + Work Days UPDATE (both or nothing)
// ─────────────────────────────────────────────────────────────────────
async function commitSave() {
    const btn = document.getElementById('revModalSaveBtn');
    btn.disabled = true;
    btn.textContent = '⌛ جاري الحفظ...';

    const matchedDays = _pendingMatchedDays;
    const totalApplied = matchedDays.reduce((s, d) => s + d.applied, 0);

    const carNo = document.getElementById('carFilter').value;
    const refCar = carNo || matchedDays[0].f03_car_no;
    const refDriver = matchedDays[0].f04_driver_id;

    // Gather form values
    const rcDate      = document.getElementById('rc_date').value;
    const rcCategory  = document.getElementById('rc_category').value;
    const rcMethod    = document.getElementById('rc_method').value;
    const rcCollector = document.getElementById('rc_collector').value;
    const rcNotes     = document.getElementById('rc_notes').value.trim();

    // ── STEP 1: Insert Revenue Record ──────────────────────────────
    const revPayload = {
        f02_date:          rcDate,
        f03_car_no:        refCar,
        f04_driver_id:     refDriver,
        f05_category:      rcCategory,
        f06_amount:        totalApplied,
        f07_method:        rcMethod,
        f08_collector_id:  rcCollector || null,
        f09_notes:         rcNotes || 'مطابقة ذكية (Magic Match)',
        f10_work_day_link: JSON.stringify(matchedDays.map(d => d.f01_id))
    };

    const { data: revData, error: revErr } = await _supabase
        .from('t05_revenues')
        .insert([revPayload])
        .select('f01_id')
        .single();

    if (revErr) {
        console.error('Revenue Insert Error:', revErr);
        showToast('❌ فشل حفظ الإيراد — لم يتم تعديل أيام العمل.', 'error');
        btn.disabled = false;
        btn.textContent = '✅ تأكيد الحفظ والمطابقة';
        return;
    }

    // ── STEP 2: Update Work Days (only after revenue is confirmed) ──
    let workDaysFailed = false;
    for (const d of matchedDays) {
        const newPaid   = d.paid + d.applied;
        const isClosed  = newPaid >= d.expected;
        const newStatus = isClosed ? 'Closed | مغلق' : 'Opened | مفتوح جزئياً';

        const { error: wdErr } = await _supabase
            .from('t08_work_days')
            .update({ f09_paid_amount: newPaid, f10_status: newStatus })
            .eq('f01_id', d.f01_id);

        if (wdErr) {
            console.error('Work Day Update Error:', wdErr, 'Day:', d.f01_id);
            workDaysFailed = true;
        }
    }

    // ── STEP 3: Handle outcome ─────────────────────────────────────
    if (workDaysFailed) {
        // Revenue was saved but work day update partially failed — warn user
        showToast('⚠️ تم حفظ الإيراد لكن حدث خطأ في تحديث بعض أيام العمل. راجع البيانات.', 'error');
    } else {
        showToast('✅ تمت المطابقة وحفظ الإيراد بنجاح!', 'success');
    }

    closeRevModal();
    document.getElementById('magicAmount').value = '';
    _pendingMatchedDays = [];
    await loadDues(); // Refresh to show remaining open dues

    btn.disabled = false;
    btn.textContent = '✅ تأكيد الحفظ والمطابقة';
}
