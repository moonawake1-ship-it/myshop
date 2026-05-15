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

const courseDatabase = {
    digital_logic: { name: '數位邏輯補救班', amount: 6700 },
    microprocessor: { name: '微處理機補救班', amount: 6700 },
    electronics: { name: '電子學補救班', amount: 6700 },
    basic_electricity: { name: '基本電學補救班', amount: 6700 },
    math: { name: '統測數學高分班', amount: 6700 }
};

app.get('/', (req, res) => {
    res.send('軍一補救教室後端 API 正常運作中');
});

app.post('/api/checkout', async (req, res) => {
    try {
        const { courseId } = req.body;
        const selectedCourse = courseDatabase[courseId] || courseDatabase.digital_logic;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'twd',
                    product_data: {
                        name: selectedCourse.name
                    },
                    unit_amount: selectedCourse.amount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: 'https://moonawake1-ship-it.github.io/myshop/success.html',
            cancel_url: 'https://moonawake1-ship-it.github.io/myshop/courses.html'
        });

        const logEntry = `[${new Date().toLocaleString()}] 發起收費 - 科目: ${selectedCourse.name}, 金額: NT$${selectedCourse.amount / 100}\n`;
        fs.appendFileSync(path.join(__dirname, 'payments.txt'), logEntry);

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe 錯誤：', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const timeStr = new Date().toLocaleString();

        const contactData = `
====================================
時間: ${timeStr}
姓名: ${name}
信箱: ${email}
內容: ${message}
====================================

`;

        fs.appendFileSync(path.join(__dirname, 'contacts.txt'), contactData);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});