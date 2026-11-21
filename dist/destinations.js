const Destinations = (() => {
  "use strict";
  const regionKey = "payroll-arcade.region.v1";
  const sceneKey = code => "payroll-arcade.scene.v1." + code;
  const artwork = {
    "zh-HK": { poster: "assets/cat-keyboard.jpg", loop: "assets/cat-keyboard.gif", atlas: "assets/typing-frames.jpg" },
    "zh-MO": { poster: "assets/cat-keyboard-mo.jpg", loop: "assets/cat-keyboard-mo.gif", atlas: "assets/typing-frames-mo.jpg" },
    "zh-TW": { poster: "assets/cat-keyboard-tw.jpg", loop: "assets/cat-keyboard-tw.gif", atlas: "assets/typing-frames-tw.jpg" },
    "en-US": { poster: "assets/cat-keyboard-us.jpg", loop: "assets/cat-keyboard-us.gif", atlas: "assets/typing-frames-us.jpg" },
  };
  const codes = Object.keys(artwork);
  const cityNames = ["香港", "澳門", "台北", "紐約"];
  const places = ["霓虹街景", "大三巴牌坊", "台北 101", "自由女神像"];
  const englishCities = ["Hong Kong", "Macao", "Taipei", "New York"];
  const englishPlaces = ["Neon city lights", "Ruins of St. Paul’s", "Taipei 101", "Statue of Liberty"];
  const copy = {
    "zh-HK": ["語言及地區", "各地區會分開儲存人工同打卡紀錄。", "打字貓去邊度？", "揀個風景陪你返工。", "關閉"],
    "zh-MO": ["語言及地區", "各地區會分開儲存薪金同打卡紀錄。", "打字貓去邊度？", "揀個風景陪你返工。", "關閉"],
    "zh-TW": ["語言與地區", "各地區會分別儲存薪資和打卡紀錄。", "打字貓要去哪裡？", "選個風景陪你上班。", "關閉"],
    "en-US": ["Language & region", "Each region keeps its own pay settings and shifts.", "Where’s the cat working?", "Pick a view for this shift.", "Close"],
  };
  const query = new URL(location.href).searchParams;
  function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch { /* The URL also keeps the selection. */ } }
  function choice(parameter, saved, fallback) {
    const supplied = query.get(parameter);
    return codes.includes(supplied) ? supplied : codes.includes(saved) ? saved : fallback;
  }
  const code = choice("region", read(regionKey), "zh-HK");
  const sceneCode = choice("scene", read(sceneKey(code)), code);
  const region = ArcadeLocale.get(code);
  const english = code === "en-US";
  const city = dest => (english ? englishCities : cityNames)[codes.indexOf(dest)];
  const landmark = dest => (english ? englishPlaces : places)[codes.indexOf(dest)];
  const text = copy[code];
  const alt = english
    ? "An orange cat in sunglasses types at a keyboard in " + city(sceneCode) + ". The view features " + landmark(sceneCode) + "."
    : code === "zh-TW"
      ? "戴墨鏡的橘貓在" + city(sceneCode) + "敲鍵盤，背景是" + landmark(sceneCode) + "。"
      : "戴黑超嘅橘貓喺" + city(sceneCode) + "敲鍵盤，背後係" + landmark(sceneCode) + "。";
  const destination = { ...artwork[sceneCode], code: sceneCode, city: city(sceneCode), alt };

  function choose(next, scenes) {
    const url = new URL(location.href);
    if (scenes) {
      write(sceneKey(code), next);
      url.searchParams.set("region", code);
      url.searchParams.set("scene", next);
    } else {
      write(regionKey, next);
      url.searchParams.set("region", next);
      url.searchParams.delete("scene");
    }
    location.assign(url.href);
  }
  function mount() {
    ArcadeLocale.apply(document, region);
    const el = id => document.getElementById(id);
    const modal = el("destination-dialog");
    const regionButton = el("region-button"), sceneButton = el("scene-button");
    el("region-label").textContent = region.label;
    el("region-short").textContent = code.slice(-2);
    el("scene-label").textContent = destination.city;
    regionButton.setAttribute("aria-label", text[0] + " · " + region.label);
    regionButton.title = text[0];
    sceneButton.setAttribute("aria-label", text[2] + " · " + destination.city);
    sceneButton.title = text[2];
    el("destination-close").setAttribute("aria-label", text[4]);
    function open(scenes) {
      const current = scenes ? sceneCode : code;
      el("destination-title").textContent = text[scenes ? 2 : 0];
      el("destination-note").textContent = text[scenes ? 3 : 1];
      const grid = el("destination-options");
      grid.replaceChildren();
      let selected;
      for (const dest of codes) {
        const profile = ArcadeLocale.get(dest);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "destination-option";
        button.dataset.region = dest;
        const isCurrent = dest === current;
        button.setAttribute("aria-pressed", String(isCurrent));
        const img = document.createElement("img");
        img.src = artwork[dest].poster; img.alt = ""; img.width = 240; img.height = 100;
        const title = document.createElement("strong");
        title.textContent = scenes ? city(dest) : profile.label;
        if (!scenes) title.lang = dest;
        const detail = document.createElement("span");
        detail.className = "destination-detail";
        detail.textContent = scenes ? landmark(dest) : city(dest) + " · " + profile.currency;
        button.append(img, title, detail);
        if (isCurrent) {
          const tick = document.createElement("span");
          tick.className = "destination-tick"; tick.textContent = "✓"; tick.setAttribute("aria-hidden", "true");
          button.append(tick); selected = button;
        }
        button.addEventListener("click", () => {
          modal.close();
          if (!isCurrent) choose(dest, scenes);
        });
        grid.append(button);
      }
      modal.showModal();
      selected.focus({ preventScroll: true });
    }
    regionButton.addEventListener("click", () => open(false));
    sceneButton.addEventListener("click", () => open(true));
  }
  return { region, destination, mount };
})();
const activeRegion = Destinations.region;
const activeDestination = Destinations.destination;
Destinations.mount();
