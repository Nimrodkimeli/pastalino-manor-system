const bcrypt = require("bcrypt");
const { run, get, all } = require("../db");

async function ensureColumn(tableName, columnName, columnDefinition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
}

async function createTables() {
  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      mustResetPassword INTEGER NOT NULL DEFAULT 0,
      resetToken TEXT,
      resetExpires INTEGER,
      createdAt INTEGER NOT NULL
    )`
  );

  await ensureColumn("users", "mustResetPassword", "INTEGER NOT NULL DEFAULT 0");

  await run(
    `CREATE TABLE IF NOT EXISTS staff_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT,
      department TEXT,
      phone TEXT,
      cprExpiry INTEGER,
      firstAidExpiry INTEGER,
      caregiverExpiry INTEGER,
      bhtExpiry INTEGER,
      fingerprintExpiry INTEGER,
      tbExpiry INTEGER,
      licenseExpiry INTEGER,
      foodHandlerExpiry INTEGER,
      documentMetadata TEXT,
      notes TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dob TEXT,
      guardian TEXT,
      insurance TEXT,
      physician TEXT,
      allergies TEXT,
      diagnosis TEXT,
      assessments TEXT,
      treatmentPlan TEXT,
      demographics TEXT,
      clinicalDocuments TEXT,
      medications TEXT,
      emergencyContacts TEXT,
      primaryCareProvider TEXT,
      behavioralHealthProvider TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt INTEGER NOT NULL
    )`
  );

  await ensureColumn("members", "dischargePlanning", "TEXT");

  await run(
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      ownerType TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      category TEXT,
      title TEXT,
      fileName TEXT,
      fileUrl TEXT,
      expiresAt INTEGER,
      uploadedAt INTEGER NOT NULL,
      history TEXT,
      status TEXT NOT NULL DEFAULT 'current'
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      staffId TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY(memberId) REFERENCES members(id),
      FOREIGN KEY(staffId) REFERENCES users(id)
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS fire_drills (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      eventDate TEXT,
      createdBy TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS chat_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdByName TEXT NOT NULL,
      memberIds TEXT NOT NULL DEFAULT '[]',
      createdAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS chat_group_messages (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS daily_census (
      id TEXT PRIMARY KEY,
      staffId TEXT NOT NULL,
      staffName TEXT NOT NULL,
      houseName TEXT NOT NULL,
      censusDate TEXT NOT NULL,
      clientNames TEXT,
      memberCount INTEGER NOT NULL DEFAULT 0,
      presentCount INTEGER NOT NULL DEFAULT 0,
      absentCount INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt INTEGER NOT NULL
    )`
  );

  await ensureColumn("daily_census", "clientNames", "TEXT");

  await run(
    `CREATE TABLE IF NOT EXISTS staff_compliance_items (
      id TEXT PRIMARY KEY,
      staffId TEXT NOT NULL,
      name TEXT NOT NULL,
      issueDate INTEGER,
      expiryDate INTEGER,
      uploadedCopy TEXT,
      renewalHistory TEXT,
      reminderEnabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'current',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      staffId TEXT,
      incidentType TEXT,
      incidentDate TEXT,
      witnesses TEXT,
      description TEXT NOT NULL,
      immediateActions TEXT,
      notifications TEXT,
      followUp TEXT,
      correctiveActions TEXT,
      createdAt INTEGER NOT NULL
    )`
  );

  await ensureColumn("incidents", "incidentType", "TEXT");

  await run(
    `CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      title TEXT NOT NULL,
      appointmentDate TEXT NOT NULL,
      contactEmail TEXT,
      contactPhone TEXT,
      reminderChannels TEXT NOT NULL DEFAULT '[]',
      reminderLeadHours INTEGER NOT NULL DEFAULT 24,
      lastReminderSentAt INTEGER,
      location TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL
    )`
  );

  await ensureColumn("appointments", "contactEmail", "TEXT");
  await ensureColumn("appointments", "contactPhone", "TEXT");
  await ensureColumn("appointments", "reminderChannels", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn("appointments", "reminderLeadHours", "INTEGER NOT NULL DEFAULT 24");
  await ensureColumn("appointments", "lastReminderSentAt", "INTEGER");
  await ensureColumn("appointments", "status", "TEXT NOT NULL DEFAULT 'scheduled'");
  await ensureColumn("appointments", "updatedAt", "INTEGER");
  await ensureColumn("appointments", "cancelledAt", "INTEGER");

  await run(
    `CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      documentUrl TEXT,
      acknowledgementRequired INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS visitor_logs (
      id TEXT PRIMARY KEY,
      visitorName TEXT NOT NULL,
      memberId TEXT NOT NULL,
      reason TEXT,
      staffName TEXT,
      visitDate TEXT,
      createdAt INTEGER NOT NULL
    )`
  );
}

