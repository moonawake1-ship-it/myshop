# 軍醫網站 V8｜以你重新翻譯、修正文案的專案為基底

**本版來源：**你上傳的 `myshop-main(1).zip`，不是較早的 V7 範本。除了必須接入功能的程式、快取版本號，沒有替換你自己修改的介紹或翻譯。

## 修正與新增

1. 全站背景音樂沒聲音：修正 `Number(null) === 0` 被當成已儲存音量的問題，原本不曾調整音量的人會被設定成 0%。播放器使用舒適的預設音量 72%，且若先前保存了異常 0% 音量會自動復原。
2. 恢復最早的「黑膠唱片播放器」：黑色圓形唱片、中間綠點、右側時間與細進度條，播放時旋轉。移除 V7 方形播放鈕、LISTEN 標籤和額外音量彈窗。原本音樂仍是 `music.mp3`、POP 仍是 `pop.mp3`。
3. 鈞一寶寶／你畫我猜：房主開房可選擇 **綜合／動漫／遊戲／電影・影視／日常生活／網路趣味**。使用 `draw-guess-words.json` 本地題庫，不需外部題目 API。伺服器按分類洗牌，一場內同題不重複；仍然是每人 1～3 輪，完成即結束。
4. 遊戲背景音量稍作提升，隱藏分頁時自動關閉遊戲合成器音樂，以減少多分頁發聲。

## 你如何上傳同一個 GitHub 倉庫

- **先備份目前的 `myshop` Git 專案**。本次優先使用「精簡更新包」，不需重新上傳巨大的 MP4/MP3。
- 把精簡更新 ZIP 解壓縮後，將檔案複製到已 clone 的 `D:\myshop\myshop-main` 根目錄（和 `index.html` 同層）。不要放入新資料夾，也不要從 `gameee` 中取舊檔。
- 在 VS Code 的 **PowerShell** 終端機：

```powershell
cd "D:\myshop\myshop-main"
git status --short
# 確認沒有多餘文件或敏感資訊，再逐一加入本次修改
git add -- ai.html contact.html courses.html draw-guess.html feed.html files.html groups.html index.html login.html messages.html profile.html revolution.html success.html site-editorial.css site-nav.js draw-guess-server.js draw-guess-words.json
git commit -m "Fix audio and add drawing game topics V8"
git push origin main
```

- GitHub Pages 的 `draw-guess.html` 是網頁本體；**題庫抽題與房間計分發生在 Render 的 Node.js 伺服器**，必須讓 Render 自動部署包含 `draw-guess-server.js` 與 `draw-guess-words.json` 的最新提交才會生效。
- 修改題目請編輯根目錄 `draw-guess-words.json`，維持 JSON 陣列格式、不要重複；修改後提交並讓 Render 重新部署。`labels` 是畫面名稱，`categories` 是題目清單；不要隨意改 `all/anime/games/film/daily/memes` 這些分類代碼。

## 測試與限制

- 已用 Chromium 的使用者點擊流程測試：原唱片播放器音量為 72%、可播音訊、時間持續走動、可暫停；遊戲試畫可顯示所選分類，合成器可啟動。
- 已兩位 Socket.IO 玩家進行動漫分類 3 輪／人，確認 6 題不重複、符合分類、最後正常結束。
- `music.mp3` 檢查為約 4 分 0.69 秒的有效 MP3，非無聲檔。
- 尚未在你正式 GitHub Pages／Render 網址進行全站真人驗收；瀏覽器、裝置靜音、Render 是否連線仍可能影響結果。網頁瀏覽器通常需要使用者第一次點唱片啟動音訊。
- 不影響首頁聊天室、原本的翻譯介紹、兩種主題與落花落雪特效；也沒有修改 `index.html` 其他實質文案。
