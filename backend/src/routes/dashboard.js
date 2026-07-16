const express = require("express");
const { authenticate } = require("../middleware/auth");
const { all, get } = require("../db");

const router = express.Router();

function buildExpiryQuery(days) {
  const now = Date.now();
  return [now + days * 24 * 60 * 60 * 1000, now];
}

router.get("/", authenticate, async (req, res) => {
  const now = Date.now();
  const expiring7 = now + 7 * 24 * 60 * 60 * 1000;
  const expiring30 = now + 30 * 24 * 60 * 60 * 1000;
  const expiring60 = now + 60 * 24 * 60 * 60 * 1000;
  const expiring90 = now + 90 * 24 * 60 * 60 * 1000;

  const todayCount = await get(
    "SELECT COUNT(*) AS count FROM documents WHERE expiresAt IS NOT NULL AND expiresAt <= ?",
    [now]
  );
  const due7 = await get(
    "SELECT COUNT(*) AS count FROM documents WHERE expiresAt BETWEEN ? AND ?",
    [now, expiring7]
  );
  const due30 = await get(
    "SELECT COUNT(*) AS count FROM documents WHERE expiresAt BETWEEN ? AND ?",
    [expiring7, expiring30]
  );
  const due60 = await get(
    "SELECT COUNT(*) AS count FROM documents WHERE expiresAt BETWEEN ? AND ?",
    [expiring30, expiring60]
  );
  const due90 = await get(
    "SELECT COUNT(*) AS count FROM documents WHERE expiresAt BETWEEN ? AND ?",
    [expiring60, expiring90]
  );

  const staffCompliance = await all(
    `SELECT u.id, u.name, sp.title,
      MIN(COALESCE(sp.cprExpiry, 9999999999999), COALESCE(sp.firstAidExpiry, 9999999999999), COALESCE(sp.caregiverExpiry, 9999999999999), COALESCE(sp.bhtExpiry, 9999999999999), COALESCE(sp.fingerprintExpiry, 9999999999999), COALESCE(sp.tbExpiry, 9999999999999), COALESCE(sp.licenseExpiry, 9999999999999), COALESCE(sp.foodHandlerExpiry, 9999999999999)) AS nextExpiry
      FROM users u
      JOIN staff_profiles sp ON sp.userId = u.id
      WHERE u.role = 'staff'
      GROUP BY u.id`);

  const staffAtRisk = staffCompliance.filter((staff) => staff.nextExpiry <= expiring30).length;
  const staffTotal = staffCompliance.length;

  const memberCompliance = await all(
    `SELECT m.id, m.name, m.status, COUNT(d.id) AS documentCount
      FROM members m
      LEFT JOIN documents d ON d.ownerType = 'member' AND d.ownerId = m.id
      GROUP BY m.id`
  );

  return res.json({
    documents: {
      today: todayCount.count || 0,
      due7: due7.count || 0,
      due30: due30.count || 0,
      due60: due60.count || 0,
      due90: due90.count || 0,
    },
    staffCompliance: {
      total: staffTotal,
      atRisk: staffAtRisk,
      details: staffCompliance,
    },
    memberCompliance: {
      total: memberCompliance.length,
      details: memberCompliance,
    },
    quickStats: {
      staffCount: staffTotal,
      memberCount: memberCompliance.length,
      expiringSoon: due30.count || 0,
    },
  });
});

module.exports = router;
