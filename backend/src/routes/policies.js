const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const policies = await all("SELECT * FROM policies ORDER BY title ASC");
  res.json(policies);
});

router.post(
  "/",
  [body("title").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, category, documentUrl, acknowledgementRequired } = req.body;
    const id = `policy-${Date.now()}`;
    await run(
      `INSERT INTO policies (id, title, category, documentUrl, acknowledgementRequired, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, category || "Policy", documentUrl || "", acknowledgementRequired ? 1 : 0, Date.now()]
    );

    res.status(201).json({ id, message: "Policy saved." });
  }
);

module.exports = router;
