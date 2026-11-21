// The existing Hong Kong copy is the source language. A locale may override a shared
// sentence with a place-specific reference, such as a local snack or cat caption.
const ArcadeLocale = (() => {
  "use strict";
  const entries = [
    // Hong Kong, Taiwan, United States. Macau shares Cantonese unless overridden below.
    ["語言及地區", "語言與地區", "Language & region"],
    ["掛住出糧街機，睇住收入逐毫秒累積。有隻打字貓陪工，亦可以試算放假後今個月預計可袋幾多。", "讓打字貓陪你上班，看薪水逐毫秒累積，也能試算休假後這個月的收入。", "Watch your pay add up by the millisecond with a typing cat for company. Plan time off and see your estimated monthly pay."],
    ["出糧街機 · 打工人出糧台", "薪水街機 · 上班族計薪台", "Payroll Arcade · Earnings dashboard"],
    ["出糧街機 Payroll Arcade", "薪水街機 Payroll Arcade", "Payroll Arcade"],
    ["出糧街機", "薪水街機", "Payroll Arcade"],
    ["陪工模式", "陪班模式", "Companion mode"],
    ["用系統畫中畫，切去其他 app 都睇到", "用子母畫面置頂，切換應用程式也看得到", "Keep the cat on top while you work in other apps"],
    ["置頂小窗", "置頂小窗", "Pin window"],
    ["收起置頂窗", "關閉置頂小窗", "Close pinned window"],
    ["音效關閉，撳掣開啟", "音效已關閉，點一下開啟", "Sound off. Turn sound on"],
    ["音效開啟，撳掣靜音", "音效已開啟，點一下靜音", "Sound on. Mute sound"],
    ["音效關閉", "音效關閉", "Sound off"],
    ["音效開啟", "音效開啟", "Sound on"],
    ["薪金設定", "薪資設定", "Pay settings"],
    ["打工人出糧台", "上班族計薪台", "Earnings dashboard"],
    ["你同貓各有一個鍵盤。望返過嚟，又賺多咗少少。", "你敲你的鍵盤，貓敲牠的。再看一眼，珍奶基金又多一點。", "One keyboard for you, one for the cat. Look back and your coffee fund has grown."],
    ["今更累積收入", "本班累積收入", "Shift earnings"],
    ["試玩計薪中", "試玩計薪中", "Demo · Earning"],
    ["／ 毫秒", "／ 毫秒", "/ millisecond"],
    ["今更仲可以賺", "本班還能賺", "Still to earn"],
    ["暫停計薪", "暫停計薪", "Pause"],
    ["收工", "下班", "Clock out"],
    ["已計工時", "累積工時", "Time worked"],
    ["迷因放送局", "迷因放送局", "Cat TV"],
    ["暫停貓動畫", "暫停貓咪動畫", "Pause cat animation"],
    ["播放貓動畫", "播放貓咪動畫", "Play cat animation"],
    ["迷因轉台", "切換貓咪頻道", "Change cat channel"],
    ["轉台", "轉台", "Next channel"],
    ["薪金數據", "薪資統計", "Pay stats"],
    ["折算時薪", "換算時薪", "Hourly rate"],
    ["歷來累積", "歷史總收入", "All-time earnings"],
    ["連今更", "含本班", "incl. this shift"],
    ["休假試算", "休假試算", "Time-off planner"],
    ["揀個假期長度，睇吓今個月有幾多收入可以安排。", "選個休假長度，看看這個月還有多少收入可以安排。", "Pick a break and see how much pay to plan around this month."],
    ["休息幾耐", "休息多久", "Time off"],
    ["假期長度單位", "休假長度單位", "Time-off unit"],
    ["工作日", "工作天", "Workdays"],
    ["小時", "小時", "Hours"],
    ["假期類別", "假別", "Leave type"],
    ["全薪假", "全薪假", "Paid leave"],
    ["部分有薪假", "部分給薪假", "Partially paid leave"],
    ["無薪假", "無薪假", "Unpaid leave"],
    ["照薪比例", "給薪比例", "Pay percentage"],
    ["常用假期長度", "常用休假長度", "Time-off presets"],
    ["2 小時", "2 小時", "2 hours"],
    ["半日", "半天", "Half day"],
    ["1 日", "1 天", "1 day"],
    ["本月預計可袋", "本月預估收入", "Estimated monthly pay"],
    ["睇計算明細", "查看計算明細", "See breakdown"],
    ["原定月薪", "原定月薪", "Base monthly pay"],
    ["工作時段收入", "工作期間收入", "Pay for time worked"],
    ["休假期間收入", "休假期間收入", "Pay during leave"],
    ["與原定月薪相差", "與原定月薪的差額", "Difference from base pay"],
    ["按你設定嘅工作日數、工時同照薪比例估算。實際金額依公司計薪方式。試算期間，出糧台照常打卡。", "依你設定的工作天數、工時和給薪比例估算，實際金額以公司計薪方式為準。試算時，計薪台會繼續計時。", "Estimates use your workdays, hours and leave pay percentage. Your employer’s payroll rules determine actual pay. Your shift keeps running while you plan."],
    ["出糧里程碑", "薪水里程碑", "Payday milestones"],
    ["睇晒成就", "所有成就", "All achievements"],
    ["下個解鎖目標", "下一個目標", "Next unlock"],
    ["里程碑進度", "里程碑進度", "Milestone progress"],
    ["迷因發射器", "迷因發射器", "Meme buttons"],
    ["落鈔票雨", "下鈔票雨", "Make it rain"],
    ["帶薪摸魚", "帶薪摸魚", "Go fishing"],
    ["老細嚟喇", "老闆來了", "Boss alert"],
    ["資料只儲存喺你嘅瀏覽器", "資料只儲存在你的瀏覽器", "Saved in this browser"],
    ["資料暫存喺呢個分頁", "資料暫存在這個分頁", "Saved for this tab session"],
    ["開啟 JavaScript 就可以睇到跳動嘅收入。", "開啟 JavaScript 即可查看即時收入。", "Enable JavaScript to see your live earnings."],
    ["置頂陪工小窗", "置頂陪班小窗", "Pinned companion"],
    ["關閉小窗說明", "關閉小窗說明", "Close window help"],
    ["開普通小窗", "開啟一般小窗", "Open regular window"],
    ["用影片畫中畫", "使用影片子母畫面", "Try video picture-in-picture"],
    ["關閉薪金設定", "關閉薪資設定", "Close pay settings"],
    ["每月人工", "月薪", "Monthly pay"],
    ["每月工作日數", "每月工作天數", "Workdays per month"],
    ["日", "天", "Days"],
    ["每日工時", "每日工時", "Hours per day"],
    ["計滿每日工時就自動收工", "達到每日工時後自動下班", "Clock out when daily hours are reached"],
    ["儲存並開工", "儲存並上班", "Save and clock in"],
    ["今日收工？", "今天要下班了嗎？", "Clock out for today?"],
    ["關閉收工確認", "關閉下班確認", "Close clock-out confirmation"],
    ["今更收入會計入歷來累積。下次開工，就由零開始新一更。", "這一班的收入會計入歷史總收入。下次上班會從零開始累計。", "This shift counts toward your all-time earnings. Your next shift starts at zero."],
    ["今更收入", "本班收入", "Shift earnings"],
    ["返多陣", "再上一會兒", "Stay clocked in"],
    ["確認收工", "確認下班", "Clock out"],
    ["出糧成就簿", "薪水成就簿", "Achievement book"],
    ["關閉成就簿", "關閉成就簿", "Close achievements"],
    ["部門營運摘要", "部門營運摘要", "Department operations summary"],
    ["返回出糧台", "返回計薪台", "Back to dashboard"],
    ["檔案　 編輯　 檢視　 插入　 格式　 資料", "檔案　 編輯　 檢視　 插入　 格式　 資料", "File　 Edit　 View　 Insert　 Format　 Data"],
    ["季度工作項目跟進", "季度工作進度追蹤", "Quarterly project tracker"],
    ["季度工作項目跟進試算表", "季度工作進度追蹤試算表", "Quarterly project tracking spreadsheet"],
    ["季度摘要", "季度摘要", "Quarterly summary"],
    ["今更袋穩", "本班已入袋", "Shift total"],
    ["已達工時目標", "已達工時目標", "Hours goal met"],
    ["收工，好好抖吓", "下班了，好好休息", "Clocked out. Enjoy the break."],
    ["繼續累積中", "持續累積中", "Still earning"],
    ["夠鐘！今更已自動收工。", "時間到，這一班已自動下班。", "Time’s up! This shift clocked out automatically."],
    ["休息中", "休息中", "On break"],
    ["今更已賺", "本班已賺", "Earned"],
    ["試玩", "試玩", "Demo · "],
    ["計薪中", "計薪中", "Earning"],
    ["已收工", "已下班", "Clocked out"],
    ["已暫停", "已暫停", "Paused"],
    ["開新一更", "開始新班次", "New shift"],
    ["繼續計薪", "繼續計薪", "Resume"],
    ["全部成就已解鎖", "所有成就已解鎖", "All goals unlocked"],
    ["揀件道具入袋啦！", "挑件道具放進袋子吧！", "Pick a reward for your bag!"],
    ["已解鎖", "已解鎖", "Unlocked"],
    ["已累積", "已累積", "Earned so far"],
    ["解鎖成就！", "解鎖成就！", "Achievement unlocked! "],
    ["未解鎖", "未解鎖", "Locked"],
    ["而家係試玩模式。填入自己嘅人工，今更收入就會由零開始計。", "目前是試玩模式。輸入你的月薪，這一班的收入就會從零開始計算。", "You’re in demo mode. Enter your monthly pay to start a fresh shift at zero."],
    ["新時薪由儲存嗰刻開始計，之前賺落嘅收入會保留。", "儲存後會套用新時薪，先前累積的收入會保留。", "Your new hourly rate starts when you save. Earnings so far stay in your total."],
    ["儲存設定", "儲存設定", "Save settings"],
    ["打卡成功！今更由零開始。", "打卡成功！新班次從零開始。", "Clocked in! Your new shift starts at zero."],
    ["人工已更新，賺落嘅錢已保留。", "薪資已更新，已賺的收入會保留。", "Pay updated. Your earnings so far are saved."],
    ["瀏覽器未能開小窗，可以喺呢個分頁繼續陪工。", "瀏覽器無法開啟小窗，打字貓會在這個分頁繼續陪你。", "The popup couldn’t open. Your cat is still here in this tab."],
    ["天文台發出鈔票雨警告，請打開銀包。", "鈔票豪雨特報！請打開錢包。", "Forecast: a shower of bills. Open your wallet!"],
    ["成功摸到魚！人工繼續游入嚟。", "摸到魚了！薪水繼續游進來。", "Caught one! Your pay keeps swimming in."],
    ["成功摸到魚！條魚陪你唞吓。", "摸到魚了！讓魚陪你休息一下。", "Nice catch. Even the fish is taking a break."],
    ["工作項目", "工作項目", "Project"],
    ["負責組別", "負責單位", "Team"],
    ["進度", "進度", "Progress"],
    ["狀態", "狀態", "Status"],
    ["備註", "備註", "Notes"],
    ["供應商資料整合", "供應商資料整合", "Vendor data consolidation"],
    ["營運", "營運", "Operations"],
    ["進行中", "進行中", "In progress"],
    ["已覆核", "已複核", "Reviewed"],
    ["月度數據整理", "每月數據整理", "Monthly data cleanup"],
    ["分析", "分析", "Analytics"],
    ["已完成", "已完成", "Complete"],
    ["已歸檔", "已歸檔", "Filed"],
    ["成本預算核對", "成本預算核對", "Budget reconciliation"],
    ["財務", "財務", "Finance"],
    ["待確認", "待確認", "Awaiting confirmation"],
    ["內部流程檢視", "內部流程檢視", "Internal process review"],
    ["行政", "行政", "Administration"],
    ["本週跟進", "本週追蹤", "Follow up this week"],
    ["下季人手安排", "下季人力規劃", "Next quarter staffing"],
    ["待覆核", "待複核", "Under review"],
    ["草擬中", "草擬中", "Drafting"],
    ["個工作日", "個工作天", "workdays"],
    ["請輸入 0 至 100 嘅照薪百分比。", "請輸入 0 到 100 的給薪百分比。", "Enter a pay percentage between 0 and 100."],
    ["輸入假期長度同類別，就會有試算結果。", "輸入休假長度和假別，即可查看試算結果。", "Enter a duration and leave type to see the estimate."],
    ["按原定工作安排計算。", "依原定工作安排計算。", "Based on your regular work schedule."],
    ["出糧街機 · 置頂陪工", "薪水街機 · 置頂陪班", "Payroll Arcade · Pinned companion"],
    ["呢個瀏覽器隨即收起咗畫中畫。用桌面 Chrome 或 Edge 開啟呢頁，仲可以將打字貓放喺其他 app 上面。", "這個瀏覽器關閉了子母畫面。用桌面版 Chrome 或 Edge 開啟此頁，即可讓打字貓浮在其他應用程式上方。", "This browser closed picture-in-picture. Open this page in desktop Chrome or Edge to keep the cat above your other apps."],
    ["呢個瀏覽器隨即收起咗文件畫中畫。撳「用影片畫中畫」可以試另一種置頂方式，同樣會見到打字貓同銀碼。", "這個瀏覽器關閉了文件子母畫面。點「使用影片子母畫面」試試另一種置頂方式，也能看到打字貓和即時收入。", "This browser closed the pinned window. Try video picture-in-picture to keep the typing cat and live earnings on screen."],
    ["呢個瀏覽器隨即收起咗文件畫中畫。用桌面 Chrome 或 Edge 開啟呢頁就可以置頂。", "這個瀏覽器關閉了文件子母畫面。用桌面版 Chrome 或 Edge 開啟此頁即可置頂。", "This browser closed the pinned window. Open this page in desktop Chrome or Edge to pin it."],
    ["用支援系統畫中畫嘅桌面瀏覽器（例如 Chrome 或 Edge）開啟呢頁，就可以將打字貓拖到螢幕角落。", "在支援子母畫面的桌面瀏覽器（例如 Chrome 或 Edge）開啟此頁，即可把打字貓拖到螢幕角落。", "Open this page in a desktop browser with picture-in-picture, such as Chrome or Edge, to pin your cat in a corner."],
    ["呢個視窗未能開啟文件畫中畫。可以試用影片畫中畫，同樣會顯示打字貓同實時銀碼。", "這個視窗無法開啟文件子母畫面。試試影片子母畫面，打字貓和即時收入也會顯示。", "The pinned window couldn’t open. Try video picture-in-picture for the same typing cat and live earnings."],
    ["瀏覽器暫時未能開啟系統畫中畫。可以重試，或者用桌面 Chrome 或 Edge 開啟同一個網址。", "瀏覽器目前無法開啟子母畫面。可以重試，或用桌面版 Chrome 或 Edge 開啟相同網址。", "Picture-in-picture couldn’t open. Try again or open this address in desktop Chrome or Edge."],
  ];
  const phrases = Object.fromEntries(entries.map(([hk, tw, us]) => [hk, { "zh-TW": tw, "en-US": us }]));

  const data = {
    "zh-HK": {
      label: "繁體中文（香港）", country: "香港", city: "香港", landmark: "霓虹街景",
      currency: "HKD", symbol: "HK$", sampleSalary: 24000, teaPrice: 20, buyingIcon: "tea",
      buyingPower: ["今更奶茶購買力", "杯", "以每杯 HK$20 試算", "歷來累積每過一關，自動解鎖一個成就。奶茶購買力以每杯 HK$20 試算。"],
      goals: [
        ["first-coin", 1, "第一蚊入袋", "brand", "貓爪一蚊銀", "paw-coin"],
        ["milk-tea", 20, "凍奶茶自由", "tea", "茶記凍奶茶"],
        ["egg-waffle", 30, "街角雞蛋仔", "waffles", "熱辣辣雞蛋仔"],
        ["two-dish-rice", 55, "兩餸飯自由", "meal", "叉燒滑蛋兩餸飯"],
        ["red-fish", 100, "紅衫魚入袋", "fish", "紅衫魚布偶", "plush-fish"],
        ["hot-pot", 300, "放工打邊爐", "pot", "迷你鴛鴦鍋"],
        ["big-ox", 500, "大牛報到", "cash", "大牛鎖匙扣", "ox-charm"],
        ["golden-ox", 1000, "金牛捕獲", "stash", "金牛錢罌", "ox-bank"],
        ["arcade-trophy", 10000, "萬元打工傳說", "trophy", "金鍵盤獎盃"],
      ],
      channels: [
        ["「鍵盤一響，黃金萬兩。」", "戴黑超嘅橘貓左右手輪流敲鍵盤。"],
        ["「錢唔係萬能，係貓能。」", "橘貓搖住條尾，攬實一大疊鈔票。"],
        ["「呢啖奶茶，老細請。」", "橘貓拎起茶杯啜一啖，杯口冒住熱氣。"],
        ["「叉一格電，等陣再嚟。」", "橘貓伏喺鍵盤小睡，頭仔跟住呼吸起伏。"],
      ],
    },
    "zh-MO": {
      label: "繁體中文（澳門）", country: "澳門", city: "澳門", landmark: "大三巴牌坊",
      currency: "MOP", symbol: "MOP$", sampleSalary: 22000, teaPrice: 12, buyingIcon: "tart",
      overrides: {
        "你同貓各有一個鍵盤。望返過嚟，又賺多咗少少。": "你有鍵盤，貓都有。望多眼，葡撻基金又多咗少少。",
        "天文台發出鈔票雨警告，請打開銀包。": "大三巴落鈔票雨喇，快啲打開銀包！",
      },
      buyingPower: ["今更葡撻購買力", "個", "以每個 MOP$12 試算", "歷來累積每過一關，自動解鎖一個澳門成就。葡撻購買力以每個 MOP$12 試算。"],
      goals: [
        ["first-coin", 1, "第一蚊入袋", "brand", "貓爪一蚊銀", "paw-coin"],
        ["egg-tart", 12, "出爐葡撻", "tart", "焦糖脆面葡撻"],
        ["pork-chop-bun", 35, "氹仔豬扒包", "meal", "氹仔豬扒包", "chop-bun"],
        ["almond-cookies", 80, "杏仁餅手信", "stash", "迷你杏仁餅鐵盒", "cookie-tin"],
        ["portuguese-chicken", 180, "葡國菜開枱", "pot", "焗葡國雞"],
        ["coloane-postcard", 400, "路環放空基金", "cash", "路環海邊明信片", "postcard"],
        ["snack-map", 1000, "澳門半島食勻一圈", "fish", "貓仔掃街地圖", "snack-map"],
        ["st-pauls-trophy", 8000, "大三巴打工傳說", "trophy", "大三巴貓爪獎座"],
      ],
      channels: [
        ["「大三巴打卡，我打鍵盤。」", "大三巴牌坊前，戴黑超嘅橘貓輪流郁兩隻爪打字。"],
        ["「呢疊銀紙高過個葡撻。」", "橘貓搖住條尾，攬實一大疊鈔票。"],
        ["「歎啖茶，等個葡撻出爐。」", "橘貓拎起茶杯啜一啖，杯口冒住熱氣。"],
        ["「容我瞓到下一爐出爐。」", "橘貓伏喺鍵盤小睡，頭仔跟住呼吸起伏。"],
      ],
    },
    "zh-TW": {
      label: "繁體中文（台灣）", country: "台灣", city: "台北", landmark: "台北 101",
      currency: "TWD", symbol: "NT$", sampleSalary: 50000, teaPrice: 60, buyingIcon: "boba",
      buyingPower: ["本班珍奶購買力", "杯", "以每杯 NT$60 試算", "每跨過一個累積收入目標，就能解鎖一項台灣成就。珍奶購買力以每杯 NT$60 試算。"],
      goals: [
        ["first-coin", 1, "第一塊入袋", "brand", "貓掌一元硬幣", "paw-coin"],
        ["egg-crepe", 40, "早餐店蛋餅", "meal", "起司蛋餅", "crepe-roll"],
        ["bubble-tea", 60, "珍珠奶茶自由", "boba", "半糖少冰珍奶"],
        ["fried-chicken", 100, "夜市雞排加辣", "meal", "辣粉大雞排", "cutlet"],
        ["beef-noodles", 200, "牛肉麵加滷蛋", "pot", "紅燒牛肉麵加蛋", "noodles"],
        ["hot-pot", 600, "火鍋揪團基金", "cash", "貓掌造型火鍋料", "paw-cake"],
        ["taipei-postcard", 1500, "週末台北小旅行", "stash", "台北旅行明信片", "postcard"],
        ["taipei-trophy", 10100, "台北 101 級薪水貓", "trophy", "台北 101 貓掌獎座"],
      ],
      channels: [
        ["「敲完這一行，珍奶多一顆珍珠。」", "戴墨鏡的橘貓輪流用兩隻爪子打字，背後是台北 101。"],
        ["「貓掌一伸，獎金先收。」", "橘貓搖著尾巴，緊緊抱住一疊鈔票。"],
        ["「半糖少冰，薪水加倍。」", "橘貓捧起茶杯喝了一口，杯口冒著熱氣。"],
        ["「鍵盤借我躺一下，五分鐘就好。」", "橘貓趴在鍵盤上打盹，腦袋隨著呼吸輕輕起伏。"],
      ],
    },
    "en-US": {
      label: "English (US)", country: "United States", city: "New York", landmark: "Statue of Liberty",
      currency: "USD", symbol: "$", sampleSalary: 5000, teaPrice: 3, buyingIcon: "coffee",
      overrides: { "PAYROLL ARCADE": "NEW YORK" },
      buyingPower: ["Deli coffee fund", "cups", "Estimated at $3 per cup", "Your all-time earnings unlock New York milestones. The coffee counter uses $3 a cup as a playful estimate."],
      goals: [
        ["first-dollar", 1, "First buck", "brand", "Lucky cat dollar", "cash"],
        ["deli-coffee", 3, "Corner deli coffee", "coffee", "Blue deli coffee cup", "blue-coffee"],
        ["pizza-slice", 5, "Pizza slice fund", "slice", "Folded cheese slice"],
        ["everything-bagel", 12, "Bagel with the works", "meal", "Everything bagel", "bagel"],
        ["ballpark-pretzel", 30, "Ballpark snack run", "fish", "Ballpark pretzel", "pretzel"],
        ["diner-burger", 100, "Dinner in the city", "pot", "Double diner burger", "burger"],
        ["broadway-playbill", 250, "Broadway night fund", "stash", "Paw-signed playbill", "playbill"],
        ["golden-paw", 1000, "Four-figure cat", "trophy", "Golden Paw trophy"],
      ],
      channels: [
        ["“Lady Liberty has a torch. I have a keyboard.”", "A sunglasses-wearing orange cat types in front of New York Harbor and the Statue of Liberty."],
        ["“Direct deposit? Directly into my paws.”", "An orange cat swishes its tail and hugs a stack of bills."],
        ["“This meeting could’ve been a coffee.”", "An orange cat raises a steaming cup and takes a sip."],
        ["“I’m working on a very important nap.”", "An orange cat dozes on a keyboard, its head rising and falling as it breathes."],
      ],
    },
  };

  function collectionCopy(code, symbol) {
    const number = new Intl.NumberFormat(code, { maximumFractionDigits: 0 });
    const format = n => number.format(n);
    if (code === "en-US") {
      const points = n => format(n) + (n === 1 ? " point" : " points");
      return {
        title: "Achievements & loot", book: "Achievements", bag: "Loot bag", shortcut: "Loot bag",
        balance: "Available points", unlocked: "Unlocked", collected: "Items in bag",
        redeem: "Redeem", locked: "Locked", pending: "Redeeming…", loading: "Opening loot bag…",
        rules: "Every $1 earned adds 1 game point. Unlock an achievement, then spend points to collect its virtual item.",
        demo: "Demo collection", empty: "Your bag is empty. Redeem your first item in Achievements.",
        unavailable: "Your browser couldn’t save or open the loot bag. Please try again.",
        profileChanged: "Your pay profile changed. Check your points and try again.",
        insufficient: "Keep earning points for this item.",
        points, cost: points,
        unlockedCount: (n, total) => format(n) + " / " + format(total) + " unlocked",
        bagCount: n => format(n) + (n === 1 ? " item" : " items"),
        owned: n => format(n) + " in bag",
        received: item => "+1 " + item + "! Added to your loot bag.",
        redeemItem: item => "Redeem " + item,
        need: n => points(n) + " to go",
        unlockAt: salary => "Unlocks at " + salary,
      };
    }
    const taiwan = code === "zh-TW";
    const points = n => format(n) + " 點";
    return {
      title: taiwan ? "成就與道具" : "成就同道具", book: "成就簿", bag: "道具袋", shortcut: "成就道具袋",
      balance: "可用點數", unlocked: "已解鎖", collected: "袋內道具",
      redeem: "兌換", locked: "未解鎖", pending: taiwan ? "兌換中…" : "換緊…",
      loading: taiwan ? "正在打開道具袋…" : "開緊道具袋…",
      rules: taiwan
        ? "每賺 " + symbol + "1 就得到 1 點遊戲點數。解鎖成就後，可以用點數兌換對應的虛擬道具。"
        : "每賺 " + symbol + "1 就有 1 點遊戲點數。解鎖成就之後，可以用點數換嗰件虛擬道具。",
      demo: "試玩收藏",
      empty: taiwan ? "道具袋還是空的。到成就簿換第一件道具吧！" : "個袋仲係空嘅。去成就簿換件道具啦！",
      unavailable: taiwan ? "瀏覽器暫時無法存取道具袋，請再試一次。" : "瀏覽器暫時讀寫唔到道具袋，請再試一次。",
      profileChanged: taiwan ? "已切換薪資紀錄，請確認點數後再兌換。" : "已經切換咗計薪紀錄，睇一睇點數再換啦。",
      insufficient: taiwan ? "存夠點數就能兌換這件道具。" : "儲夠點數就可以換呢件道具。",
      points, cost: points,
      unlockedCount: (n, total) => "已解鎖 " + format(n) + " / " + format(total),
      bagCount: n => format(n) + " 件道具",
      owned: n => "持有 " + format(n) + " 件",
      received: item => item + (taiwan ? " +1！已放進道具袋。" : " +1！已經入袋。"),
      redeemItem: item => "兌換" + item,
      need: n => (taiwan ? "再存 " : "再儲 ") + points(n),
      unlockAt: salary => (taiwan ? "累積 " : "儲到 ") + salary + " 解鎖",
    };
  }

  const regions = Object.fromEntries(Object.entries(data).map(([code, definition]) => {
    const { buyingPower, overrides, ...settings } = definition;
    // Keep IDs stable across copy and artwork edits. The item bag stores these IDs.
    const goals = settings.goals.map(([id, value, name, icon, item, itemIcon = icon]) => ({ id, value, name, icon, item, itemIcon }));
    const channels = settings.channels.map(([quote, alt]) => ({ quote, alt }));
    const regional = new Map(Object.entries(overrides || {}));
    data["zh-HK"].buyingPower.forEach((key, i) => regional.set(key, buyingPower[i]));
    data["zh-HK"].channels.forEach(([quote, alt], i) => {
      regional.set(quote, channels[i].quote);
      regional.set(alt, channels[i].alt);
    });
    regional.set("HK$", settings.symbol);
    regional.set("HK$0.00", settings.symbol + "0.00");
    regional.set("HK$300", settings.symbol + (code === "zh-HK" ? 300 : goals[4].value));
    regional.set("放工打邊爐", code === "zh-HK" ? "放工打邊爐" : goals[4].name);
    regional.set("仲差 HK$0.00", code === "en-US" ? "$0.00 to go" : (code === "zh-TW" ? "還差 " : "仲差 ") + settings.symbol + "0.00");
    regional.set("+HK$0.000038", "+" + settings.symbol + (settings.sampleSalary / (22 * 8 * 3600000)).toFixed(6));
    const sample = settings.symbol + new Intl.NumberFormat(code).format(settings.sampleSalary);
    const example = code === "en-US" ? "Demo pay " + sample + " · 22 days/month · 8 hours/day" :
      "試玩月薪 " + sample + " · 每月 22 " + (code === "zh-TW" ? "天" : "日") + " · 每日 8 小時";
    regional.set("試玩月薪 HK$24,000 · 每月 22 日 · 每日 8 小時", example);
    return [code, {
      ...settings, code, goals, channels, collection: collectionCopy(code, settings.symbol),
      t(source) { return regional.get(source) ?? phrases[source]?.[code] ?? source; },
    }];
  }));

  function get(code) {
    return Object.hasOwn(regions, code) ? regions[code] : regions["zh-HK"];
  }

  // Keep source text outside the DOM. Updating text nodes individually preserves icons,
  // controls and listeners, including the cursor span inside the dashboard heading.
  const originals = new WeakMap();
  function apply(doc, region) {
    if (typeof region === "string") region = get(region);
    doc.documentElement.lang = region.code;
    const attributes = ["aria-label", "title", "alt", "placeholder"];
    function translate(node, key, value, write) {
      let record = originals.get(node);
      if (!record) { record = new Map(); originals.set(node, record); }
      if (!record.has(key)) record.set(key, value);
      const source = record.get(key);
      const trimmed = source.trim();
      const result = region.t(trimmed);
      const next = result === trimmed ? source : source.replace(trimmed, () => result);
      if (next !== value) write(next);
    }
    const walker = doc.createTreeWalker(doc.documentElement, 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) continue;
      if (node.nodeValue.trim()) translate(node, "text", node.nodeValue, value => { node.nodeValue = value; });
    }
    for (const el of doc.querySelectorAll("[aria-label],[title],[alt],[placeholder],meta[name='description']")) {
      for (const attr of attributes) {
        if (el.hasAttribute(attr)) translate(el, attr, el.getAttribute(attr), value => el.setAttribute(attr, value));
      }
      if (el.matches("meta[name='description']")) translate(el, "content", el.content, value => { el.content = value; });
    }
  }
  return { regions, get, apply };
})();
if (typeof module !== "undefined" && module.exports) module.exports = ArcadeLocale;
