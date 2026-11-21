# 出糧街機 · Payroll Arcade

一隻打字貓陪你返工。輸入月薪、每月工作日數同每日工時，就可以睇到今更收入逐毫秒累積。休假試算會顯示全薪、部分有薪或無薪假之後嘅預計月薪。

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
node --test tests/payroll.test.cjs
```

`dist/` 包含完整前端原始碼及可直接部署的網站。`scripts/render-loops.mjs` 使用 Node.js、FFmpeg、原始貓圖與 `artwork/typing-plate.png` 重建四個循環動畫。
