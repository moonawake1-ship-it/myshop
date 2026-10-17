# 軍一補救教室｜華麗落花 × 冰藍落雪 v6

## 內容與保留項目
- 黑綠主題：三層旋轉花瓣、綠色光點、柔光與圓弧科技背景。
- 藍白主題：三層雪粒／雪晶／微光、冰藍光暈與圓環背景。
- 兩種背景隨黑綠／藍白主題自動切換；沒有特效開關。原有主題偏好由網站原本的程式記住。
- 保留原本首頁排版、聊天、POP 音效、背景音樂、模擬來電及你畫我猜遊戲程式。
- 動畫不跟隨滑鼠、不攔截點擊；手機自動減少粒子，背景分頁暫停動畫。若作業系統開啟「減少動態效果」，呈現靜態裝飾。

## 更新檔案
精簡包：`site-petals.css`、`site-petals.js`，及 13 個已更新快取版本參數的 HTML。CSS/JS 核心特效是主要修改內容，HTML 只把引用 `v=5` 改為 `v=6`。

## VS Code PowerShell 上傳到原本 GitHub
1. 先在 VS Code 開啟原本 git clone 的 `myshop` 專案，確認其中有 `.git` 目錄。
2. 下載精簡 ZIP，**解壓縮後把裡面的檔案**複製到專案根目錄，與 `index.html` 放在同一層。請勿把外層資料夾當成子資料夾上傳。
3. 在 VS Code 終端機：

```powershell
git status --short
git add -- site-petals.css site-petals.js index.html ai.html contact.html courses.html draw-guess.html feed.html files.html groups.html login.html messages.html profile.html revolution.html success.html
git diff --cached --stat
git commit -m "Upgrade flower and snow effects v6"
git push origin main
```

4. 推送後開啟 `https://moonawake1-ship-it.github.io/myshop/index.html`，等 Pages 更新，再重新整理。
5. 黑綠應顯示落花；按頁首太陽／月亮切到藍白，應顯示落雪。切頁後也會延續主題。

## 提醒
- ZIP 只包含更新程式，不需要重新上傳 MP3、MP4 等大型檔案。
- 這版實際瀏覽器測過特效切換、滑鼠不被遮住、減少動態及手機情境，尚未直接修改你線上 GitHub，也未對 Render 或 Firebase 做實際線上回歸測試。
- `draw-guess.html` 保留遊戲原本的黑綠／藍白切換及工具，不修改遊戲連線後端。
