const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();

const allowedCategories = [
  "disaster_plan_review",
  "clients_fire_drills",
  "staff_fire_drills",
  "smoke_detectors_air_filters",
];

router.use(authenticate);

router.get(
  "/",
  [query("category").optional().isIn(allowedCategories)],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category } = req.query;
    let sql = "SELECT * FROM fire_drills";
    const params = [];

    if (category) {
      sql += " WHERE category = ?";
      params.push(category);
    }

    sql += " ORDER BY createdAt DESC";

    const records = await all(sql, params);
    res.json(records);
  }
);

router.post(
  "/",
  [
    body("category").isIn(allowedCategories),
    body("title").trim().notEmpty(),
    body("content").trim().notEmpty(),
    body("eventDate").optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = `fire-drill-${Date.now()}`;
    const now = Date.now();
    const { category, title, content, eventDate } = req.body;
    const createdBy = req.user?.id || "unknown";

    await run(
      `INSERT INTO fire_drills (id, category, title, content, eventDate, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category, title, content, eventDate || "", createdBy, now, now]
    );

    res.status(201).json({ id, message: "Fire drill entry saved." });
  }
);

router.delete("/:id", async (req, res) => {
  const existing = await all("SELECT id FROM fire_drills WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Fire drill entry not found." });
  }

  await run("DELETE FROM fire_drills WHERE id = ?", [req.params.id]);
  res.json({ message: "Fire drill entry deleted." });
});

module.exports = router;
