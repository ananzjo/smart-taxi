/* ==================================================================
 [login.js] - النسخة الاحترافية المدمجة مع سجل الأمان
 ================================================================== */

/**
 * 1. دالة تسجيل الأحداث في جدول t15_login_logs
 */
async function recordLoginEvent(username, status, reason = null) {
    let ipData = { ip: 'Unknown', city: 'Unknown' };
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) ipData = await res.json();
    } catch (e) { console.warn("IP fetch skipped"); }

    const payload = {
        f03_username: username || 'Unknown',
        f04_status: status,
        f05_failure_reason: reason,
        f06_ip_address: ipData.ip,
        f07_location: `${ipData.city || ''}, ${ipData.country_name || ''}`,
        f08_device_info: navigator.userAgent
    };

    try {
        await _supabase.from('t15_login_logs').insert([payload]);
    } catch (err) { console.error("Logging failed", err); }
}

/**
 * 2. دالة إظهار/إخفاء كلمة المرور
 */
function togglePassword() {
    const passInput = document.getElementById('password');
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}

/**
 * 3. المحرك الرئيسي للدخول
 */
async function handleLogin(event) {
    event.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');

    // فيدباك فوري
    btn.disabled = true;
    btn.innerHTML = "⌛ جاري التحقق...";
    btn.style.opacity = "0.7";

    // [أهم تعديل]: تسجيل محاولة البدء فوراً
    await recordLoginEvent(userVal, 'Attempt', 'بدء محاولة الدخول');

    try {
        const { data, error } = await _supabase
            .from('t11_staff')
            .select('*')
            .eq('f08_login_name', userVal);

        if (error) throw error;

        // حالة: المستخدم غير موجود
        if (!data || data.length === 0) {
            await recordLoginEvent(userVal, 'Failure', 'اسم المستخدم غير موجود');
            applyErrorFeedback(btn, "اسم المستخدم غير مسجل!");
            return;
        }

        const userRecord = data[0];

        // حالة: نجاح الدخول (تأكد من مطابقة اسم الحقل f03_password أو f09_password حسب جدولك)
        // ملاحظة: الكود السابق كان يستخدم f03_password، عدله لـ f09_password إذا لزم الأمر
        if (String(userRecord.f03_password) === String(passVal)) {
            await recordLoginEvent(userVal, 'Success', 'دخول ناجح');
            sessionStorage.setItem('full_name_ar', userRecord.f02_name);
            sessionStorage.setItem('user_id', userRecord.f01_id);
            
            btn.style.background = "#2ecc71";
            btn.style.opacity = "1";
            btn.innerHTML = `✅ مرحباً  ${userRecord.f02_name.split(' ')[0]}`;
            
            setTimeout(() => { window.location.href = "index.html"; }, 500);
            
        } else {
            // حالة: كلمة مرور خاطئة
            await recordLoginEvent(userVal, 'Failure', 'كلمة مرور خاطئة');
            applyErrorFeedback(btn, "كلمة مرور خاطئة ❌");
        }

    } catch (e) {
        console.error(e);
        await recordLoginEvent(userVal, 'System Error', e.message);
        applyErrorFeedback(btn, "فشل الاتصال!");
    }
}

/**
 * 4. دالة الفيدباك البصري عند الخطأ والاهتزاز
 */
function applyErrorFeedback(targetBtn, message) {
    targetBtn.disabled = false;
    targetBtn.style.background = "#e74c3c"; // أحمر
    targetBtn.style.opacity = "1";
    targetBtn.innerHTML = message;
    
    // حركة الاهتزاز
    targetBtn.style.transition = "0.1s";
    targetBtn.style.transform = "translateX(10px)";
    setTimeout(() => targetBtn.style.transform = "translateX(-10px)", 100);
    setTimeout(() => targetBtn.style.transform = "translateX(0)", 200);

    // إعادة الزر لوضعه الطبيعي بعد ثانيتين
    setTimeout(() => {
        targetBtn.style.background = ""; // سيعود لـ var(--taxi-gold) من CSS
        targetBtn.innerHTML = "دخول للنظام 🚀";
    }, 2000);
}