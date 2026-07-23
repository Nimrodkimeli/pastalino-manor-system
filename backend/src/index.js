require("dotenv").config();
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
const fireDrillRoutes = require("./routes/fireDrills");
const notificationWebhookRoutes = require("./routes/notifications");
const { startReminderScheduler } = require("./services/reminderScheduler");
const initData = require("./utils/initData");

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
app.use("/api/fire-drills", fireDrillRoutes);
app.use("/api/notifications", notificationWebhookRoutes);

app.get("/api/status", (req, res) => res.json({ status: "ok", version: "1.0" }));

initData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      startReminderScheduler();
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
