const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run, get } = require("../db");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const entries = await all(
    `SELECT id, staffId, staffName, houseName, censusDate, clientNames, memberCount, presentCount, absentCount, notes, createdAt
     FROM daily_census
     ORDER BY censusDate DESC, createdAt DESC`
  );
  res.json(entries);
});

router.post(
  "/",
  [body("houseName").notEmpty(), body("censusDate").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { houseName, censusDate, clientNames, memberCount, presentCount, absentCount, notes } = req.body;
    const id = `census-${Date.now()}`;
    const staffName = req.user?.name || "Staff";
    const payload = {
      id,
      staffId: req.user.id,
      staffName,
      houseName,
      censusDate,
      clientNames: clientNames || "",
      memberCount: Number(memberCount || 0),
      presentCount: Number(presentCount || 0),
      absentCount: Number(absentCount || 0),
      notes: notes || "",
      createdAt: Date.now(),
    };

    await run(
      `INSERT INTO daily_census (id, staffId, staffName, houseName, censusDate, clientNames, memberCount, presentCount, absentCount, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        payload.id,
        payload.staffId,
        payload.staffName,
        payload.houseName,
        payload.censusDate,
        payload.clientNames,
        payload.memberCount,
        payload.presentCount,
        payload.absentCount,
        payload.notes,
        payload.createdAt,
      ]
    );

    const createdEntry = await get(
      `SELECT id, staffId, staffName, houseName, censusDate, clientNames, memberCount, presentCount, absentCount, notes, createdAt
       FROM daily_census WHERE id = ?`,
      [id]
    );

    res.status(201).json(createdEntry);
  }
);

module.exports = router;
