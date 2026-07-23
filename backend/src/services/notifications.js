const fs = require("fs");
const path = require("path");
const twilio = require("twilio");
const { getSmtpProviderStatus, sendMailMessage } = require("./email");
const {
  canSendSmsTo,
  normalizePhoneNumber,
  shouldRequireOptIn,
} = require("./smsConsent");

const logDirectory = path.join(__dirname, "..", "..", "data");
const logFile = path.join(logDirectory, "notification.log");

function hasTwilioConfig() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

function createTwilioClient() {
  if (!hasTwilioConfig()) {
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function ensureLogDirectory() {
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
}

function formatEntry(entry) {
  return `[${new Date().toISOString()}] ${entry}\n`;
}

async function logNotification(entry) {
  ensureLogDirectory();
  await fs.promises.appendFile(logFile, formatEntry(entry), "utf8");
}

async function sendEmailNotification({ to, subject, body }) {
  const result = await sendMailMessage({ to, subject, text: body });
  const entry = result.success
    ? `EMAIL provider=smtp to=${to} subject=${subject}`
    : `EMAIL fallback to=${to} subject=${subject} reason=${result.reason} body=${body}`;
  console.log(entry);
  await logNotification(entry);
  return result;
}

async function sendSmsNotification({ to, message, ignoreConsent = false }) {
  const client = createTwilioClient();
  if (!client) {
    const entry = `SMS fallback to=${to} reason=TWILIO_NOT_CONFIGURED message=${message}`;
    console.log(entry);
    await logNotification(entry);
    return { success: false, channel: "sms", to, reason: "TWILIO_NOT_CONFIGURED" };
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!ignoreConsent) {
    const consentCheck = await canSendSmsTo(normalizedTo);
    if (!consentCheck.allowed) {
      const entry = `SMS blocked to=${normalizedTo} reason=${consentCheck.reason}`;
      console.log(entry);
      await logNotification(entry);
      return {
        success: false,
        channel: "sms",
        to: normalizedTo,
        reason: consentCheck.reason,
      };
    }
  }

  const response = await client.messages.create({
    to: normalizedTo,
    from: normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER),
    body: message,
  });

  const entry = `SMS provider=twilio to=${normalizedTo} sid=${response.sid}`;
  console.log(entry);
  await logNotification(entry);
  return {
    success: true,
    channel: "sms",
    to: normalizedTo,
    provider: "twilio",
    providerId: response.sid,
  };
}

function getNotificationProviderStatus() {
  const smtpStatus = getSmtpProviderStatus();
  const twilioConfigured = hasTwilioConfig();

  return {
    email: {
      ...smtpStatus,
      mode: smtpStatus.configured ? "smtp" : "log-fallback",
      summary: smtpStatus.configured
        ? `SMTP via ${process.env.SMTP_HOST || "unknown host"}:${process.env.SMTP_PORT || "unknown port"}`
        : "Writes email reminders to notification.log",
    },
    sms: {
      configured: twilioConfigured,
      from: normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER),
      mode: twilioConfigured ? "twilio" : "log-fallback",
      requiresOptIn: shouldRequireOptIn(),
      summary: twilioConfigured
        ? `Twilio SMS from ${normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER)}`
        : "Writes SMS reminders to notification.log",
    },
    logFile,
  };
}

async function verifySmsProvider() {
  const client = createTwilioClient();
  if (!client) {
    return { success: false, reason: "TWILIO_NOT_CONFIGURED" };
  }

  const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

  return {
    success: true,
    provider: "twilio",
    accountSid: account.sid,
    friendlyName: account.friendlyName || "",
    status: account.status || "",
    from: normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER),
  };
}

module.exports = {
  getNotificationProviderStatus,
  sendEmailNotification,
  sendSmsNotification,
  verifySmsProvider,
};
