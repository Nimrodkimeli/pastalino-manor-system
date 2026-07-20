const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { get, run, all } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "pastalino-secret";

// Debug endpoint - list all users
router.get("/debug/users", async (req, res) => {
  try {
    const users = await all("SELECT id, email, name, role FROM users");
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);
    
    const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    console.log(`User found: ${user ? user.email : "none"}`);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password valid: ${validPassword}`);
    
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, mustResetPassword: Boolean(user.mustResetPassword) } });
  }
);

router.post(
  "/change-temporary-password",
  [body("currentPassword").isLength({ min: 6 }), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const user = await get("SELECT id, passwordHash, mustResetPassword FROM users WHERE id = ?", [payload.id]);
    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (!user.mustResetPassword) {
      return res.status(400).json({ message: "Password reset is not required for this account." });
    }

    const { currentPassword, newPassword } = req.body;
    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
      return res.status(400).json({ message: "Current temporary password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await run("UPDATE users SET passwordHash = ?, mustResetPassword = 0, resetToken = NULL, resetExpires = NULL WHERE id = ?", [newHash, user.id]);
    return res.json({ message: "Password updated successfully." });
  }
);

router.post(
  "/forgot-password",
  [body("email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset code has been generated." });
    }

    const resetToken = require("crypto").randomBytes(20).toString("hex");
    const resetExpires = Date.now() + 1000 * 60 * 60;
    await run("UPDATE users SET resetToken = ?, resetExpires = ? WHERE id = ?", [resetToken, resetExpires, user.id]);
    return res.json({ message: "Password reset token generated.", resetToken });
  }
);

router.post(
  "/reset-password",
  [body("token").notEmpty(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const user = await get("SELECT id, resetExpires FROM users WHERE resetToken = ?", [token]);
    if (!user || user.resetExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await run("UPDATE users SET passwordHash = ?, mustResetPassword = 0, resetToken = NULL, resetExpires = NULL WHERE id = ?", [passwordHash, user.id]);
    return res.json({ message: "Password updated successfully." });
  }
);

module.exports = router;

