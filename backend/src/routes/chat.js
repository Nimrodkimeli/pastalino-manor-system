const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, run } = require("../db");

const router = express.Router();
router.use(authenticate);

const parseMemberIds = (value) => {
  try {
    return JSON.parse(value || "[]");
  } catch (error) {
    return [];
  }
};

router.get("/", async (req, res) => {
  const { memberId } = req.query;
  let query = "SELECT * FROM chat_messages WHERE 1=1";
  const params = [];

  if (memberId) {
    query += " AND memberId = ?";
    params.push(memberId);
  }

  query += " ORDER BY createdAt ASC";
  const messages = await all(query, params);
  res.json(messages);
});

router.post(
  "/",
  [body("memberId").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { memberId, message } = req.body;
    const id = `chat-${Date.now()}`;
    const createdAt = Date.now();
    const senderId = req.user?.id || "unknown";
    const senderName = req.user?.name || "Staff";

    await run(
      `INSERT INTO chat_messages (id, memberId, senderId, senderName, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, memberId, senderId, senderName, message, createdAt]
    );

    res.status(201).json({ id, memberId, senderId, senderName, message, createdAt });
  }
);

router.get("/groups", async (req, res) => {
  const groups = await all("SELECT * FROM chat_groups ORDER BY createdAt ASC");
  res.json(groups.map((group) => ({ ...group, memberIds: parseMemberIds(group.memberIds) })));
});

router.post(
  "/groups",
  [body("name").notEmpty(), body("memberIds").isArray()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, memberIds = [] } = req.body;
    const normalizedMemberIds = Array.from(new Set([...(memberIds || []), req.user?.id].filter(Boolean)));
    const id = `chat-group-${Date.now()}`;
    const createdAt = Date.now();

    await run(
      `INSERT INTO chat_groups (id, name, createdBy, createdByName, memberIds, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), req.user?.id || "unknown", req.user?.name || "Staff", JSON.stringify(normalizedMemberIds), createdAt]
    );

    res.status(201).json({ id, name: name.trim(), createdBy: req.user?.id || "unknown", createdByName: req.user?.name || "Staff", memberIds: normalizedMemberIds, createdAt });
  }
);

router.get("/groups/:groupId/messages", async (req, res) => {
  const messages = await all("SELECT * FROM chat_group_messages WHERE groupId = ? ORDER BY createdAt ASC", [req.params.groupId]);
  res.json(messages);
});

router.post(
  "/groups/:groupId/messages",
  [body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const id = `chat-group-message-${Date.now()}`;
    const createdAt = Date.now();
    const senderId = req.user?.id || "unknown";
    const senderName = req.user?.name || "Staff";

    await run(
      `INSERT INTO chat_group_messages (id, groupId, senderId, senderName, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.params.groupId, senderId, senderName, message, createdAt]
    );

    res.status(201).json({ id, groupId: req.params.groupId, senderId, senderName, message, createdAt });
  }
);

module.exports = router;
