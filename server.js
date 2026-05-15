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

const NOTIFY_EMAIL = 'moonawake1@gmail.com';

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
            metadata: {
                courseId,
                courseName: selectedCourse.name
            },
            success_url: 'https://moonawake1-ship-it.github.io/myshop/success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://moonawake1-ship-it.github.io/myshop/courses.html'
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe 錯誤：', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/check-payment', async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: '缺少 session_id'
            });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            const amount = session.amount_total / 100;
            const courseName = session.metadata?.courseName || '未提供';
            const customerEmail = session.customer_details?.email || '未提供';

            const logEntry =
                `[${new Date().toLocaleString()}] 付款成功 - 課程: ${courseName}, 金額: NT$${amount}, Email: ${customerEmail}, Session: ${session.id}\n`;

            fs.appendFileSync(path.join(__dirname, 'payments.txt'), logEntry);

            console.log("付款確認成功：", courseName, amount, customerEmail);
        }

        res.json({
            success: true,
            paid: session.payment_status === 'paid',
            status: session.payment_status,
            amount: session.amount_total / 100,
            courseName: session.metadata?.courseName || '',
            email: session.customer_details?.email || ''
        });

    } catch (error) {
        console.error('查詢付款錯誤：', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const timeStr = new Date().toLocaleString();

        fs.appendFileSync(
            path.join(__dirname, 'contacts.txt'),
            `時間:${timeStr}\n姓名:${name}\n信箱:${email}\n內容:${message}\n\n`
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: `"軍一補救教室後台" <${process.env.GMAIL_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `🔔 新訊息通知：${name} 的課務諮詢`,
            text:
`有新的學生諮詢訊息。

填單時間：${timeStr}
學生姓名：${name}
學生信箱：${email}

諮詢內容：
${message}`
        });

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