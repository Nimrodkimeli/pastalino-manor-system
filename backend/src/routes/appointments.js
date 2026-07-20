const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { run } = require("../db");
const {
  getAppointmentById,
  getAppointmentReminderStatus,
  listAppointments,
  listDueAppointmentReminders,
  normalizeChannels,
  sendDueAppointmentReminders,
} = require("../services/appointmentReminders");
const { getReminderSchedulerStatus } = require("../services/reminderScheduler");

const router = express.Router();
router.use(authenticate);

const appointmentValidators = [
  body("memberId").notEmpty(),
  body("title").notEmpty(),
  body("appointmentDate").notEmpty(),
  body("contactEmail").optional({ checkFalsy: true }).isEmail(),
  body("contactPhone").optional({ checkFalsy: true }).isLength({ min: 7 }),
];

router.get("/", async (req, res) => {
  const appointments = await listAppointments({ includeCancelled: req.query.includeCancelled === "true" });
  res.json(appointments);
});

router.get("/due-reminders", async (req, res) => {
  const dueAppointments = await listDueAppointmentReminders();
  res.json({ total: dueAppointments.length, appointments: dueAppointments });
});

router.get("/reminder-status", async (req, res) => {
  res.json({
    ...getAppointmentReminderStatus(),
    scheduler: getReminderSchedulerStatus(),
  });
});

router.post("/send-reminders", async (req, res) => {
  const result = await sendDueAppointmentReminders();
  res.json(result);
});

async function upsertAppointment(req, res, existingAppointmentId = null) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      memberId,
      title,
      appointmentDate,
      contactEmail,
      contactPhone,
      reminderChannels,
      reminderLeadHours,
      location,
      notes,
    } = req.body;
    const channels = normalizeChannels(reminderChannels);
    const now = Date.now();

    if (existingAppointmentId) {
      const existingAppointment = await getAppointmentById(existingAppointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found." });
      }

      await run(
        `UPDATE appointments
          SET memberId = ?,
              title = ?,
              appointmentDate = ?,
              contactEmail = ?,
              contactPhone = ?,
              reminderChannels = ?,
              reminderLeadHours = ?,
              location = ?,
              notes = ?,
              status = 'scheduled',
              cancelledAt = NULL,
              lastReminderSentAt = NULL,
              updatedAt = ?
          WHERE id = ?`,
        [
          memberId,
          title,
          appointmentDate,
          contactEmail || "",
          contactPhone || "",
          JSON.stringify(channels),
          Number(reminderLeadHours) || 24,
          location || "",
          notes || "",
          now,
          existingAppointmentId,
        ]
      );

      return res.json({ id: existingAppointmentId, message: "Appointment updated." });
    }

    const id = `appt-${Date.now()}`;
    await run(
      `INSERT INTO appointments (
        id, memberId, title, appointmentDate, contactEmail, contactPhone,
        reminderChannels, reminderLeadHours, location, notes, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
      [
        id,
        memberId,
        title,
        appointmentDate,
        contactEmail || "",
        contactPhone || "",
        JSON.stringify(channels),
        Number(reminderLeadHours) || 24,
        location || "",
        notes || "",
        now,
        now,
      ]
    );

    return res.status(201).json({ id, message: "Appointment saved." });
}

router.post("/", appointmentValidators, async (req, res) => upsertAppointment(req, res));

router.put("/:id", appointmentValidators, async (req, res) => upsertAppointment(req, res, req.params.id));

router.delete("/:id", async (req, res) => {
  const appointment = await getAppointmentById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  await run(
    `UPDATE appointments
      SET status = 'cancelled', cancelledAt = ?, updatedAt = ?, lastReminderSentAt = NULL
      WHERE id = ?`,
    [Date.now(), Date.now(), req.params.id]
  );

  return res.json({ id: req.params.id, message: "Appointment cancelled." });
});

module.exports = router;
