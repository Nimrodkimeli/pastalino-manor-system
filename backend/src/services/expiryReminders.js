const { all, run } = require("../db");
const {
  getNotificationProviderStatus,
  sendEmailNotification,
  sendSmsNotification,
} = require("./notifications");

const DEFAULT_WINDOW_DAYS = 30;

function parseChannels(value) {
  if (Array.isArray(value)) {
    return value.filter((channel) => ["email", "sms"].includes(String(channel || "").toLowerCase()));
  }

  return String(value || "email,sms")
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter((channel) => ["email", "sms"].includes(channel));
}

function isExpiryReminderEnabled() {
  return String(process.env.EXPIRY_REMINDER_SCHEDULER_ENABLED || "true").toLowerCase() !== "false";
}

function getReminderWindowDays(value) {
  const parsed = Number(value || process.env.EXPIRY_REMINDER_WINDOW_DAYS || DEFAULT_WINDOW_DAYS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WINDOW_DAYS;
}

async function listDueDocumentReminders({ ownerType, daysAhead } = {}) {
  const now = Date.now();
  const threshold = now + getReminderWindowDays(daysAhead) * 24 * 60 * 60 * 1000;

  const params = [now, threshold];
  let ownerTypeClause = "";
  if (ownerType && ["staff", "member"].includes(ownerType)) {
    ownerTypeClause = " AND d.ownerType = ?";
    params.push(ownerType);
  }

  return all(
    `SELECT
      d.*, 
      u.email AS staffEmail,
      u.name AS staffName,
      sp.phone AS staffPhone,
      m.name AS memberName,
      m.guardian AS memberGuardian
    FROM documents d
    LEFT JOIN users u ON d.ownerType = 'staff' AND d.ownerId = u.id
    LEFT JOIN staff_profiles sp ON d.ownerType = 'staff' AND sp.userId = u.id
    LEFT JOIN members m ON d.ownerType = 'member' AND d.ownerId = m.id
    WHERE d.expiresAt IS NOT NULL
      AND d.expiresAt BETWEEN ? AND ?
      AND d.status = 'current'
      AND (d.lastReminderSentAt IS NULL OR d.lastReminderSentAt = 0)
      ${ownerTypeClause}
    ORDER BY d.expiresAt ASC`,
    params
  );
}

async function listDueComplianceReminders({ daysAhead } = {}) {
  const now = Date.now();
  const threshold = now + getReminderWindowDays(daysAhead) * 24 * 60 * 60 * 1000;

  return all(
    `SELECT
      sci.*,
      u.name AS staffName,
      u.email AS staffEmail,
      sp.phone AS staffPhone
    FROM staff_compliance_items sci
    JOIN users u ON u.id = sci.staffId
    LEFT JOIN staff_profiles sp ON sp.userId = sci.staffId
    WHERE sci.expiryDate IS NOT NULL
      AND sci.expiryDate BETWEEN ? AND ?
      AND sci.reminderEnabled = 1
      AND sci.status = 'current'
      AND (sci.lastReminderSentAt IS NULL OR sci.lastReminderSentAt = 0)
    ORDER BY sci.expiryDate ASC`,
    [now, threshold]
  );
}

function buildDocumentReminderMessage(reminder) {
  const expiresAt = new Date(reminder.expiresAt).toLocaleDateString();
  const ownerLabel = reminder.ownerType === "staff"
    ? reminder.staffName || "staff member"
    : reminder.memberName || "member";

  return {
    subject: `Document expiration reminder: ${reminder.title}`,
    body: `The document '${reminder.title}' for ${ownerLabel} expires on ${expiresAt}.`,
  };
}

function buildComplianceReminderMessage(reminder) {
  const expiresAt = new Date(reminder.expiryDate).toLocaleDateString();
  return {
    subject: `Compliance expiration reminder: ${reminder.name}`,
    body: `${reminder.name} for ${reminder.staffName || "staff member"} expires on ${expiresAt}.`,
  };
}

async function sendDocumentReminder(reminder, channels) {
  const { subject, body } = buildDocumentReminderMessage(reminder);
  const results = [];
  let sent = false;

  if (channels.includes("email") && reminder.staffEmail) {
    const emailResult = await sendEmailNotification({
      to: reminder.staffEmail,
      subject,
      body,
    });
    results.push(emailResult);
    sent = sent || emailResult.success;
  }

  if (channels.includes("sms") && reminder.staffPhone) {
    const smsResult = await sendSmsNotification({
      to: reminder.staffPhone,
      message: body,
    });
    results.push(smsResult);
    sent = sent || smsResult.success;
  }

  if (sent) {
    await run("UPDATE documents SET lastReminderSentAt = ? WHERE id = ?", [Date.now(), reminder.id]);
  }

  return {
    type: "document",
    id: reminder.id,
    sent,
    results,
  };
}

async function sendComplianceReminder(reminder, channels) {
  const { subject, body } = buildComplianceReminderMessage(reminder);
  const results = [];
  let sent = false;

  if (channels.includes("email") && reminder.staffEmail) {
    const emailResult = await sendEmailNotification({
      to: reminder.staffEmail,
      subject,
      body,
    });
    results.push(emailResult);
    sent = sent || emailResult.success;
  }

  if (channels.includes("sms") && reminder.staffPhone) {
    const smsResult = await sendSmsNotification({
      to: reminder.staffPhone,
      message: body,
    });
    results.push(smsResult);
    sent = sent || smsResult.success;
  }

  if (sent) {
    await run("UPDATE staff_compliance_items SET lastReminderSentAt = ?, updatedAt = ? WHERE id = ?", [Date.now(), Date.now(), reminder.id]);
  }

  return {
    type: "compliance",
    id: reminder.id,
    sent,
    results,
  };
}

async function sendDueExpiryReminders({ channels, ownerType, daysAhead } = {}) {
  const resolvedChannels = parseChannels(channels || process.env.EXPIRY_REMINDER_CHANNELS || "email,sms");
  const documents = await listDueDocumentReminders({ ownerType, daysAhead });
  const compliance = await listDueComplianceReminders({ daysAhead });
  const results = [];

  for (const reminder of documents) {
    results.push(await sendDocumentReminder(reminder, resolvedChannels));
  }

  for (const reminder of compliance) {
    results.push(await sendComplianceReminder(reminder, resolvedChannels));
  }

  return {
    channels: resolvedChannels,
    totalDocuments: documents.length,
    totalCompliance: compliance.length,
    total: documents.length + compliance.length,
    sent: results.filter((result) => result.sent).length,
    results,
  };
}

function getExpiryReminderStatus() {
  return {
    enabled: isExpiryReminderEnabled(),
    windowDays: getReminderWindowDays(),
    channels: parseChannels(process.env.EXPIRY_REMINDER_CHANNELS || "email,sms"),
    providers: getNotificationProviderStatus(),
  };
}

module.exports = {
  getExpiryReminderStatus,
  isExpiryReminderEnabled,
  listDueComplianceReminders,
  listDueDocumentReminders,
  sendDueExpiryReminders,
};
