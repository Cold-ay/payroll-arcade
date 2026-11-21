function mountLeavePlanner(getPay, readKey, writeKey, cash) {
  "use strict";
  const key = "payroll-arcade.leave.v1";
  const $ = id => document.getElementById(id);
  const duration = $("leave-duration"), unit = $("leave-unit"), kind = $("leave-kind"), percent = $("leave-percent");
  const presets = Array.from(document.querySelectorAll(".leave-presets button"));
  const decimal = new Intl.NumberFormat("zh-HK", { maximumFractionDigits: 4 });
  const labels = { paid: "全薪假", partial: "部分有薪假", unpaid: "無薪假" };
  let lastUnit = "days";

  function restore() {
    let saved;
    try { saved = JSON.parse(readKey(key)); } catch { /* Start with the half-day example. */ }
    if (Payroll.leaveEstimate(getPay(), saved)) {
      duration.value = saved.duration;
      unit.value = saved.unit; kind.value = saved.kind;
      if (Number.isFinite(saved.percent)) percent.value = saved.percent;
    }
    lastUnit = unit.value;
    refresh(false);
  }
  function refresh(save = false) {
    const pay = getPay();
    const partial = kind.value === "partial";
    const plan = { duration: duration.valueAsNumber, unit: unit.value, kind: kind.value, percent: percent.valueAsNumber };
    const result = Payroll.leaveEstimate(pay, plan);
    const limit = unit.value === "days" ? pay.days : pay.days * pay.hours;
    const unitName = unit.value === "days" ? "個工作日" : "小時";
    duration.max = limit;
    $("percent-field").hidden = !partial;
    const validDuration = Number.isFinite(plan.duration) && plan.duration >= 0 && plan.duration <= limit + 1e-8;
    const validPercent = !partial || Number.isFinite(plan.percent) && plan.percent >= 0 && plan.percent <= 100;
    duration.setAttribute("aria-invalid", String(!validDuration));
    percent.setAttribute("aria-invalid", String(!validPercent));
    $("leave-note").textContent = !validDuration ? "按而家嘅工時，請輸入 0 至 " + decimal.format(limit) + " " + unitName + "。" :
      !validPercent ? "請輸入 0 至 100 嘅照薪百分比。" : "";
    for (const button of presets) {
      const matches = unit.value in button.dataset && Number(button.dataset[unit.value]) === plan.duration;
      button.setAttribute("aria-pressed", String(matches));
    }
    $("leave-base").textContent = cash(pay.salary);
    $("leave-work").textContent = result ? cash(result.workPay) : "—";
    $("leave-paid").textContent = result ? cash(result.leavePay) : "—";
    $("leave-change").textContent = result ? cash(result.change) : "—";
    $("leave-month").textContent = result ? cash(result.monthPay) : "—";
    let message = "輸入假期長度同類別，就會有試算結果。";
    if (result) {
      const time = plan.unit === "days" && plan.duration === .5 ? "半日" : decimal.format(plan.duration) + (plan.unit === "days" ? "日" : "小時");
      const period = time + labels[plan.kind];
      if (!result.hours) message = "按原定工作安排計算。";
      else if (result.paid === 100) message = period + "，休息時間都照計人工。";
      else if (result.paid > 0) message = period + "，已計埋假期 " + decimal.format(result.paid) + "% 人工。";
      else message = period + "，呢段時間留畀自己。";
    }
    $("leave-message").textContent = message;
    if (save && result) writeKey(key, JSON.stringify(plan));
  }
  unit.addEventListener("change", () => {
    if (lastUnit !== unit.value && Number.isFinite(duration.valueAsNumber)) {
      const hours = getPay().hours;
      const converted = unit.value === "hours" ? duration.valueAsNumber * hours : duration.valueAsNumber / hours;
      duration.value = Number(converted.toFixed(8));
    }
    lastUnit = unit.value;
    refresh(true);
  });
  for (const control of [duration, percent]) control.addEventListener("input", () => refresh(true));
  kind.addEventListener("change", () => refresh(true));
  for (const button of presets) button.addEventListener("click", () => {
    lastUnit = "days" in button.dataset ? "days" : "hours";
    unit.value = lastUnit;
    duration.value = button.dataset[lastUnit];
    refresh(true);
  });
  window.addEventListener("storage", event => { if (event.key === key) restore(); });
  restore();
  return () => refresh(false);
}
