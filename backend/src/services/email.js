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

async function sendStaffTemporaryPasswordEmail({ to, staffName, temporaryPassword }) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
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

  return { sent: true };
}

module.exports = {
  sendStaffTemporaryPasswordEmail,
};
