const nodemailer = require("nodemailer");

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getSmtpProviderStatus() {
  return {
    configured: hasSmtpConfig(),
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
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

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
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