async function seedInitialData() {
  const admin = await get("SELECT id FROM users WHERE email = ?", ["admin@pastalino.local"]);
  if (admin) {
    return;
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const userId = "user-admin-1";
  await run(
    "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, "admin@pastalino.local", "Admin User", "admin", passwordHash, Date.now()]
  );

  const staffUsers = [
    {
      id: "user-staff-1",
      email: "beth@pastalino.local",
      name: "Beth Carter",
      title: "Caregiver",
      department: "Residential",
      phone: "602-555-0112",
      cprExpiry: Date.now() + 1000 * 60 * 60 * 24 * 18,
      firstAidExpiry: Date.now() + 1000 * 60 * 60 * 24 * 48,
      caregiverExpiry: Date.now() + 1000 * 60 * 60 * 24 * 180,
      bhtExpiry: Date.now() + 1000 * 60 * 60 * 24 * 110,
      fingerprintExpiry: Date.now() + 1000 * 60 * 60 * 24 * 365,
      tbExpiry: Date.now() + 1000 * 60 * 60 * 24 * 90,
      licenseExpiry: Date.now() + 1000 * 60 * 60 * 24 * 220,
      foodHandlerExpiry: Date.now() + 1000 * 60 * 60 * 24 * 30,
    },
    {
      id: "user-staff-2",
      email: "mike@pastalino.local",
      name: "Mike Alvarez",
      title: "Behavior Specialist",
      department: "Day Program",
      phone: "602-555-0194",
      cprExpiry: Date.now() + 1000 * 60 * 60 * 24 * 60,
      firstAidExpiry: Date.now() + 1000 * 60 * 60 * 24 * 95,
      caregiverExpiry: Date.now() + 1000 * 60 * 60 * 24 * 250,
      bhtExpiry: Date.now() + 1000 * 60 * 60 * 24 * 130,
      fingerprintExpiry: Date.now() + 1000 * 60 * 60 * 24 * 400,
      tbExpiry: Date.now() + 1000 * 60 * 60 * 24 * 20,
      licenseExpiry: Date.now() + 1000 * 60 * 60 * 24 * 70,
      foodHandlerExpiry: Date.now() + 1000 * 60 * 60 * 24 * 250,
    },
  ];

  for (const staff of staffUsers) {
    const passwordHash = await bcrypt.hash("Staff123!", 10);
    await run(
      "INSERT INTO users (id, email, name, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [staff.id, staff.email, staff.name, "staff", passwordHash, Date.now()]
    );
    await run(
      `INSERT INTO staff_profiles (id, userId, title, department, phone, cprExpiry, firstAidExpiry, caregiverExpiry, bhtExpiry, fingerprintExpiry, tbExpiry, licenseExpiry, foodHandlerExpiry, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `profile-${staff.id}`,
        staff.id,
        staff.title,
        staff.department,
        staff.phone,
        staff.cprExpiry,
        staff.firstAidExpiry,
        staff.caregiverExpiry,
        staff.bhtExpiry,
        staff.fingerprintExpiry,
        staff.tbExpiry,
        staff.licenseExpiry,
        staff.foodHandlerExpiry,
        "Profile created during initial setup.",
      ]
    );
  }

  const sampleMember = {
    id: "member-1",
    name: "Ava Jenkins",
    dob: "2008-02-14",
    guardian: "Karen Jenkins",
    insurance: "AZ Care Plus",
    physician: "Dr. Harris",
    allergies: "Peanuts",
    diagnosis: "Autism Spectrum Disorder",
    assessments: "Annual functional behavior assessment completed.",
    treatmentPlan: "Behavior support with structured communication goals.",
    dischargePlanning: "Coordinate transition planning with guardian and external providers.",
    demographics: JSON.stringify({
      dob: "2008-02-14",
      guardian: "Karen Jenkins",
      emergencyContacts: "Karen Jenkins • 602-555-0100",
      primaryCareProvider: "Dr. Harris",
      behavioralHealthProvider: "Dr. Morales",
    }),
    clinicalDocuments: JSON.stringify({
      admissionPaperwork: "Received",
      individualServicePlan: "Active",
      treatmentPlan: "Updated this month",
      physicianOrders: "Available",
      medicationList: "On file",
      progressNotes: "Updated weekly",
      incidentReports: "2 recent entries",
      dischargeSummary: "Not applicable",
    }),
    medications: JSON.stringify({
      list: "Melatonin, vitamin D, OTC allergy med",
      prescriber: "Dr. Harris",
      pharmacy: "North Valley Pharmacy",
      refillReminder: "Next refill in 10 days",
    }),
  };

  await run(
    "INSERT INTO members (id, name, dob, guardian, insurance, physician, allergies, diagnosis, assessments, treatmentPlan, dischargePlanning, demographics, clinicalDocuments, medications, emergencyContacts, primaryCareProvider, behavioralHealthProvider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      sampleMember.id,
      sampleMember.name,
      sampleMember.dob,
      sampleMember.guardian,
      sampleMember.insurance,
      sampleMember.physician,
      sampleMember.allergies,
      sampleMember.diagnosis,
      sampleMember.assessments,
      sampleMember.treatmentPlan,
      sampleMember.dischargePlanning,
      sampleMember.demographics,
      sampleMember.clinicalDocuments,
      sampleMember.medications,
      "Karen Jenkins • 602-555-0100",
      "Dr. Harris",
      "Dr. Morales",
      Date.now(),
    ]
  );

  const documents = [
    {
      id: "doc-1",
      ownerType: "staff",
      ownerId: "user-staff-1",
      category: "CPR",
      title: "CPR Certificate",
      fileName: "beth_cpr.pdf",
      fileUrl: "/uploads/beth_cpr.pdf",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 18,
    },
    {
      id: "doc-2",
      ownerType: "member",
      ownerId: sampleMember.id,
      category: "Insurance",
      title: "AZ Care Plus Coverage",
      fileName: "ava_insurance.pdf",
      fileUrl: "/uploads/ava_insurance.pdf",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 120,
    },
  ];

  for (const document of documents) {
    await run(
      `INSERT INTO documents (id, ownerType, ownerId, category, title, fileName, fileUrl, expiresAt, uploadedAt, history, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        document.id,
        document.ownerType,
        document.ownerId,
        document.category,
        document.title,
        document.fileName,
        document.fileUrl,
        document.expiresAt,
        Date.now(),
        JSON.stringify([{ date: Date.now(), action: "uploaded" }]),
        "current",
      ]
    );
  }

  const complianceItems = [
    {
      id: "compliance-1",
      staffId: "user-staff-1",
      name: "Caregiver Certificate",
      issueDate: Date.now() - 1000 * 60 * 60 * 24 * 180,
      expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 180,
      uploadedCopy: "/uploads/beth_caregiver.pdf",
      renewalHistory: [{ date: Date.now() - 1000 * 60 * 60 * 24 * 180, action: "uploaded" }],
    },
    {
      id: "compliance-2",
      staffId: "user-staff-2",
      name: "CPR/First Aid",
      issueDate: Date.now() - 1000 * 60 * 60 * 24 * 30,
      expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
      uploadedCopy: "/uploads/mike_cpr.pdf",
      renewalHistory: [{ date: Date.now() - 1000 * 60 * 60 * 24 * 30, action: "uploaded" }],
    },
  ];

  for (const item of complianceItems) {
    await run(
      `INSERT INTO staff_compliance_items (id, staffId, name, issueDate, expiryDate, uploadedCopy, renewalHistory, reminderEnabled, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        item.id,
        item.staffId,
        item.name,
        item.issueDate,
        item.expiryDate,
        item.uploadedCopy,
        JSON.stringify(item.renewalHistory),
        1,
        "current",
        Date.now(),
        Date.now(),
      ]
    );
  }

  const incidents = [
    {
      id: "incident-1",
      memberId: sampleMember.id,
      staffId: "user-staff-1",
      incidentDate: new Date().toISOString(),
      witnesses: "Nurse Lopez",
      description: "Member became distressed during transition to evening routine.",
      immediateActions: "Redirection and calm space used.",
      notifications: "Supervisor notified",
      followUp: "Behavior review scheduled",
      correctiveActions: "Updated support plan with extra sensory support.",
    },
  ];

  for (const incident of incidents) {
    await run(
      `INSERT INTO incidents (id, memberId, staffId, incidentDate, witnesses, description, immediateActions, notifications, followUp, correctiveActions, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [incident.id, incident.memberId, incident.staffId, incident.incidentDate, incident.witnesses, incident.description, incident.immediateActions, incident.notifications, incident.followUp, incident.correctiveActions, Date.now()]
    );
  }

  const appointments = [
    {
      id: "appt-1",
      memberId: sampleMember.id,
      title: "Psychiatry follow-up",
      appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      location: "North Valley Clinic",
      notes: "Bring medication list",
    },
  ];

  for (const appointment of appointments) {
    await run(
      `INSERT INTO appointments (id, memberId, title, appointmentDate, location, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [appointment.id, appointment.memberId, appointment.title, appointment.appointmentDate, appointment.location, appointment.notes, Date.now()]
    );
  }

  const policies = [
    {
      id: "policy-1",
      title: "Emergency Response Plan",
      category: "Emergency",
      documentUrl: "/uploads/emergency-plan.pdf",
      acknowledgementRequired: 1,
    },
  ];

  for (const policy of policies) {
    await run(
      `INSERT INTO policies (id, title, category, documentUrl, acknowledgementRequired, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [policy.id, policy.title, policy.category, policy.documentUrl, policy.acknowledgementRequired ? 1 : 0, Date.now()]
    );
  }

  const visitors = [
    {
      id: "visitor-1",
      visitorName: "Laura Simmons",
      memberId: sampleMember.id,
      reason: "Family visit",
      staffName: "Beth Carter",
      visitDate: new Date().toISOString(),
    },
  ];

  for (const visitor of visitors) {
    await run(
      `INSERT INTO visitor_logs (id, visitorName, memberId, reason, staffName, visitDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [visitor.id, visitor.visitorName, visitor.memberId, visitor.reason, visitor.staffName, visitor.visitDate, Date.now()]
    );
  }

  const notes = [
    {
      id: "note-1",
      memberId: sampleMember.id,
      staffId: "user-staff-1",
      type: "face_sheet",
      category: "Face Sheet",
      title: "Initial face sheet for Ava Jenkins",
      content: "Collected intake details, guardian contacts, health history, and emergency information.",
    },
    {
      id: "note-2",
      memberId: sampleMember.id,
      staffId: "user-staff-2",
      type: "assessment",
      category: "Assessment",
      title: "Functional behavior assessment",
      content: "Completed ABA assessment; identified communication triggers and sensory needs.",
    },
    {
      id: "note-3",
      memberId: sampleMember.id,
      staffId: "user-staff-1",
      type: "progress_note",
      category: "Progress Note",
      title: "Progress on communication goals",
      content: "Ava responded positively to visual supports and completed 4 of 5 target tasks.",
    },
  ];

  for (const note of notes) {
    await run(
      `INSERT INTO notes (id, memberId, staffId, type, category, title, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [note.id, note.memberId, note.staffId, note.type, note.category, note.title, note.content, Date.now(), Date.now()]
    );
  }
}

async function init() {
  await createTables();
  await seedInitialData();
}

if (require.main === module) {
  init()
    .then(() => {
      console.log("Database schema created and initial seed data added.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = init;
