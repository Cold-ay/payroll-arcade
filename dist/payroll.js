/* Amounts are derived from millisecond timestamps. Animation frames only paint them. */
const Payroll = (() => {
  "use strict";
  const HOUR = 3_600_000;
  const samplePay = { salary: 24000, days: 22, hours: 8, autoStop: true };
  const sampleElapsed = (98 * 60 + 42) * 1000;

  function validPay(pay) {
    return pay && Number.isFinite(pay.salary) && pay.salary >= 0.01 && pay.salary <= 99999999.99 &&
      Number.isInteger(pay.days) && pay.days >= 1 && pay.days <= 31 &&
      Number.isFinite(pay.hours) && pay.hours >= 0.25 && pay.hours <= 24 &&
      typeof pay.autoStop === "boolean";
  }

  function perHour(pay) {
    return pay.salary / (pay.days * pay.hours);
  }

  function shiftOutlook(state, view) {
    const hoursLeft = state.status === "finished" ? 0 : Math.max(0, state.pay.hours - view.elapsed / HOUR);
    return hoursLeft * perHour(state.pay);
  }

  // A hypothetical month is independent of the shift ledger and uses the employee's chosen paid percentage.
  function leaveEstimate(pay, plan) {
    if (!validPay(pay) || !plan || !Number.isFinite(plan.duration) || plan.duration < 0 ||
        !["days", "hours"].includes(plan.unit) || !["paid", "partial", "unpaid"].includes(plan.kind)) return null;
    const paid = plan.kind === "partial" ? plan.percent : plan.kind === "paid" ? 100 : 0;
    if (!Number.isFinite(paid) || paid < 0 || paid > 100) return null;
    const monthHours = pay.days * pay.hours;
    const hours = plan.unit === "days" ? plan.duration * pay.hours : plan.duration;
    if (hours > monthHours + 1e-8) return null;
    const leaveHours = Math.min(monthHours, hours);
    const fraction = leaveHours / monthHours;
    const salaryCents = Math.round(pay.salary * 100);
    const workCents = Math.round(salaryCents * (1 - fraction));
    const totalCents = Math.round(salaryCents * (1 - fraction * (1 - paid / 100)));
    return {
      hours: leaveHours, paid, workPay: workCents / 100, leavePay: (totalCents - workCents) / 100,
      change: (salaryCents - totalCents) / 100, monthPay: totalCents / 100,
    };
  }

  function create(now, pay = samplePay, demo = true) {
    const elapsed = demo ? sampleElapsed : 0;
    return {
      version: 1, demo, pay: { ...pay }, status: "running", prior: 0,
      earned: elapsed * perHour(pay) / HOUR, elapsed, started: now,
    };
  }

  function valid(state) {
    return state && state.version === 1 && typeof state.demo === "boolean" && validPay(state.pay) &&
      ["running", "paused", "finished"].includes(state.status) &&
      [state.prior, state.elapsed, state.earned].every(value => Number.isFinite(value) && value >= 0) &&
      (state.status === "running" ? Number.isFinite(state.started) && state.started >= 0 : state.started === null);
  }

  function snapshot(state, now) {
    const duration = state.status === "running" ? Math.max(0, now - state.started) : 0;
    const left = Math.max(0, Math.round(state.pay.hours * HOUR) - state.elapsed);
    const effective = state.pay.autoStop ? Math.min(duration, left) : duration;
    const earned = state.earned + effective * perHour(state.pay) / HOUR;
    return {
      earned, elapsed: state.elapsed + effective, total: state.prior + earned,
      due: state.status === "running" && state.pay.autoStop && duration >= left,
    };
  }

  function settle(state, now, status) {
    const view = snapshot(state, now);
    return { ...state, earned: view.earned, elapsed: view.elapsed, status, started: status === "running" ? now : null };
  }

  function settleIfDue(state, now) {
    return snapshot(state, now).due ? settle(state, now, "finished") : state;
  }

  function changeStatus(state, now, next) {
    state = settleIfDue(state, now);
    if (next === "paused" && state.status === "running") return settle(state, now, next);
    if (next === "running" && state.status === "paused") return settle(state, now, next);
    if (next === "finished" && state.status !== "finished") return settle(state, now, next);
    if (next === "new" && state.status === "finished") {
      return { ...create(now, state.pay, false), demo: state.demo, prior: state.prior + state.earned };
    }
    return state;
  }

  function changePay(state, now, pay) {
    if (!validPay(pay)) throw new RangeError("Invalid pay settings");
    if (state.demo) return create(now, pay, false);
    state = settleIfDue(state, now);
    const updated = { ...settle(state, now, state.status), pay: { ...pay } };
    return settleIfDue(updated, now);
  }

  return { HOUR, valid, validPay, perHour, shiftOutlook, leaveEstimate, create, snapshot, settleIfDue, changeStatus, changePay };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Payroll;
