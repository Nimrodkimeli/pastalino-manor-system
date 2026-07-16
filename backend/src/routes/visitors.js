const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const visitors = await all("SELECT * FROM visitor_logs ORDER BY visitDate DESC");
  res.json(visitors);
});

router.post(
  "/",
  [body("visitorName").notEmpty(), body("memberId").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { visitorName, memberId, reason, staffName, visitDate } = req.body;
    const id = `visitor-${Date.now()}`;
    await run(
      `INSERT INTO visitor_logs (id, visitorName, memberId, reason, staffName, visitDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, visitorName, memberId, reason || "", staffName || "", visitDate || new Date().toISOString(), Date.now()]
    );

    res.status(201).json({ id, message: "Visitor logged." });
  }
);

module.exports = router;
