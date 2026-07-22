const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { all, get, run } = require("../db");

const router = express.Router();
router.use(authenticate);

const allowedTypes = [
  "face_sheet",
  "assessment",
  "progress_note",
  "group_note",
  "counselling_note",
  "art_meeting",
  "chat",
];

const noteLabels = {
  face_sheet: "Face Sheet",
  assessment: "Assessment",
  progress_note: "Progress Note",
  group_note: "Group Note",
  counselling_note: "Individual Counseling Note",
  art_meeting: "Art Meeting",
  chat: "Communication",
};

const digitallySignedNoteTypes = new Set([
  "progress_note",
  "group_note",
  "counselling_note",
  "art_meeting",
]);

function pickDiagnosisGuidance(diagnosisText = "") {
  const normalized = diagnosisText.toLowerCase();

  if (normalized.includes("autism")) {
    return {
      focus: "Improve communication and increase tolerance for schedule changes.",
      interventions: "Used visual prompts, simple choices, and calm redirection during transitions.",
      response: "Member followed prompts with minimal support and used words to request needs.",
      progress: "Member needed fewer reminders than prior sessions and stayed engaged in tasks.",
      next: "Continue visual supports and practice coping statements for transitions.",
    };
  }

  if (normalized.includes("anxiety")) {
    return {
      focus: "Lower anxiety symptoms and improve coping during daily activities.",
      interventions: "Practiced breathing, grounding skills, and step-by-step reassurance.",
      response: "Member reported feeling calmer and completed activities after coaching.",
      progress: "Member used at least one coping tool with reduced prompting.",
      next: "Reinforce coping tools and track triggers with staff support.",
    };
  }

  if (normalized.includes("depression")) {
    return {
      focus: "Increase daily participation and improve mood stability.",
      interventions: "Used motivational coaching, activity scheduling, and strengths-based feedback.",
      response: "Member participated in planned tasks and verbally processed emotions.",
      progress: "Member showed better follow-through compared to previous shift notes.",
      next: "Continue routine-building and mood check-ins each shift.",
    };
  }

  if (normalized.includes("adhd")) {
    return {
      focus: "Improve task completion and reduce impulsive behaviors.",
      interventions: "Used short directions, timer prompts, and positive reinforcement.",
      response: "Member stayed on task for longer periods with brief redirection.",
      progress: "Member completed key tasks with fewer interruptions.",
      next: "Maintain structured prompts and reward consistent task completion.",
    };
  }

  return {
    focus: "Support emotional and behavioral stability during program activities.",
    interventions: "Used supportive counseling, redirection, and coping-skill practice.",
    response: "Member remained engaged and accepted staff support during the session.",
    progress: "Member demonstrated measurable participation in treatment activities.",
    next: "Continue current treatment supports and monitor response.",
  };
}

