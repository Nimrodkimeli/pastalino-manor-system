const { sendDueAppointmentReminders } = require("./appointmentReminders");

let schedulerTimer = null;
let schedulerRunning = false;
let lastRunAt = null;
let lastResult = null;

function isSchedulerEnabled() {
  return String(process.env.APPOINTMENT_REMINDER_SCHEDULER_ENABLED || "true").toLowerCase() !== "false";
}

function getSchedulerIntervalMs() {
  const intervalMinutes = Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MINUTES || 5);
  return Math.max(intervalMinutes, 1) * 60 * 1000;
}

async function runSchedulerCycle() {
  if (schedulerRunning) {
    return lastResult;
  }

  schedulerRunning = true;
  lastRunAt = Date.now();

  try {
    lastResult = await sendDueAppointmentReminders();
    if (lastResult.sent || lastResult.total) {
      console.log(
        `[appointment-reminders] processed due=${lastResult.total} sent=${lastResult.sent}`
      );
    }
    return lastResult;
  } catch (error) {
    console.error("[appointment-reminders] scheduler cycle failed", error);
    lastResult = { error: error.message };
    return lastResult;
  } finally {
    schedulerRunning = false;
  }
}

function startReminderScheduler() {
  if (!isSchedulerEnabled() || schedulerTimer) {
    return;
  }

  schedulerTimer = setInterval(() => {
    runSchedulerCycle();
  }, getSchedulerIntervalMs());

  if (typeof schedulerTimer.unref === "function") {
    schedulerTimer.unref();
  }

  console.log(
    `[appointment-reminders] scheduler started intervalMinutes=${Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MINUTES || 5)}`
  );

  runSchedulerCycle();
}

function stopReminderScheduler() {
  if (!schedulerTimer) {
    return;
  }
  clearInterval(schedulerTimer);
  schedulerTimer = null;
}

function getReminderSchedulerStatus() {
  return {
    enabled: isSchedulerEnabled(),
    intervalMinutes: Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MINUTES || 5),
    running: schedulerRunning,
    started: Boolean(schedulerTimer),
    lastRunAt,
    lastResult,
  };
}

module.exports = {
  getReminderSchedulerStatus,
  runSchedulerCycle,
  startReminderScheduler,
  stopReminderScheduler,
};