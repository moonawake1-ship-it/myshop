# 軍一網站｜編輯設計改版 V7（2026-10-15）

## 改了什麼

- 所有一般網站頁面統一細緻文字型導覽列：左右層次、目前頁面、音樂播放與進度、音量控制，雙色主題照舊。
- 新興革命黨首頁重製為原創「編輯室／檔案館」風格，保留原 Firebase 登入判斷與動態牆、私訊等既有連結。這是架空創作網站，不代表真實政黨。
- 軍一亂畫社大廳與試畫區改成紙張與手繪風格；標準／擴充房間、Socket.IO 與試畫邏輯沒有更動。
- 首頁文字改自然，保留原本左右主視覺及聊天室，不改習近平模擬來電功能。
- AI 題庫、課程與聯絡表單改善說明文字、字體層次和表單介面。
- 背景：黑綠落花、藍白落雪常駐，原有音樂 MP3、POP 音效和影片保留。

## 你要選哪份 ZIP

- **V7_精簡更新包.zip**：只包含本次有變動的檔案，適合 GitHub/VS Code 更新（不含大型 MP4/MP3）。
- **V7_完整原始碼備份.zip**：包含當時 V6 備份的全部檔案與本次改版，**不是**線上 GitHub 即時快照。

## 用 VS Code 更新同一個 myshop 倉庫

1. 先 `git status` 確認專案工作樹，建議先 `git pull --ff-only origin main` 取得遠端最新提交；如果已有未提交變更，先處理它們。
2. 將精簡更新包**解壓縮後，裡面的檔案直接複製到 GitHub 專案根目錄**，例如 `D:\myshop\myshop-main`，與 `index.html` 同層。**不要把 ZIP 或外層資料夾直接搬進倉庫。**
3. 執行 `git status --short`，確認更動範圍。
4. `git add -- *.html site-nav.js site-editorial.css revolution-editorial.css draw-editorial.css`
5. `git commit -m "Redesign site editorial UI V7"`
6. `git push origin main`

GitHub Pages 更新後開啟 `https://moonawake1-ship-it.github.io/myshop/index.html`，可按 Ctrl+Shift+R 重新整理；若原畫面仍在，檢查新檔名與快取。

## 驗證與限制

- 已以瀏覽器渲染桌機 1440x900、手機 390x844，檢查主要頁面溢出。
- 已在無後端試畫模式驗證畫布、主題切換；共用導覽已驗證音量面板與主題按鈕。
- 已跑 node 的 JavaScript 語法檢查，檢查網頁引用的同站 CSS／JS 檔案。
- **沒有**連接真實 Firebase/Render 完成正式登入、付款、跨裝置遊戲或真實音訊串流驗收。這些要部署到你的站上後實際測試。
- 這份完整包仍有原本的 `gameee` 歷史遊戲資料夾，不應作為正式入口；正式遊戲是根目錄 `draw-guess.html`。
