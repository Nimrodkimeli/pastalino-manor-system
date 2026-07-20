const bcrypt = require("bcrypt");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "pastalino.sqlite");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function seedUsers() {
  try {
    console.log("Seeding test users...");

    // Check if admin already exists
    const admin = await get("SELECT id FROM users WHERE email = ?", ["admin@pastalino.local"]);
    if (admin) {
      console.log("Admin user already exists, skipping seed");
      db.close();
      return;
    }

    // Hash passwords
    const adminHash = await bcrypt.hash("Admin123!", 10);
    const staffHash = await bcrypt.hash("Staff123!", 10);

    // Insert users
    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-admin-1", "admin@pastalino.local", "Admin User", "admin", adminHash, Date.now()]
    );
    console.log("✓ Created admin@pastalino.local");

    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-staff-1", "beth@pastalino.local", "Beth Carter", "staff", staffHash, Date.now()]
    );
    console.log("✓ Created beth@pastalino.local");

    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-staff-2", "mike@pastalino.local", "Mike Alvarez", "staff", staffHash, Date.now()]
    );
    console.log("✓ Created mike@pastalino.local");

    console.log("\n✓ All test users created successfully!");
    console.log("\nTest credentials:");
    console.log("  Admin: admin@pastalino.local / Admin123!");
    console.log("  Staff: beth@pastalino.local / Staff123!");
    console.log("  Staff: mike@pastalino.local / Staff123!");

    db.close();
  } catch (err) {
    console.error("Error seeding users:", err);
    db.close();
    process.exit(1);
  }
}

seedUsers();

