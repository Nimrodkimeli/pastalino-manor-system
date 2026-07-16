const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { all, get, run } = require("../db");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const members = await all("SELECT * FROM members ORDER BY name ASC");
  res.json(members);
});

router.get("/:id", async (req, res) => {
  const member = await get("SELECT * FROM members WHERE id = ?", [req.params.id]);
  if (!member) {
    return res.status(404).json({ message: "Member not found." });
  }
  const documents = await all("SELECT * FROM documents WHERE ownerType = 'member' AND ownerId = ?", [req.params.id]);
  const notes = await all("SELECT * FROM notes WHERE memberId = ? ORDER BY createdAt DESC", [req.params.id]);
  res.json({ ...member, documents, notes });
});

router.post(
  "/",
  authorizeRoles("admin", "staff"),
  [body("name").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dob, guardian, insurance, physician, allergies, diagnosis, assessments, treatmentPlan, dischargePlanning } = req.body;
    const id = `member-${Date.now()}`;

    await run(
      `INSERT INTO members (id, name, dob, guardian, insurance, physician, allergies, diagnosis, assessments, treatmentPlan, dischargePlanning, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, dob || "", guardian || "", insurance || "", physician || "", allergies || "", diagnosis || "", assessments || "", treatmentPlan || "", dischargePlanning || "", Date.now()]
    );

    res.status(201).json({ id, name });
  }
);

router.put("/:id", async (req, res) => {
  const member = await get("SELECT * FROM members WHERE id = ?", [req.params.id]);
  if (!member) {
    return res.status(404).json({ message: "Member not found." });
  }

  const updates = {
    name: req.body.name || member.name,
    dob: req.body.dob || member.dob,
    guardian: req.body.guardian || member.guardian,
    insurance: req.body.insurance || member.insurance,
    physician: req.body.physician || member.physician,
    allergies: req.body.allergies || member.allergies,
    diagnosis: req.body.diagnosis || member.diagnosis,
    assessments: req.body.assessments || member.assessments,
    treatmentPlan: req.body.treatmentPlan || member.treatmentPlan,
    dischargePlanning: req.body.dischargePlanning || member.dischargePlanning,
    status: req.body.status || member.status,
  };

  await run(
    `UPDATE members SET name = ?, dob = ?, guardian = ?, insurance = ?, physician = ?, allergies = ?, diagnosis = ?, assessments = ?, treatmentPlan = ?, dischargePlanning = ?, status = ? WHERE id = ?`,
    [
      updates.name,
      updates.dob,
      updates.guardian,
      updates.insurance,
      updates.physician,
      updates.allergies,
      updates.diagnosis,
      updates.assessments,
      updates.treatmentPlan,
      updates.dischargePlanning,
      updates.status,
      req.params.id,
    ]
  );

  res.json({ message: "Member updated." });
});

module.exports = router;
