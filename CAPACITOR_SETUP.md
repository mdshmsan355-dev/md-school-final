# Md School — PWA و Android

## PWA

بعد نشر التطبيق على HTTPS، سيظهر خيار **تثبيت التطبيق** في المتصفحات الداعمة. يمكن أيضًا تثبيته من قائمة المتصفح على Android أو Chrome/Edge على الكمبيوتر.

الـService Worker الموجود في `public/sw.js` يوفر **Offline Shell**: الملفات الأساسية والصفحات التي سبق فتحها يمكن أن تبقى قابلة للفتح عند انقطاع الاتصال. بيانات Supabase نفسها لا تُخزّن محليًا ولا تصبح قابلة للتعديل دون اتصال؛ عمليات الطلاب والدرجات والنتائج تحتاج اتصالًا بقاعدة البيانات.

## Android / APK

تم تجهيز `capacitor.config.ts` وscripts الخاصة بـCapacitor، لكن لا يتم تضمين مجلد `android/` داخل المستودع قبل تشغيل Capacitor في بيئة التطوير النهائية.

بعد التأكد من رابط الإنتاج HTTPS:

```bash
npm install
npx cap add android
npx cap sync
npx cap open android
```

أو باستخدام scripts المشروع:

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

إذا أردت تغليف الموقع المنشور مباشرة داخل WebView الآمن، ضع رابط الإنتاج في `CAP_SERVER_URL` قبل `cap sync`. لا تستخدم HTTP غير مشفر في الإنتاج.

لإنشاء APK/AAB النهائي استخدم Android Studio بعد فتح مشروع `android/`.

## الدخول السريع

يستخدم Md School Passkeys/WebAuthn من Supabase، وليس بصمة مخصصة. لذلك يمكن للجهاز استخدام:

- بصمة الإصبع.
- Face Unlock / Face ID عندما يدعمه الجهاز.
- Windows Hello / PIN على الأجهزة المدعومة.
- مفتاح أمان خارجي عند الحاجة.

يجب أن يكون الموقع على HTTPS (أو localhost أثناء التطوير)، ويجب تفعيل Passkeys في إعدادات Supabase قبل استخدام الميزة في الإنتاج.
