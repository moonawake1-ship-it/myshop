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

// 避免付款成功頁重新整理時重複通知 Discord
const notifiedSessions = new Set();

const courseDatabase = {
    digital_logic: {
        name: '數位邏輯補救班',
        amount: 6700
    },
    microprocessor: {
        name: '微處理機補救班',
        amount: 6700
    },
    electronics: {
        name: '電子學補救班',
        amount: 6700
    },
    basic_electricity: {
        name: '基本電學補救班',
        amount: 6700
    },
    math: {
        name: '統測數學高分班',
        amount: 6700
    },
    chinese: {
        name: '國文補救班',
        amount: 6700
    },
    english: {
        name: '英文補救班',
        amount: 6700
    }
};


// ==============================
// 首頁 / 健康檢查
// ==============================

app.get('/', (req, res) => {
    res.send('軍一補救教室後端 API 正常運作中');
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API alive'
    });
});


// ==============================
// Stripe 建立付款
// ==============================

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

                    // NT$67
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
                'https://moonawake1-ship-it.github.io/myshop/success.html?session_id={CHECKOUT_SESSION_ID}',

            cancel_url:
                'https://moonawake1-ship-it.github.io/myshop/courses.html'
        });

        res.json({
            success: true,
            url: session.url
        });

    } catch (error) {

        console.error('Stripe 建立付款錯誤：', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Stripe API 錯誤',
            detail: error.toString()
        });
    }
});


// ==============================
// Stripe 檢查付款
// ==============================

app.get('/api/check-payment', async (req, res) => {
    try {

        const { session_id } = req.query;

        if (!session_id) {

            return res.status(400).json({
                success: false,
                paid: false,
                message: '缺少 session_id'
            });
        }

        const session =
            await stripe.checkout.sessions.retrieve(session_id);

        const paid =
            session.payment_status === 'paid';

        const courseName =
            session.metadata?.courseName || '課程';

        // Stripe 這裡回傳 6700
        // 顯示給使用者時轉成 NT$67
        const amount =
            (session.amount_total || 0) / 100;

        const email =
            session.customer_details?.email || '';

        // 付款成功後通知 Discord
        if (
            paid &&
            DISCORD_WEBHOOK_URL &&
            !notifiedSessions.has(session.id)
        ) {

            const discordResponse =
                await fetch(DISCORD_WEBHOOK_URL, {

                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({

                        content:
`💰 有新付款成功！

📘 課程：${courseName}
💵 金額：NT$${amount}
📧 信箱：${email || '未提供'}
💳 付款狀態：${session.payment_status}

🧾 Session ID：
${session.id}`
                    })
                });

            if (!discordResponse.ok) {

                const errorText =
                    await discordResponse.text();

                console.error(
                    'Discord 付款通知失敗：',
                    discordResponse.status,
                    errorText
                );

            } else {

                console.log(
                    '✅ Discord 付款通知成功：',
                    session.id
                );

                notifiedSessions.add(session.id);
            }
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
            message:
                error.message ||
                '付款查詢失敗'
        });
    }
});


// ==============================
// 聯絡表單
// ==============================

app.post('/api/contact', async (req, res) => {

    try {

        const { name, email, message } = req.body;

        if (!name || !email || !message) {

            return res.status(400).json({
                success: false,
                message:
                    '姓名、電子郵件與諮詢內容不得空白'
            });
        }

        if (!DISCORD_WEBHOOK_URL) {

            console.error(
                '❌ 尚未設定 DISCORD_WEBHOOK_URL'
            );

            return res.status(500).json({
                success: false,
                message:
                    '網站通知系統尚未設定'
            });
        }

        const timeStr =
            new Date().toLocaleString(
                'zh-TW',
                {
                    timeZone: 'Asia/Taipei'
                }
            );

        const discordResponse =
            await fetch(DISCORD_WEBHOOK_URL, {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    content:
`📩 有新的課務諮詢！

👤 姓名：${name}
📧 Email：${email}
🕒 時間：${timeStr}

📝 諮詢內容：
${message}`
                })
            });

        if (!discordResponse.ok) {

            const errorText =
                await discordResponse.text();

            console.error(
                'Discord 聯絡表單通知失敗：',
                discordResponse.status,
                errorText
            );

            return res.status(502).json({
                success: false,
                message:
                    '通知系統傳送失敗'
            });
        }

        console.log(
            '✅ 聯絡表單通知成功：',
            name,
            email
        );

        res.json({
            success: true,
            message:
                '訊息已成功送出'
        });

    } catch (error) {

        console.error(
            '聯絡表單錯誤：',
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                '聯絡表單送出失敗'
        });
    }
});


// ==============================
// Gemini AI 出題
// ==============================

app.post('/api/generate-question', async (req, res) => {

    try {

        const {
            subject,
            topic,
            difficulty
        } = req.body;

        if (
            !subject ||
            !topic ||
            !difficulty
        ) {

            return res.status(400).json({
                success: false,
                message:
                    '缺少 subject、topic 或 difficulty'
            });
        }

        const prompt = `
你是台灣高職電子科老師。

請生成一題適合高職電子科學生的四選一題目。

科目：${subject}
章節：${topic}
難度：${difficulty}

請只回傳 JSON。

不要加 markdown。
不要加說明文字。
不要使用 \`\`\`json。

格式必須如下：

{
  "question": "題目",
  "choices": [
    "選項A內容",
    "選項B內容",
    "選項C內容",
    "選項D內容"
  ],
  "answer": "A",
  "explanation": "解析"
}
`;

        const response =
            await ai.models.generateContent({

                model:
                    'gemini-2.5-flash',

                contents: prompt,

                config: {
                    responseMimeType:
                        'application/json'
                }
            });

        const text =
            response.text || '';

        console.log(
            'Gemini 原始回傳：',
            text
        );

        if (!text) {

            throw new Error(
                'Gemini 沒有回傳內容'
            );
        }

        const jsonData =
            JSON.parse(text);

        // 基本格式檢查
        if (
            !jsonData.question ||
            !Array.isArray(
                jsonData.choices
            ) ||
            jsonData.choices.length !== 4 ||
            !jsonData.answer ||
            !jsonData.explanation
        ) {

            throw new Error(
                'Gemini 回傳格式不完整'
            );
        }

        res.json({
            success: true,
            question: jsonData
        });

    } catch (error) {

        console.error(
            'Gemini 錯誤：',
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                'Gemini API 錯誤',
            detail:
                error.toString()
        });
    }
});


// ==============================
// 啟動 Server
// ==============================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});