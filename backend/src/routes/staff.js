const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { all, get, run } = require("../db");
const crypto = require("crypto");
const { sendStaffTemporaryPasswordEmail } = require("../services/email");

const router = express.Router();

router.use(authenticate);

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
    const temporaryPassword = `Tmp-${crypto.randomBytes(4).toString("hex")}`;
    const passwordHash = await require("bcrypt").hash(temporaryPassword, 10);
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
