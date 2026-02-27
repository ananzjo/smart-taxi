/* ==================================================================
 [login-logic.js] - النسخة الاحترافية (سرعة + فيدباك بصري)
 ================================================================== */

async function handleLogin(event) {
    event.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');

    // 1. فيدباك فوري: الزر يتحول للرمادي الداكن ويبدأ التحقق
    btn.disabled = true;
    btn.innerHTML = "⌛ جاري التحقق...";
    btn.style.opacity = "0.7";

    try {
        const { data, error } = await _supabase
            .from('t11_staff')
            .select('*')
            .eq('f08_login_name', userVal);

        if (error) throw error;

        // 2. حالة: المستخدم غير موجود
        if (!data || data.length === 0) {
            applyErrorFeedback(btn, "اسم المستخدم غير مسجل!");
            return window.showModal("تنبيه", `المستخدم "${userVal}" غير موجود لدينا.`, "warning");
        }

        const userRecord = data[0];

        // 3. حالة: نجاح الدخول
        if (userRecord.f03_password === passVal) {
            sessionStorage.setItem('full_name_ar', userRecord.f02_name);
            
            // فيدباك النجاح: أخضر مشع
            btn.style.background = "#2ecc71";
            btn.style.opacity = "1";
            btn.innerHTML = `✅ مرحباً  ${userRecord.f02_name.split(' ')[0]}`; // عرض الاسم الأول فقط للسرعة
            
            setTimeout(() => { window.location.href = "index.html"; }, 500);
            
} else {
    // 1. إعادة تفعيل الزر فوراً ليتمكن المستخدم من رؤيته
    btn.disabled = false;
    
    // 2. تطبيق الفيدباك البصري (تغيير اللون والاهتزاز)
    btn.style.background = "#e74c3c"; // أحمر
    btn.innerHTML = "كلمة مرور خاطئة ❌";
    
    // 3. حركة الاهتزاز اليدوية (للتأكد من عملها بدون دوال خارجية)
    btn.style.transition = "0.1s";
    btn.style.transform = "translateX(10px)";
    setTimeout(() => btn.style.transform = "translateX(-10px)", 100);
    setTimeout(() => btn.style.transform = "translateX(0)", 200);

    // 4. إظهار المودال بعد 500ms فقط (نصف ثانية - كافية جداً للرؤية)
    setTimeout(() => {
        if (typeof window.showModal === "function") {
            window.showModal("فشل الدخول", "كلمة المرور غير مطابقة للسجلات.", "error");
        } else {
            alert("فشل الدخول: كلمة المرور غير صحيحة");
        }
        
        // إعادة الزر لشكلة الطبيعي بعد ظهور المودال
        btn.style.background = "var(--taxi-dark)";
        btn.innerHTML = "دخول للنظام 🚀";
    }, 500); 

    return; // إنهاء الدالة
}
    } catch (e) {
        console.error(e);
        applyErrorFeedback(btn, "فشل الاتصال!");
        window.showModal("خطأ تقني", "تأكد من اتصال الإنترنت.", "error");
    }
}

/**
 * دالة الفيدباك البصري عند الخطأ
 */
function applyErrorFeedback(targetBtn, message) {
    targetBtn.disabled = false;
    targetBtn.style.background = "#e74c3c"; // أحمر
    targetBtn.style.opacity = "1";
    targetBtn.innerHTML = message;
    
    // إضافة حركة "اهتزاز" بسيطة (Shake Effect)
    targetBtn.style.transition = "0.1s";
    targetBtn.style.transform = "translateX(10px)";
    setTimeout(() => targetBtn.style.transform = "translateX(-10px)", 100);
    setTimeout(() => targetBtn.style.transform = "translateX(0)", 200);

    // إعادة الزر لوضعه الطبيعي بعد ثانيتين
    setTimeout(() => {
        targetBtn.style.background = "var(--taxi-dark)";
        targetBtn.innerHTML = "دخول للنظام 🚀";
    }, 2000);
}