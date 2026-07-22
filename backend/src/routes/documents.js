const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const { ownerType, ownerId, category, search } = req.query;
  let query = "SELECT * FROM documents WHERE 1=1";
  const params = [];

  if (ownerType) {
    query += " AND ownerType = ?";
    params.push(ownerType);
  }
  if (ownerId) {
    query += " AND ownerId = ?";
    params.push(ownerId);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (search) {
    query += " AND (title LIKE ? OR fileName LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const documents = await all(query, params);
  res.json(documents);
});

router.post(
  "/",
  [body("ownerType").isIn(["staff", "member", "fire_drill"]), body("ownerId").notEmpty(), body("title").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ownerType, ownerId, category, title, fileName, fileUrl, expiresAt } = req.body;
    const id = `doc-${Date.now()}`;

    await run(
      `INSERT INTO documents (id, ownerType, ownerId, category, title, fileName, fileUrl, expiresAt, uploadedAt, history, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ownerType,
        ownerId,
        category || "Document",
        title,
        fileName || "unknown.pdf",
        fileUrl || "",
        expiresAt || null,
        Date.now(),
        JSON.stringify([{ date: Date.now(), action: "uploaded" }]),
        "current",
      ]
    );

    res.status(201).json({ id, message: "Document added." });
  }
);

router.delete("/:id", async (req, res) => {
  const document = await all("SELECT id FROM documents WHERE id = ? LIMIT 1", [req.params.id]);
  if (!document.length) {
    return res.status(404).json({ message: "Document not found." });
  }

  await run("DELETE FROM documents WHERE id = ?", [req.params.id]);
  res.json({ message: "Document deleted." });
});

module.exports = router;
