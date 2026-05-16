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

            success_url:
                'https://moonawake1-ship.github.io/success.html?session_id={CHECKOUT_SESSION_ID}',

            cancel_url:
                'https://moonawake1-ship.github.io/courses.html'
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe 錯誤：', error.message);

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

請生成一題適合高職電子科學生的四選一題目。

科目：${subject}
章節：${topic}
難度：${difficulty}

請只回傳 JSON：

{
  "question": "題目",
  "choices": ["A", "B", "C", "D"],
  "answer": "A",
  "explanation": "解析"
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        const text = response.text || '';

        const match = text.match(/\{[\s\S]*\}/);

        if (!match) {
            throw new Error('Gemini 沒有回傳 JSON');
        }

        const jsonData = JSON.parse(match[0]);

        res.json({
            success: true,
            question: jsonData
        });

    } catch (error) {
        console.error('Gemini 錯誤：', error.message);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});