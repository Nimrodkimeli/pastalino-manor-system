import { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Select, FormControl, InputLabel, Checkbox, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api, { clearSession, getSession } from "../api";
import { openRecordPrintView } from "../utils/printRecord";

const noteTypes = [
  { value: "group_note", label: "Group Note" },
  { value: "counselling_note", label: "Individual Counseling" },
  { value: "progress_note", label: "Progress Note" },
  { value: "art_meeting", label: "Art Meeting" },
];

const noteTypeLabelMap = noteTypes.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const durationOptions = Array.from({ length: 48 }, (_, index) => (index + 1) * 15);
const progressDateOptions = Array.from({ length: 31 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return date.toISOString().slice(0, 10);
});

const progressShiftOptions = ["Day Shift", "Night Shift", "Day and Night Shift"];
const progressShiftHourOptions = ["6:00AM - 6:00PM", "6:00PM - 6:00AM"];
const medicationPromptOptions = ["With Prompts", "Without Prompts"];
const medicationPromptCountOptions = Array.from({ length: 11 }, (_, index) => String(index));
const yesNoOptions = ["Yes", "No"];
const counsellingOptions = ["No", "Individual", "Group", "Both"];
const pcsTaskOptions = [
  "Bathing",
  "Dressing",
  "Grooming",
  "Toileting",
  "Meal Preparation",
  "Feeding Support",
  "Medication Reminders",
  "Mobility Assistance",
  "Transfers",
  "Laundry",
  "Housekeeping",
  "Shopping/Errands",
  "Transportation Support",
  "Budgeting Support",
  "Community Integration",
  "Safety Monitoring",
  "Appointment Coordination",
  "Behavioral Redirection",
];
const adlAssistanceOptions = [
  "Bathing",
  "Dressing",
  "Grooming",
  "Oral Hygiene",
  "Toileting",
  "Incontinence Care",
  "Ambulation",
  "Transfers",
  "Meal Setup",
  "Eating",
  "Medication Routine",
];
const ilsActivityOptions = [
  "Meal Planning",
  "Cooking",
  "Cleaning",
  "Laundry",
  "Money Management",
  "Budgeting",
  "Medication Management",
  "Time Management",
  "Use of Public Transportation",
  "Shopping",
  "Phone Skills",
  "Scheduling Appointments",
  "Problem Solving",
  "Home Safety Skills",
  "Social Skills Practice",
  "Coping Skills Practice",
];
const bhrfActivityOptions = [
  "Medication Education",
  "Psychoeducation Group",
  "Coping Skills Practice",
  "Symptom Management",
  "Stress Management",
  "Relaxation Exercise",
  "Deep Breathing",
  "Grounding Activity",
  "Life Skills Training",
  "ADL Skills Practice",
  "ILS Skills Practice",
  "Meal Preparation",
  "Housekeeping",
  "Laundry",
  "Community Outing",
  "Recreational Activity",
  "Exercise/Walking",
  "Peer Interaction",
  "Social Skills Group",
  "Arts and Crafts",
  "Music Activity",
  "Journaling",
  "Goal Review",
  "Relapse Prevention",
  "Crisis Prevention Planning",
  "Wellness Check-In",
  "Independent Leisure",
  "Spiritual Activity",
  "Volunteer Activity",
  "Job Readiness Activity",
];
const appointmentOptions = [
  "Primary Care",
  "Psychiatry",
  "Therapy",
  "Individual Counseling",
  "Group Counseling",
  "Medication Management",
  "Case Management",
  "Dental",
  "Vision",
  "Lab Work",
  "Behavioral Health Intake",
  "Substance Use Treatment",
  "Neurology",
  "Cardiology",
  "Endocrinology",
  "Pain Management",
  "Physical Therapy",
  "Occupational Therapy",
  "Court/Probation",
  "DES/AHCCCS Review",
  "Vocational/Rehabilitation",
  "Housing Appointment",
  "Other Community Provider",
];
const nightShiftCheckOptions = [
  "In bed with eyes closed",
  "Awake",
  "Screaming",
  "Tossing and turning",
  "Sleeping calmly",
  "Watching TV",
  "Pacing",
  "Restless",
  "Using restroom",
  "Talking to self",
  "Requesting staff support",
  "Eating/snacking",
  "Crying",
  "Agitated",
  "Off unit with staff",
];
const nightShiftCheckFields = [
  { key: "nightCheck10pm", label: "10:00 PM" },
  { key: "nightCheck12am", label: "12:00 AM" },
  { key: "nightCheck2am", label: "2:00 AM" },
  { key: "nightCheck4am", label: "4:00 AM" },
  { key: "nightCheck6am", label: "6:00 AM" },
];
const behavioralIssueOptions = [
  "Aggression",
  "Agitation",
  "Anger Outburst",
  "Anxiety",
  "Argumentative Behavior",
  "Attention-Seeking",
  "Confusion",
  "Crying Spells",
  "Defiance",
  "Delusional Thinking",
  "Depressed Mood",
  "Disorganized Behavior",
  "Disruptive Behavior",
  "Elopement Risk",
  "Hallucinations",
  "Hoarding",
  "Impulsivity",
  "Irritability",
  "Isolation/Withdrawal",
  "Noncompliance",
  "Pacing",
  "Paranoia",
  "Poor Boundaries",
  "Property Destruction",
  "Refusal of Care",
  "Restlessness",
  "Self-Injurious Behavior",
  "Sleep Disturbance",
  "Verbal Aggression",
  "Wandering",
];
const progressCheckFields = [
  { key: "safetyCheckStatus", label: "Safety Checks Completed", options: ["Completed", "Partially Completed", "Not Completed"] },
  { key: "medicationObservation", label: "Medication Observation", options: ["Observed and Documented", "Refused/Deferred", "Not Applicable"] },
  { key: "behavioralRiskStatus", label: "Behavioral Risk Status", options: ["No Acute Risk", "Elevated Risk", "Crisis Response Activated"] },
  { key: "hygieneNutritionStatus", label: "Hygiene/Nutrition Support", options: ["Independent", "Prompting Required", "Hands-on Support"] },
  { key: "handoffStatus", label: "Shift Handoff Status", options: ["Completed", "Pending", "Not Completed"] },
];

const mentalStatusFields = [
  {
    key: "appearance",
    label: "Appearance",
    options: ["Well-groomed", "Appropriate attire", "Casual dress", "Disheveled", "Poor hygiene", "Unkempt"],
  },
  {
    key: "behavior",
    label: "Behavior",
    options: ["Calm", "Cooperative", "Guarded", "Restless", "Withdrawn", "Agitated"],
  },
  {
    key: "mood",
    label: "Mood",
    options: ["Euthymic", "Anxious", "Depressed", "Irritable", "Sad", "Labile"],
  },
  {
    key: "affect",
    label: "Affect",
    options: ["Appropriate", "Congruent", "Flat", "Blunted", "Constricted", "Labile"],
  },
  {
    key: "speech",
    label: "Speech",
    options: ["Clear", "Normal rate", "Soft", "Slow", "Pressured", "Slurred"],
  },
  {
    key: "thoughtProcess",
    label: "Thought Process",
    options: ["Linear", "Goal-directed", "Circumstantial", "Tangential", "Disorganized", "Flight of ideas"],
  },
  {
    key: "cognition",
    label: "Cognition",
    options: ["Alert", "Oriented x4", "Distracted", "Confused", "Impaired memory", "Limited concentration"],
  },
  {
    key: "insight",
    label: "Insight",
    options: ["Good", "Fair", "Limited", "Poor", "Minimal awareness"],
  },
  {
    key: "judgment",
    label: "Judgment",
    options: ["Good", "Fair", "Impaired", "Poor", "Needs redirection"],
  },
];

const formatDurationLabel = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  if (!remainingMinutes) {
    return hourLabel;
  }

  return `${hourLabel} ${remainingMinutes} minutes`;
};

