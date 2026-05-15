const express = require('express');
const { GoogleGenAI } = require('@google/genai'); // 🟢 核心升級：改用 Google 最新一代 SDK 載入
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 🟢 最新官方初始化語法：直接讀取環境變數中的 GEMINI_API_KEY
const ai = new GoogleGenAI(); 

const courseDatabase = {
    digital_logic: { name: '數位邏輯補救班', amount: 6700 },
    microprocessor: { name: '微處理機補救班', amount: 6700 },
    electronics: { name: '電子學補救班', amount: 6700 },
    basic_electricity: { name: '基本電學補救班', amount: 6700 },
    math: { name: '統測數學高分班', amount: 6700 }
};

async function sendDiscordNotification(message) {
    if (!process.env.DISCORD_WEBHOOK_URL) return;
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

app.get('/', (req, res) => { res.send('軍一補救教室後端 API 正常運作中'); });

app.post('/api/checkout', async (req, res) => {
    try {
        const { courseId } = req.body;
        const selectedCourse = courseDatabase[courseId] || courseDatabase.digital_logic;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: { currency: 'twd', product_data: { name: selectedCourse.name }, unit_amount: selectedCourse.amount },
                quantity: 1
            }],
            mode: 'payment',
            metadata: { courseId, courseName: selectedCourse.name },
            success_url: 'https://github.io{CHECKOUT_SESSION_ID}',
            cancel_url: 'https://github.io'
        });
        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const timeStr = new Date().toLocaleString();
        fs.appendFileSync(path.join(__dirname, 'contacts.txt'), `時間:${timeStr}\n姓名:${name}\n信箱:${email}\n內容:${message}\n\n`);
        await sendDiscordNotification(`📩 新的課務諮詢！\n👤 姓名：${name}\n📧 信箱：${email}\n📝 內容：\n${message}`);
        res.json({ success: true, message: '訊息已成功送出' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🧠 3. 完全對齊官方文件：全新 AI 自動出題路由
app.post('/api/generate-question', async (req, res) => {
    try {
        const { subject, topic, difficulty } = req.body;

        const prompt = `
你是台灣高職電子科老師。
請生成一題適合高職電子科電類學生的考題：
科目：${subject || '電子學'}
章節：${topic || '基礎概念'}
難度：${difficulty || '普通'}

規則：
1. 必須是四選一單選題
2. 僅回傳純 JSON 數據，不要夾帶任何 markdown 語法 (不要有 \`\`\`json)
3. 附上詳細的中文解析說明

格式：
{
 "question":"",
 "choices":["","","",""],
 "answer":"",
 "explanation":""
}
`;

        // 🟢 核心對接：使用您截圖中最新規的 client.models.generateContent（在 Node.js 中為 ai.models.generateContent）
        // 且型號精準代入目前最通用的商用型號 "gemini-1.5-flash"
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const text = response.text;
        
        // 清理可能殘留的 JSON 標籤
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonData = JSON.parse(cleanText);

        res.json({
            success: true,
            question: jsonData
        });

    } catch (err) {
        console.error('最新 SDK 出題錯誤：', err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });
