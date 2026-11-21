(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORE = "payroll-arcade.shift.v1";
  const SOUND = "payroll-arcade.sound.v1";
  const MOTION = "payroll-arcade.cat-motion.v1";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const TEA_PRICE = 20;
  const goals = [
    { value: 1, name: "第一蚊入袋", icon: "brand" },
    { value: 20, name: "凍奶茶自由", icon: "tea" },
    { value: 55, name: "兩餸飯自由", icon: "meal" },
    { value: 100, name: "紅衫魚入袋", icon: "fish" },
    { value: 300, name: "放工打邊爐", icon: "pot" },
    { value: 500, name: "大牛報到", icon: "cash" },
    { value: 1000, name: "金牛捕獲", icon: "stash" },
    { value: 10000, name: "萬元打工傳說", icon: "trophy" },
  ];
  const channels = [
    { image: "assets/cat-keyboard.jpg", loop: "assets/cat-keyboard.gif", quote: "「鍵盤一響，黃金萬兩。」", alt: "戴黑超嘅橘貓左右手輪流敲鍵盤。" },
    { image: "assets/cat-cash.jpg", loop: "assets/cat-cash.gif", quote: "「錢唔係萬能，係貓能。」", alt: "橘貓搖住條尾，攬實一大疊鈔票。" },
    { image: "assets/cat-tea.jpg", loop: "assets/cat-tea.gif", quote: "「呢啖奶茶，老細請。」", alt: "橘貓拎起茶杯啜一啖，杯口冒住熱氣。" },
    { image: "assets/cat-tired.jpg", loop: "assets/cat-tired.gif", quote: "「叉一格電，等陣再嚟。」", alt: "橘貓伏喺鍵盤小睡，頭仔跟住呼吸起伏。" },
  ];
  const cents = new Intl.NumberFormat("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grouped = new Intl.NumberFormat("en-HK", { maximumFractionDigits: 2 });
  const compact = new Intl.NumberFormat("en-HK", { notation: "compact", maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("en-HK", { maximumFractionDigits: 0 });
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
  const nodes = Object.fromEntries(Array.from(document.querySelectorAll("[id]"), el => [el.id, el]));
  let usableStorage = true;
  let audioContext;
  let toastTimer;
  let frameId = 0;
  let previousFrame = -Infinity;
  let lastAux = -Infinity;
  let lastDay = "";
  let lastAmountLength = 0;
  let pendingAutoStop = false;
  let channelIndex = 0;
  let backgroundTick = 0;
  let titleUpdatedAt = -Infinity;
  let companion = false;
  let catOnscreen = true;
  let catFrame = "";

  function readKey(key) {
    try { return localStorage.getItem(key); }
    catch { usableStorage = false; return null; }
  }
  function writeKey(key, value) {
    try { localStorage.setItem(key, value); }
    catch {
      usableStorage = false;
      $("privacy").lastElementChild.textContent = "資料暫存喺呢個分頁";
    }
  }
  function readState() {
    const raw = readKey(STORE);
    if (!raw) return null;
    try {
      const candidate = JSON.parse(raw);
      return Payroll.valid(candidate) ? candidate : null;
    } catch { return null; }
  }
  const initial = readState();
  let state = initial || Payroll.create(Date.now());
  if (!initial) writeKey(STORE, JSON.stringify(state));
  let sound = readKey(SOUND) === "on";
  let motionPreference = readKey(MOTION);
  if (!usableStorage) $("privacy").lastElementChild.textContent = "資料暫存喺呢個分頁";
  const refreshLeave = mountLeavePlanner(() => state.pay, readKey, writeKey, cash);

  const goalCount = total => goals.filter(goal => total >= goal.value).length;
  let previousGoal = goalCount(Payroll.snapshot(state, Date.now()).total);
  function text(id, value) {
    const el = nodes[id];
    if (el.textContent !== value) el.textContent = value;
  }
  function cash(value) { return "HK$" + cents.format(value); }
  function notify(message) {
    clearTimeout(toastTimer);
    text("toast", message);
    $("toast").classList.add("show");
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3000);
  }

  async function transact(change) {
    const apply = () => {
      const current = (usableStorage && readState()) || state;
      const updated = change(current, Date.now());
      if (updated !== current) writeKey(STORE, JSON.stringify(updated));
      adopt(updated);
    };
    if (!navigator.locks) return apply();
    let entered = false;
    try { await navigator.locks.request(STORE, () => { entered = true; apply(); }); }
    catch (error) { if (entered) throw error; apply(); }
  }
  function adopt(updated) {
    const switchedProfile = state.demo !== updated.demo;
    const oldPay = state.pay;
    state = updated;
    if (oldPay.salary !== state.pay.salary || oldPay.days !== state.pay.days || oldPay.hours !== state.pay.hours) refreshLeave();
    if (switchedProfile) previousGoal = goalCount(Payroll.snapshot(state, Date.now()).total);
    refreshControls();
    paint(Date.now(), true);
    schedule();
  }
  function schedule() {
    cancelAnimationFrame(frameId);
    clearInterval(backgroundTick);
    if (state.status !== "running") return;
    if (document.hidden) backgroundTick = setInterval(() => {
      const now = Date.now(), view = Payroll.snapshot(state, now);
      updateTitle(view, now, true);
      if (view.due) finishIfDue();
    }, 10000);
    else frameId = requestAnimationFrame(loop);
  }
  function loop(timestamp) {
    if (!reducedMotion.matches || timestamp - previousFrame >= 200) {
      previousFrame = timestamp;
      paint(Date.now(), false);
    }
    if (!document.hidden && state.status === "running") frameId = requestAnimationFrame(loop);
  }
  function setStat(id, value) {
    const el = nodes[id];
    const pretty = value >= 1e6 ? compact.format(value) : cents.format(value);
    if (el.textContent === pretty) return;
    el.textContent = pretty;
    el.parentElement.classList.toggle("long-value", pretty.length > 8);
    if (value >= 1e6) el.title = cents.format(value);
    else el.removeAttribute("title");
  }
  function paint(now, force) {
    const view = Payroll.snapshot(state, now);
    const [integer, decimals] = view.earned.toFixed(6).split(".");
    const wholePart = whole.format(Number(integer));
    text("amount-major", wholePart + "." + decimals.slice(0, 2));
    text("amount-tail", decimals.slice(2));
    if (wholePart.length !== lastAmountLength) {
      lastAmountLength = wholePart.length;
      const scale = Math.min(15.2, 94 / (3.96 + .8 * integer.length + .35 * (wholePart.length - integer.length)));
      $("amount-line").style.setProperty("--amount-size", scale.toFixed(2) + "cqw");
    }
    const ms = Math.floor(view.elapsed);
    const pad = value => String(value).padStart(2, "0");
    text("elapsed-seconds", pad(Math.floor(ms / Payroll.HOUR)) + ":" + pad(Math.floor(ms / 60000) % 60) + ":" + pad(Math.floor(ms / 1000) % 60));
    text("elapsed-ms", "." + String(ms % 1000).padStart(3, "0"));
    if (force || Math.abs(now - lastAux) >= 200) {
      lastAux = now;
      const remaining = Payroll.shiftOutlook(state, view);
      const atTarget = view.elapsed >= state.pay.hours * Payroll.HOUR;
      const finished = state.status === "finished" || view.due;
      text("outlook-label", finished ? "今更袋穩" : atTarget ? "已達工時目標" : "今更仲可以賺");
      text("shift-outlook", cash(finished || atTarget ? view.earned : remaining));
      text("outlook-hours", finished ? "收工，好好抖吓" : atTarget ? "繼續累積中" : "按 " + state.pay.hours + " 小時一更");
      updateTitle(view, now, force);
      setStat("all-time", view.total);
      setStat("tea-count", view.earned / TEA_PRICE);
      updateGoals(view.total);
      updateDate(now);
      if ($("finish").open) text("finish-total", cash(view.earned));
    }
    if (view.due) finishIfDue();
  }
  function finishIfDue() {
    if (pendingAutoStop) return;
    pendingAutoStop = true;
    transact((latest, time) => Payroll.settleIfDue(latest, time)).then(() => {
      if (state.status === "finished" && !document.hidden) notify("夠鐘！今更已自動收工。");
    }).finally(() => { pendingAutoStop = false; });
  }
  function updateTitle(view, now, force) {
    if (!force && Math.abs(now - titleUpdatedAt) < 1000) return;
    titleUpdatedAt = now;
    const label = state.status === "finished" || view.due ? "收工" : state.status === "paused" ? "休息中" : "今更已賺";
    const title = $("boss-sheet").open ? "部門營運摘要" : cash(view.earned) + " · " + (state.demo ? "試玩" : "") + label + "｜出糧街機";
    if (document.title !== title) document.title = title;
  }
  function updateDate(now) {
    const date = new Date(now);
    const dateString = date.getFullYear() + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getDate()).padStart(2, "0");
    if (dateString === lastDay) return;
    lastDay = dateString;
    $("today").dateTime = dateString.replaceAll(".", "-");
    $("today").lastElementChild.textContent = dateString + "  " + weekday.format(date).toUpperCase();
  }
  function refreshControls() {
    const run = state.status === "running";
    const finished = state.status === "finished";
    const chip = $("run-state");
    chip.classList.toggle("idle", !run);
    chip.lastElementChild.textContent = (state.demo ? "試玩" : "") + (run ? "計薪中" : finished ? "已收工" : "已暫停");
    text("clock-label", run ? "暫停計薪" : finished ? "開新一更" : "繼續計薪");
    Pixels.draw($("clock-button").querySelector("canvas"), run ? "pause" : "play");
    $("finish-button").disabled = finished;
    const rate = Payroll.perHour(state.pay);
    const msRate = rate / Payroll.HOUR;
    const precision = Math.min(15, Math.max(6, 1 - Math.floor(Math.log10(msRate))));
    text("ms-rate", "+HK$" + (run ? msRate : 0).toFixed(precision));
    setStat("hourly", rate);
    text("profile-note", (state.demo ? "試玩月薪 " : "月薪 ") + "HK$" + grouped.format(state.pay.salary) + " · 每月 " + state.pay.days + " 日 · 每日 " + state.pay.hours + " 小時");
  }
  function updateGoals(total) {
    const count = goalCount(total);
    const next = goals[count] || goals[goals.length - 1];
    const done = count === goals.length;
    const percent = Math.min(100, Math.floor(total / next.value * 100));
    text("goal-tag", done ? "全部成就已解鎖" : "下個解鎖目標");
    text("goal-name", next.name);
    text("goal-amount", "HK$" + grouped.format(next.value));
    text("remaining", done ? "打工圖鑑，全收集！" : "已累積 " + cash(total));
    text("progress-pct", percent + "%");
    if ($("goal-progress").getAttribute("aria-valuenow") !== String(percent)) {
      $("goal-progress").setAttribute("aria-valuenow", percent);
      $("progress-fill").style.width = percent + "%";
    }
    if ($("next-art").dataset.pixel !== next.icon) Pixels.draw($("next-art"), next.icon);
    if (count > previousGoal && !companion && !document.hidden && !$("boss-sheet").open) {
      notify("解鎖成就！" + goals[count - 1].name);
      burst("cash", 13);
      chime("unlock");
    }
    if ($("milestones").open && (count !== previousGoal || !$("goal-list").children.length)) showGoalList(count);
    previousGoal = count;
  }
  function showGoalList(count) {
    const list = $("goal-list");
    list.replaceChildren();
    goals.forEach((goal, index) => {
      const item = document.createElement("li");
      const art = document.createElement("canvas");
      const desc = document.createElement("span");
      const price = document.createElement("small");
      const status = document.createElement("span");
      art.setAttribute("aria-hidden", "true");
      desc.className = "goal-desc";
      desc.textContent = goal.name;
      price.textContent = "HK$" + grouped.format(goal.value);
      desc.append(price);
      const unlocked = index < count;
      item.className = unlocked ? "unlocked" : "locked";
      status.className = "goal-status";
      status.textContent = unlocked ? "已解鎖" : "未解鎖";
      item.append(art, desc, status);
      list.append(item);
      Pixels.draw(art, goal.icon);
    });
  }

  function openSettings() {
    const { salary, days, hours, autoStop } = state.pay;
    $("salary").value = salary; $("days").value = days; $("hours").value = hours; $("auto-stop").checked = autoStop;
    text("settings-copy", state.demo ? "而家係試玩模式。填入自己嘅人工，今更收入就會由零開始計。" : "新時薪由儲存嗰刻開始計，之前賺落嘅收入會保留。");
    text("save-pay", state.demo ? "儲存並開工" : "儲存設定");
    refreshPreview();
    $("settings").showModal();
  }
  function readForm() {
    return { salary: $("salary").valueAsNumber, days: $("days").valueAsNumber, hours: $("hours").valueAsNumber, autoStop: $("auto-stop").checked };
  }
  function refreshPreview() {
    const pay = readForm();
    text("rate-preview", Payroll.validPay(pay) ? cash(Payroll.perHour(pay)) : "—");
  }
  $("settings-button").addEventListener("click", openSettings);
  $("profile-note").addEventListener("click", openSettings);
  $("settings-form").addEventListener("input", refreshPreview);
  $("settings-form").addEventListener("submit", async event => {
    event.preventDefault();
    const pay = readForm();
    if (!Payroll.validPay(pay) || !$("settings-form").reportValidity()) return;
    const demo = state.demo;
    await transact((latest, now) => Payroll.changePay(latest, now, pay));
    $("settings").close();
    notify(demo ? "打卡成功！今更由零開始。" : "人工已更新，賺落嘅錢已保留。");
    chime("unlock");
  });
  $("clock-button").addEventListener("click", async () => {
    const intent = { running: "paused", paused: "running", finished: "new" }[state.status];
    await transact((latest, now) => Payroll.changeStatus(latest, now, intent));
    chime("click");
  });
  $("finish-button").addEventListener("click", () => {
    text("finish-total", cash(Payroll.snapshot(state, Date.now()).earned));
    $("finish").showModal();
  });
  $("confirm-finish").addEventListener("click", async () => {
    await transact((latest, now) => Payroll.changeStatus(latest, now, "finished"));
    $("finish").close();
    notify("收工！今更袋咗 " + cash(state.earned) + "。");
    chime("unlock");
  });
  $("milestones-button").addEventListener("click", () => {
    showGoalList(goalCount(Payroll.snapshot(state, Date.now()).total));
    $("milestones").showModal();
  });
  for (const button of document.querySelectorAll("[data-close]")) button.addEventListener("click", () => button.closest("dialog").close());
  for (const dialog of document.querySelectorAll(".dialog")) {
    dialog.addEventListener("click", event => { if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    } });
  }
  function motionEnabled() {
    return motionPreference === "on" || motionPreference !== "off" && !reducedMotion.matches;
  }
  function showCat() {
    const channel = channels[channelIndex];
    const moving = motionEnabled() && catOnscreen && !document.hidden && !$("boss-sheet").open;
    const frame = channelIndex + (moving ? "-moving" : "-still");
    const img = $("meme-image");
    if (frame !== catFrame) {
      catFrame = frame;
      img.src = moving ? channel.loop : channel.image;
      img.alt = channel.alt;
    }
    text("meme-quote", channel.quote);
    text("channel", "CH. " + String(channelIndex + 1).padStart(2, "0"));
    const button = $("motion-button");
    const label = motionEnabled() ? "暫停貓動畫" : "播放貓動畫";
    button.setAttribute("aria-label", label); button.title = label;
    Pixels.draw(button.querySelector("canvas"), motionEnabled() ? "pause" : "play");
  }
  $("motion-button").addEventListener("click", () => {
    motionPreference = motionEnabled() ? "off" : "on";
    writeKey(MOTION, motionPreference); showCat();
  });
  reducedMotion.addEventListener("change", showCat);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      catOnscreen = entries[0].isIntersecting;
      showCat();
    }).observe($("meme-image").parentElement);
  }
  $("channel-button").addEventListener("click", () => {
    channelIndex = (channelIndex + 1) % channels.length;
    showCat();
    const screen = $("meme-image").parentElement;
    screen.classList.remove("tuning");
    requestAnimationFrame(() => screen.classList.add("tuning"));
    chime("click");
  });

  function applyCompanion() {
    companion = location.hash === "#companion" || location.hash === "#companion-window";
    document.body.classList.toggle("companion", companion);
    text("companion-label", companion ? "返回出糧台" : "陪工模式");
    $("companion-button").setAttribute("aria-pressed", String(companion));
    $("popout-button").hidden = !companion || location.hash === "#companion-window";
    showCat();
  }
  $("companion-button").addEventListener("click", () => {
    const target = companion ? "" : "#companion";
    try { history.replaceState(null, "", location.pathname + location.search + target); }
    catch { location.hash = target; }
    applyCompanion();
    window.scrollTo(0, 0);
  });
  $("popout-button").addEventListener("click", () => {
    const url = new URL(location.href);
    url.hash = "companion-window";
    const small = window.open(url.href, "payroll-arcade-companion", "popup=yes,width=465,height=670,resizable=yes,scrollbars=yes");
    if (small) small.focus();
    else notify("瀏覽器未能開小窗，可以喺呢個分頁繼續陪工。");
  });
  window.addEventListener("hashchange", applyCompanion);

  function updateSoundButton() {
    text("sound-label", sound ? "音效開啟" : "音效關閉");
    $("sound-button").setAttribute("aria-label", sound ? "音效開啟，撳掣靜音" : "音效關閉，撳掣開啟");
    $("sound-button").setAttribute("aria-pressed", String(sound));
    Pixels.draw($("sound-button").querySelector("canvas"), sound ? "sound" : "mute");
  }
  async function chime(kind) {
    if (!sound) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!audioContext) audioContext = new Audio();
      if (audioContext.state === "suspended") await audioContext.resume();
      if (!sound || audioContext.state !== "running") return;
      const notes = { click: [440, 660], unlock: [523, 659, 784, 1047], rain: [784, 1047, 1175, 1568], fish: [311, 392, 330] }[kind];
      notes.forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const when = audioContext.currentTime + i * .065;
        oscillator.type = "square"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(.025, when + .006); gain.gain.exponentialRampToValueAtTime(.0001, when + .115);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(when); oscillator.stop(when + .12);
      });
    } catch { /* Audio output can be suspended by the browser while a tab is in the background. */ }
  }
  $("sound-button").addEventListener("click", () => {
    sound = !sound;
    writeKey(SOUND, sound ? "on" : "off");
    updateSoundButton();
    if (sound) chime("click");
    else if (audioContext) audioContext.suspend().catch(() => {});
  });

  const random = (min, max) => min + Math.random() * (max - min);
  function burst(kind, count) {
    const layer = $("particle-layer");
    if (reducedMotion.matches || !Element.prototype.animate) return;
    while (layer.children.length + count > 65) layer.firstElementChild?.remove();
    for (let i = 0; i < count; i++) {
      const sprite = document.createElement("canvas");
      sprite.className = "particle";
      const size = random(29, 58);
      const fish = kind === "fish";
      sprite.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + (fish ? -size + "px" : random(-5, 99) + "%") + ";top:" + (fish ? random(8, 88) + "%" : -size + "px");
      layer.append(sprite);
      Pixels.draw(sprite, kind);
      const drift = random(-100, 100);
      const far = innerHeight + size * 2;
      const run = innerWidth + size * 2;
      const frames = fish ? [
        { transform: "translate(0,0) rotate(-9deg)" }, { transform: "translate(" + run * .45 + "px,-38px) rotate(8deg)" }, { transform: "translate(" + run + "px,16px) rotate(-6deg)" }
      ] : [
        { transform: "translate(0,0) rotate(-25deg)" }, { transform: "translate(" + drift + "px," + far * .5 + "px) rotate(60deg)" }, { transform: "translate(" + drift * .4 + "px," + far + "px) rotate(175deg)" }
      ];
      const animation = sprite.animate(frames, { duration: random(1400, 2800), delay: random(0, 650), easing: fish ? "ease-in-out" : "ease-in", fill: "both" });
      animation.onfinish = () => sprite.remove();
    }
  }
  $("rain-button").addEventListener("click", () => { burst("cash", 28); chime("rain"); notify("天文台發出鈔票雨警告，請打開銀包。"); });
  $("fish-button").addEventListener("click", () => { burst("fish", 12); chime("fish"); notify(state.status === "running" ? "成功摸到魚！人工繼續游入嚟。" : "成功摸到魚！條魚陪你唞吓。"); });

  function openOffice() {
    const table = $("office-table");
    if (!table.rows.length) {
      const entries = [
        [], ["", "季度工作項目跟進"], [],
        ["", "工作項目", "負責組別", "進度", "狀態", "備註"],
        ["", "供應商資料整合", "營運", "82%", "進行中", "已覆核"],
        ["", "月度數據整理", "分析", "100%", "已完成", "已歸檔"],
        ["", "成本預算核對", "財務", "67%", "進行中", "待確認"],
        ["", "內部流程檢視", "行政", "75%", "進行中", "本週跟進"],
        ["", "下季人手安排", "營運", "50%", "待覆核", "草擬中"],
      ];
      for (let row = 0; row <= 40; row++) {
        const tr = table.insertRow();
        for (let col = 0; col <= 9; col++) {
          const cell = document.createElement(row === 0 || col === 0 ? "th" : "td");
          cell.textContent = row === 0 ? (col ? String.fromCharCode(64 + col) : "") : col === 0 ? row : (entries[row - 1]?.[col - 1] || "");
          if (row === 4 && col >= 2 && col <= 6) cell.className = "sheet-label";
          tr.append(cell);
        }
      }
    }
    $("boss-sheet").showModal();
    showCat();
    updateTitle(Payroll.snapshot(state, Date.now()), Date.now(), true);
  }
  $("boss-button").addEventListener("click", openOffice);
  $("boss-sheet").addEventListener("close", () => { showCat(); paint(Date.now(), true); });
  document.addEventListener("visibilitychange", () => {
    showCat();
    if (!document.hidden) adopt(readState() || state);
    else {
      const now = Date.now();
      updateTitle(Payroll.snapshot(state, now), now, true);
      schedule();
    }
  });
  window.addEventListener("pageshow", () => adopt(readState() || state));
  window.addEventListener("storage", event => {
    if (event.key === STORE) adopt(readState() || state);
    if (event.key === SOUND) { sound = readKey(SOUND) === "on"; updateSoundButton(); }
    if (event.key === MOTION) { motionPreference = readKey(MOTION); showCat(); }
  });
  for (const canvas of document.querySelectorAll("canvas[data-pixel]")) Pixels.draw(canvas);
  updateSoundButton();
  applyCompanion();
  adopt(state);
})();
