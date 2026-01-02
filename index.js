const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// السماح للموقع الخارجي بالاتصال بالسيرفر
app.use(cors());
app.use(express.json());

// إعداد مرسل البريد (SMTP)
// سيتم جلب البيانات من متغيرات البيئة في السيرفر لحماية الخصوصية
const transporter = nodemailer.createTransport({
    service: 'gmail', // أو يمكنك استخدام 'host' و 'port' إذا كان بريد آخر غير جيميل
    auth: {
        user: process.env.EMAIL_USER, // بريدك الإلكتروني
        pass: process.env.EMAIL_PASS  // كلمة مرور التطبيقات (App Password)
    }
});

// دالة الانتظار (Delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms * 1000));

// نقطة الاستقبال (API Endpoint)
app.post('/api/send', async (req, res) => {
    const { target_email, subject, message, count, interval } = req.body;

    // التحقق من البيانات
    if (!target_email || !subject || !message || !count || !interval) {
        return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول المطلوبة' });
    }

    // إرسال رد فوري للمستخدم بأن العملية بدأت (لتجنب تعليق الواجهة)
    res.status(200).json({ success: true, message: 'بدأت عملية الإرسال في الخلفية' });

    console.log(`[START] Sending ${count} emails to ${target_email} every ${interval} seconds.`);

    // بدء عملية الإرسال في الخلفية
    processEmails(target_email, subject, message, parseInt(count), parseInt(interval));
});

async function processEmails(to, subject, text, count, interval) {
    for (let i = 1; i <= count; i++) {
        try {
            await transporter.sendMail({
                from: `"Equinox System" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: `${subject} #${i}`, // إضافة رقم للعنوان لتجنب الفلترة
                text: text,
                html: `<div dir="rtl"><h3>${subject}</h3><p>${text}</p><hr><small>Msg ID: ${Date.now()}</small></div>`
            });
            console.log(`✅ Email ${i}/${count} sent to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email ${i}:`, error.message);
        }

        // انتظار الفاصل الزمني قبل الرسالة التالية (إلا إذا كانت الأخيرة)
        if (i < count) await sleep(interval);
    }
    console.log(`[DONE] Finished sending to ${to}`);
}

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});