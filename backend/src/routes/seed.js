const express = require("express");
const bcrypt = require("bcrypt");
const { run, get } = require("../db");

const router = express.Router();

// Seed endpoint - creates test users
router.post("/seed-data", async (req, res) => {
  try {
    console.log("Seeding test users...");

    // Check if admin already exists
    const admin = await get("SELECT id FROM users WHERE email = ?", ["admin@pastalino.local"]);
    if (admin) {
      console.log("Admin user already exists");
      return res.json({ message: "Test data already seeded", usersCreated: 0 });
    }

    // Create admin user
    const adminHash = await bcrypt.hash("Admin123!", 10);
    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-admin-1", "admin@pastalino.local", "Admin User", "admin", adminHash, Date.now()]
    );
    console.log("✓ Created admin user");

    // Create staff users
    const staffUsers = [
      {
        id: "user-staff-1",
        email: "beth@pastalino.local",
        name: "Beth Carter",
      },
      {
        id: "user-staff-2",
        email: "mike@pastalino.local",
        name: "Mike Alvarez",
      },
    ];

    const staffHash = await bcrypt.hash("Staff123!", 10);
    for (const staff of staffUsers) {
      await run(
        "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        [staff.id, staff.email, staff.name, "staff", staffHash, Date.now()]
      );
      console.log(`✓ Created staff user: ${staff.email}`);
    }

    // Verify users were created
    const userCount = await get("SELECT COUNT(*) as count FROM users");
    console.log(`Total users in database: ${userCount.count}`);

    res.json({
      message: "Test data seeded successfully",
      usersCreated: 3,
      totalUsers: userCount.count,
    });
  } catch (err) {
    console.error("Seeding error:", err.message);
    res.status(500).json({ error: "Failed to seed data", details: err.message });
  }
});

module.exports = router;

