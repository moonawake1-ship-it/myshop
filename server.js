const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

// 課程資料庫
const courseDatabase = {
    'digital_logic': { name: '數位邏輯補救班', amount: 6700 },
    'microprocessor': { name: '微處理機補救班', amount: 6700 },
    'electronics': { name: '電子學補救班', amount: 6700 },
    'basic_electricity': { name: '基本電學補救班', amount: 6700 },
    'math': { name: '統測數學高分班', amount: 6700 }
};

// 🛒 Stripe 金流 API
app.post('/api/checkout', async (req, res) => {
    try {
        const { courseId } = req.body;
        const selectedCourse =
            courseDatabase[courseId] || courseDatabase['digital_logic'];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'twd',
                    product_data: {
                        name: selectedCourse.name
                    },
                    unit_amount: selectedCourse.amount,
                },
                quantity: 1,
            }],
            mode: 'payment',

            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/courses.html',
        });

        const logEntry =
            `[${new Date().toLocaleString()}] ` +
            `發起收費 - 科目: ${selectedCourse.name}, 金額: NT$15\n`;

        fs.appendFileSync(
            path.join(__dirname, 'payments.txt'),
            logEntry
        );

        res.json({ url: session.url });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
});

// ✉️ 聯絡表單 API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const timeStr = new Date().toLocaleString();

        // 儲存本機紀錄
        const contactData = `
====================================
時間: ${timeStr}
姓名: ${name}
信箱: ${email}
內容: ${message}
====================================

`;

        fs.appendFileSync(
            path.join(__dirname, 'contacts.txt'),
            contactData
        );

        // Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // 郵件內容
        const mailOptions = {
            from: `"軍一補救教室後台" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,

            subject: `🔔 新訊息通知：${name} 的課務諮詢`,

            text:
`軍一老師您好：

有新的學生諮詢訊息。

填單時間：${timeStr}

學生姓名：${name}

學生信箱：${email}

諮詢內容：
${message}

（此郵件由網站自動發送）`
        };

        await transporter.sendMail(mailOptions);

        console.log('✅ 郵件已成功寄出');

        res.json({
            success: true,
            message: '訊息已成功送出'
        });

    } catch (error) {

        console.error('郵件發送失敗：', error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});