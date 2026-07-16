const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const appointments = await all("SELECT * FROM appointments ORDER BY appointmentDate ASC");
  res.json(appointments);
});

router.post(
  "/",
  [body("memberId").notEmpty(), body("title").notEmpty(), body("appointmentDate").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { memberId, title, appointmentDate, location, notes } = req.body;
    const id = `appt-${Date.now()}`;
    await run(
      `INSERT INTO appointments (id, memberId, title, appointmentDate, location, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, memberId, title, appointmentDate, location || "", notes || "", Date.now()]
    );

    res.status(201).json({ id, message: "Appointment saved." });
  }
);

module.exports = router;