const createInitialForm = (memberId = "", staffId = "") => ({
  memberId,
  staffId,
  type: "counselling_note",
  title: "",
  content: "",
  clinicalTeamPresent: "",
  noteDate: "",
  durationMinutes: "",
  location: "",
  riskLevel: "Low",
  groupMembers: [],
  sessionFocus: "",
  presentingProblem: "",
  appearance: "",
  behavior: "",
  mood: "",
  affect: "",
  speech: "",
  thoughtProcess: "",
  cognition: "",
  insight: "",
  judgment: "",
  interventionsUsed: "",
  clientResponse: "",
  progressTowardsGoals: "",
  planNextSteps: "",
  shiftCoverage: "",
  shiftHours: "",
  didSelfAdminMedication: "",
  medicationPrompting: "",
  medicationPromptCount: "",
  medKnowledgeName: false,
  medKnowledgeDose: false,
  medKnowledgeSideEffect: false,
  medKnowledgePurpose: false,
  medKnowledgeNone: false,
  hasSevenDayMedicationSupply: "",
  completesAdls: "",
  adlPrompting: "",
  adlTask1: "",
  adlTask2: "",
  adlTask3: "",
  adlAssistanceType: "",
  completesIls: "",
  ilsPrompting: "",
  ilsActivity: "",
  participatedActivity: "",
  attendedAppointment: "",
  appointmentType: "",
  counsellingParticipation: "",
  refusalReason: "",
  behavioralIssues: [],
  behavioralIssueOther: "",
  dayShiftNotes: "",
  nightShiftNotes: "",
  nightCheck10pm: "",
  nightCheck12am: "",
  nightCheck2am: "",
  nightCheck4am: "",
  nightCheck6am: "",
  safetyCheckStatus: "",
  medicationObservation: "",
  behavioralRiskStatus: "",
  hygieneNutritionStatus: "",
  handoffStatus: "",
  additionalProgressNotes: "",
});

