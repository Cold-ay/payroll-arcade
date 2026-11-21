/* Game points use the lifetime earnings counter. Only the virtual inventory is writable here. */
const ArcadeRewards = (() => {
  "use strict";
  const dbName = "payroll-arcade.rewards";
  const storeName = "bags";
  const changeKey = "payroll-arcade.rewards.changed";
  const listeners = new Set();
  let listening = false, channel = null;

  function wholePoints(total) {
    if (!Number.isFinite(total) || total <= 0) return 0;
    // Tolerate floating point noise where a completed hour or shift lands on a whole unit.
    const tolerance = Math.min(1e-7, Math.max(1, total) * Number.EPSILON * 4);
    return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(total + tolerance));
  }

  const validId = id => typeof id === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(id);
  function itemId(goal) {
    if (!goal || !Number.isSafeInteger(goal.value) || goal.value < 1) throw new Error("Invalid item cost");
    const id = goal.id ?? "tier-" + goal.value;
    if (!validId(id)) throw new Error("Invalid item ID");
    return id;
  }

  function view(total, bag = {}) {
    if (Object.prototype.toString.call(bag) !== "[object Object]") throw new Error("Invalid reward inventory");
    let spent = 0, quantity = 0;
    const counts = Object.create(null);
    for (const [id, line] of Object.entries(bag)) {
      if (!validId(id) || !line || !Number.isSafeInteger(line.count) || line.count < 1 ||
          !Number.isSafeInteger(line.spent) || line.spent < line.count) throw new Error("Invalid inventory item");
      counts[id] = line.count;
      spent += line.spent;
      quantity += line.count;
    }
    if (!Number.isSafeInteger(spent)) throw new Error("Inventory total out of range");
    const earned = wholePoints(total);
    return { earned, spent, available: Math.max(0, earned - spent), quantity, counts };
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") throw new Error("Inventory storage unavailable");
      const request = indexedDB.open(dbName, 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore(storeName);
      request.onblocked = () => { blocked = true; reject(new Error("Inventory storage busy")); };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else resolve(request.result);
      };
    });
  }

  async function access(regionCode, demo, update) {
    if (typeof regionCode !== "string" || !/^[a-z]{2}-[A-Z]{2}$/.test(regionCode) || typeof demo !== "boolean") {
      throw new Error("Invalid reward profile");
    }
    const key = [regionCode, demo ? "demo" : "personal"];
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, update ? "readwrite" : "readonly");
        const store = tx.objectStore(storeName);
        let result, failure;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure || tx.error || new Error("Inventory transaction aborted"));
        const request = store.get(key);
        request.onsuccess = () => {
          try {
            const bag = request.result === undefined ? {} : request.result;
            if (update) {
              // No awaits between get and put: another tab cannot take the same points.
              result = update(bag);
              if (result.status === "ok") store.put(result.bag, key);
            } else {
              view(0, bag);
              result = bag;
            }
          } catch (error) {
            failure = error;
            tx.abort();
          }
        };
      });
    } finally { db.close(); }
  }

  const load = (regionCode, demo) => access(regionCode, demo);

  async function redeem(regionCode, demo, goal, readTotal) {
    const id = itemId(goal);
    const cost = goal.value;
    const result = await access(regionCode, demo, bag => {
      const total = readTotal();
      if (!Number.isFinite(total) || total < 0) return { status: "profile-changed", bag };
      const wallet = view(total, bag);
      if (wallet.earned < cost) return { status: "locked", bag };
      if (wallet.available < cost) return { status: "insufficient", bag };
      const prior = Object.hasOwn(bag, id) ? bag[id] : { count: 0, spent: 0 };
      const line = { count: prior.count + 1, spent: prior.spent + cost };
      return { status: "ok", bag: { ...bag, [id]: line } };
    });
    if (result.status === "ok") publish({ regionCode, demo });
    return result;
  }

  function notify(change) {
    if (!change || typeof change.demo !== "boolean") return;
    for (const { regionCode, callback } of listeners) {
      if (regionCode === change.regionCode) {
        try { callback(change.demo); } catch (error) { console.error(error); }
      }
    }
  }
  function startListening() {
    if (listening || typeof window === "undefined") return;
    listening = true;
    try {
      channel = new window.BroadcastChannel(changeKey);
      channel.onmessage = event => notify(event.data);
    } catch { /* Storage events can also carry an invalidation signal. */ }
    window.addEventListener("storage", event => {
      if (event.key !== changeKey || !event.newValue) return;
      try { notify(JSON.parse(event.newValue)); } catch { /* Ignore unrelated or old messages. */ }
    });
  }
  function publish(change) {
    notify(change);
    if (typeof window === "undefined") return;
    startListening();
    try {
      if (channel) { channel.postMessage(change); return; }
      window.localStorage.setItem(changeKey, JSON.stringify({ ...change, nonce: Math.random() }));
    } catch { /* The committed inventory remains readable when the shop next opens. */ }
  }
  function subscribe(regionCode, callback) {
    startListening();
    const listener = { regionCode, callback };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { wholePoints, itemId, view, load, redeem, subscribe };
})();
if (typeof module !== "undefined" && module.exports) module.exports = ArcadeRewards;
