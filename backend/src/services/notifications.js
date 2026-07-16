const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "..", "..", "data");
const logFile = path.join(logDirectory, "notification.log");

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
  const entry = `EMAIL to=${to} subject=${subject} body=${body}`;
  console.log(entry);
  await logNotification(entry);
  return { success: true, channel: "email", to };
}

async function sendSmsNotification({ to, message }) {
  const entry = `SMS to=${to} message=${message}`;
  console.log(entry);
  await logNotification(entry);
  return { success: true, channel: "sms", to };
}

module.exports = {
  sendEmailNotification,
  sendSmsNotification,
};
