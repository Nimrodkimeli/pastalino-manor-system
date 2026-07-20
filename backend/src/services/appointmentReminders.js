const { all, get, run } = require("../db");
const { getNotificationProviderStatus, sendEmailNotification, sendSmsNotification } = require("./notifications");

function normalizeChannels(value) {
  if (Array.isArray(value)) {
    return value.filter((channel) => ["email", "sms"].includes(channel));
  }
  return [];
}

function formatAppointment(appointment) {
  return {
    ...appointment,
    reminderChannels: appointment.reminderChannels ? JSON.parse(appointment.reminderChannels) : [],
  };
}

function appointmentMessage(appointment) {
  const appointmentDateText = new Date(appointment.appointmentDate).toLocaleString();
  const subject = `Appointment reminder: ${appointment.title}`;
  const body = `${appointment.memberName || "Member"} has ${appointment.title} scheduled for ${appointmentDateText}${appointment.location ? ` at ${appointment.location}` : ""}.`;
  return { subject, body };
}

async function listAppointments({ includeCancelled = false } = {}) {
  const whereClause = includeCancelled ? "" : "WHERE a.status != 'cancelled'";
  const appointments = await all(
    `SELECT a.*, m.name AS memberName
      FROM appointments a
      LEFT JOIN members m ON m.id = a.memberId
      ${whereClause}
      ORDER BY datetime(a.appointmentDate) ASC`
  );

  return appointments.map(formatAppointment);
}

async function getAppointmentById(id) {
  const appointment = await get(
    `SELECT a.*, m.name AS memberName
      FROM appointments a
      LEFT JOIN members m ON m.id = a.memberId
      WHERE a.id = ?`,
    [id]
  );

  return appointment ? formatAppointment(appointment) : null;
}

function isReminderDue(appointment, now = Date.now()) {
  const appointmentTime = new Date(appointment.appointmentDate).getTime();
  if (Number.isNaN(appointmentTime) || appointment.status === "cancelled" || appointment.lastReminderSentAt) {
    return false;
  }

  const leadHours = Number(appointment.reminderLeadHours || 24);
  const reminderDueAt = appointmentTime - leadHours * 60 * 60 * 1000;
  return reminderDueAt <= now;
}

async function listDueAppointmentReminders() {
  const nowIso = new Date().toISOString();
  const appointments = await all(
    `SELECT a.*, m.name AS memberName
      FROM appointments a
      LEFT JOIN members m ON m.id = a.memberId
      WHERE a.status != 'cancelled' AND datetime(a.appointmentDate) >= datetime(?)
      ORDER BY datetime(a.appointmentDate) ASC`,
    [nowIso]
  );

  return appointments.map(formatAppointment).filter((appointment) => isReminderDue(appointment));
}

async function sendReminderForAppointment(appointment) {
  const { subject, body } = appointmentMessage(appointment);
  const results = [];
  let sent = false;

  if (appointment.reminderChannels.includes("email") && appointment.contactEmail) {
    const emailResult = await sendEmailNotification({
      to: appointment.contactEmail,
      subject,
      body,
    });
    results.push(emailResult);
    sent = sent || emailResult.success;
  }

  if (appointment.reminderChannels.includes("sms") && appointment.contactPhone) {
    const smsResult = await sendSmsNotification({
      to: appointment.contactPhone,
      message: body,
    });
    results.push(smsResult);
    sent = sent || smsResult.success;
  }

  if (sent) {
    await run("UPDATE appointments SET lastReminderSentAt = ?, updatedAt = ? WHERE id = ?", [Date.now(), Date.now(), appointment.id]);
  }

  return {
    appointmentId: appointment.id,
    sent,
    results,
  };
}

async function sendDueAppointmentReminders() {
  const dueAppointments = await listDueAppointmentReminders();
  const results = [];

  for (const appointment of dueAppointments) {
    results.push(await sendReminderForAppointment(appointment));
  }

  return {
    total: dueAppointments.length,
    sent: results.filter((result) => result.sent).length,
    results,
  };
}

function getAppointmentReminderStatus() {
  return {
    providers: getNotificationProviderStatus(),
    schedulerEnabled: String(process.env.APPOINTMENT_REMINDER_SCHEDULER_ENABLED || "true").toLowerCase() !== "false",
    schedulerIntervalMinutes: Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MINUTES || 5),
  };
}

module.exports = {
  formatAppointment,
  getAppointmentById,
  getAppointmentReminderStatus,
  isReminderDue,
  listAppointments,
  listDueAppointmentReminders,
  normalizeChannels,
  sendDueAppointmentReminders,
};