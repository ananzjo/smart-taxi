/* ==================================================================
 [login-logic.js] - المحرك المعتمد للدخول
 ================================================================== */

async function handleLogin(event) {
    event.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');

    // 1. تفعيل حالة الانتظار
    btn.disabled = true;
    btn.innerHTML = "⏳ جاري الاتصال بالقاعدة...";

    try {
        // 2. البحث في جدول الموظفين عن طريق اسم الدخول f08_login_name
        const { data, error } = await _supabase
            .from('t11_staff')
            .select('*')
            .eq('f08_login_name', userVal);

        if (error) throw error;

        // 3. التحقق من النتيجة
        if (!data || data.length === 0) {
            window.showModal("تنبيه", `اسم المستخدم "${userVal}" غير موجود.`, "warning");
            resetBtn(btn);
            return;
        }

        const userRecord = data[0];

        // 4. مطابقة كلمة المرور (الحقل f03_password)
        if (userRecord.f03_password === passVal) {
            
            // حفظ الاسم الكامل للعرض في الهيدر العالمي
            sessionStorage.setItem('full_name_ar', userRecord.f02_name);
            
            // تذكرني (اختياري)
            if (document.getElementById('remember').checked) {
                localStorage.setItem('taxi_user', userVal);
                localStorage.setItem('taxi_pass', passVal);
            }

            btn.style.background = "#2ecc71";
            btn.innerHTML = `✅ مرحباً دكتور ${userRecord.f02_name}`;
            
            // التوجه لصفحة الانديكس
            setTimeout(() => {
                window.location.href = "index.html";
            }, 800);
            
        } else {
            window.showModal("فشل الدخول", "كلمة المرور غير صحيحة، حاول مجدداً.", "error");
            resetBtn(btn);
        }

    } catch (e) {
        console.error("Critical Login Error:", e);
        window.showModal("خطأ تقني", "حدث خلل في الاتصال بالسيرفر.", "error");
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.disabled = false;
    btn.innerHTML = "دخول للنظام 🚀";
}