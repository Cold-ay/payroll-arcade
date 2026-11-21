const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const rewards = require("../dist/rewards.js");
const us = require("../dist/locales.js").get("en-US");
const source = readFileSync(join(__dirname, "../dist/collection.js"), "utf8");
const afterCommit = () => new Promise(setImmediate);

class Node extends EventTarget {
  dataset = {};
  classList = { toggle() {} };
  children = [];
  attrs = {};
  setAttribute(key, value) { this.attrs[key] = value; }
  append(...items) { this.children.push(...items); }
  querySelector() { return {}; }
  showModal() { this.open = true; }
  click() { this.dispatchEvent(new Event("click")); }
}

function setup(store) {
  const nodes = new Map();
  const el = id => {
    if (!nodes.has(id)) nodes.set(id, new Node());
    return nodes.get(id);
  };
  const context = {
    window: new EventTarget(), location: { hash: "" },
    document: Object.assign(new EventTarget(), { getElementById: el, createElement: () => new Node() }),
    Pixels: { draw() {} }, ArcadeRewards: { ...rewards, subscribe() {}, ...store },
  };
  const profile = { total: 5, demo: true };
  let celebrations = 0;
  const mount = vm.runInNewContext(source + "\nmountCollection", context);
  const ui = mount(us, () => profile, demo => demo === profile.demo ? profile.total : null, () => celebrations++);
  ui.update(profile.total, profile.demo);
  return { el, profile, ui, celebrations: () => celebrations };
}

test("a cold bag shortcut restores the right tab, and spending leaves lifetime unlocks and the player's focus intact", async () => {
  const coin = us.goals[0], coffee = us.goals[1];
  let bag = { [coin.id]: { count: 1, spent: 1 } }, redemptions = 0;
  const { ui, el, celebrations, profile } = setup({
    load: async () => bag,
    async redeem(_region, mode, goal, latest) {
      assert.equal(latest(mode), 5);
      redemptions++;
      bag = { ...bag, [goal.id]: { count: 1, spent: goal.value } };
      return { status: "ok", bag };
    },
  });
  el("collection-shortcut").click();
  await afterCommit();
  assert.equal(el("bag-panel").hidden, false);
  assert.equal(el("collection-points").textContent, "4");
  el("catalog-tab").click();
  const row = el("goal-list").children[1];
  const button = row.children[2];
  button.click(); button.click();
  await afterCommit();
  assert.equal(redemptions, 1);
  assert.equal(celebrations(), 1);
  assert.equal(profile.total, 5);
  assert.equal(el("collection-points").textContent, "1");
  assert.equal(el("collection-items").textContent, "2");
  assert.equal(el("collection-unlocked").textContent, "3 / 8");
  assert.equal(el("reward-feedback").textContent, us.collection.received(coffee.item));
  assert.equal(button.attrs["aria-disabled"], "true");
  ui.update(5.9, true); ui.update(6.1, true);
  assert.equal(el("goal-list").children[1], row);
  assert.equal(el("goal-list").children[1].children[2], button);
});

test("a demo read resolving late cannot overwrite the personal bag", async () => {
  let finishDemo;
  const oldRead = new Promise(resolve => { finishDemo = resolve; });
  const { ui, el, profile } = setup({ load: (_region, demo) => demo ? oldRead : Promise.resolve({}) });
  ui.open("catalog");
  profile.total = 0; profile.demo = false;
  ui.update(0, false);
  await afterCommit();
  finishDemo({ [us.goals[0].id]: { count: 12, spent: 12 } });
  await afterCommit();
  assert.equal(el("collection-items").textContent, "0");
  assert.equal(el("collection-points").textContent, "0");
  assert.equal(el("collection-account").hidden, true);
  assert.equal(el("dashboard-unlocked").textContent, us.collection.unlockedCount(0, 8));
});
