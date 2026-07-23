const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { all, get, run } = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const {
  sendMailMessage,
  sendStaffTemporaryPasswordEmail,
  verifySmtpConnection,
} = require("../services/email");
const {
  getNotificationProviderStatus,
  sendSmsNotification,
  verifySmsProvider,
} = require("../services/notifications");

const router = express.Router();

router.use(authenticate);

function createTemporaryPassword() {
  return `Tmp-${crypto.randomBytes(4).toString("hex")}`;
}

async function issueTemporaryPassword({ userId, email, staffName }) {
  const temporaryPassword = createTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await run(
    "UPDATE users SET passwordHash = ?, mustResetPassword = 1 WHERE id = ?",
    [passwordHash, userId]
  );

  let emailResult = { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  try {
    emailResult = await sendStaffTemporaryPasswordEmail({
      to: email.toLowerCase(),
      staffName,
      temporaryPassword,
    });
  } catch (error) {
    emailResult = { sent: false, reason: error.message || "EMAIL_SEND_FAILED" };
  }

  return {
    temporaryPassword,
    emailResult,
  };
}

router.get("/", async (req, res) => {
  const staff = await all(
    `SELECT u.id, u.name, u.email, sp.title, sp.department, sp.phone,
      sp.cprExpiry, sp.firstAidExpiry, sp.caregiverExpiry, sp.bhtExpiry,
      sp.fingerprintExpiry, sp.tbExpiry, sp.licenseExpiry, sp.foodHandlerExpiry
      FROM users u
      JOIN staff_profiles sp ON sp.userId = u.id
      WHERE u.role = 'staff'`
  );
  res.json(staff);
});

router.post(
  "/notification-test",
  authorizeAdmin,
  [
    body("email").optional({ checkFalsy: true }).isEmail(),
    body("phone").optional({ checkFalsy: true }).isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetEmail = String(req.body.email || process.env.TEST_NOTIFICATION_EMAIL || "").trim();
    const targetPhone = String(req.body.phone || process.env.TEST_NOTIFICATION_PHONE || "").trim();
    const timestamp = new Date().toISOString();
    const results = [];

    if (targetEmail) {
      try {
        results.push(
          await sendMailMessage({
            to: targetEmail,
            subject: "Pastalino admin notification test",
            text: `This is a test email notification from Pastalino Manor System.\nTimestamp: ${timestamp}`,
          })
        );
      } catch (error) {
        results.push({ success: false, channel: "email", to: targetEmail, reason: error.message });
      }
    } else {
      results.push({ success: false, channel: "email", skipped: true, reason: "NO_TEST_EMAIL_CONFIGURED" });
    }

    if (targetPhone) {
      try {
        results.push(
          await sendSmsNotification({
            to: targetPhone,
            message: `Pastalino test SMS notification. Timestamp: ${timestamp}`,
          })
        );
      } catch (error) {
        results.push({ success: false, channel: "sms", to: targetPhone, reason: error.message });
      }
    } else {
      results.push({ success: false, channel: "sms", skipped: true, reason: "NO_TEST_PHONE_CONFIGURED" });
    }

    res.json({
      providers: getNotificationProviderStatus(),
      verification: {
        email: await verifySmtpConnection().catch((error) => ({ success: false, reason: error.message })),
        sms: await verifySmsProvider().catch((error) => ({ success: false, reason: error.message })),
      },
      results,
    });
  }
);

router.get("/:id", async (req, res) => {
  const profile = await get(
    `SELECT u.id, u.name, u.email, sp.title, sp.department, sp.phone,
      sp.cprExpiry, sp.firstAidExpiry, sp.caregiverExpiry, sp.bhtExpiry,
      sp.fingerprintExpiry, sp.tbExpiry, sp.licenseExpiry, sp.foodHandlerExpiry, sp.notes
      FROM users u
      JOIN staff_profiles sp ON sp.userId = u.id
      WHERE u.role = 'staff' AND u.id = ?`,
    [req.params.id]
  );

  if (!profile) {
    return res.status(404).json({ message: "Staff profile not found." });
  }
  res.json(profile);
});

router.post(
  "/",
  authorizeAdmin,
  [body("name").notEmpty(), body("email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, title, department, phone } = req.body;
    const existing = await get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const id = `user-${Date.now()}`;
    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await run("INSERT INTO users (id, email, name, role, passwordHash, mustResetPassword, createdAt) VALUES (?, ?, ?, 'staff', ?, 1, ?)", [
      id,
      email.toLowerCase(),
      name,
      passwordHash,
      Date.now(),
    ]);

    await run(
      `INSERT INTO staff_profiles (id, userId, title, department, phone, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [`profile-${id}`, id, title || "", department || "", phone || "", "Created via API."]
    );

    let emailResult = { sent: false, reason: "SMTP_NOT_CONFIGURED" };
    try {
      emailResult = await sendStaffTemporaryPasswordEmail({
        to: email.toLowerCase(),
        staffName: name,
        temporaryPassword,
      });
    } catch (error) {
      emailResult = { sent: false, reason: error.message || "EMAIL_SEND_FAILED" };
    }

    res.status(201).json({
      id,
      name,
      email,
      role: "staff",
      mustResetPassword: true,
      temporaryPasswordEmailSent: emailResult.sent,
      temporaryPassword: emailResult.sent ? undefined : temporaryPassword,
      message: emailResult.sent
        ? "Staff created. Temporary password sent to email."
        : "Staff created. SMTP not configured; temporary password returned for manual delivery.",
    });
  }
);

router.post("/:id/resend-temporary-password", authorizeAdmin, async (req, res) => {
  const user = await get(
    "SELECT id, name, email, role FROM users WHERE id = ? AND role = 'staff'",
    [req.params.id]
  );

  if (!user) {
    return res.status(404).json({ message: "Staff user not found." });
  }

  const { temporaryPassword, emailResult } = await issueTemporaryPassword({
    userId: user.id,
    email: user.email,
    staffName: user.name,
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    temporaryPasswordEmailSent: emailResult.sent,
    temporaryPassword: emailResult.sent ? undefined : temporaryPassword,
    message: emailResult.sent
      ? "Temporary password email resent successfully."
      : "Temporary password reset, but email delivery failed. Share the password manually.",
  });
});

router.put("/:id", async (req, res) => {
  const { title, department, phone, cprExpiry, firstAidExpiry, caregiverExpiry, bhtExpiry, fingerprintExpiry, tbExpiry, licenseExpiry, foodHandlerExpiry, notes } = req.body;
  const profile = await get("SELECT * FROM staff_profiles WHERE userId = ?", [req.params.id]);
  if (!profile) {
    return res.status(404).json({ message: "Staff profile not found." });
  }

  await run(
    `UPDATE staff_profiles SET title = ?, department = ?, phone = ?, cprExpiry = ?, firstAidExpiry = ?, caregiverExpiry = ?, bhtExpiry = ?, fingerprintExpiry = ?, tbExpiry = ?, licenseExpiry = ?, foodHandlerExpiry = ?, notes = ? WHERE userId = ?`,
    [
      title || profile.title,
      department || profile.department,
      phone || profile.phone,
      cprExpiry || profile.cprExpiry,
      firstAidExpiry || profile.firstAidExpiry,
      caregiverExpiry || profile.caregiverExpiry,
      bhtExpiry || profile.bhtExpiry,
      fingerprintExpiry || profile.fingerprintExpiry,
      tbExpiry || profile.tbExpiry,
      licenseExpiry || profile.licenseExpiry,
      foodHandlerExpiry || profile.foodHandlerExpiry,
      notes || profile.notes,
      req.params.id,
    ]
  );

  res.json({ message: "Staff profile updated." });
});

module.exports = router;
