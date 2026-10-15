# 軍一補救教室｜完整網站整合修正版（2026-10-14）

這份是以使用者提供的 **myshop-main.zip** 為基礎修改，不是以前保存的舊版本。保留原專案檔案與已存在的圖片、音樂、課程影片和社群功能。

## 主要修正

1. **主站導覽一致**：`index.html`、`courses.html`、`ai.html`、`contact.html` 改用一致的上方導覽，新增「你畫我猜」及「新興革命黨」入口，支援窄螢幕圖示導覽；使用共用 `site-nav.css`、`site-nav.js`。
2. **AI 題庫補音樂**：AI 頁原本沒有背景音樂，現與其他三頁共用唱片按鈕、播放時間、拖曳進度與主題切換。
3. **播放器問題**：不再硬編 `240` 秒或對每次點擊都建立 `new Audio()`；播放器改依 MP3 `duration` 計算，短 POP 以輕量 Web Audio 生成，降低多重播放的卡頓。音樂由使用者按播放才載入；在頁面切換時保留上一次時間（瀏覽器不保證跨頁自動播放，需重新點擊）。
4. **模擬來電**：`xi-call.mp4` 改在按下接聽後才開始載入，鈴聲與背景音樂不互相重疊，離開時可恢復先前播放的背景音樂。關閉通話與切到其他頁面時不會持續播放影片。
5. **影片修正**：數位邏輯 57 MB 課程影片不再進入頁面時自動循環下載，改為手動按播放；原檔中缺少 `microprocessor.mp4`，改顯示「尚未上傳」提示（因為沒有來源，不能憑空修復成可播放影片）。
6. **修正圖片遺漏**：原本缺少 `hero.jpg`、`electronics.png`、`english.jpg`，以主題式 SVG 占位圖片替換，避免破圖，不改動內文字體。
7. **社群壞連結**：原本指向未附上的 `groups.html`、`files.html`、`profile.html`；新增清楚標示「準備中」的導向頁，不會當成已完成功能。
8. **遊戲多人後端**：新 `draw-guess-server.js` 接入原本 Express `server.js` 的同一個 HTTP 埠，並在原 `package.json` / `package-lock.json` 中加入 Socket.IO 依賴，保留既有 Stripe、Gemini、Discord 與聯絡 API 路由。新興革命黨和主站可以往返「你畫我猜」。
9. **效能**：降低背景畫布動畫的更新頻率與粒子存量；分頁隱藏或通話時減少動畫負擔，沒有更換原有字體或整體網頁主題。

## 如何安裝到 GitHub + Render

**先備份目前 GitHub 倉庫，再部署。請勿把 ZIP 本身當成網頁上傳。**

- 若使用 GitHub Desktop / git：可以將本完整 ZIP 解壓縮後，把 `myshop-main` 內的內容同步到原倉庫根目錄（與 `index.html` 同層），再 commit / push。
- 若用 GitHub 網頁介面：可以使用另一份「只含修改檔」的精簡 ZIP，解壓後逐份覆蓋根目錄同名檔案。不要整個上傳 `myshop-main` 資料夾造成多一層路徑。`site-nav.css`、`site-nav.js`、SVG 和 `draw-guess-server.js` 是**新增必要檔**。
- **Render**：Web Service 仍指定此 GitHub 倉庫，Build Command 使用 `npm install` 或 `npm ci`，Start Command `npm start`，保留原本的環境變數（例如 `GEMINI_API_KEY`、`STRIPE_SECRET_KEY`、郵件相關設定）。後端須部署含 Socket.IO 的新版 `server.js`，不要覆蓋回原版。
- **GitHub Pages**：靜態檔案位於根目錄，原本網址不變，新增遊戲入口 `https://moonawake1-ship-it.github.io/myshop/draw-guess.html`。
- `gameee` 子資料夾是原本的遊戲歷史範例，**正式部署以根目錄的 `draw-guess.html` 及 `draw-guess-server.js` 為準**。

## 部署後實測清單

- [ ] 在首頁、AI 題庫、課程與聯絡頁確認導覽列都有同樣的入口。
- [ ] 桌機與手機寬度下，導覽列不會遮住內容。
- [ ] 每頁按一次唱片能播放 `music.mp3`，進度與實際長度同步；另一頁可從記錄進度再按播放。
- [ ] 明暗模式切換後換頁仍保留偏好。
- [ ] 首頁按模擬來電：鈴聲正常、接聽後影片正常、掛斷停止音訊；回主站能正常恢復原有功能。
- [ ] `digital_logic.mp4` 可以點擊手動播放；微處理機顯示尚未提供影片。
- [ ] 登入、動態牆、私訊、AI 生成、聯絡表單、付款前台仍可運作（各需要後端設定和外部服務）。
- [ ] Render 服務狀態為 Live；兩個瀏覽器可以建立與加入同一個你畫我猜房間。

## 已驗證與限制

已完成 JS 語法檢查、HTML 靜態資源／站內相對路徑檢查、`npm ci --dry-run` 相依套件鎖定檢查。**未在實際 GitHub Pages / Render 上完成跨裝置、付款、Firebase 和瀏覽器音訊播放測試**，因此不保證線上所有功能已通過。程式不含任何帳號憑證或新加入的第三方金鑰。

既有內容中缺失的真正影片或尚未開發的社群功能，必須提供來源或另外開發，不能只靠修正前端連結就補齊。