function buildBhtDraft({
  memberName,
  diagnosis,
  title,
  noteType,
  noteDate,
  prompt,
  location,
  sessionFocus,
  presentingProblem,
  interventionsUsed,
  clientResponse,
  progressTowardsGoals,
  planNextSteps,
  riskLevel,
  shiftCoverage,
  shiftHours,
  didSelfAdminMedication,
  medicationPrompting,
  medicationPromptCount,
  medicationKnowledge,
  hasSevenDayMedicationSupply,
  completesAdls,
  adlPrompting,
  adlTasks,
  adlAssistanceType,
  completesIls,
  ilsPrompting,
  ilsActivity,
  participatedActivity,
  attendedAppointment,
  appointmentType,
  counsellingParticipation,
  refusalReason,
  behavioralIssues,
  dayShiftNotes,
  nightShiftNotes,
  nightShiftChecks,
  safetyCheckStatus,
  medicationObservation,
  behavioralRiskStatus,
  hygieneNutritionStatus,
  handoffStatus,
  additionalProgressNotes,
}) {
  if (noteType === "progress_note") {
    const safePrompt = (prompt || "").trim();
    const selectedMedicationKnowledge = Array.isArray(medicationKnowledge) ? medicationKnowledge.join(", ") : "";
    const selectedAdlTasks = Array.isArray(adlTasks) ? adlTasks.join(", ") : "";
    const selectedBehavioralIssues = Array.isArray(behavioralIssues) ? behavioralIssues.join(", ") : "";
    const formattedNightChecks = nightShiftChecks && typeof nightShiftChecks === "object"
      ? Object.entries(nightShiftChecks)
        .filter(([, value]) => value)
        .map(([time, value]) => `${time} - ${value}`)
        .join("; ")
      : "";

    const progressSummary = [
      `Progress Note`,
      `Date of Service: ${noteDate || new Date().toISOString().slice(0, 10)}`,
      `Member: ${memberName}`,
      `Diagnosis: ${diagnosis || "Not documented"}`,
      `Shift Coverage: ${shiftCoverage || "Not documented"}`,
      shiftHours ? `Shift Hours: ${shiftHours}` : "",
      didSelfAdminMedication ? `Client self-administered medication: ${didSelfAdminMedication}` : "",
      medicationPrompting ? `Medication prompts: ${medicationPrompting}${medicationPromptCount ? ` (${medicationPromptCount} prompts)` : ""}` : "",
      selectedMedicationKnowledge ? `Medication knowledge: ${selectedMedicationKnowledge}` : "",
      hasSevenDayMedicationSupply ? `7-day medication supply: ${hasSevenDayMedicationSupply}` : "",
      completesAdls ? `ADLs completed: ${completesAdls}` : "",
      adlPrompting ? `ADL prompting/assistance: ${adlPrompting}` : "",
      selectedAdlTasks ? `PCS tasks addressed: ${selectedAdlTasks}` : "",
      adlAssistanceType ? `ADL assistance provided with: ${adlAssistanceType}` : "",
      completesIls ? `ILS completed: ${completesIls}` : "",
      ilsPrompting ? `ILS prompting: ${ilsPrompting}` : "",
      ilsActivity ? `ILS activity: ${ilsActivity}` : "",
      participatedActivity ? `Activities participated in: ${participatedActivity}` : "",
      attendedAppointment ? `Attended appointment: ${attendedAppointment}` : "",
      appointmentType ? `Appointment type: ${appointmentType}` : "",
      counsellingParticipation ? `Counseling participation: ${counsellingParticipation}` : "",
      refusalReason ? `Refusal reason: ${refusalReason}` : "",
      selectedBehavioralIssues ? `Behavioral issues observed: ${selectedBehavioralIssues}` : "",
      safetyCheckStatus ? `Safety checks completed: ${safetyCheckStatus}` : "",
      medicationObservation ? `Medication observation: ${medicationObservation}` : "",
      behavioralRiskStatus ? `Behavioral risk status: ${behavioralRiskStatus}` : "",
      hygieneNutritionStatus ? `Hygiene/nutrition support: ${hygieneNutritionStatus}` : "",
      handoffStatus ? `Shift handoff status: ${handoffStatus}` : "",
      dayShiftNotes ? `Day shift notes: ${dayShiftNotes}` : "",
      formattedNightChecks ? `Night shift checks: ${formattedNightChecks}` : "",
      nightShiftNotes ? `Night shift notes: ${nightShiftNotes}` : "",
      additionalProgressNotes ? `Additional progress details: ${additionalProgressNotes}` : "",
      safePrompt ? `Staff input: ${safePrompt}` : "",
      "",
      `${memberName} received BHRF support during the documented shift. Staff monitored medication routines, ADL/ILS participation, behavioral presentation, and follow-through with scheduled activities and appointments. Support and observations were recorded based on the selected shift options and staff input above.`,
    ].filter(Boolean).join("\n");

    return {
      sessionFocus: "",
      presentingProblem: "",
      interventionsUsed: "",
      clientResponse: "",
      progressTowardsGoals: "",
      planNextSteps: "",
      notes: progressSummary,
    };
  }

  const guidance = pickDiagnosisGuidance(diagnosis);
  const safePrompt = (prompt || "").trim();
  const finalSessionFocus = sessionFocus || guidance.focus;
  const finalPresentingProblem = presentingProblem || `${memberName} continues to show symptoms related to ${diagnosis || "behavioral health needs"}.`;
  const finalInterventions = interventionsUsed || guidance.interventions;
  const finalResponse = clientResponse || guidance.response;
  const finalProgress = progressTowardsGoals || guidance.progress;
  const finalPlan = planNextSteps || guidance.next;

  const fullNote = [
    `${title || noteLabels[noteType] || "Behavioral Health Note"}`,
    `Date of Service: ${noteDate || new Date().toISOString().slice(0, 10)}`,
    `Member: ${memberName}`,
    `Diagnosis: ${diagnosis || "Not documented"}`,
    `Location: ${location || "Program setting"}`,
    `Risk Level: ${riskLevel || "Low"}`,
    "",
    `Session Focus/Goal: ${finalSessionFocus}`,
    `Presenting Problem: ${finalPresentingProblem}`,
    `Interventions Used: ${finalInterventions}`,
    `Client's Response: ${finalResponse}`,
    `Progress Towards Goals: ${finalProgress}`,
    `Plan/Next Step: ${finalPlan}`,
    safePrompt ? `Staff Input: ${safePrompt}` : "",
    "",
    `BHT Summary: Staff provided direct behavioral-health support using simple prompts and coping practice. ${memberName} remained safe during the session and participated in treatment-focused activities.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    sessionFocus: finalSessionFocus,
    presentingProblem: finalPresentingProblem,
    interventionsUsed: finalInterventions,
    clientResponse: finalResponse,
    progressTowardsGoals: finalProgress,
    planNextSteps: finalPlan,
    notes: fullNote,
  };
}

function buildDigitalSignature({ noteId, memberId, staffId, staffName, createdAt, title }) {
  const signaturePayload = `${noteId}|${memberId}|${staffId}|${createdAt}|${title}`;
  const signatureHash = crypto.createHash("sha256").update(signaturePayload).digest("hex");

  return {
    signedByStaffId: staffId,
    signedByName: staffName || "Staff",
    signedAt: new Date(createdAt).toISOString(),
    signatureHash,
  };
}

function buildSignedStructuredContent({
  content,
  noteDate,
  durationMinutes,
  intervention,
  response,
  plan,
  location,
  riskLevel,
  digitalSignature,
}) {
  const stampedNarrative = [
    content || "",
    "",
    `Time Stamp: ${digitalSignature.signedAt}`,
    `Digital Signature: ${digitalSignature.signedByName} (${digitalSignature.signedByStaffId})`,
    `Signature Hash: ${digitalSignature.signatureHash}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    noteDate: noteDate || new Date().toISOString(),
    durationMinutes: durationMinutes || null,
    intervention: intervention || "",
    response: response || "",
    plan: plan || "",
    location: location || "",
    riskLevel: riskLevel || "Low",
    clinicalNarrative: stampedNarrative,
    digitalSignature,
  };
}

