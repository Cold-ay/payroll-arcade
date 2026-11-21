const assert = require("node:assert/strict");
const { HOUR, create, valid, validPay, perHour, snapshot, shiftOutlook, leaveEstimate, settleIfDue, changeStatus, changePay } = require("../dist/payroll.js");
const { test } = require("node:test");
const at = 1800000000000;
const pay = { salary: 28800, days: 20, hours: 8, autoStop: true };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, actual + " != " + expected);

test("the demo is identified and replaced by a new personal shift starting at zero", () => {
  const demo = create(at);
  assert.ok(valid(demo) && demo.demo && snapshot(demo, at).earned > 0);
  const personal = changePay(demo, at + 45, pay);
  assert.ok(valid(personal) && !personal.demo);
  assert.deepEqual(snapshot(personal, at + 45), { earned: 0, elapsed: 0, total: 0, due: false });
});
test("wall-clock millisecond increments and a skipped hour use the same rate", () => {
  const state = create(at, pay, false);
  assert.equal(perHour(pay), 180);
  close(snapshot(state, at + 1).earned, .00005);
  close(snapshot(state, at + 1001).earned, .05005);
  close(snapshot(state, at + HOUR).earned, 180);
  close(snapshot(state, at - 100).earned, 0);
});
test("a pause survives serialization and excludes the entire break after resuming", () => {
  const frozen = changeStatus(create(at, pay, false), at + HOUR, "paused");
  const restored = JSON.parse(JSON.stringify(frozen));
  assert.ok(valid(restored));
  close(snapshot(restored, at + 8 * HOUR).earned, 180);
  const run = changeStatus(restored, at + 9 * HOUR, "running");
  const view = snapshot(run, at + 10 * HOUR);
  close(view.earned, 360); assert.equal(view.elapsed, 2 * HOUR);
  assert.equal(changeStatus(run, at + 9.5 * HOUR, "running"), run);
});
test("rate edits apply prospectively both running and paused", () => {
  const state = create(at, pay, false);
  const more = { ...pay, salary: pay.salary * 2 };
  const edited = changePay(state, at + HOUR, more);
  close(snapshot(edited, at + 2 * HOUR).earned, 540);
  const pause = changeStatus(edited, at + 2 * HOUR, "paused");
  const less = changePay(pause, at + 8 * HOUR, pay);
  assert.equal(less.status, "paused"); close(less.earned, 540);
});
test("settlement and starting a new shift are idempotent and preserve lifetime earnings", () => {
  let state = changeStatus(create(at, pay, false), at + 2 * HOUR, "finished");
  assert.equal(changeStatus(state, at + 3 * HOUR, "finished"), state);
  close(snapshot(state, at + 20 * HOUR).total, 360);
  state = changeStatus(state, at + 20 * HOUR, "new");
  assert.equal(changeStatus(state, at + 20 * HOUR, "new"), state);
  assert.equal(state.earned, 0); assert.equal(state.elapsed, 0); close(state.prior, 360);
  close(snapshot(state, at + 21 * HOUR).total, 540);
});
test("an unattended shift caps once at the configured hours, including after reload", () => {
  const state = create(at, pay, false);
  const nextWeek = at + HOUR * 24 * 7;
  assert.ok(snapshot(state, nextWeek).due);
  const capped = settleIfDue(JSON.parse(JSON.stringify(state)), nextWeek);
  assert.equal(capped.status, "finished"); assert.equal(capped.elapsed, 8 * HOUR);
  close(capped.earned, 1440);
  assert.equal(settleIfDue(capped, nextWeek + HOUR), capped);
});
test("opting out permits overtime and a shorter cap preserves the amount already earned", () => {
  const overtime = create(at, { ...pay, autoStop: false }, false);
  close(snapshot(overtime, at + HOUR * 10).earned, 1800);
  const capped = changePay(overtime, at + HOUR * 10, { ...pay, hours: 4 });
  assert.equal(capped.status, "finished");
  assert.equal(capped.elapsed, HOUR * 10);
  close(capped.earned, 1800);
});
test("stored profiles and forms reject malformed or out-of-range settings", () => {
  const state = create(at, pay, false);
  assert.ok(valid(state));
  assert.ok(!valid({ ...state, started: null }));
  assert.ok(!valid({ ...state, earned: -2 }));
  assert.ok(!valid({ ...state, elapsed: NaN }));
  assert.ok(!validPay({ ...pay, salary: Infinity }));
  assert.ok(!validPay({ ...pay, days: 0 }));
  assert.ok(!validPay({ ...pay, hours: 25 }));
  assert.throws(() => changePay(state, at, { ...pay, salary: 0 }), RangeError);
});
test("a paid half day preserves the monthly salary and shows estimated holiday income", () => {
  const plan = { duration: .5, unit: "days", kind: "paid" };
  assert.deepEqual(leaveEstimate(pay,plan), { hours: 4, paid: 100, workPay: 28080, leavePay: 720, change: 0, monthPay: 28800 });
  assert.deepEqual(leaveEstimate(pay,{...plan, unit:"hours", duration:4}), leaveEstimate(pay,plan));
});
test("unpaid and partial leave keep the projected salary and the optional adjustment consistent", () => {
  const plan = { duration: .5, unit:"days", kind:"unpaid" };
  assert.deepEqual(leaveEstimate(pay,plan), { hours:4, paid:0, workPay:28080, leavePay:0, change:720, monthPay:28080 });
  assert.deepEqual(leaveEstimate(pay,{...plan,kind:"partial",percent:80}), { hours:4, paid:80, workPay:28080, leavePay:576, change:144, monthPay:28656 });
  const part = leaveEstimate({...pay, salary:12345.67,hours:7.5,days:21},{...plan,unit:"hours",duration:3.25,kind:"partial",percent:67});
  close(part.monthPay, part.workPay + part.leavePay);
  close(part.monthPay + part.change, 12345.67);
});
test("zero and a full month work and out-of-range inputs receive no estimate", () => {
  const plan = { duration:0,unit:"hours",kind:"unpaid" };
  assert.equal(leaveEstimate(pay,plan).monthPay,28800);
  assert.equal(leaveEstimate(pay,{...plan,duration:160}).monthPay,0);
  for (const duration of [-1,161,NaN,Infinity]) assert.equal(leaveEstimate(pay,{...plan,duration}),null);
  for (const percent of [-1,101,NaN]) assert.equal(leaveEstimate(pay,{...plan,kind:"partial",percent}),null);
  assert.equal(leaveEstimate(pay,{...plan,unit:"week"}),null);
});
test("remaining shift potential uses only remaining hours at the current rate", () => {
  const shift = create(at,pay,false);
  close(shiftOutlook(shift, snapshot(shift,at+2*HOUR)),1080);
  const pause = changeStatus(shift,at+2*HOUR,"paused");
  close(shiftOutlook(pause,snapshot(pause,at+9*HOUR)),1080);
  const edited=changePay(pause,at+9*HOUR,{...pay,salary:pay.salary*2});
  close(shiftOutlook(edited,snapshot(edited,at+9*HOUR)),2160);
  const finish=changeStatus(edited,at+9*HOUR,"finished");
  close(shiftOutlook(finish,snapshot(finish,at+12*HOUR)),0);
  close(shiftOutlook(shift,snapshot(shift,at+15*HOUR)),0);
});
