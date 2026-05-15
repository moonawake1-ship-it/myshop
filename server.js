const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});

const courseDatabase = {
    digital_logic: { name: '數位邏輯補救班', amount: 6700 },
    microprocessor: { name: '微處理機補救班', amount: 6700 },
    electronics: { name: '電子學補救班', amount: 6700 },
    basic_electricity: { name: '基本電學補救班', amount: 6700 },
    math: { name: '統測數學高分班', amount: 6700 }
};

async function sendDiscordNotification(message) {
    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.log('尚未設定 DISCORD_WEBHOOK_URL');
        return;
    }

    try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (error) {
        console.error('Discord 通知失敗：', error.message);
    }
}

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
                    product_data: { name: selectedCourse.name },
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

            await sendDiscordNotification(
`💰 有學生完成付款！

📘 課程：${courseName}
💵 金額：NT$${amount}
📧 Email：${customerEmail}
🧾 Session：${session.id}`
            );

            console.log('付款確認成功：', courseName, amount, customerEmail);
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

        await sendDiscordNotification(
`📩 新的課務諮詢！

👤 姓名：${name}
📧 信箱：${email}
🕒 時間：${timeStr}

📝 內容：
${message}`
        );

        res.json({
            success: true,
            message: '訊息已成功送出'
        });

    } catch (error) {
        console.error('聯絡表單通知失敗：', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/generate-question', async (req, res) => {
    try {
        const { subject, topic, difficulty } = req.body;

        const prompt = `
你是台灣高職電子科老師。

請生成一題：

科目：${subject || '電子學'}
章節：${topic || '基礎概念'}
難度：${difficulty || '普通'}

規則：
1. 四選一
2. 僅回傳 JSON
3. 不要 markdown
4. 附詳細解析
5. 題目要適合高職電子科學生

格式：
{
 "question":"",
 "choices":["","","",""],
 "answer":"",
 "explanation":""
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const jsonData = JSON.parse(cleanText);

        res.json({
            success: true,
            question: jsonData
        });

    } catch (err) {
        console.error('Gemini 題目生成錯誤：', err.message);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});