router.get("/", async (req, res) => {
  const { memberId, staffId, type, search } = req.query;
  let query = "SELECT * FROM notes WHERE 1=1";
  const params = [];

  if (memberId) {
    query += " AND memberId = ?";
    params.push(memberId);
  }
  if (staffId) {
    query += " AND staffId = ?";
    params.push(staffId);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }
  if (search) {
    query += " AND (title LIKE ? OR content LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += " ORDER BY createdAt DESC";

  const notes = await all(query, params);
  res.json(notes);
});

router.get("/:id", async (req, res) => {
  const note = await get("SELECT * FROM notes WHERE id = ?", [req.params.id]);
  if (!note) {
    return res.status(404).json({ message: "Note not found." });
  }
  res.json(note);
});

router.post(
  "/ai-draft",
  [
    body("memberId").notEmpty(),
    body("type").optional().isIn(allowedTypes),
    body("prompt").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const member = await get("SELECT id, name, diagnosis FROM members WHERE id = ?", [req.body.memberId]);
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    const draft = buildBhtDraft({
      memberName: member.name,
      diagnosis: member.diagnosis,
      title: req.body.title,
      noteType: req.body.type || "counselling_note",
      noteDate: req.body.noteDate,
      prompt: req.body.prompt,
      location: req.body.location,
      sessionFocus: req.body.sessionFocus,
      presentingProblem: req.body.presentingProblem,
      interventionsUsed: req.body.interventionsUsed,
      clientResponse: req.body.clientResponse,
      progressTowardsGoals: req.body.progressTowardsGoals,
      planNextSteps: req.body.planNextSteps,
      riskLevel: req.body.riskLevel,
      shiftCoverage: req.body.shiftCoverage,
      shiftHours: req.body.shiftHours,
      didSelfAdminMedication: req.body.didSelfAdminMedication,
      medicationPrompting: req.body.medicationPrompting,
      medicationPromptCount: req.body.medicationPromptCount,
      medicationKnowledge: req.body.medicationKnowledge,
      hasSevenDayMedicationSupply: req.body.hasSevenDayMedicationSupply,
      completesAdls: req.body.completesAdls,
      adlPrompting: req.body.adlPrompting,
      adlTasks: req.body.adlTasks,
      adlAssistanceType: req.body.adlAssistanceType,
      completesIls: req.body.completesIls,
      ilsPrompting: req.body.ilsPrompting,
      ilsActivity: req.body.ilsActivity,
      participatedActivity: req.body.participatedActivity,
      attendedAppointment: req.body.attendedAppointment,
      appointmentType: req.body.appointmentType,
      counsellingParticipation: req.body.counsellingParticipation,
      refusalReason: req.body.refusalReason,
      behavioralIssues: req.body.behavioralIssues,
      dayShiftNotes: req.body.dayShiftNotes,
      nightShiftNotes: req.body.nightShiftNotes,
      nightShiftChecks: req.body.nightShiftChecks,
      safetyCheckStatus: req.body.safetyCheckStatus,
      medicationObservation: req.body.medicationObservation,
      behavioralRiskStatus: req.body.behavioralRiskStatus,
      hygieneNutritionStatus: req.body.hygieneNutritionStatus,
      handoffStatus: req.body.handoffStatus,
      additionalProgressNotes: req.body.additionalProgressNotes,
    });

    res.json({
      memberId: member.id,
      memberName: member.name,
      diagnosis: member.diagnosis || "",
      ...draft,
    });
  }
);

router.post(
  "/",
  [
    body("memberId").notEmpty(),
    body("staffId").notEmpty(),
    body("type").isIn(allowedTypes),
    body("title").notEmpty(),
    body("content").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { memberId, type, title, content, category, noteDate, durationMinutes, intervention, response, plan, location, riskLevel } = req.body;
    const authenticatedStaffId = req.user?.id;
    const authenticatedStaffName = req.user?.name;
    const id = `note-${Date.now()}`;
    const createdAt = Date.now();
    const digitalSignature = buildDigitalSignature({
      noteId: id,
      memberId,
      staffId: authenticatedStaffId,
      staffName: authenticatedStaffName,
      createdAt,
      title,
    });

    const shouldDigitallySign = digitallySignedNoteTypes.has(type);
    const noteContent = shouldDigitallySign
      ? JSON.stringify(
          buildSignedStructuredContent({
            content,
            noteDate,
            durationMinutes,
            intervention,
            response,
            plan,
            location,
            riskLevel,
            digitalSignature,
          })
        )
      : content;

    await run(
      `INSERT INTO notes (id, memberId, staffId, type, category, title, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, memberId, authenticatedStaffId, type, category || type, title, noteContent, createdAt, createdAt]
    );

    res.status(201).json({
      id,
      memberId,
      staffId: authenticatedStaffId,
      signedAt: shouldDigitallySign ? digitalSignature.signedAt : null,
      signatureHash: shouldDigitallySign ? digitalSignature.signatureHash : null,
      type,
      message: "Note created.",
    });
  }
);

router.put(
  "/:id",
  [
    body("title").optional().notEmpty(),
    body("content").optional().notEmpty(),
    body("type").optional().isIn(allowedTypes),
  ],
  async (req, res) => {
    const note = await get("SELECT * FROM notes WHERE id = ?", [req.params.id]);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const nextType = req.body.type || note.type;
    const shouldDigitallySign = digitallySignedNoteTypes.has(nextType);
    const authenticatedStaffId = req.user?.id;
    const authenticatedStaffName = req.user?.name;
    const signedAt = Date.now();
    const digitalSignature = buildDigitalSignature({
      noteId: note.id,
      memberId: note.memberId,
      staffId: authenticatedStaffId,
      staffName: authenticatedStaffName,
      createdAt: signedAt,
      title: req.body.title || note.title,
    });

    const updates = {
      title: req.body.title || note.title,
      content: shouldDigitallySign
        ? JSON.stringify(
            buildSignedStructuredContent({
              content: req.body.content || note.content,
              noteDate: req.body.noteDate,
              durationMinutes: req.body.durationMinutes,
              intervention: req.body.intervention,
              response: req.body.response,
              plan: req.body.plan,
              location: req.body.location,
              riskLevel: req.body.riskLevel,
              digitalSignature,
            })
          )
        : req.body.content || note.content,
      type: nextType,
      category: req.body.category || note.category,
      updatedAt: Date.now(),
    };

    await run(
      `UPDATE notes SET title = ?, content = ?, type = ?, category = ?, updatedAt = ? WHERE id = ?`,
      [updates.title, updates.content, updates.type, updates.category, updates.updatedAt, req.params.id]
    );

    res.json({ message: "Note updated." });
  }
);

router.delete("/:id", async (req, res) => {
  const note = await get("SELECT id FROM notes WHERE id = ?", [req.params.id]);
  if (!note) {
    return res.status(404).json({ message: "Note not found." });
  }

  await run("DELETE FROM notes WHERE id = ?", [req.params.id]);
  res.json({ message: "Note deleted." });
});

module.exports = router;
