const express = require("express");
const { authenticate } = require("../middleware/auth");
const { all, get } = require("../db");

const router = express.Router();
router.use(authenticate);

router.get("/compliance", async (req, res) => {
  const staff = await all(
    `SELECT u.id, u.name, u.email, sp.title,
      MIN(COALESCE(sp.cprExpiry, 9999999999999), COALESCE(sp.firstAidExpiry, 9999999999999), COALESCE(sp.caregiverExpiry, 9999999999999), COALESCE(sp.bhtExpiry, 9999999999999), COALESCE(sp.fingerprintExpiry, 9999999999999), COALESCE(sp.tbExpiry, 9999999999999), COALESCE(sp.licenseExpiry, 9999999999999), COALESCE(sp.foodHandlerExpiry, 9999999999999)) AS nextExpiry
      FROM users u
      JOIN staff_profiles sp ON sp.userId = u.id
      WHERE u.role = 'staff'
      GROUP BY u.id`
  );

  const now = Date.now();
  const expired = staff.filter((row) => row.nextExpiry <= now).length;
  const expiringSoon = staff.filter((row) => row.nextExpiry > now && row.nextExpiry <= now + 30 * 24 * 60 * 60 * 1000).length;

  res.json({ total: staff.length, expired, expiringSoon, details: staff });
});

router.get("/expired", async (req, res) => {
  const expiredDocs = await all("SELECT * FROM documents WHERE expiresAt IS NOT NULL AND expiresAt <= ? ORDER BY expiresAt ASC", [Date.now()]);
  res.json({ count: expiredDocs.length, expiredDocs });
});

router.get("/renewals", async (req, res) => {
  const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const renewals = await all("SELECT * FROM documents WHERE expiresAt IS NOT NULL AND expiresAt BETWEEN ? AND ? ORDER BY expiresAt ASC", [Date.now(), soon]);
  res.json({ count: renewals.length, renewals });
});

router.get("/azdhs", async (req, res) => {
  const docs = await all("SELECT * FROM documents ORDER BY expiresAt DESC LIMIT 50");
  res.json({ inspectionReady: docs.slice(0, 20), notes: "AZDHS inspection report data is available for current documents." });
});

module.exports = router;
