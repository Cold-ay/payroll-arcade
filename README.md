# 出糧街機 · Payroll Arcade

一隻打字貓陪你返工。輸入月薪、每月工作日數同每日工時，就可以睇到今更收入逐毫秒累積。休假試算會顯示全薪、部分有薪或無薪假之後嘅預計月薪。

[開出糧台](https://payroll-arcade.pages.dev/) · [直接開陪工模式](https://payroll-arcade.pages.dev/#companion)

## 語言、地區同風景

撳頁頂嘅地區掣，可以揀繁體中文（香港、澳門、台灣）或者 English (US)。每個地區有自己嘅貨幣、薪金設定、休假試算同成就。返到之前嘅地區，就會見返嗰度嘅紀錄。

想帶隻貓去旅行，可以直接撳打字貓畫面上嘅地名。大三巴牌坊、台北 101、紐約自由女神像同香港霓虹街景都可以配任何語言或貨幣，置頂小窗亦會用你揀嘅風景。

[澳門](https://payroll-arcade.pages.dev/?region=zh-MO) · [台灣](https://payroll-arcade.pages.dev/?region=zh-TW) · [United States](https://payroll-arcade.pages.dev/?region=en-US)

## 置頂陪工小窗

用桌面 Chrome 或 Edge 開「陪工模式」，撳「置頂小窗」，再將畫中畫拖去螢幕角落。可以拉窗邊調整大小。保留原本分頁，切去其他 app 時，貓會繼續打字，銀碼同原本分頁共用同一更嘅紀錄。撳「暫停計薪」會同步暫停小窗，關閉小窗則會繼續計薪。

網站會按瀏覽器支援情況使用文件或影片畫中畫。未能開啟系統畫中畫時，可以選擇「開普通小窗」。

## 本機運行

網站用原生 HTML、CSS 同 JavaScript，所有媒體同字型都隨專案提供。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

用瀏覽器開啟 `http://127.0.0.1:8000`。薪金、打卡紀錄同假期試算保存在該瀏覽器、該網址嘅 localStorage。

## Cloudflare Pages

以 Git 整合連接本 repo。正式分支用 `main`，Framework preset 選 `None`，Build command 留空，Build output directory 填 `dist`。專案根目錄使用預設值。

## 測試與素材

```sh
node --test tests/*.test.cjs
```

`dist/` 包含完整前端原始碼及可直接部署的網站。`scripts/render-loops.mjs` 使用 Node.js、FFmpeg、原始貓圖與 `artwork/typing-plate.png` 重建四個循環動畫。
