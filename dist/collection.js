function mountCollection(region, readAccount, readTotal, celebrate) {
  "use strict";
  const $ = id => document.getElementById(id);
  const dialog = $("milestones");
  const goals = region.goals, copy = region.collection;
  const numbers = new Intl.NumberFormat(region.code);
  const tabs = { catalog: $("catalog-tab"), bag: $("bag-tab") };
  const controls = new Map();
  let demo = null, earned = -1, bag, ready = false, readFailed = false;
  let readVersion = 0, pending = null, autoSelectBag = false;

  function set(node, value) {
    if (node.textContent !== value) node.textContent = value;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function art(icon) {
    const holder = element("span", "reward-art");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.pixel = icon;
    holder.append(canvas);
    return holder;
  }
  function buildRows() {
    if (controls.size) return;
    for (const goal of goals) {
      const row = element("li", "reward-row");
      row.dataset.item = goal.id;
      const info = element("div", "reward-info");
      const item = element("span", "reward-item");
      const meta = element("small", "reward-meta");
      meta.id = "reward-meta-" + goal.id;
      info.append(element("strong", "reward-name", goal.name), item, meta);
      const button = element("button", "reward-redeem");
      button.type = "button";
      button.setAttribute("aria-label", copy.redeemItem(goal.item));
      button.setAttribute("aria-describedby", meta.id);
      button.addEventListener("click", () => redeem(goal));
      row.append(art(goal.itemIcon || goal.icon), info, button);
      $("goal-list").append(row);
      Pixels.draw(row.querySelector("canvas"));
      const slot = element("li", "bag-slot");
      slot.dataset.item = goal.id;
      const quantity = element("small", "bag-quantity");
      slot.append(art(goal.itemIcon || goal.icon), element("strong", "bag-name", goal.item), quantity);
      $("bag-items").append(slot);
      Pixels.draw(slot.querySelector("canvas"));
      controls.set(goal.id, { row, item, meta, button, slot, quantity });
    }
  }
  function feedback(message, kind = "") {
    const out = $("reward-feedback");
    out.dataset.kind = kind;
    out.classList.toggle("reward-arrival", kind === "success");
    set(out, message);
  }
  function render() {
    const view = ArcadeRewards.view(earned, bag);
    const unlocked = goals.filter(goal => goal.value <= earned).length;
    set($("dashboard-unlocked"), copy.unlockedCount(unlocked, goals.length));
    set($("collection-shortcut-label"), ready && view.quantity ? copy.shortcut + " · " + numbers.format(view.quantity) : copy.shortcut);
    if (!dialog.open) return;
    set($("collection-unlocked"), numbers.format(unlocked) + " / " + numbers.format(goals.length));
    set($("collection-points"), ready ? numbers.format(view.available) : "—");
    set($("collection-items"), ready ? numbers.format(view.quantity) : "—");
    $("collection-account").hidden = !demo;
    $("bag-empty").hidden = !ready || view.quantity > 0;
    for (const goal of goals) {
      const { row, item, meta, button, slot, quantity } = controls.get(goal.id);
      const unlockedGoal = earned >= goal.value;
      const count = ready ? view.counts[goal.id] || 0 : 0;
      const short = ready && unlockedGoal && view.available < goal.value;
      row.classList.toggle("unlocked", unlockedGoal);
      row.classList.toggle("locked", !unlockedGoal);
      set(item, goal.item + (count ? " · " + copy.owned(count) : ""));
      const price = copy.cost(goal.value);
      const detail = !unlockedGoal ? copy.unlockAt(region.symbol + numbers.format(goal.value)) : short ? copy.need(goal.value - view.available) : "";
      set(meta, price + (detail ? " · " + detail : ""));
      const busy = pending?.goal === goal;
      set(button, !unlockedGoal ? copy.locked : busy ? copy.pending : copy.redeem);
      button.disabled = !unlockedGoal;
      button.setAttribute("aria-disabled", String(!unlockedGoal || !ready || short || Boolean(pending)));
      slot.hidden = !count;
      set(quantity, "×" + numbers.format(count));
    }
  }
  async function reload() {
    const version = ++readVersion;
    try {
      const stored = await ArcadeRewards.load(region.code, demo);
      if (version !== readVersion) return;
      bag = stored; ready = true;
      if (readFailed || $("reward-feedback").dataset.kind === "loading") feedback("");
      readFailed = false;
      if (autoSelectBag && dialog.open) select(ArcadeRewards.view(earned, bag).quantity ? "bag" : "catalog");
    } catch {
      if (version !== readVersion) return;
      ready = false; readFailed = true;
      if (dialog.open) feedback(copy.unavailable, "error");
    }
    render();
  }
  function update(total, activeDemo) {
    const next = ArcadeRewards.wholePoints(total);
    if (demo !== activeDemo) {
      demo = activeDemo; bag = undefined; ready = false; pending = null; readFailed = false;
      autoSelectBag = false;
      if (dialog.open) feedback(copy.loading, "loading");
      earned = next;
      void reload();
    } else if (next === earned) return;
    earned = next;
    render();
  }
  async function redeem(goal) {
    if (pending || !ready || earned < goal.value || ArcadeRewards.view(earned, bag).available < goal.value) return;
    const request = { goal, demo };
    pending = request;
    feedback(""); render();
    try {
      const result = await ArcadeRewards.redeem(region.code, request.demo, goal, () => readTotal(request.demo));
      if (request !== pending) return;
      if (result.status === "profile-changed") {
        feedback(copy.profileChanged, "error");
      } else {
        bag = result.bag;
        if (result.status === "ok") {
          feedback(copy.received(goal.item), "success");
          celebrate();
        } else feedback(result.status === "locked" ? copy.unlockAt(region.symbol + numbers.format(goal.value)) : copy.insufficient, "error");
      }
    } catch {
      if (request !== pending) return;
      feedback(copy.unavailable, "error");
    } finally {
      if (request === pending) {
        pending = null;
        render();
        // Reconcile with any redemption another tab committed immediately after ours.
        void reload();
      }
    }
  }
  function select(tab) {
    autoSelectBag = false;
    for (const [name, button] of Object.entries(tabs)) {
      button.setAttribute("aria-selected", String(name === tab));
      button.tabIndex = name === tab ? 0 : -1;
      $(name + "-panel").hidden = name !== tab;
    }
  }
  function open(tab) {
    if (dialog.open) return;
    const account = readAccount();
    update(account.total, account.demo);
    buildRows();
    const hasItems = ready && ArcadeRewards.view(earned, bag).quantity > 0;
    select(tab === "auto" ? hasItems ? "bag" : "catalog" : tab);
    autoSelectBag = tab === "auto" && !ready;
    feedback(readFailed ? copy.unavailable : ready ? "" : copy.loading, readFailed ? "error" : ready ? "" : "loading");
    dialog.showModal();
    render();
    void reload();
  }
  set($("collection-title"), copy.title);
  set($("collection-account"), copy.demo);
  set($("collection-rule"), copy.rules);
  set($("unlocked-label"), copy.unlocked);
  set($("points-label"), copy.balance);
  set($("items-label"), copy.collected);
  set($("bag-empty"), copy.empty);
  set(tabs.catalog, copy.book);
  set(tabs.bag, copy.bag);
  for (const [name, button] of Object.entries(tabs)) {
    button.addEventListener("click", () => select(name));
    button.addEventListener("keydown", event => {
      const next = { ArrowLeft: name === "catalog" ? "bag" : "catalog", ArrowRight: name === "catalog" ? "bag" : "catalog", Home: "catalog", End: "bag" }[event.key];
      if (!next) return;
      event.preventDefault();
      select(next); tabs[next].focus();
    });
  }
  $("milestones-button").addEventListener("click", () => open("catalog"));
  $("collection-shortcut").addEventListener("click", () => open("auto"));
  dialog.addEventListener("close", () => {
    if (location.hash !== "#collection") return;
    try { history.replaceState(null, "", location.pathname + location.search); }
    catch { /* A standalone file can still close its dialog. */ }
  });
  window.addEventListener("hashchange", () => { if (location.hash === "#collection") open("catalog"); });
  window.addEventListener("pageshow", () => { if (demo !== null) void reload(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && demo !== null) void reload(); });
  ArcadeRewards.subscribe(region.code, changedDemo => { if (demo === changedDemo) void reload(); });
  return { update, open };
}
