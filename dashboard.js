/* ==================================================================
 [dashboard.js] - المحرك التحليلي للوحة التحكم
 ================================================================== */

async function loadDashboardStats() {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // تاريخ اليوم YYYY-MM-DD
        
        // تحديد أول يوم في الشهر الحالي
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        // 1. جلب بيانات الإيرادات للفترة من بداية الشهر حتى اليوم
        const { data: revData, error } = await _supabase
            .from('t05_revenues')
            .select('f06_amount, f02_date')
            .gte('f02_date', firstDayOfMonth)
            .lte('f02_date', todayStr);

        if (error) throw error;

        let totalToday = 0;
        let totalMonth = 0;

        if (revData) {
            revData.forEach(item => {
                const amt = parseFloat(item.f06_amount || 0);
                totalMonth += amt; // المجموع الكلي للشهر
                
                if (item.f02_date === todayStr) {
                    totalToday += amt; // مجموع اليوم فقط
                }
            });
        }

        // تحديث الأرقام في الواجهة
        document.getElementById('todayRevenue').innerText = totalToday.toLocaleString('en-US', {minimumFractionDigits: 2}) + " JOD";
        document.getElementById('monthRevenue').innerText = totalMonth.toLocaleString('en-US', {minimumFractionDigits: 2}) + " JOD";

        // 2. تحديث باقي العدادات (السيارات والسائقين) كما هي
        const { count: activeCars } = await _supabase.from('t01_cars').select('*', { count: 'exact', head: true }).eq('f12_is_active', 'نشط');
        document.getElementById('activeCarsCount').innerText = activeCars || 0;

        const { count: driversCount } = await _supabase.from('t02_drivers').select('*', { count: 'exact', head: true });
        document.getElementById('driversCount').innerText = driversCount || 0;

        loadRecentTransactions();

    } catch (err) {
        console.error("Dashboard Surgery Failed:", err);
    }
}
async function loadRecentTransactions() {
    const { data } = await _supabase
        .from('t05_revenues')
        .select('*')
        .order('f07_created_at', { ascending: false })
        .limit(5);

    if (data) {
        let html = `<table><thead><tr><th>السيارة</th><th>السائق</th><th>المبلغ</th></tr></thead><tbody>`;
        data.forEach(r => {
            html += `<tr><td>${r.f03_car_no}</td><td>${r.f04_driver_name}</td><td style="color:var(--taxi-green); font-weight:bold;">${r.f06_amount}</td></tr>`;
        });
        document.getElementById('recentTransactions').innerHTML = html + "</tbody></table>";
    }
}