require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const staffRoutes = require("./routes/staff");
const memberRoutes = require("./routes/members");
const documentRoutes = require("./routes/documents");
const reportRoutes = require("./routes/reports");
const reminderRoutes = require("./routes/reminders");
const noteRoutes = require("./routes/notes");
const chatRoutes = require("./routes/chat");
const censusRoutes = require("./routes/census");
const complianceRoutes = require("./routes/compliance");
const incidentRoutes = require("./routes/incidents");
const appointmentRoutes = require("./routes/appointments");
const policyRoutes = require("./routes/policies");
const visitorRoutes = require("./routes/visitors");
const { startReminderScheduler } = require("./services/reminderScheduler");
const initData = require("./utils/initData");
const bcrypt = require("bcrypt");
const { db, get, run } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and same-origin requests.
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/census", censusRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/visitors", visitorRoutes);

app.get("/api/status", (req, res) => res.json({ status: "ok", version: "1.0" }));

async function ensureTestUsers() {
  try {
    console.log("Checking for test users...");
    const admin = await get("SELECT id FROM users WHERE email = ?", ["admin@pastalino.local"]);
    
    if (admin) {
      console.log("✓ Test users already exist");
      return;
    }

    console.log("Creating test users...");
    
    // Hash passwords
    const adminHash = await bcrypt.hash("Admin123!", 10);
    const staffHash = await bcrypt.hash("Staff123!", 10);

    // Insert users
    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-admin-1", "admin@pastalino.local", "Admin User", "admin", adminHash, Date.now()]
    );

    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-staff-1", "beth@pastalino.local", "Beth Carter", "staff", staffHash, Date.now()]
    );

    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["user-staff-2", "mike@pastalino.local", "Mike Alvarez", "staff", staffHash, Date.now()]
    );

    console.log("✓ Test users created:");
    console.log("  - admin@pastalino.local / Admin123!");
    console.log("  - beth@pastalino.local / Staff123!");
    console.log("  - mike@pastalino.local / Staff123!");
  } catch (err) {
    console.error("Error ensuring test users:", err);
  }
}

initData()
  .then(async () => {
    console.log("Database initialized");
    await ensureTestUsers();
    
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      startReminderScheduler();
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

