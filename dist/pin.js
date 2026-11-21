/* Both native PiP APIs show the same locally drawn cat and payroll clock. */
function mountPinnedCompanion(readShift, motionEnabled) {
  "use strict";
  const button = document.getElementById("popout-button");
  const label = document.getElementById("pin-label");
  const help = document.getElementById("pin-help");
  const retry = document.getElementById("retry-pin-video");
  const money = new Intl.NumberFormat("en-HK", { maximumFractionDigits: 0 });
  const poster = new Image(), atlas = new Image();
  const width = 800, height = 300, artWidth = 272;
  const sans = '"PingFang HK", "PingFang TC", system-ui, sans-serif';
  const mono = 'ui-monospace, Menlo, Consolas, monospace';
  const testVideo = document.createElement("video");
  const docPip = window.documentPictureInPicture;
  const canVideo = typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    (document.pictureInPictureEnabled && typeof testVideo.requestPictureInPicture === "function" ||
      typeof testVideo.webkitSetPresentationMode === "function");
  let floating = null;
  let media = null;
  let opening = false;
  let artRequested = false;

  function loadArt() {
    if (artRequested) return;
    artRequested = true;
    poster.src = "assets/cat-keyboard.jpg";
    atlas.src = "assets/typing-frames.jpg";
  }
  function canvasIn(doc) {
    const canvas = doc.createElement("canvas");
    canvas.width = width; canvas.height = height;
    return canvas;
  }
  function draw(canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const now = Date.now(), shift = readShift(now);
    const moving = motionEnabled() && shift.status === "running";
    const cell = moving ? Math.floor(now / 125) % 32 : 5;
    const useAtlas = atlas.complete && atlas.naturalWidth > 0;
    const art = useAtlas ? atlas : poster;
    ctx.fillStyle = "#151d14";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#4b2672";
    ctx.fillRect(0, 0, artWidth, height);
    if (art.complete && art.naturalWidth) {
      const w = art.naturalWidth / (useAtlas ? 8 : 1);
      const h = art.naturalHeight / (useAtlas ? 4 : 1);
      const crop = h * artWidth / height;
      const x = (useAtlas ? cell % 8 * w : 0) + (w - crop) * .52;
      const y = useAtlas ? Math.floor(cell / 8) * h : 0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(art, x, y, crop, h, 0, 0, artWidth, height);
    }
    ctx.fillStyle = "#a482bf";
    ctx.fillRect(artWidth, 0, 3, height);
    const x = artWidth + 25, room = width - x - 21;
    ctx.fillStyle = "#e1ead8";
    ctx.font = "700 32px " + sans;
    ctx.fillText("今更已賺", x, 57);
    ctx.font = "600 25px " + mono;
    ctx.fillStyle = "#afbea4";
    ctx.fillText("HK$", x + 154, 56);
    const [integer, fraction] = shift.earned.toFixed(6).split(".");
    const major = money.format(Number(integer)) + "." + fraction.slice(0, 2);
    const minor = fraction.slice(2);
    ctx.font = "800 90px " + mono;
    const majorWidth = ctx.measureText(major).width;
    ctx.font = "700 40px " + mono;
    const scale = Math.min(1, room / (majorWidth + ctx.measureText(minor).width + 4));
    ctx.font = "800 " + (90 * scale) + "px " + mono;
    ctx.fillStyle = "#c4fb63";
    ctx.fillText(major, x, 169);
    ctx.font = "700 " + (40 * scale) + "px " + mono;
    ctx.fillStyle = "#a4d06c";
    ctx.fillText(minor, x + majorWidth * scale + 4, 169);
    ctx.fillStyle = "#3d4b37";
    ctx.fillRect(x, 207, room, 2);
    const live = shift.status === "running";
    const status = (shift.demo ? "試玩" : "") + (live ? "計薪中" : shift.status === "finished" ? "已收工" : "已暫停");
    ctx.fillStyle = live ? "#b8eb75" : "#bbc2b3";
    ctx.fillRect(x, 244, 12, 12);
    ctx.font = "650 25px " + sans;
    ctx.fillText(status, x + 23, 260);
    const secs = Math.floor(shift.elapsed / 1000);
    const clock = [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, secs % 60].map(n => String(n).padStart(2, "0")).join(":");
    ctx.font = "650 27px " + mono;
    ctx.fillStyle = "#d2dec8";
    ctx.textAlign = "right";
    ctx.fillText(clock, width - 21, 260);
    ctx.textAlign = "left";
    return status + "，今更已賺港幣 " + shift.earned.toFixed(2);
  }
  function reflect() {
    label.textContent = floating ? "收起置頂窗" : "置頂小窗";
    button.setAttribute("aria-pressed", String(Boolean(floating)));
    button.disabled = opening;
  }
  function explain(message, allowRetry) {
    document.getElementById("pin-help-message").textContent = message;
    retry.hidden = !allowRetry;
    if (!help.open) help.showModal();
  }
  function discardMedia(stage = media) {
    if (!stage || stage !== media) return;
    media = null;
    clearInterval(stage.timer);
    clearTimeout(stage.expiry);
    stage.video.pause();
    stage.stream.getTracks().forEach(track => track.stop());
    stage.video.srcObject = null;
    stage.video.remove();
    if (floating?.stage === stage) floating = null;
    reflect();
  }
  function startFrames(stage) {
    clearInterval(stage.timer);
    const tick = () => {
      draw(stage.canvas);
      if (!opening && floating?.stage !== stage && stage.video.readyState >= 2) clearInterval(stage.timer);
    };
    stage.timer = setInterval(tick, 80);
    tick();
  }
  function prepareMedia() {
    if (media) return media;
    const canvas = canvasIn(document);
    draw(canvas);
    const stream = canvas.captureStream(16);
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.autoplay = true;
    video.className = "pin-stream";
    video.setAttribute("aria-hidden", "true");
    document.body.append(video);
    const stage = { canvas, stream, video, timer: 0, expiry: 0 };
    media = stage;
    video.addEventListener("leavepictureinpicture", () => discardMedia(stage));
    video.addEventListener("webkitpresentationmodechanged", () => {
      if (video.webkitPresentationMode === "inline" && floating?.stage === stage) discardMedia(stage);
    });
    video.srcObject = stream;
    startFrames(stage);
    void video.play().catch(() => {});
    stage.expiry = setTimeout(() => { if (!opening && floating?.stage !== stage) discardMedia(stage); }, 45000);
    return stage;
  }
  function prime() {
    loadArt();
    if (!docPip?.requestWindow && canVideo && !media && !floating) {
      try { prepareMedia(); } catch { discardMedia(); }
    }
  }
  async function openDocument() {
    // Request the OS window directly inside the user's gesture.
    const win = await docPip.requestWindow({ width: 340, height: 136 });
    try {
      const doc = win.document;
      doc.documentElement.lang = "zh-HK"; doc.title = "出糧街機 · 置頂陪工";
      const style = doc.createElement("style");
      style.textContent = "html,body{margin:0;overflow:hidden;background:#151d14;color-scheme:dark}canvas{display:block;position:fixed;inset:0;width:100vw;height:100dvh;object-fit:contain}";
      doc.head.append(style);
      const canvas = canvasIn(doc);
      canvas.setAttribute("role", "img");
      doc.body.replaceChildren(canvas);
      let lastLabel = 0;
      const paint = () => {
        const description = draw(canvas);
        if (Date.now() - lastLabel >= 1000) {
          canvas.setAttribute("aria-label", description);
          lastLabel = Date.now();
        }
      };
      paint();
      // The timer belongs to the visible PiP document even when the main tab is in the background.
      const timer = win.setInterval(paint, 80);
      floating = { win };
      win.addEventListener("pagehide", () => {
        win.clearInterval(timer);
        if (floating?.win === win) floating = null;
        reflect();
      }, { once: true });
    } catch (error) { win.close(); throw error; }
  }
  async function waitForVideo(stage) {
    if (stage.video.readyState >= 2) return;
    await new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timeout); stage.video.removeEventListener("loadeddata", ready); };
      const ready = () => { cleanup(); resolve(); };
      const timeout = setTimeout(() => { cleanup(); reject(Error("Media not ready")); }, 2500);
      stage.video.addEventListener("loadeddata", ready, { once: true });
      if (stage.video.readyState >= 2) ready();
    });
  }
  async function openVideo() {
    const stage = prepareMedia(), video = stage.video;
    startFrames(stage);
    void video.play().catch(() => {});
    if (video.readyState < 2) await waitForVideo(stage);
    if (document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function") {
      await video.requestPictureInPicture();
    } else if (video.webkitSupportsPresentationMode?.("picture-in-picture")) {
      video.webkitSetPresentationMode("picture-in-picture");
      if (video.webkitPresentationMode !== "picture-in-picture") {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (video.webkitPresentationMode !== "picture-in-picture") throw Error("Presentation unavailable");
      }
    } else throw Error("Picture-in-picture unavailable");
    floating = { stage };
    clearTimeout(stage.expiry);
  }
  async function close() {
    if (floating?.win) { floating.win.close(); return; }
    const stage = floating?.stage;
    if (!stage) return;
    try {
      if (document.pictureInPictureElement === stage.video) await document.exitPictureInPicture();
      else if (stage.video.webkitPresentationMode === "picture-in-picture") stage.video.webkitSetPresentationMode("inline");
    } catch {
      // Stopping the capture track also ends the presentation if the OS already dismissed it.
    } finally { discardMedia(stage); }
  }
  async function toggle(videoOnly = false) {
    if (opening) return;
    if (floating) { await close(); return; }
    opening = true; reflect(); loadArt();
    const wantsDoc = !videoOnly && typeof docPip?.requestWindow === "function";
    try {
      if (wantsDoc) await openDocument();
      else if (canVideo) await openVideo();
      else explain("用支援系統畫中畫嘅桌面瀏覽器（例如 Chrome 或 Edge）開啟呢頁，就可以將打字貓拖到螢幕角落。", false);
    } catch {
      if (wantsDoc && canVideo) {
        try { prepareMedia(); } catch { discardMedia(); }
        explain("呢個視窗未能開啟文件畫中畫。可以試用影片畫中畫，同樣會顯示打字貓同實時銀碼。", true);
      } else {
        discardMedia();
        explain("瀏覽器暫時未能開啟系統畫中畫。可以重試，或者用桌面 Chrome 或 Edge 開啟同一個網址。", Boolean(canVideo));
      }
    } finally { opening = false; reflect(); }
  }
  button.addEventListener("click", () => void toggle());
  retry.addEventListener("click", () => { help.close(); void toggle(true); });
  window.addEventListener("pagehide", () => { floating?.win?.close(); discardMedia(); });
  return { prime, close };
}
