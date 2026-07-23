const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getExpiryReminderStatus,
  listDueComplianceReminders,
  listDueDocumentReminders,
  sendDueExpiryReminders,
} = require("../services/expiryReminders");

const router = express.Router();
router.use(authenticate);

const REMINDER_WINDOW_DAYS = 30;

router.get("/", async (req, res) => {
  const daysAhead = Number(req.query.daysAhead || REMINDER_WINDOW_DAYS);
  const ownerType = String(req.query.ownerType || "").trim();

  const [documentReminders, complianceReminders] = await Promise.all([
    listDueDocumentReminders({ ownerType, daysAhead }),
    listDueComplianceReminders({ daysAhead }),
  ]);

  res.json({
    status: getExpiryReminderStatus(),
    counts: {
      total: documentReminders.length + complianceReminders.length,
      documents: documentReminders.length,
      compliance: complianceReminders.length,
      staffOwnedDocuments: documentReminders.filter((item) => item.ownerType === "staff").length,
      memberOwnedDocuments: documentReminders.filter((item) => item.ownerType === "member").length,
    },
    reminders: {
      documents: documentReminders,
      compliance: complianceReminders,
    },
  });
});

router.post("/send", async (req, res) => {
  const { channels = ["email", "sms"], ownerType, daysAhead = REMINDER_WINDOW_DAYS } = req.body || {};
  const result = await sendDueExpiryReminders({ channels, ownerType, daysAhead });
  res.json(result);
});

module.exports = router;
