const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 避免成功頁重新整理時重複通知 DC
const notifiedSessions = new Set();

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

        const selectedCourse =
            courseDatabase[courseId] ||
            courseDatabase.digital_logic;

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
                courseId: courseId || 'digital_logic',
                courseName: selectedCourse.name
            },

            success_url:
                'https://moonawake1-ship.github.io/success.html?session_id={CHECKOUT_SESSION_ID}',

            cancel_url:
                'https://moonawake1-ship.github.io/courses.html'
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe 錯誤：', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Stripe API 錯誤',
            detail: error.toString()
        });
    }
});

app.get('/api/check-payment', async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                paid: false,
                error: '缺少 session_id'
            });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        const paid = session.payment_status === 'paid';
        const courseName = session.metadata?.courseName || '課程';
        const amount = session.amount_total || 0;
        const email = session.customer_details?.email || '';

        if (paid && DISCORD_WEBHOOK_URL && !notifiedSessions.has(session.id)) {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content:
`💰 有新付款成功！
課程：${courseName}
金額：NT$${amount}
信箱：${email || '未提供'}
付款狀態：${session.payment_status}
Session ID：${session.id}`
                })
            });

            notifiedSessions.add(session.id);
        }

        res.json({
            success: true,
            paid,
            status: session.payment_status,
            courseName,
            amount,
            email
        });

    } catch (error) {
        console.error('付款查詢錯誤：', error);

        res.status(500).json({
            success: false,
            paid: false,
            error: error.message || '付款查詢失敗'
        });
    }
});

app.post('/api/generate-question', async (req, res) => {
    try {
        const { subject, topic, difficulty } = req.body;

        if (!subject || !topic || !difficulty) {
            return res.status(400).json({
                success: false,
                error: '缺少 subject、topic 或 difficulty'
            });
        }

        const prompt = `
你是台灣高職電子科老師。

請生成一題適合高職電子科學生的四選一題目。

科目：${subject}
章節：${topic}
難度：${difficulty}

請只回傳 JSON，不要加上 markdown，不要加上說明文字。

{
  "question": "題目",
  "choices": ["選項A內容", "選項B內容", "選項C內容", "選項D內容"],
  "answer": "A",
  "explanation": "解析"
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        console.log('Gemini 原始回傳：', text);

        const jsonData = JSON.parse(text);

        res.json({
            success: true,
            question: jsonData
        });

    } catch (error) {
        console.error('Gemini 錯誤：', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Gemini API 錯誤',
            detail: error.toString()
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});