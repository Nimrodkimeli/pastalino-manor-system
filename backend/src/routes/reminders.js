const express = require("express");
const { authenticate } = require("../middleware/auth");
const { all } = require("../db");
const { sendEmailNotification, sendSmsNotification } = require("../services/notifications");

const router = express.Router();
router.use(authenticate);

const REMINDER_WINDOW_DAYS = 30;

router.get("/", async (req, res) => {
  const now = Date.now();
  const threshold = now + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const reminders = await all(
    `SELECT d.*, u.email AS staffEmail, u.name AS staffName, m.guardian AS memberGuardian, m.name AS memberName
      FROM documents d
      LEFT JOIN users u ON d.ownerType = 'staff' AND d.ownerId = u.id
      LEFT JOIN members m ON d.ownerType = 'member' AND d.ownerId = m.id
      WHERE d.expiresAt IS NOT NULL AND d.expiresAt BETWEEN ? AND ?
      ORDER BY d.expiresAt ASC`,
    [now, threshold]
  );

  const counts = {
    total: reminders.length,
    staff: reminders.filter((item) => item.ownerType === "staff").length,
    member: reminders.filter((item) => item.ownerType === "member").length,
  };

  res.json({ counts, reminders });
});

router.post("/send", async (req, res) => {
  const { channels = ["email", "sms"], ownerType, daysAhead = REMINDER_WINDOW_DAYS } = req.body || {};
  const now = Date.now();
  const threshold = now + daysAhead * 24 * 60 * 60 * 1000;

  let query = `SELECT d.*, u.email AS staffEmail, u.name AS staffName, m.guardian AS memberGuardian, m.name AS memberName
      FROM documents d
      LEFT JOIN users u ON d.ownerType = 'staff' AND d.ownerId = u.id
      LEFT JOIN members m ON d.ownerType = 'member' AND d.ownerId = m.id
      WHERE d.expiresAt IS NOT NULL AND d.expiresAt BETWEEN ? AND ?`;
  const params = [now, threshold];

  if (ownerType && ["staff", "member"].includes(ownerType)) {
    query += " AND d.ownerType = ?";
    params.push(ownerType);
  }

  const reminders = await all(query, params);
  const results = [];

  for (const reminder of reminders) {
    const expiresAt = new Date(reminder.expiresAt).toLocaleDateString();
    const subject = `Document expiration reminder: ${reminder.title}`;
    const body = `The document '${reminder.title}' for ${reminder.ownerType} ${reminder.ownerType === "staff" ? reminder.staffName : reminder.memberName} expires on ${expiresAt}.`;
    if (channels.includes("email") && reminder.staffEmail) {
      results.push(await sendEmailNotification({ to: reminder.staffEmail, subject, body }));
    }
    if (channels.includes("sms")) {
      const to = reminder.ownerType === "staff" ? reminder.staffEmail : reminder.memberGuardian || "unknown";
      results.push(await sendSmsNotification({ to, message: body }));
    }
  }

  res.json({ total: reminders.length, sent: results.length, results });
});

module.exports = router;
