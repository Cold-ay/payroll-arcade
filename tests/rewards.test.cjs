const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { create, changePay, changeStatus, snapshot, HOUR } = require("../dist/payroll.js");
const { wholePoints, view } = require("../dist/rewards.js");
const source = readFileSync(path.join(__dirname, "../dist/rewards.js"), "utf8");
const tea = { id: "milk-tea", value: 20 };

// Node has no IndexedDB. This fixture schedules requests in transaction order, stages
// writes until commit, and lets two independent copies of the app share one database.
function database() {
  const rows = new Map();
  let queue = Promise.resolve();
  const fixture = { rows, failNextWrite: false };
  function transaction(_storeName, mode) {
    let read, key, pending, aborted = false;
    const tx = {
      objectStore: () => ({
        get(index) { key = JSON.stringify(index); read = {}; return read; },
        put(row, index) {
          assert.equal(mode, "readwrite");
          assert.equal(JSON.stringify(index), key);
          pending = structuredClone(row);
        },
      }),
      abort() { aborted = true; },
    };
    queue = queue.then(() => {
      read.result = structuredClone(rows.get(key));
      read.onsuccess();
      if (pending && fixture.failNextWrite) {
        fixture.failNextWrite = false;
        tx.error = new Error("Simulated quota failure");
        aborted = true;
      }
      if (aborted) return tx.onabort();
      if (pending) rows.set(key, pending);
      tx.oncomplete();
    });
    return tx;
  }
  fixture.open = () => {
    const req = { result: { transaction, close() {} } };
    queueMicrotask(() => req.onsuccess());
    return req;
  };
  return fixture;
}
function tab(idb) {
  const context = vm.createContext({ module: { exports: {} }, indexedDB: idb });
  vm.runInContext(source, context);
  return context.module.exports;
}

test("whole-unit points recognize calculation noise and never round ordinary fractions up", () => {
  assert.equal(wholePoints(19.9999), 19);
  assert.equal(wholePoints(20 - 20 * Number.EPSILON), 20);
  assert.equal(wholePoints(Infinity), 0);
  assert.equal(wholePoints(-12.4), 0);
  assert.equal(wholePoints(Number.MAX_VALUE), Number.MAX_SAFE_INTEGER);
});

test("two tabs can only redeem one item using the same last twenty points", async () => {
  const shared = database(), first = tab(shared), second = tab(shared);
  const outcomes = await Promise.all([
    first.redeem("zh-HK", false, tea, () => 20),
    second.redeem("zh-HK", false, tea, () => 20),
  ]);
  assert.deepEqual(outcomes.map(x => x.status).sort(), ["insufficient", "ok"]);
  const wallet = view(20, await tab(shared).load("zh-HK", false));
  assert.equal(wallet.earned, 20); // The achievement stays unlocked.
  assert.equal(wallet.available, 0);
  assert.equal(wallet.quantity, 1);
  assert.equal(wallet.counts["milk-tea"], 1);
});

test("repeated copies retain their original prices and survive payroll edits and new shifts", async () => {
  const shop = tab(database());
  const pay = { salary: 16000, days: 20, hours: 8, autoStop: true };
  let state = create(0, pay, false), now = HOUR;
  const earned = () => snapshot(state, now).total;
  assert.equal((await shop.redeem("zh-HK", false, tea, earned)).status, "ok");
  assert.equal((await shop.redeem("zh-HK", false, { ...tea, name: "New name", value: 30 }, earned)).status, "ok");
  state = changePay(state, now, { ...pay, salary: 32000 });
  state = changeStatus(state, now, "finished");
  state = changeStatus(state, now, "new");
  now += HOUR;
  const bag = await shop.load("zh-HK", false), wallet = view(earned(), bag);
  assert.equal(earned(), 300);
  assert.equal(wallet.spent, 50);
  assert.equal(wallet.available, 250);
  assert.equal(wallet.counts["milk-tea"], 2);
});

test("regions and demo wallets are independent, and purchases recheck the current pay profile", async () => {
  const shop = tab(database());
  await shop.redeem("zh-TW", true, tea, () => 50);
  assert.equal(view(50, await shop.load("zh-TW", true)).quantity, 1);
  assert.equal(view(50, await shop.load("zh-TW", false)).quantity, 0);
  assert.equal(view(50, await shop.load("en-US", true)).quantity, 0);
  assert.equal((await shop.redeem("zh-TW", true, tea, () => null)).status, "profile-changed");
  assert.equal((await shop.redeem("zh-TW", false, tea, () => 19.99)).status, "locked");
  assert.equal(view(50, await shop.load("zh-TW", true)).quantity, 1);
});

test("storage failures and malformed bags never create free inventory or announce a purchase", async () => {
  const shared = database(), shop = tab(shared);
  const signals = [];
  const unsubscribe = shop.subscribe("zh-HK", demo => signals.push(demo));
  shared.failNextWrite = true;
  await assert.rejects(shop.redeem("zh-HK", false, tea, () => 50), /quota/);
  assert.equal(view(50, await shop.load("zh-HK", false)).quantity, 0);
  assert.deepEqual(signals, []);
  await shop.redeem("zh-HK", false, tea, () => 50);
  assert.deepEqual(signals, [false]);
  unsubscribe();
  const key = JSON.stringify(["zh-HK", "personal"]);
  const invalid = { "milk-tea": { count: 3, spent: -1 } };
  shared.rows.set(key, invalid);
  await assert.rejects(shop.load("zh-HK", false), /Invalid/);
  await assert.rejects(shop.redeem("zh-HK", false, tea, () => 50), /Invalid/);
  assert.deepEqual(shared.rows.get(key), invalid);
  await assert.rejects(tab(undefined).redeem("zh-HK", false, tea, () => 50), /unavailable/);
});
