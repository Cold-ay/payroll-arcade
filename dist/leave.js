function mountLeavePlanner(getPay, readKey, writeKey, cash, region, key) {
  "use strict";
  const t = source => region.t(source);
  const english = region.code === "en-US";
  const taiwan = region.code === "zh-TW";
  const $ = id => document.getElementById(id);
  const duration = $("leave-duration"), unit = $("leave-unit"), kind = $("leave-kind"), percent = $("leave-percent");
  const presets = Array.from(document.querySelectorAll(".leave-presets button"));
  const decimal = new Intl.NumberFormat(region.code, { maximumFractionDigits: 4 });
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
    const unitName = unit.value === "days" ? t("個工作日") : t("小時");
    duration.max = limit;
    $("percent-field").hidden = !partial;
    const validDuration = Number.isFinite(plan.duration) && plan.duration >= 0 && plan.duration <= limit + 1e-8;
    const validPercent = !partial || Number.isFinite(plan.percent) && plan.percent >= 0 && plan.percent <= 100;
    duration.setAttribute("aria-invalid", String(!validDuration));
    percent.setAttribute("aria-invalid", String(!validPercent));
    const max = decimal.format(limit);
    let warning = "";
    if (!validDuration) {
      warning = english ? `Enter a duration from 0 to ${max} ${unitName.toLowerCase()} for this work schedule.` :
        taiwan ? `依目前的工時設定，請輸入 0 到 ${max} ${unitName}。` : `按而家嘅工時，請輸入 0 至 ${max} ${unitName}。`;
    } else if (!validPercent) warning = t("請輸入 0 至 100 嘅照薪百分比。");
    $("leave-note").textContent = warning;
    for (const button of presets) {
      const matches = unit.value in button.dataset && Number(button.dataset[unit.value]) === plan.duration;
      button.setAttribute("aria-pressed", String(matches));
    }
    $("leave-base").textContent = cash(pay.salary);
    $("leave-work").textContent = result ? cash(result.workPay) : "—";
    $("leave-paid").textContent = result ? cash(result.leavePay) : "—";
    $("leave-change").textContent = result ? cash(result.change) : "—";
    $("leave-month").textContent = result ? cash(result.monthPay) : "—";
    let message = t("輸入假期長度同類別，就會有試算結果。");
    if (result) {
      const days = plan.unit === "days";
      const halfDay = days && plan.duration === .5;
      const number = decimal.format(plan.duration);
      const units = english ? (days ? "day" : "hour") + (plan.duration === 1 ? "" : "s") : (days ? (taiwan ? "天" : "日") : "小時");
      const time = halfDay ? (english ? "Half a day" : t("半日")) : number + (english ? " " : "") + units;
      const kindLabel = t(labels[plan.kind]);
      const period = english ? time + " of " + kindLabel.toLowerCase() : time + kindLabel;
      const percentPaid = decimal.format(result.paid) + "%";
      if (!result.hours) message = t("按原定工作安排計算。");
      else if (result.paid === 100) {
        message = english ? `${period}. Your rest time is fully paid.` : taiwan ? `${period}，休息也照常領薪。` : `${period}，休息時間都照計人工。`;
      } else if (result.paid > 0) {
        message = english ? `${period}. Your estimate includes ${percentPaid} pay for that time.` :
          taiwan ? `${period}，已計入休假期間 ${percentPaid} 的薪水。` : `${period}，已計埋假期 ${percentPaid} 人工。`;
      } else message = english ? `${period}. That time is yours.` :
        taiwan ? `${period}，把這段時間留給自己。` : `${period}，呢段時間留畀自己。`;
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
