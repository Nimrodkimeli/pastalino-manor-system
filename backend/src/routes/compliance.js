const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, get, run } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const { staffId } = req.query;
  let query = `SELECT sci.*, u.name AS staffName
    FROM staff_compliance_items sci
    JOIN users u ON u.id = sci.staffId`;
  const params = [];

  if (staffId) {
    query += " WHERE sci.staffId = ?";
    params.push(staffId);
  }

  query += " ORDER BY sci.expiryDate ASC";
  const items = await all(query, params);
  res.json(items);
});

router.post(
  "/",
  [body("staffId").notEmpty(), body("name").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      staffId,
      name,
      issueDate,
      expiryDate,
      uploadedCopy,
      renewalHistory,
      reminderEnabled = true,
      status = "current",
    } = req.body;

    const id = `compliance-${Date.now()}`;
    await run(
      `INSERT INTO staff_compliance_items (id, staffId, name, issueDate, expiryDate, uploadedCopy, renewalHistory, reminderEnabled, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        staffId,
        name,
        issueDate || null,
        expiryDate || null,
        uploadedCopy || "",
        renewalHistory ? JSON.stringify(renewalHistory) : JSON.stringify([]),
        reminderEnabled ? 1 : 0,
        status,
        Date.now(),
        Date.now(),
      ]
    );

    res.status(201).json({ id, message: "Compliance item created." });
  }
);

router.put("/:id", async (req, res) => {
  const item = await get("SELECT * FROM staff_compliance_items WHERE id = ?", [req.params.id]);
  if (!item) {
    return res.status(404).json({ message: "Compliance item not found." });
  }

  const { name, issueDate, expiryDate, uploadedCopy, renewalHistory, reminderEnabled, status } = req.body;
  await run(
    `UPDATE staff_compliance_items SET name = ?, issueDate = ?, expiryDate = ?, uploadedCopy = ?, renewalHistory = ?, reminderEnabled = ?, status = ?, updatedAt = ? WHERE id = ?`,
    [
      name || item.name,
      issueDate || item.issueDate,
      expiryDate || item.expiryDate,
      uploadedCopy || item.uploadedCopy,
      renewalHistory ? JSON.stringify(renewalHistory) : item.renewalHistory,
      reminderEnabled !== undefined ? (reminderEnabled ? 1 : 0) : item.reminderEnabled,
      status || item.status,
      Date.now(),
      req.params.id,
    ]
  );

  res.json({ message: "Compliance item updated." });
});

router.delete("/:id", async (req, res) => {
  await run("DELETE FROM staff_compliance_items WHERE id = ?", [req.params.id]);
  res.json({ message: "Compliance item removed." });
});

module.exports = router;
