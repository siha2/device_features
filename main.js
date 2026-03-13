const statusDiv = document.getElementById('status-bar');

function updateStatus(msg) {
    statusDiv.innerText = msg;
}

// 1. Vibration (الاهتزاز)
function vibrateDevice() {
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
        updateStatus("تم تشغيل الاهتزاز بنمط (200ms)");
    } else {
        updateStatus("المتصفح لا يدعم الاهتزاز");
    }
}

// 2. Flashlight (الكشاف)
let streamTrack = null;
async function toggleFlash() {
    try {
        if (!streamTrack) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamTrack = stream.getVideoTracks()[0];
        }
        const constraints = streamTrack.getConstraints();
        const isTorchOn = constraints.advanced?.find(c => c.torch)?.torch;
        await streamTrack.applyConstraints({
            advanced: [{ torch: !isTorchOn }]
        });
        updateStatus(isTorchOn ? "تم إطفاء الكشاف" : "تم تشغيل الكشاف");
    } catch (err) {
        updateStatus("خطأ في الكشاف: " + err.message);
    }
}

// 3. GPS (الموقع الجغرافي)
function getGPS() {
    updateStatus("جاري تحديد الموقع...");
    navigator.geolocation.getCurrentPosition(
        pos => updateStatus(`موقعك: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        err => updateStatus("خطأ في الوصول للموقع: " + err.message)
    );
}

// 4. Notifications (الإشعارات)
function sendNotification() {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            new Notification("تنبيه من الموقع", { body: "هذا إشعار تجريبي من لوحة التحكم" });
            updateStatus("تم إرسال الإشعار");
        } else {
            updateStatus("تم رفض إذن الإشعارات");
        }
    });
}

// 5. Battery (البطارية)
function checkBattery() {
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const level = (battery.level * 100).toFixed(0);
            const charging = battery.charging ? "جاري الشحن" : "لا يشحن";
            updateStatus(`البطارية: ${level}% (${charging})`);
        });
    } else {
        updateStatus("خاصية البطارية غير مدعومة");
    }
}

// 6. Share (المشاركة)
function shareContent() {
    if (navigator.share) {
        navigator.share({
            title: 'تحكم بهاتفك',
            text: 'جربت موقع التحكم في خصائص الموبايل؟',
            url: window.location.href
        }).then(() => updateStatus("تمت المشاركة بنجاح"))
          .catch(() => updateStatus("تم إلغاء المشاركة"));
    } else {
        updateStatus("المشاركة غير مدعومة في متصفحك");
    }
}

// 7. Fullscreen (ملء الشاشة)
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        updateStatus("وضع ملء الشاشة مفعل");
    } else {
        document.exitFullscreen();
        updateStatus("خرجت من ملء الشاشة");
    }
}

// 8. Device Orientation (الحساسات / الجيروسكوب)
function startOrientation() {
    window.addEventListener("deviceorientation", (e) => {
        updateStatus(`ميلان الهاتف: Alpha:${Math.round(e.alpha)}°`);
    }, { once: true }); // نأخذ قراءة واحدة فقط للتجربة
}

// 9. Wake Lock (منع الشاشة من الانطفاء)
let wakeLock = null;
async function keepScreenOn() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            updateStatus("الشاشة ستبقى مضيئة دائماً");
        } else {
            updateStatus("خاصية WakeLock غير مدعومة");
        }
    } catch (err) {
        updateStatus("خطأ: " + err.message);
    }
}

// 10. Camera (فتح الكاميرا للتجربة)
async function openCamera() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        updateStatus("تم الوصول للكاميرا بنجاح");
    } catch (err) {
        updateStatus("تم رفض الوصول للكاميرا");
    }
}
// 11. Microphone (اختبار الميكروفون)
async function testMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateStatus("تم تفعيل الميكروفون بنجاح (جاري الاستماع)");
        
        // لإيقاف الميكروفون بعد 3 ثوانٍ كتجربة
        setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            updateStatus("تم إيقاف تسجيل الميكروفون");
        }, 3000);
    } catch (err) {
        updateStatus("خطأ في الوصول للميكروفون: " + err.message);
    }
}

// 12. Gyroscope (قراءة الجيروسكوب - حركة الهاتف)
function testGyroscope() {
    // التحقق من الحاجة لطلب إذن (خاص بنظام iOS 13+)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            })
            .catch(console.error);
    } else {
        // للمتصفحات التي لا تتطلب إذن خاص (أندرويد)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            updateStatus("جاري قراءة الحساسات... حرك هاتفك");
        } else {
            updateStatus("الجيروسكوب غير مدعوم في هذا الجهاز");
        }
    }
}

function handleOrientation(event) {
    const alpha = Math.round(event.alpha); // الاتجاه حول المحور Z
    const beta = Math.round(event.beta);   // الميل للأمام والخلف X
    const gamma = Math.round(event.gamma); // الميل لليمين واليسار Y
    
    updateStatus(`Z: ${alpha}°, X: ${beta}°, Y: ${gamma}°`);
}
// 1. Bluetooth (البلوتوث - يتطلب HTTPS)
async function connectBluetooth() {
    try {
        updateStatus("جاري البحث عن أجهزة بلوتوث...");
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        });
        updateStatus(`تم الاتصال بـ: ${device.name}`);
    } catch (err) {
        updateStatus("خطأ بالبلوتوث: " + err.message);
    }
}



// 3. Network Information (وضع عدم الاتصال/حالة الشبكة)
function checkNetwork() {
    const status = navigator.onLine ? "أنت متصل بالإنترنت" : "أنت غير متصل (Offline)";
    const type = navigator.connection ? `نوع الشبكة: ${navigator.connection.effectiveType}` : "";
    updateStatus(`${status} | ${type}`);
}

// 4. Native Share (المشاركة الأصلية)
function nativeShare() {
    if (navigator.share) {
        navigator.share({
            title: 'تحكم الهاتف',
            text: 'جرب ميزات الـ Web APIs الرائعة!',
            url: window.location.href
        }).then(() => updateStatus("تمت المشاركة"))
          .catch(() => updateStatus("تم إلغاء المشاركة"));
    } else {
        updateStatus("المشاركة غير مدعومة");
    }
}

// 5. Ambient Light Sensor (مستشعر الضوء - يتطلب تفعيل Flag في بعض المتصفحات)
function testLightSensor() {
    if ('AmbientLightSensor' in window) {
        const sensor = new AmbientLightSensor();
        sensor.onreading = () => updateStatus(`شدة الضوء: ${sensor.illuminance} lux`);
        sensor.onerror = (event) => updateStatus("خطأ في المستشعر: " + event.error.name);
        sensor.start();
        updateStatus("جاري قراءة مستوى الضوء...");
    } else {
        updateStatus("مستشعر الضوء غير مدعوم في متصفحك");
    }
}

// 6. Speech Recognition (التعرف على الكلام)
function startSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = 'ar-SA';
        recognition.onstart = () => updateStatus("جاري الاستماع... تكلم الآن");
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            updateStatus(`قلت: ${transcript}`);
        };
        recognition.start();
    } else {
        updateStatus("التعرف على الكلام غير مدعوم");
    }
}

// 7. Screen Orientation (قفل اتجاه الشاشة)
async function lockOrientation() {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            await screen.orientation.lock('landscape');
            updateStatus("تم قفل الشاشة بالعرض (Landscape)");
        }
    } catch (err) {
        updateStatus("خطأ في قفل الاتجاه: " + err.message);
    }
}