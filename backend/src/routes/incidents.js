const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, get, run } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const { memberId } = req.query;
  let query = "SELECT * FROM incidents";
  const params = [];

  if (memberId) {
    query += " WHERE memberId = ?";
    params.push(memberId);
  }

  query += " ORDER BY incidentDate DESC";
  const incidents = await all(query, params);
  res.json(incidents);
});

router.post(
  "/",
  [body("memberId").notEmpty(), body("description").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { memberId, staffId, incidentType, incidentDate, witnesses, description, immediateActions, notifications, followUp, correctiveActions } = req.body;
    const id = `incident-${Date.now()}`;
    await run(
      `INSERT INTO incidents (id, memberId, staffId, incidentType, incidentDate, witnesses, description, immediateActions, notifications, followUp, correctiveActions, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, memberId, staffId || "", incidentType || "General", incidentDate || new Date().toISOString(), witnesses || "", description, immediateActions || "", notifications || "", followUp || "", correctiveActions || "", Date.now()]
    );

    res.status(201).json({ id, message: "Incident saved." });
  }
);

router.put("/:id", async (req, res) => {
  const incident = await get("SELECT * FROM incidents WHERE id = ?", [req.params.id]);
  if (!incident) {
    return res.status(404).json({ message: "Incident not found." });
  }

  const updates = {
    incidentType: req.body.incidentType || incident.incidentType,
    description: req.body.description || incident.description,
    immediateActions: req.body.immediateActions || incident.immediateActions,
    notifications: req.body.notifications || incident.notifications,
    followUp: req.body.followUp || incident.followUp,
    correctiveActions: req.body.correctiveActions || incident.correctiveActions,
  };

  await run(
    `UPDATE incidents SET incidentType = ?, description = ?, immediateActions = ?, notifications = ?, followUp = ?, correctiveActions = ? WHERE id = ?`,
    [updates.incidentType, updates.description, updates.immediateActions, updates.notifications, updates.followUp, updates.correctiveActions, req.params.id]
  );

  res.json({ message: "Incident updated." });
});

module.exports = router;
