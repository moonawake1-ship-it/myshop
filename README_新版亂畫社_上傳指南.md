# 軍一亂畫社 V3.1 — 上傳指南（2026-10-14）

這份包從已整合的 `myshop-main` 完整網站製作，保留原本主站、課程、AI、登入、社群、音樂與影片。

## 確認版本

遊戲根目錄 `draw-guess.html` 現為「手繪新版 V3.1」。首頁標語 `FRIENDS & DOODLES / 手繪新版 V3.1`。包含黑綠/藍白切換、房主選經典/擴充繪圖、8 種素材、POP 音效、背景旋律及多人 Socket.IO。

正式路徑：`https://moonawake1-ship-it.github.io/myshop/draw-guess.html?v=20261014-v3-1`

舊 `gameee/` 為歷史檔案，不是主站正式入口。請勿從子資料夾內的 HTML 或本機舊檔測試；以根目錄連結為準。若畫面仍舊，請 Ctrl+Shift+R 強制重新整理，並確認 GitHub Pages 來源分支/資料夾正確。

## 不用原本資料夾如何上傳 GitHub

**方式 A：純網頁（最簡單）**

1. 下載 `軍醫網站_新版亂畫社_只需更新檔案.zip` 並解壓縮。
2. 開啟同一個 GitHub 倉庫 `moonawake1-ship-it/myshop`，切到 `main` 根目錄（能看到 `index.html`）。
3. 選 `Add file` → `Upload files`，把解壓縮後的檔案**本身**拖進去（不要上傳 ZIP、不要多一層資料夾）。
4. 在 `Commit changes` 確認新增與覆蓋的檔案；若 GitHub 拒絕同名覆蓋，進入該檔案直接 Edit 貼新版內容，或用方式 B。
5. 等 GitHub Pages 更新，開啟上方 V3.1 網址並 Ctrl+Shift+R。

**方式 B：任何全新本機資料夾（Git Bash）**

```bash
git clone https://github.com/moonawake1-ship-it/myshop.git myshop-new
cd myshop-new
```

把精簡版 ZIP 解壓後的檔案**內容**覆蓋到 `myshop-new` 根目錄，然後在 Git Bash 執行：

```bash
git add -A
git commit -m "Update doodle game V3.1 and links"
git push origin main
```

你不需要舊資料夾的 Git 設定。若 GitHub 要求驗證，使用 GitHub 正規登入方式。若 push 被拒絕，先 `git pull --rebase origin main`，有衝突不要強制 push，先確認其他修改。

## Render / 注意事項

只要原先整合版後端 `server.js` 已含 `draw-guess-server.js` 與 Socket.IO，這次前端 V3.1 **不需要**再次變動 Render API。若尚未完成後端部署，請使用完整包裡的 `server.js`、`draw-guess-server.js`、`package.json`、`package-lock.json` 並確認 Render Build=`npm ci`、Start=`npm start`。首頁離線免連線試畫可先單機測試；多人房間需 Render 上線、網路通暢且設定正確。

本次只更新正式遊戲頁的版本標示及各頁入口網址，**不宣稱已在線上完成多人測試**。原社群與媒體功能保留，未重新覆蓋其程式。