export default function NotesPage() {
  const navigate = useNavigate();
  const session = getSession();
  const staffDisplayName = session?.name || "Staff";
  const [notes, setNotes] = useState([]);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [members, setMembers] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [isAddNoteExpanded, setIsAddNoteExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [staffPosition, setStaffPosition] = useState("BHT");
  const [aiDraft, setAiDraft] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [printPageSize, setPrintPageSize] = useState("A4");
  const [saveError, setSaveError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("counselling_note");
  const [editContent, setEditContent] = useState("");
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const activeStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [form, setForm] = useState(() => createInitialForm("", session?.id || "user-staff-1"));
  const isArtMeeting = form.type === "art_meeting";
  const isProgressNote = form.type === "progress_note";

  const loadMembers = async () => {
    const response = await api.get("/members");
    setMembers(response.data);
    setForm((prev) => {
      if (!response.data.length) {
        return prev;
      }

      const selectedMemberExists = response.data.some((member) => member.id === prev.memberId);
      if (selectedMemberExists) {
        return prev;
      }

      return { ...prev, memberId: response.data[0].id };
    });
  };

  const loadNotes = async (memberId = form.memberId) => {
    const response = await api.get("/notes", { params: { memberId } });
    setNotes(response.data);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    const loadStaffProfile = async () => {
      if (!session?.id) {
        return;
      }

      try {
        const response = await api.get(`/staff/${session.id}`);
        setStaffProfile(response.data);
        const normalizedTitle = ["BHT", "Manager", "Administrator"].find((title) => title.toLowerCase() === String(response.data?.title || "").toLowerCase());
        if (normalizedTitle) {
          setStaffPosition(normalizedTitle);
        }
      } catch {
        setStaffProfile(null);
      }
    };

    loadStaffProfile();
  }, [session?.id]);

  useEffect(() => {
    if (form.memberId) {
      loadNotes(form.memberId);
    }
  }, [form.memberId]);

  useEffect(() => {
    const loadDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter((device) => device.kind === "audioinput");
        setAudioDevices(microphones);
        if (!selectedDeviceId && microphones[0]) {
          setSelectedDeviceId(microphones[0].deviceId);
        }
      } catch (error) {
        console.warn("Unable to list microphone devices", error);
      }
    };

    loadDevices();
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    activeStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (staffProfile?.name) {
      return;
    }

    if (session?.name && session.name !== form.staffId) {
      setForm((prev) => ({ ...prev, staffId: session.name }));
    }
  }, [form.staffId, session?.name, staffProfile?.name]);

  const buildArtMeetingText = (summary, currentForm = form) => {
    return [
      "Art Meeting Notes",
      `Title: ${currentForm.title || "Art Meeting"}`,
      `Date: ${currentForm.noteDate || new Date().toISOString().slice(0, 10)}`,
      `Clinical Team Present: ${currentForm.clinicalTeamPresent || "Not provided"}`,
      "Summary of the Meeting:",
      summary || currentForm.content || "No summary recorded yet.",
    ].join("\n\n");
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const handleArrayCheckboxChange = (field, option) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.checked
        ? [...prev[field], option]
        : prev[field].filter((value) => value !== option),
    }));
  };

  const renderInlineSelect = (label, field, options, minWidth = 180) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <FormControl size="small" sx={{ minWidth }}>
        <Select value={form[field]} onChange={handleChange(field)}>
          <MenuItem value="">Select</MenuItem>
          {options.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  const renderInlineTextField = (label, field, minWidth = 220) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <TextField size="small" value={form[field]} onChange={handleChange(field)} sx={{ minWidth }} />
    </Box>
  );

  const handleStartRecording = async () => {
    setSpeechError("");
    setAudioUrl("");
    setAudioBlob(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia) {
      setSpeechError("This browser does not support microphone recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });

      activeStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        if (blob.size) {
          const nextUrl = URL.createObjectURL(blob);
          setAudioUrl(nextUrl);
        }
        activeStreamRef.current?.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current?.stop();
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let finalTranscript = "";
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            const text = result[0].transcript.trim();
            if (result.isFinal) {
              finalTranscript += `${finalTranscript ? " " : ""}${text}`;
            }
          }

          if (finalTranscript) {
            setSpeechTranscript((prev) => {
              const nextValue = `${prev} ${finalTranscript}`.trim();
              setForm((current) => ({ ...current, content: nextValue }));
              return nextValue;
            });
          }
        };

        recognition.onerror = (event) => {
          if (event.error && !["no-speech", "aborted", "not-allowed"].includes(event.error)) {
            setSpeechError(`Transcript issue: ${event.error}`);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (error) {
      setSpeechError(error.name === "NotAllowedError"
        ? "Microphone access was denied. Please allow microphone access and try again."
        : `Recording could not start: ${error.message || error.name}`);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleSaveWord = () => {
    const content = form.type === "art_meeting" ? buildArtMeetingText(speechTranscript || form.content) : form.content || "";
    const blob = new Blob([content], { type: "text/rtf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(form.title || "art-meeting").toLowerCase().replace(/\s+/g, "-") || "art-meeting"}.rtf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAudio = () => {
    if (!audioBlob) {
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(form.title || "art-meeting").toLowerCase().replace(/\s+/g, "-") || "art-meeting"}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGroupMemberToggle = (memberId) => {
    setForm((prev) => {
      const nextMembers = prev.groupMembers.includes(memberId)
        ? prev.groupMembers.filter((id) => id !== memberId)
        : [...prev.groupMembers, memberId];
      return { ...prev, groupMembers: nextMembers };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const extractNoteText = (note) => {
    if (!note?.content) {
      return "";
    }

    try {
      const parsed = JSON.parse(note.content);
      if (parsed?.clinicalNarrative) {
        return parsed.clinicalNarrative;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return note.content;
    }
  };

  const isNoteDigitallySigned = (note) => {
    if (!note?.content) {
      return false;
    }

    try {
      const parsed = JSON.parse(note.content);
      if (parsed?.digitalSignature?.signatureHash) {
        return true;
      }
      if (typeof parsed?.clinicalNarrative === "string" && parsed.clinicalNarrative.includes("Signature Hash:")) {
        return true;
      }
    } catch {
      if (typeof note.content === "string" && note.content.includes("Signature Hash:")) {
        return true;
      }
    }

    return false;
  };

  const handlePrintNote = (note) => {
    const selectedMember = members.find((member) => member.id === note.memberId);
    const memberName = selectedMember?.name || note.memberId;
    openRecordPrintView({
      title: note.title || "Behavioral Health Note",
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      noteType: note.type,
      headerLabel: noteTypeLabelMap[note.type] || "Behavioral Health Note",
      organizationName: "Pastalino Manor LLC",
      organizationFontSize: 48,
      titleFontSize: 24,
      metaLeftLabel: "Member Name",
      metaLeftValue: memberName,
      metaRightLabel: "Date of Birth",
      metaRightValue: selectedMember?.dob || "",
      renderBodyAsSections: true,
      pageSize: printPageSize,
      fields: [
        { label: "Type", value: note.type },
        { label: "Member", value: memberName },
        { label: "Writer", value: note.staffId },
        { label: "Created", value: note.createdAt ? new Date(note.createdAt).toLocaleString() : "" },
      ],
      body: extractNoteText(note),
    });
  };

  const handleToggleNoteExpansion = (noteId) => {
    setExpandedNoteId((prev) => (prev === noteId ? null : noteId));
  };

  const handleOpenAddNote = () => {
    setIsAddNoteExpanded(false);
    setOpen(true);
  };

  const handleCloseAddNote = () => {
    setOpen(false);
    setIsAddNoteExpanded(false);
  };

  const handleOpenEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title || "");
    setEditType(note.type || "counselling_note");
    setEditContent(extractNoteText(note) || "");
    setIsEditOpen(true);
  };

  const handleSaveEditedNote = async () => {
    if (!editingNoteId || !editContent.trim()) {
      return;
    }

    await api.put(`/notes/${editingNoteId}`, {
      title: editTitle.trim() || "Behavioral Health Note",
      type: editType,
      category: editType,
      content: editContent,
    });

    setIsEditOpen(false);
    setEditingNoteId("");
    await loadNotes(form.memberId);
  };

  const handleDeleteNote = async (note) => {
    const shouldDelete = window.confirm(`Delete note \"${note.title || "Untitled Note"}\"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    await api.delete(`/notes/${note.id}`);
    if (expandedNoteId === note.id) {
      setExpandedNoteId(null);
    }
    await loadNotes(form.memberId);
  };

  const handleAiDraft = async () => {
    setAiError("");
    setAiLoading(true);

    const medicationKnowledgeSummary = [
      form.medKnowledgeName ? "Name" : "",
      form.medKnowledgeDose ? "Dose" : "",
      form.medKnowledgeSideEffect ? "Side Effect" : "",
      form.medKnowledgePurpose ? "Purpose of Medication" : "",
      form.medKnowledgeNone ? "None" : "",
    ].filter(Boolean);

    const behavioralIssuesSummary = [
      ...form.behavioralIssues,
      form.behavioralIssueOther ? `Other: ${form.behavioralIssueOther}` : "",
    ].filter(Boolean);

    try {
      const response = await api.post("/notes/ai-draft", {
        memberId: form.memberId,
        type: form.type,
        title: form.title,
        noteDate: form.noteDate,
        location: form.location,
        riskLevel: form.riskLevel,
        prompt: aiPrompt,
        sessionFocus: form.sessionFocus,
        presentingProblem: form.presentingProblem,
        interventionsUsed: form.interventionsUsed,
        clientResponse: form.clientResponse,
        progressTowardsGoals: form.progressTowardsGoals,
        planNextSteps: form.planNextSteps,
        shiftCoverage: form.shiftCoverage,
        shiftHours: form.shiftHours,
        didSelfAdminMedication: form.didSelfAdminMedication,
        medicationPrompting: form.medicationPrompting,
        medicationPromptCount: form.medicationPromptCount,
        medicationKnowledge: medicationKnowledgeSummary,
        hasSevenDayMedicationSupply: form.hasSevenDayMedicationSupply,
        completesAdls: form.completesAdls,
        adlPrompting: form.adlPrompting,
        adlTasks: [form.adlTask1, form.adlTask2, form.adlTask3].filter(Boolean),
        adlAssistanceType: form.adlAssistanceType,
        completesIls: form.completesIls,
        ilsPrompting: form.ilsPrompting,
        ilsActivity: form.ilsActivity,
        participatedActivity: form.participatedActivity,
        attendedAppointment: form.attendedAppointment,
        appointmentType: form.appointmentType,
        counsellingParticipation: form.counsellingParticipation,
        refusalReason: form.refusalReason,
        behavioralIssues: behavioralIssuesSummary,
        dayShiftNotes: form.dayShiftNotes,
        nightShiftNotes: form.nightShiftNotes,
        nightShiftChecks: {
          "10:00 PM": form.nightCheck10pm,
          "12:00 AM": form.nightCheck12am,
          "2:00 AM": form.nightCheck2am,
          "4:00 AM": form.nightCheck4am,
          "6:00 AM": form.nightCheck6am,
        },
        safetyCheckStatus: form.safetyCheckStatus,
        medicationObservation: form.medicationObservation,
        behavioralRiskStatus: form.behavioralRiskStatus,
        hygieneNutritionStatus: form.hygieneNutritionStatus,
        handoffStatus: form.handoffStatus,
        additionalProgressNotes: form.additionalProgressNotes,
      });

      const draft = response.data;
      setAiDraft(draft.notes || "");
      setForm((prev) => ({
        ...prev,
        sessionFocus: draft.sessionFocus || prev.sessionFocus,
        presentingProblem: draft.presentingProblem || prev.presentingProblem,
        interventionsUsed: draft.interventionsUsed || prev.interventionsUsed,
        clientResponse: draft.clientResponse || prev.clientResponse,
        progressTowardsGoals: draft.progressTowardsGoals || prev.progressTowardsGoals,
        planNextSteps: draft.planNextSteps || prev.planNextSteps,
        content: form.type === "progress_note" ? prev.content : draft.notes || prev.content,
        additionalProgressNotes: form.type === "progress_note" ? draft.notes || prev.additionalProgressNotes : prev.additionalProgressNotes,
      }));
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error;

      if (status === 401 || status === 403) {
        clearSession();
        setAiError("Your session expired. Please sign in again.");
        navigate("/login", { replace: true });
      } else {
        setAiError(message || "AI draft could not be generated.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaveError("");

    const mentalStatusSummary = mentalStatusFields
      .map(({ key, label }) => (form[key] ? `${label}: ${form[key]}` : ""))
      .filter(Boolean)
      .join("; ");

    const progressChecksSummary = progressCheckFields
      .map(({ key, label }) => (form[key] ? `${label}: ${form[key]}` : ""))
      .filter(Boolean)
      .join("; ");

    const medicationKnowledgeSummary = [
      form.medKnowledgeName ? "Name" : "",
      form.medKnowledgeDose ? "Dose" : "",
      form.medKnowledgeSideEffect ? "Side Effect" : "",
      form.medKnowledgePurpose ? "Purpose of Medication" : "",
      form.medKnowledgeNone ? "None" : "",
    ].filter(Boolean).join(", ");

    const adlTaskSummary = [form.adlTask1, form.adlTask2, form.adlTask3].filter(Boolean).join(", ");
    const behavioralIssuesSummary = [
      ...form.behavioralIssues,
      form.behavioralIssueOther ? `Other: ${form.behavioralIssueOther}` : "",
    ].filter(Boolean).join(", ");
    const nightShiftChecksSummary = nightShiftCheckFields
      .map(({ key, label }) => (form[key] ? `${label}: ${form[key]}` : ""))
      .filter(Boolean)
      .join("; ");

    const structuredContent = form.type === "art_meeting"
      ? [
        form.clinicalTeamPresent ? `Clinical Team Present: ${form.clinicalTeamPresent}` : "",
        form.content ? `Summary of the Meeting: ${form.content}` : "",
      ].filter(Boolean).join("\n\n")
      : form.type === "progress_note"
        ? [
          `Date: ${form.noteDate || new Date().toISOString().slice(0, 10)}`,
          form.shiftHours ? `Shift Hours: ${form.shiftHours}` : "",
          `Shift Coverage: ${form.shiftCoverage || "Not documented"}`,
          form.didSelfAdminMedication ? `Did Client Self-Administer Medication?: ${form.didSelfAdminMedication}` : "",
          form.medicationPrompting ? `Prompts: ${form.medicationPrompting}` : "",
          form.medicationPromptCount ? `Number of Prompts: ${form.medicationPromptCount}` : "",
          medicationKnowledgeSummary ? `Client Knows Regarding Medications: ${medicationKnowledgeSummary}` : "",
          form.hasSevenDayMedicationSupply ? `Does Client Have 7-Day Medication Supply?: ${form.hasSevenDayMedicationSupply}` : "",
          form.completesAdls ? `Does Client Complete ADL's?: ${form.completesAdls}` : "",
          form.adlPrompting ? `ADL Prompting/Assistance: ${form.adlPrompting}` : "",
          adlTaskSummary ? `PCS Tasks: ${adlTaskSummary}` : "",
          form.adlAssistanceType ? `ADL Assistance Provided With: ${form.adlAssistanceType}` : "",
          form.completesIls ? `Did Client Complete ILS?: ${form.completesIls}` : "",
          form.ilsPrompting ? `ILS Prompting: ${form.ilsPrompting}` : "",
          form.ilsActivity ? `ILS Activity: ${form.ilsActivity}` : "",
          form.participatedActivity ? `Activities Participated In: ${form.participatedActivity}` : "",
          form.attendedAppointment ? `Did Client Attend Any Appointment?: ${form.attendedAppointment}` : "",
          form.appointmentType ? `Appointment Type: ${form.appointmentType}` : "",
          form.counsellingParticipation ? `Did Client Participate In Counseling?: ${form.counsellingParticipation}` : "",
          form.refusalReason ? `If Refused, Reason: ${form.refusalReason}` : "",
          behavioralIssuesSummary ? `Behavioral Issues Observed: ${behavioralIssuesSummary}` : "",
          form.dayShiftNotes ? `Day Shift Notes: ${form.dayShiftNotes}` : "",
          nightShiftChecksSummary ? `Night Shift Checks: ${nightShiftChecksSummary}` : "",
          form.nightShiftNotes ? `Night Shift Notes: ${form.nightShiftNotes}` : "",
          progressChecksSummary ? `Compliance and Checks: ${progressChecksSummary}` : "",
          form.additionalProgressNotes ? `Additional Progress Notes: ${form.additionalProgressNotes}` : "",
        ].filter(Boolean).join("\n\n")
      : [
        form.content ? `Mental Status: ${form.content}` : "",
        mentalStatusSummary ? `Mental Status Details: ${mentalStatusSummary}` : "",
        form.sessionFocus ? `Session Focus/Goal: ${form.sessionFocus}` : "",
        form.presentingProblem ? `Presenting Problem: ${form.presentingProblem}` : "",
        form.interventionsUsed ? `Interventions Used: ${form.interventionsUsed}` : "",
        form.clientResponse ? `Client's Response: ${form.clientResponse}` : "",
        form.progressTowardsGoals ? `Progress Towards Goals: ${form.progressTowardsGoals}` : "",
        form.planNextSteps ? `Plan/Next Step: ${form.planNextSteps}` : "",
        form.type === "group_note"
          ? `Group attendees: ${form.groupMembers.map((id) => members.find((member) => member.id === id)?.name || id).join(", ") || "None selected"}`
          : "",
      ].filter(Boolean).join("\n\n");

    const nextMemberId = form.memberId || members[0]?.id || "";
    const nextStaffId = form.staffId || session?.id || staffProfile?.id || "user-staff-1";
    const payload = {
      ...form,
      memberId: nextMemberId,
      staffId: nextStaffId,
      title: (form.title || "").trim() || noteTypeLabelMap[form.type] || "Behavioral Health Note",
      content: structuredContent,
    };

    try {
      await api.post("/notes", payload);
      handleCloseAddNote();
      setSpeechTranscript("");
      setSpeechError("");
      setAudioBlob(null);
      setAudioUrl("");
      setForm(createInitialForm(nextMemberId, nextStaffId));
      loadNotes(nextMemberId);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || "Unable to save the note.";
      setSaveError(message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Behavioral Health Notes</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handlePrint}>
            Print Notes
          </Button>
          <Button variant="contained" onClick={handleOpenAddNote}>
            Add Note
          </Button>
        </Stack>
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Notes for {members.find((member) => member.id === form.memberId)?.name || "selected member"}
        </Typography>
        <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel id="notes-print-size-label">Print size</InputLabel>
          <Select labelId="notes-print-size-label" value={printPageSize} label="Print size" onChange={(event) => setPrintPageSize(event.target.value)}>
            <MenuItem value="A4">A4</MenuItem>
            <MenuItem value="Letter">Letter</MenuItem>
            <MenuItem value="Legal">Legal</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="member-notes-select-label">Select member</InputLabel>
          <Select labelId="member-notes-select-label" value={form.memberId} label="Select member" onChange={handleChange("memberId")}>
            {members.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folder</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>Writer</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Signed</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Record Export</TableCell>
              <TableCell>Manage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notes.map((note) => [
                <TableRow key={`${note.id}-row`}>
                  <TableCell>{note.type === "group_note" ? "Group Note" : note.type === "counselling_note" ? "Individual Counseling" : note.type}</TableCell>
                  <TableCell>{note.title}</TableCell>
                  <TableCell>{note.memberId}</TableCell>
                  <TableCell>{note.staffId}</TableCell>
                  <TableCell>{note.createdAt ? new Date(note.createdAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    {isNoteDigitallySigned(note) ? (
                      <Chip label="Signed" color="success" size="small" />
                    ) : (
                      <Chip label="Unsigned" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => handleToggleNoteExpansion(note.id)}>
                      {expandedNoteId === note.id ? "Minimize" : "Expand"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => handlePrintNote(note)}>
                      Read / Print
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => handleOpenEditNote(note)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteNote(note)}>
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>,
                expandedNoteId === note.id ? (
                  <TableRow key={`${note.id}-expanded`}>
                    <TableCell colSpan={9}>
                      <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#fafafa" }}>
                        <Typography variant="subtitle2" mb={1}>Note Preview</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {extractNoteText(note) || "No note content."}
                        </Typography>
                      </Paper>
                    </TableCell>
                  </TableRow>
                ) : null,
            ])}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} fullWidth />
            <TextField select label="Type" value={editType} onChange={(event) => setEditType(event.target.value)}>
              {noteTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Note Content"
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              multiline
              minRows={8}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEditedNote} disabled={!editContent.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={open}
        onClose={handleCloseAddNote}
        fullWidth
        maxWidth={isAddNoteExpanded ? false : "lg"}
        fullScreen={isAddNoteExpanded}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6">Add Behavioral Health Note</Typography>
            <Button size="small" variant="outlined" onClick={() => setIsAddNoteExpanded((prev) => !prev)}>
              {isAddNoteExpanded ? "Minimize" : "Expand"}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <Paper variant="outlined" sx={{ width: { xs: "100%", md: "210mm" }, minHeight: { xs: "auto", md: "297mm" }, mx: "auto", mt: 1, p: { xs: 2, md: 3 }, backgroundColor: "#fff" }}>
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "2.25rem", md: "48px" }, lineHeight: 1, textTransform: "uppercase" }}>
                  Pastalino Manor LLC
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select value={form.type} onChange={handleChange("type")} sx={{ fontSize: "24px", fontWeight: 700, height: 44, textAlign: "center" }}>
                      {noteTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                {isProgressNote ? (
                  <Box sx={{ display: "grid", mt: 1, gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Name:</Typography>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select value={form.memberId} onChange={handleChange("memberId")} sx={{ fontSize: "14px", height: 34 }}>
                          {members.map((member) => (
                            <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
                      <TextField select size="small" label="Date" value={form.noteDate} onChange={handleChange("noteDate")}>
                        <MenuItem value="">Select</MenuItem>
                        {progressDateOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                      <TextField select size="small" label="Shift" value={form.shiftCoverage} onChange={handleChange("shiftCoverage")}>
                        <MenuItem value="">Select</MenuItem>
                        {progressShiftOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                      <TextField select size="small" label="Shift Hours" value={form.shiftHours} onChange={handleChange("shiftHours")}>
                        <MenuItem value="">Select</MenuItem>
                        {progressShiftHourOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 1fr) auto minmax(220px, 1fr)" }, alignItems: "center", mt: 1, gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Name:</Typography>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select value={form.memberId} onChange={handleChange("memberId")} sx={{ fontSize: "14px", height: 34 }}>
                          {members.map((member) => (
                            <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Typography sx={{ fontSize: "14px", fontWeight: 500, textAlign: "center" }}>
                      Date of Birth: {members.find((member) => member.id === form.memberId)?.dob || ""}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Duration:</Typography>
                      <TextField
                        select
                        size="small"
                        value={form.durationMinutes}
                        onChange={handleChange("durationMinutes")}
                        sx={{ width: 130 }}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {durationOptions.map((minutes) => (
                          <MenuItem key={minutes} value={String(minutes)}>
                            {formatDurationLabel(minutes)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                )}
              </Box>

              {!isProgressNote && (
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Session Title
                  </Typography>
                  <TextField value={form.title} onChange={handleChange("title")} fullWidth />
                </Box>
              )}
            {isArtMeeting ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button variant="contained" color="secondary" onClick={handleStartRecording} disabled={isRecording}>
                      {isRecording ? "Recording..." : "Start Recording"}
                    </Button>
                    <Button variant="outlined" onClick={handleStopRecording} disabled={!isRecording}>
                      Stop Recording
                    </Button>
                    <Button variant="outlined" onClick={handleSaveWord}>
                      Save as Word
                    </Button>
                    <Button variant="outlined" onClick={handleSaveAudio} disabled={!audioBlob}>
                      Save Audio
                    </Button>
                  </Stack>
                  {audioDevices.length > 0 && (
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel id="audio-device-select-label">Microphone</InputLabel>
                      <Select labelId="audio-device-select-label" value={selectedDeviceId} label="Microphone" onChange={(event) => setSelectedDeviceId(event.target.value)}>
                        {audioDevices.map((device) => (
                          <MenuItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {speechError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{speechError}</Typography>}
                  {speechTranscript && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: "#f8fafc" }}>
                      <Typography variant="subtitle2" mb={1}>Voice to Text Transcript</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{speechTranscript}</Typography>
                    </Paper>
                  )}
                  {audioUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" mb={0.5}>Recorded Audio</Typography>
                      <audio controls src={audioUrl} style={{ width: "100%" }} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    List of Clinical Team Present
                  </Typography>
                  <TextField value={form.clinicalTeamPresent} onChange={handleChange("clinicalTeamPresent")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Summary of the Meeting
                  </Typography>
                  <TextField value={form.content} onChange={handleChange("content")} multiline rows={5} fullWidth />
                </Box>
              </Box>
            ) : (
              <>
                <TextField label="AI note input" value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} multiline rows={2} fullWidth helperText="Enter brief staff details. AI will generate a full BHT-level note based on member diagnosis." />
                <Button variant="outlined" onClick={handleAiDraft} disabled={aiLoading || !form.memberId}>
                  {aiLoading ? "Generating..." : "Generate Full AI Note"}
                </Button>
                {aiError && <Typography color="error" variant="body2">{aiError}</Typography>}
                {aiDraft && (
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#f8fafc" }}>
                    <Typography variant="subtitle2" mb={1}>Draft preview</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{aiDraft}</Typography>
                  </Paper>
                )}
              </>
            )}
            {form.type === "group_note" && (
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  Group member checklist
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {members.map((member) => (
                    <FormControlLabel
                      key={member.id}
                      control={<Checkbox checked={form.groupMembers.includes(member.id)} onChange={() => handleGroupMemberToggle(member.id)} />}
                      label={member.name}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {!isArtMeeting && !isProgressNote && (
              <>
                <TextField label="Location" value={form.location} onChange={handleChange("location")} fullWidth />
                <TextField select label="Risk Level" value={form.riskLevel} onChange={handleChange("riskLevel")}>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </TextField>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Session Focus / Goal
                  </Typography>
                  <TextField value={form.sessionFocus} onChange={handleChange("sessionFocus")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Presenting Problem
                  </Typography>
                  <TextField value={form.presentingProblem} onChange={handleChange("presentingProblem")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Mental Status
                  </Typography>
                  <TextField value={form.content} onChange={handleChange("content")} multiline rows={4} fullWidth />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
                    {mentalStatusFields.map((field) => (
                      <TextField
                        key={field.key}
                        select
                        label={field.label}
                        value={form[field.key]}
                        onChange={handleChange(field.key)}
                        InputLabelProps={{ sx: { fontWeight: 700 } }}
                        fullWidth
                      >
                        <MenuItem value="">Select</MenuItem>
                        {field.options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Interventions Used
                  </Typography>
                  <TextField value={form.interventionsUsed} onChange={handleChange("interventionsUsed")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Client's Response
                  </Typography>
                  <TextField value={form.clientResponse} onChange={handleChange("clientResponse")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Progress Towards Goals
                  </Typography>
                  <TextField value={form.progressTowardsGoals} onChange={handleChange("progressTowardsGoals")} multiline rows={2} fullWidth />
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontSize: "20px", fontWeight: 700, mb: 1 }}>
                    Plan / Next Step
                  </Typography>
                  <TextField value={form.planNextSteps} onChange={handleChange("planNextSteps")} multiline rows={2} fullWidth />
                </Box>
              </>
            )}
            {isProgressNote && (
              <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 1, p: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Self-Administer Medication?
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={form.didSelfAdminMedication} onChange={handleChange("didSelfAdminMedication")}>
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Prompts
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select value={form.medicationPrompting} onChange={handleChange("medicationPrompting")}>
                        <MenuItem value="">Select</MenuItem>
                        {medicationPromptOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Number of Prompts
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select value={form.medicationPromptCount} onChange={handleChange("medicationPromptCount")}>
                        <MenuItem value="">Select</MenuItem>
                        {medicationPromptCountOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "nowrap", overflowX: "auto" }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                    Client Knows Regarding Medications:
                  </Typography>
                  <FormControlLabel
                    sx={{ m: 0, whiteSpace: "nowrap" }}
                    control={<Checkbox checked={form.medKnowledgeName} onChange={handleCheckboxChange("medKnowledgeName")} />}
                    label="Name"
                  />
                  <FormControlLabel
                    sx={{ m: 0, whiteSpace: "nowrap" }}
                    control={<Checkbox checked={form.medKnowledgeDose} onChange={handleCheckboxChange("medKnowledgeDose")} />}
                    label="Dose"
                  />
                  <FormControlLabel
                    sx={{ m: 0, whiteSpace: "nowrap" }}
                    control={<Checkbox checked={form.medKnowledgeSideEffect} onChange={handleCheckboxChange("medKnowledgeSideEffect")} />}
                    label="Side Effect"
                  />
                  <FormControlLabel
                    sx={{ m: 0, whiteSpace: "nowrap" }}
                    control={<Checkbox checked={form.medKnowledgePurpose} onChange={handleCheckboxChange("medKnowledgePurpose")} />}
                    label="Purpose of Medication"
                  />
                  <FormControlLabel
                    sx={{ m: 0, whiteSpace: "nowrap" }}
                    control={<Checkbox checked={form.medKnowledgeNone} onChange={handleCheckboxChange("medKnowledgeNone")} />}
                    label="None"
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("7-Day Medication Supply?", "hasSevenDayMedicationSupply", yesNoOptions, 120)}
                  {renderInlineSelect("Client Complete ADL's?", "completesAdls", yesNoOptions, 120)}
                  {renderInlineSelect("ADL Prompting/Assistance", "adlPrompting", ["Without Prompts", "With Prompts", "With Assistance"], 170)}
                  {renderInlineSelect("ADL Assistance Type", "adlAssistanceType", adlAssistanceOptions, 180)}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("Task 1", "adlTask1", pcsTaskOptions, 160)}
                  {renderInlineSelect("Task 2", "adlTask2", pcsTaskOptions, 160)}
                  {renderInlineSelect("Task 3", "adlTask3", pcsTaskOptions, 160)}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("Client Complete ILS?", "completesIls", yesNoOptions, 120)}
                  {renderInlineSelect("ILS Prompting", "ilsPrompting", ["Without Prompts", "With Prompts"], 170)}
                  {renderInlineSelect("ILS Activity", "ilsActivity", ilsActivityOptions, 180)}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("Activities Participated In", "participatedActivity", bhrfActivityOptions, 220)}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("Client Attend Appointment?", "attendedAppointment", yesNoOptions, 120)}
                  {renderInlineSelect("Which Appointment", "appointmentType", appointmentOptions, 180)}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {renderInlineSelect("Counseling Participation", "counsellingParticipation", counsellingOptions, 140)}
                  {renderInlineTextField("If Refused, Why", "refusalReason", 220)}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 1 }}>
                    Indicate Any Behavioral Issues
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                    {behavioralIssueOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        sx={{ m: 0, whiteSpace: "nowrap" }}
                        control={<Checkbox checked={form.behavioralIssues.includes(option)} onChange={handleArrayCheckboxChange("behavioralIssues", option)} />}
                        label={option}
                      />
                    ))}
                    <TextField
                      size="small"
                      label="Other"
                      value={form.behavioralIssueOther}
                      onChange={handleChange("behavioralIssueOther")}
                      sx={{ minWidth: 220 }}
                    />
                  </Box>
                </Box>
                {(form.shiftCoverage === "Day Shift" || form.shiftCoverage === "Day and Night Shift") && (
                  <TextField
                    label="Day Shift Notes"
                    value={form.dayShiftNotes}
                    onChange={handleChange("dayShiftNotes")}
                    multiline
                    rows={3}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
                {(form.shiftCoverage === "Night Shift" || form.shiftCoverage === "Day and Night Shift") && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                      {nightShiftCheckFields.map((field) => (
                        <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {field.label}
                          </Typography>
                          <FormControl size="small" sx={{ minWidth: 220 }}>
                            <Select value={form[field.key]} onChange={handleChange(field.key)}>
                              <MenuItem value="">Select</MenuItem>
                              {nightShiftCheckOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ))}
                    </Box>
                    <TextField
                      label="Night Shift Notes"
                      value={form.nightShiftNotes}
                      onChange={handleChange("nightShiftNotes")}
                      multiline
                      rows={3}
                      fullWidth
                    />
                  </Box>
                )}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {progressCheckFields.map((field) => (
                    <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {field.label}
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={form[field.key]} onChange={handleChange(field.key)}>
                          <MenuItem value="">Select</MenuItem>
                          {field.options.map((option) => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </Box>
                <TextField
                  label="Additional Progress Notes"
                  value={form.additionalProgressNotes}
                  onChange={handleChange("additionalProgressNotes")}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            )}
            <Box sx={{ borderTop: "1px solid #cbd5e1", pt: 2, mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>Staff Name</Typography>
                  <Typography sx={{ fontSize: "14px" }}>{staffProfile?.name || form.staffId || staffDisplayName}</Typography>
                </Box>
                <Box sx={{ minWidth: 180, textAlign: "center", flex: 1 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>Position</Typography>
                  <FormControl size="small" sx={{ minWidth: 180, mt: 0.5 }}>
                    <Select value={staffPosition} onChange={(event) => setStaffPosition(event.target.value)} sx={{ fontSize: "14px", height: 34 }}>
                      <MenuItem value="BHT">BHT</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="Administrator">Administrator</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 220, textAlign: "right" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>Date</Typography>
                  <Typography sx={{ fontSize: "14px" }}>{form.noteDate || new Date().toISOString().slice(0, 10)}</Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, mt: 1 }}>Digital Signature</Typography>
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: 700,
                      lineHeight: 1.1,
                      fontFamily: '"Dreaming Outloud Script Pro", "Brush Script MT", "Segoe Script", cursive',
                    }}
                  >
                    {staffProfile?.name || form.staffId || staffDisplayName}
                  </Typography>
                </Box>
              </Box>
            </Box>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddNote}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isArtMeeting ? !form.content : isProgressNote ? !form.shiftCoverage || !form.shiftHours : !form.title || !form.content}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
