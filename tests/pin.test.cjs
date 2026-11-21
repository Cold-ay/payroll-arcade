const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const Payroll = require("../dist/payroll.js");

const source = readFileSync(join(__dirname, "../dist/pin.js"), "utf8");

class UIElement extends EventTarget {
  constructor() {
    super();
    this.attributes = {};
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  showModal() { this.open = true; }
}

function setup(supportsDocumentPiP) {
  const elements = new Map();
  const document = {
    createElement: () => new UIElement(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new UIElement());
      return elements.get(id);
    },
  };
  const window = new EventTarget();
  const child = new EventTarget();
  const canvas = new UIElement();
  const frames = [];
  const context = {
    fillRect() {}, fillText() {}, measureText: text => ({ width: text.length * 10 }),
    drawImage: (_img, sx, sy) => frames.push([sx, sy]),
  };
  canvas.getContext = () => context;
  child.document = {
    documentElement: {}, head: { append() {} }, body: { replaceChildren() {} },
    createElement: type => type === "canvas" ? canvas : new UIElement(),
  };
  let repaint = null;
  child.setInterval = fn => { repaint = fn; return 1; };
  child.clearInterval = () => { repaint = null; };
  child.close = () => child.dispatchEvent(new Event("pagehide"));
  if (supportsDocumentPiP) window.documentPictureInPicture = { requestWindow: async () => child };
  class Art { complete = true; naturalWidth = 1728; naturalHeight = 576; }
  let now = 100000;
  const state = Payroll.create(now, { salary: 16000, days: 20, hours: 8, autoStop: true }, false);
  const mount = vm.runInNewContext(source + "\nmountPinnedCompanion", {
    window, document, Date: { now: () => now }, Image: Art, HTMLCanvasElement: class {},
  });
  const pin = mount(at => ({ ...Payroll.snapshot(state, at), status: state.status, demo: false }), () => true);
  return {
    elements, canvas, frames, pin,
    click: () => document.getElementById("popout-button").dispatchEvent(new Event("click")),
    advance(ms) { now += ms; if (repaint) repaint(); },
    pause() { Object.assign(state, Payroll.changeStatus(state, now, "paused")); },
  };
}

test("the floating window paints elapsed pay and typing frames independently of opener timers", async () => {
  const ui = setup(true);
  ui.pin.prime();
  ui.click();
  await new Promise(setImmediate);
  const button = ui.elements.get("popout-button");
  assert.equal(button.attributes["aria-pressed"], "true");
  assert.match(ui.canvas.attributes["aria-label"], /今更已賺港幣 0\.00$/);
  const firstFrame = ui.frames.at(-1);
  ui.advance(3600125);
  assert.match(ui.canvas.attributes["aria-label"], /計薪中，今更已賺港幣 100\.00$/);
  assert.notDeepEqual(ui.frames.at(-1), firstFrame);
  ui.pause();
  ui.advance(2000);
  const pausedFrame = ui.frames.at(-1);
  ui.advance(2200);
  assert.deepEqual(ui.frames.at(-1), pausedFrame);
  assert.match(ui.canvas.attributes["aria-label"], /已暫停，今更已賺港幣 100\.00$/);
  await ui.pin.close();
  assert.equal(button.attributes["aria-pressed"], "false");
  const count = ui.frames.length;
  ui.advance(3600000);
  assert.equal(ui.frames.length, count);
});

test("a browser without a native PiP API offers a choice and leaves the shift running", () => {
  const ui = setup(false);
  ui.click();
  assert.equal(ui.elements.get("pin-help").open, true);
  assert.equal(ui.elements.get("retry-pin-video").hidden, true);
  assert.equal(ui.elements.get("popout-button").attributes["aria-pressed"], "false");
});
