# 軍一亂畫社・第一版（V3 介面）

「你畫，我亂猜！」將原本的工程版重新設計成原創塗鴉俱樂部風格。插圖、人物、遊戲素材直接由 HTML SVG / Canvas 向量繪製，不依賴外部 AI 圖像、遊戲畫面模板或 CDN 字體。

## 這一版做了什麼

- **手繪風遊戲大廳**：原創塗鴉怪物、紙張貼紙與非制式排版。
- **雙視覺主題**：黑綠「深夜塗鴉」／藍白「清爽畫室」；可即時切換，主題記在裝置中。
- **房主決定繪圖規則**：建立房間時可選擇「經典亂畫（標準）」或「幫我一筆（擴充）」。
- **標準模式**：十色畫筆、筆觸粗細、橡皮擦、撤銷、清空畫布。
- **擴充模式**：在標準模式之外多 8 款小素材（短髮、長髮、眼睛、眼鏡、帽子、笑臉、樹木、小屋）和大小／角度調整；關閉擴充時完全不顯示素材區。
- **聲音**：點擊 pop 音效與 Web Audio 原創簡易循環背景音樂，分別可開關；瀏覽器需互動後才能啟用音訊。
- **基本多人功能**：2–8 人開房、房號邀請、即時共享畫布、回合倒數、猜答案、早猜高分與排行；只有畫家能畫圖。
- **免連線試畫**：不用部署後端，直接開啟 HTML 就可使用標準／擴充繪圖工具。
- **手機支援**：小螢幕版面重新堆疊、觸控畫筆；可在手機瀏覽器遊玩。

## 最快的試玩方式

**只想試畫：** 直接在 Chrome / Edge 開啟 `draw-guess.html`，切選「經典亂畫／幫我一筆」，再點「先隨便畫畫看（免連線）」。這時只有自己的畫布，聊天、開房、猜題不會生效。

**想兩個人連線試玩（Windows）：**

1. 先安裝 Node.js 18 以上（建議 LTS），在 ZIP 解壓縮後的資料夾裡點兩下 `開始試玩_Windows.bat`。
2. 第一次執行會自動 `npm install` 安裝 Socket.IO，完成後啟動 `http://localhost:3000/draw-guess.html`。
3. 在同一台電腦開兩個不同的瀏覽器視窗，分別輸入不同暱稱：一個開房，一個輸入房號加入，房主即可開始。
4. 若要另一台手機加入，請讓手機與電腦使用同一個 Wi-Fi，透過電腦的區域網路 IP 開啟 `http://電腦IP:3000/draw-guess.html`；同時確認電腦防火牆允許連線。此版網頁已支援連到相同主機的 `:3000` 後端。

**Mac / Linux / 終端機：** 在資料夾執行 `npm install`，再執行 `npm start`，之後開瀏覽器進入上述 localhost 網址。

## 加入你的原本 GitHub Pages + Render 網站

目前尚未替你直接上傳或修改線上網站。原網站專案：`moonawake1-ship-it/myshop`，前端正式路徑建議仍使用 `draw-guess.html`。

1. 在 GitHub Pages 專案根目錄放入 `draw-guess.html`；首頁新增遊戲入口連到 `draw-guess.html`。
2. 後端 Render 專案放入 `draw-guess-server.js`，在原 `package.json` 加上 `socket.io` 套件，並以 **原有 Express app** 建立 `httpServer`：

```js
const http = require('http');
const { Server } = require('socket.io');
// app: 既有的 Express 實例
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['https://moonawake1-ship-it.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});
require('./draw-guess-server')(io);
httpServer.listen(PORT, () => console.log('Ready'));
```

**重要：** 原本 `app.listen(...)` 要改成 `httpServer.listen(...)`，不能兩者都保留；原本其他 API / 路由不要刪除。你的伺服器實際檔案如與此不同，需依實際結構合併，而不是整份複製覆蓋。

3. 在 `draw-guess.html` 上方的 `API_BASE` 填入你目前實際使用的 Render 後端網址（程式預設是上一版使用的 `https://junyi-myshop.onrender.com`）。
4. 部署前後端後，打開兩個裝置或瀏覽器，以相同房號測試畫筆同步與猜題。

## 本機多人在區網測試：API_BASE 寫法

這一版 HTML 已包含下面這段分流，讓相同 Wi-Fi 的手機也能連到電腦上的本地伺服器：

```js
const API_BASE = location.protocol === 'file:'
  ? 'http://localhost:3000'
  : (['localhost','127.0.0.1'].includes(location.hostname) || location.port === '3000')
    ? location.origin
    : 'https://junyi-myshop.onrender.com';
```

這樣使用電腦區網網址的 `:3000` 連線時，瀏覽器會連到同一台伺服器。正式部署後可以保留此分流。

## 範圍與限制

- 第一版聚焦視覺重製、雙主題、雙畫畫模式、音效、基礎多人功能。
- **尚未製作** 題庫後台、動漫全題庫、可調提示、永久排行榜、帳號綁定、畫作收藏。這些屬於後續版本。
- 若只開啟 HTML 檔案，沒有多人伺服器，**無法真正開房或和朋友連線**。
- 房間與分數保存在伺服器記憶體，伺服器重啟後會清空。連線中斷後需重新加入。
- 多人連線伺服器目前做過自動化邏輯測試，正式部署後仍需用兩台真實裝置進行驗收。
- 本地 Socket.IO 範例允許跨來源請求僅作開發測試；正式部署時請限制跨網域來源。

## 測試指令

```sh
node --check server-local.js
node --check draw-guess-server.js
node test_draw_guess_modes.js
```
