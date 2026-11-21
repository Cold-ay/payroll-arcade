const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const Payroll = require("../dist/payroll.js");
const locales = require("../dist/locales.js");
const ArcadeRewards = require("../dist/rewards.js");

const read = file => readFileSync(join(__dirname, "../dist", file), "utf8");
const ids = [...read("index.html").matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const scripts = read("destinations.js") + "\n" + read("app.js");
const home = "https://example.test/";

// Just the browser surface needed by the picker, storage and first earnings paint.
class Element extends EventTarget {
  children = [];
  dataset = {};
  attributes = new Map();
  classList = { toggle() {} };
  style = { setProperty() {} };
  get parentElement() { return this; }
  get lastElementChild() { return this; }
  querySelector() { return this; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key); }
  removeAttribute(key) { this.attributes.delete(key); }
  replaceChildren() { this.children = []; }
  append(...children) { this.children.push(...children); }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  click() { this.dispatchEvent(new Event("click")); }
}

function visit(url, storage) {
  const location = new URL(url);
  location.assign = next => { location.href = next; };
  const nodes = Object.fromEntries(ids.map(id => [id, Object.assign(new Element(), { id })]));
  const document = Object.assign(new EventTarget(), {
    body: new Element(),
    createElement: () => new Element(),
    getElementById: id => nodes[id],
    querySelector: () => new Element(),
    querySelectorAll: selector => selector === "[id]" ? Object.values(nodes) : [],
  });
  const context = {
    location, URL, document, window: new EventTarget(), Payroll, ArcadeRewards,
    ArcadeLocale: { get: locales.get, apply() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    matchMedia: () => new EventTarget(), Pixels: { draw() {} },
    requestAnimationFrame() {}, cancelAnimationFrame() {}, clearInterval() {},
    mountPinnedCompanion: () => ({ prime() {} }), mountLeavePlanner: () => () => {},
    mountCollection: () => ({ update() {}, open() {} }),
  };
  const { region, destination } = vm.runInNewContext(scripts + "\nDestinations", context);
  function choose(button, code) {
    nodes[button].click();
    nodes["destination-options"].children.find(option => option.dataset.region === code).click();
    return location.href;
  }
  return { region, destination, nodes, choose };
}

test("regional profiles keep distinct shifts and restore a pre-regions Hong Kong balance", () => {
  const payday = { salary: 28800, days: 20, hours: 8, autoStop: true };
  const legacy = JSON.stringify(Payroll.changeStatus(Payroll.create(0, payday, false), Payroll.HOUR, "paused"));
  const key = "payroll-arcade.shift.v1";
  const storage = new Map([[key, legacy]]);
  let page = visit(home, storage);
  assert.equal(page.nodes["amount-major"].textContent, "180.00");
  for (const code of ["zh-MO", "zh-TW", "en-US"]) {
    page = visit(page.choose("region-button", code), storage);
    assert.equal(page.region.code, code);
    assert.equal(page.destination.code, code);
    const stored = storage.get(key + "." + code);
    assert.ok(stored, `Missing independent shift for ${code}`);
    const shift = JSON.parse(stored);
    assert.equal(shift.demo, true);
    assert.equal(shift.pay.salary, locales.get(code).sampleSalary);
    assert.equal(visit(home, storage).region.code, code);
  }
  page = visit(page.choose("region-button", "zh-HK"), storage);
  assert.equal(storage.get(key), legacy);
  assert.equal(page.nodes["amount-major"].textContent, "180.00");
  assert.match(page.nodes["profile-note"].textContent, /HK\$28,800/);
});

test("a scene change preserves the paycheck, companion hash and unrelated URL parameters", () => {
  const storage = new Map();
  const us = visit(home + "?region=en-US&from=work#companion", storage);
  const usd = storage.get("payroll-arcade.shift.v1.en-US");
  assert.ok(usd);
  const changed = new URL(us.choose("scene-button", "zh-TW"));
  assert.equal(changed.hash, "#companion");
  assert.equal(changed.searchParams.get("from"), "work");
  const taipei = visit(changed.href, storage);
  assert.equal(taipei.region.currency, "USD");
  assert.equal(taipei.destination.code, "zh-TW");
  assert.equal(taipei.nodes["meme-image"].src, taipei.destination.loop);
  assert.equal(storage.get("payroll-arcade.shift.v1.en-US"), usd);
  assert.equal(storage.has("payroll-arcade.shift.v1.zh-TW"), false);
  const macao = visit(taipei.choose("region-button", "zh-MO"), storage);
  assert.equal(macao.destination.code, "zh-MO");
  const back = visit(macao.choose("region-button", "en-US"), storage);
  assert.equal(back.destination.code, "zh-TW");
});

test("valid deep links override saved choices and invalid codes fall back safely", () => {
  const storage = new Map([["payroll-arcade.region.v1", "zh-MO"], ["payroll-arcade.scene.v1.zh-MO", "zh-TW"]]);
  const direct = visit(home + "?region=en-US&scene=zh-HK#companion-window", storage);
  assert.equal(direct.region.code, "en-US");
  assert.equal(direct.destination.code, "zh-HK");
  const invalid = visit(home + "?region=__proto__&scene=unknown", storage);
  assert.equal(invalid.region.code, "zh-MO");
  assert.equal(invalid.destination.code, "zh-TW");
  storage.set("payroll-arcade.region.v1", "unknown");
  storage.set("payroll-arcade.scene.v1.zh-HK", "unknown");
  const fallback = visit(home, storage);
  assert.equal(fallback.region.code, "zh-HK");
  assert.equal(fallback.destination.code, "zh-HK");
});
