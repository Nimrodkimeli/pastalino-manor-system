const nodemailer = require("nodemailer");

function envValue(name) {
  return String(process.env[name] || "").trim();
}

function smtpPassword() {
  return envValue("SMTP_PASS").replace(/\s+/g, "");
}

function hasSmtpConfig() {
  return Boolean(envValue("SMTP_HOST") && envValue("SMTP_PORT") && envValue("SMTP_USER") && smtpPassword());
}

function createTransport() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: envValue("SMTP_HOST"),
    port: Number(envValue("SMTP_PORT")),
    secure: String(envValue("SMTP_SECURE") || "false").toLowerCase() === "true",
    auth: {
      user: envValue("SMTP_USER"),
      pass: smtpPassword(),
    },
  });
}

function getSmtpProviderStatus() {
  return {
    configured: hasSmtpConfig(),
    host: envValue("SMTP_HOST"),
    port: envValue("SMTP_PORT") ? Number(envValue("SMTP_PORT")) : null,
    secure: String(envValue("SMTP_SECURE") || "false").toLowerCase() === "true",
    from: envValue("SMTP_FROM") || envValue("SMTP_USER") || "",
  };
}

async function verifySmtpConnection() {
  const transport = createTransport();
  if (!transport) {
    return { success: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  await transport.verify();

  return {
    success: true,
    provider: "smtp",
    ...getSmtpProviderStatus(),
  };
}

async function sendMailMessage({ to, subject, text }) {
  const transport = createTransport();
  if (!transport) {
    return { success: false, reason: "SMTP_NOT_CONFIGURED", channel: "email", to };
  }

  const from = envValue("SMTP_FROM") || envValue("SMTP_USER");
  const info = await transport.sendMail({
    from,
    to,
    subject,
    text,
  });

  return {
    success: true,
    channel: "email",
    to,
    provider: "smtp",
    providerId: info.messageId || null,
  };
}

async function sendStaffTemporaryPasswordEmail({ to, staffName, temporaryPassword }) {
  const result = await sendMailMessage({
    to,
    subject: "Pastalino Manor account approved - temporary password",
    text: [
      `Hello ${staffName},`,
      "",
      "Your staff account has been approved by admin.",
      `Temporary password: ${temporaryPassword}`,
      "",
      "Please sign in and reset your password immediately.",
    ].join("\n"),
  });

  return { sent: result.success, reason: result.reason || null };
}

module.exports = {
  createTransport,
  getSmtpProviderStatus,
  hasSmtpConfig,
  sendMailMessage,
  sendStaffTemporaryPasswordEmail,
  verifySmtpConnection,
};
