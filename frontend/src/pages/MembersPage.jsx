import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getSession } from "../api";
import { openRecordPrintView } from "../utils/printRecord";

const symptomOptions = [
  "Denied current symptoms",
  "Anxiety",
  "Depressed mood",
  "Irritability",
  "Mood swings",
  "Panic attacks",
  "Sleep disturbance",
  "Fatigue",
  "Poor concentration",
  "Hopelessness",
  "Paranoia",
  "Hallucinations",
  "Delusional thoughts",
  "Racing thoughts",
  "Impulse control issues",
  "Anger outbursts",
  "Social withdrawal",
  "Low motivation",
  "Appetite changes",
  "Suicidal ideation",
  "Self-harm urges",
];

const triggerOptions = [
  "Family conflict",
  "Relationship stress",
  "Financial stress",
  "Housing instability",
  "Legal issues",
  "Work-related stress",
  "School-related stress",
  "Medication non-adherence",
  "Substance use",
  "Withdrawal symptoms",
  "Sleep deprivation",
  "Health concerns",
  "Trauma reminders",
  "Loud noises/crowds",
  "Change in routine",
  "Loneliness/isolation",
  "Peer conflict",
  "Authority conflict",
  "Anniversary dates",
  "Loss/grief",
];

const coOccurringOptions = ["SUD", "Psychosis", "Depression", "Anxiety", "Bipolar", "PTSD", "Personality Disorder", "Cognitive Disorder", "None"];
const livingEnvironmentOptions = ["Independent living", "Family home", "Group home", "Shelter", "Transitional housing", "Assisted living", "Homeless/unsheltered", "Correctional setting", "Other"];
const legalHistoryOptions = ["N/A", "None reported", "Pending charges", "Probation", "Parole", "Court ordered treatment", "Other"];
const guardianshipOptions = ["N/A", "Self", "Family guardian", "Public guardian", "Agency guardian", "Other"];
const militaryHistoryOptions = ["N/A", "No military history", "Veteran", "Active duty", "Reserve/National Guard", "Unknown"];
const yesNoUnsureOptions = ["Yes", "No", "Unsure"];
const recreationalOptions = ["Games", "Cards", "TV", "Movies", "Walking", "Reading", "Music", "Arts/Crafts", "Exercise", "Cooking", "Social groups", "Prayer/Spiritual activity"];

const emptyTreatmentPlanRow = {
  presentingIssues: "",
  goal: "",
  service: "",
  methods: "",
  frequency: "",
  progressCommunication: "",
  extra: [],
};

const getDefaultDischargeAppointments = () => [
  { name: "Primary Care Appointment (within 7 days)", provider: "", date: "", time: "" },
  { name: "ART (Adult Recovery Team) Meeting", provider: "", date: "", time: "" },
  { name: "Case Management Appointment", provider: "", date: "", time: "" },
  { name: "Group Therapy Appointment", provider: "", date: "", time: "" },
  { name: "Individual Therapy Appointment", provider: "", date: "", time: "" },
  { name: "Peer Support Appointment", provider: "", date: "", time: "" },
  { name: "Psychiatric Medication Appointment", provider: "", date: "", time: "" },
  { name: "Additional Appointment 1", provider: "", date: "", time: "" },
  { name: "Additional Appointment 2", provider: "", date: "", time: "" },
];

const buildComprehensiveAssessmentTemplate = ({ memberName, memberDob, assessmentDate, cot, expirationDate, copyInChart }) => {
  return [
    "YOUR RECOVERY GOALS (what do you want life to look like in the future?)",
    "",
    "Client to work towards maintaining stable housing and mental health status.",
    "",
    `COT: ${cot || "Yes/No"}   Expiration Date: ${expirationDate || "__________________"}   Copy in chart: ${copyInChart || "Yes/No"}`,
    "",
    "Client is [age] year old [ethnicity] [gender] presenting [in-person/virtually] to complete intake needs.",
    "Client to readmit to residential level of care to maintain (Circle all that apply):",
    "- Medication compliance",
    "- Psychoeducation pertaining to psychiatric diagnosis",
    "- Functionality in social setting",
    "",
    "MSE",
    "Speech: Normal / Pressured",
    "Affect: Full / Constricted / Flat",
    "Mood: Euthymic / Anxious / Angry / Depressed / Irritable",
    "Cognition: Memory intact/impaired, Attention normal/distracted",
    "Perception: Hallucinations none/AVH, depersonalization, derealization",
    "Judgment: Good / Fair / Poor",
    "Insight: Good / Fair / Poor",
    "Behavior: Cooperative / Aggressive / Hyperactive / Guarded / Paranoid / Bizarre / Withdrawn",
    "",
    "Diagnosis (noted in hospital documents):",
    "",
    `Member Name: ${memberName || ""}`,
    `D.O.B: ${memberDob || ""}`,
    `Assessment Date: ${assessmentDate || new Date().toISOString().slice(0, 10)}`,
    "",
    "A. Symptoms reported by resident:",
    "Denied current symptoms.",
    "",
    "B. Triggers:",
    "None / If yes, list:",
    "",
    "C. Behavioral Health HX:",
    "Psych provider:",
    "PCP:",
    "HX of self-harming BX:",
    "HX of SA:",
    "HX of AVH/current:",
    "Current SI/HI:",
    "",
    "D. Substance abuse history (include current use and history):",
    "",
    "E. Co-occurring disorder:",
    "",
    "F. Hospitalizations in the last year (psych and medical):",
    "",
    "G. Living environment (prior to admission):",
    "",
    "H. Medications (as noted in hospital documents):",
    "",
    "I. Medical concerns and treatment:",
    "",
    "J. Legal history:",
    "",
    "K. Guardianship info:",
    "",
    "L. Military history:",
    "",
    "M. Family history (marital status, children, parents, siblings):",
    "Family HX of mental illness/substance use/abuse:",
    "HX of traumatic events (physical, sexual, emotional, verbal):",
    "",
    "N. Social support:",
    "",
    "O. Educational and work history:",
    "Does resident want to return to work or school and why:",
    "",
    "P. Allergies (food and medication):",
    "",
    "Q. Recreational activities:",
    "",
    "R. Cultural preferences (religion, diet, holidays, language, identity):",
    "",
    "S. Strengths:",
    "",
    "T. Recommendations:",
    "1.",
    "2.",
    "3.",
    "4.",
    "",
    "Resident and/or representative participated in this assessment: Yes / No",
    "",
    "Client Signature: ____________________________ Date: ____________________",
    "Representative Name/Signature: ____________________________ Date: __________",
    "",
    "Assessment completed by:",
    "Name/Credentials: ____________________________ Date: __________",
    "Signature: ____________________________",
  ].join("\n");
};

export default function MembersPage() {
  const session = getSession();
  const canAddClients = session?.role === "admin" || session?.role === "staff";
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("Member File");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [memberCreateMessage, setMemberCreateMessage] = useState("");
  const [memberCreateForm, setMemberCreateForm] = useState({
    name: "",
    dob: "",
    guardian: "",
    insurance: "",
    physician: "",
  });
  const [clinicalForm, setClinicalForm] = useState({
    assessment: "",
    treatmentPlan: "",
    dischargePlanning: "",
    assessmentType: "Initial",
    assessmentDate: "",
    assessmentCot: "",
    assessmentExpirationDate: "",
    assessmentCopyInChart: "",
    assessmentClientHistory: "",
    assessmentSymptoms: "",
    assessmentTriggerStatus: "",
    assessmentTriggerType: "",
    assessmentBehavioralHealthHistory: "",
    assessmentSubstanceAbuseHistory: "",
    assessmentCoOccurringDisorders: [],
    assessmentHospitalizations: "",
    assessmentLivingEnvironment: "",
    assessmentLivingEnvironmentDetails: "",
    assessmentMedications: "",
    assessmentMedicalConcerns: "",
    assessmentLegalHistory: "",
    assessmentLegalHistoryDetails: "",
    assessmentGuardianshipInfo: "",
    assessmentGuardianshipDetails: "",
    assessmentMilitaryHistory: "",
    assessmentMilitaryHistoryDetails: "",
    assessmentFamilyHistory: "",
    assessmentFamilyMhSudAbuse: "",
    assessmentTraumaHistory: "",
    assessmentSocialSupport: "",
    assessmentEducationWorkHistory: "",
    assessmentReturnWorkSchool: "",
    assessmentReturnWorkSchoolWhy: "",
    assessmentAllergies: "",
    assessmentRecreationalActivities: [],
    assessmentRecreationalOther: "",
    assessmentCulturalPreferences: "",
    assessmentStrengths: "",
    assessmentRecommendations: "",
    assessmentResidentParticipation: "",
    treatmentPlanType: "Initial",
    treatmentPlanDate: "",
    treatmentPlanRows: [{ ...emptyTreatmentPlanRow }],
    treatmentPlanExtraColumns: [],
    dischargePlanningType: "Initial",
    dischargePlanningDate: "",
    dischargeGender: "",
    dischargeCoe: false,
    dischargeCoeDate: "",
    dischargeCot: false,
    dischargeVoluntary: false,
    dischargeCurrentFacilityInformation: "Pastalino Manor",
    dischargeReturningResidence: "",
    dischargePsychiatricDiagnosis: "",
    dischargeMedicalDiagnosis: "",
    dischargeMedications: "SEE MARS",
    dischargeIdentifiedStrengths: "",
    dischargeNaturalSupports: "",
    dischargeCulturalPriorities: "",
    dischargeReadinessHygiene: "",
    dischargeReadinessMeds: "",
    dischargeReadinessFireSafety: "",
    dischargeReadinessMoodStability: "",
    dischargeReadinessFamilyInvolved: "",
    dischargeRecommendations: "",
    dischargeAftercareFamilyPeer: "",
    dischargeAftercareOutpatientTherapies: "",
    dischargeAftercareMedicationManagement: "",
    dischargeAftercareCommunitySupports: "",
    dischargeAppointments: getDefaultDischargeAppointments(),
    dischargeSignatureClinician: "",
    dischargePrintNameClinician: "",
    dischargeDateClinician: "",
    dischargeSignatureAdministrator: "",
    dischargePrintNameAdministrator: "",
    dischargeDateAdministrator: "",
    dischargeParticipationAcknowledged: false,
    dischargeSignatureResident: "",
    dischargePrintNameResident: "",
    dischargeDateResident: "",
    dischargeSignatureRepresentative: "",
    dischargePrintNameRepresentative: "",
    dischargeDateRepresentative: "",
  });
  const [incidentForm, setIncidentForm] = useState({
    incidentType: "General",
    incidentDate: "",
    description: "",
    witnesses: "",
    immediateActions: "",
    notifications: "",
    followUp: "",
    correctiveActions: "",
  });
  const [incidents, setIncidents] = useState([]);
  const [clinicalMessages, setClinicalMessages] = useState({
    assessment: "",
    treatmentPlan: "",
    dischargePlanning: "",
  });
  const [incidentMessage, setIncidentMessage] = useState("");
  const [savingClinicalField, setSavingClinicalField] = useState("");
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [printPageSize, setPrintPageSize] = useState("A4");

  const openFaceSheetForMember = (memberId) => {
    navigate(`/members/face-sheet?memberId=${encodeURIComponent(memberId)}`);
  };

  const parseAssessmentValue = (value) => {
    if (!value) {
      return {
        assessmentType: "Initial",
        assessmentDate: "",
        assessmentCot: "",
        assessmentExpirationDate: "",
        assessmentCopyInChart: "",
        assessmentClientHistory: "",
        assessmentSymptoms: "",
        assessmentTriggerStatus: "",
        assessmentTriggerType: "",
        assessmentBehavioralHealthHistory: "",
        assessmentSubstanceAbuseHistory: "",
        assessmentCoOccurringDisorders: [],
        assessmentHospitalizations: "",
        assessmentLivingEnvironment: "",
        assessmentLivingEnvironmentDetails: "",
        assessmentMedications: "",
        assessmentMedicalConcerns: "",
        assessmentLegalHistory: "",
        assessmentLegalHistoryDetails: "",
        assessmentGuardianshipInfo: "",
        assessmentGuardianshipDetails: "",
        assessmentMilitaryHistory: "",
        assessmentMilitaryHistoryDetails: "",
        assessmentFamilyHistory: "",
        assessmentFamilyMhSudAbuse: "",
        assessmentTraumaHistory: "",
        assessmentSocialSupport: "",
        assessmentEducationWorkHistory: "",
        assessmentReturnWorkSchool: "",
        assessmentReturnWorkSchoolWhy: "",
        assessmentAllergies: "",
        assessmentRecreationalActivities: [],
        assessmentRecreationalOther: "",
        assessmentCulturalPreferences: "",
        assessmentStrengths: "",
        assessmentRecommendations: "",
        assessmentResidentParticipation: "",
        assessmentBody: "",
      };
    }

    const typeMatch = value.match(/Assessment Type:\s*(Initial|Update)/i);
    const dateMatch = value.match(/Assessment Date:\s*([^\n]+)/i);
    const cotMatch = value.match(/COT:\s*(Yes|No)/i);
    const expirationMatch = value.match(/Expiration Date:\s*([^\n|]+)/i);
    const copyInChartMatch = value.match(/Copy in Chart:\s*(Yes|No)/i);
    const clientHistoryMatch = value.match(/Client History:\s*([^\n]*)/i);
    const symptomsMatch = value.match(/Symptoms Reported by Resident:\s*([^\n]*)/i);
    const triggerStatusMatch = value.match(/Triggers:\s*([^\n]*)/i);
    const triggerTypeMatch = value.match(/Trigger Type:\s*([^\n]*)/i);
    const behavioralHxMatch = value.match(/Behavioral Health Hx:\s*([^\n]*)/i);
    const substanceHxMatch = value.match(/Substance Abuse History:\s*([^\n]*)/i);
    const coOccurringMatch = value.match(/Co-occurring Disorder:\s*([^\n]*)/i);
    const hospitalizationMatch = value.match(/Hospitalizations in Last Year:\s*([^\n]*)/i);
    const livingEnvironmentMatch = value.match(/Living Environment Prior to Admission:\s*([^\n]*)/i);
    const livingEnvironmentDetailsMatch = value.match(/Living Environment Details:\s*([^\n]*)/i);
    const medicationsMatch = value.match(/Medications \(Hospital Documents\):\s*([^\n]*)/i);
    const medicalConcernsMatch = value.match(/Medical Concerns and Treatment:\s*([^\n]*)/i);
    const legalHistoryMatch = value.match(/Legal History:\s*([^\n]*)/i);
    const legalHistoryDetailsMatch = value.match(/Legal History Details:\s*([^\n]*)/i);
    const guardianshipMatch = value.match(/Guardianship Info:\s*([^\n]*)/i);
    const guardianshipDetailsMatch = value.match(/Guardianship Details:\s*([^\n]*)/i);
    const militaryMatch = value.match(/Military History:\s*([^\n]*)/i);
    const militaryDetailsMatch = value.match(/Military History Details:\s*([^\n]*)/i);
    const familyHistoryMatch = value.match(/Family History:\s*([^\n]*)/i);
    const familyMhSudMatch = value.match(/Family MH\/SUD\/Abuse History:\s*([^\n]*)/i);
    const traumaHistoryMatch = value.match(/Trauma History:\s*([^\n]*)/i);
    const socialSupportMatch = value.match(/Social Support:\s*([^\n]*)/i);
    const educationWorkMatch = value.match(/Educational and Work History:\s*([^\n]*)/i);
    const returnWorkSchoolMatch = value.match(/Return to Work\/School Interest:\s*([^\n]*)/i);
    const returnWorkSchoolWhyMatch = value.match(/Return to Work\/School Why:\s*([^\n]*)/i);
    const allergiesMatch = value.match(/Allergies:\s*([^\n]*)/i);
    const recreationalMatch = value.match(/Recreational Activities:\s*([^\n]*)/i);
    const recreationalOtherMatch = value.match(/Recreational Other:\s*([^\n]*)/i);
    const culturalMatch = value.match(/Cultural Preferences:\s*([^\n]*)/i);
    const strengthsMatch = value.match(/Strengths:\s*([^\n]*)/i);
    const recommendationsMatch = value.match(/Recommendations:\s*([^\n]*)/i);
    const residentParticipationMatch = value.match(/Resident\/Representative Participated:\s*([^\n]*)/i);
    const bodyMatch = value.match(/Assessment Notes:\s*([\s\S]*)$/i);

    return {
      assessmentType: typeMatch ? (typeMatch[1].toLowerCase() === "update" ? "Update" : "Initial") : "Initial",
      assessmentDate: dateMatch ? dateMatch[1].trim() : "",
      assessmentCot: cotMatch ? cotMatch[1].trim() : "",
      assessmentExpirationDate: expirationMatch ? expirationMatch[1].trim() : "",
      assessmentCopyInChart: copyInChartMatch ? copyInChartMatch[1].trim() : "",
      assessmentClientHistory: clientHistoryMatch ? clientHistoryMatch[1].trim() : "",
      assessmentSymptoms: symptomsMatch ? symptomsMatch[1].trim() : "",
      assessmentTriggerStatus: triggerStatusMatch ? triggerStatusMatch[1].trim() : "",
      assessmentTriggerType: triggerTypeMatch ? triggerTypeMatch[1].trim() : "",
      assessmentBehavioralHealthHistory: behavioralHxMatch ? behavioralHxMatch[1].trim() : "",
      assessmentSubstanceAbuseHistory: substanceHxMatch ? substanceHxMatch[1].trim() : "",
      assessmentCoOccurringDisorders: coOccurringMatch ? coOccurringMatch[1].split(",").map((item) => item.trim()).filter(Boolean) : [],
      assessmentHospitalizations: hospitalizationMatch ? hospitalizationMatch[1].trim() : "",
      assessmentLivingEnvironment: livingEnvironmentMatch ? livingEnvironmentMatch[1].trim() : "",
      assessmentLivingEnvironmentDetails: livingEnvironmentDetailsMatch ? livingEnvironmentDetailsMatch[1].trim() : "",
      assessmentMedications: medicationsMatch ? medicationsMatch[1].trim() : "",
      assessmentMedicalConcerns: medicalConcernsMatch ? medicalConcernsMatch[1].trim() : "",
      assessmentLegalHistory: legalHistoryMatch ? legalHistoryMatch[1].trim() : "",
      assessmentLegalHistoryDetails: legalHistoryDetailsMatch ? legalHistoryDetailsMatch[1].trim() : "",
      assessmentGuardianshipInfo: guardianshipMatch ? guardianshipMatch[1].trim() : "",
      assessmentGuardianshipDetails: guardianshipDetailsMatch ? guardianshipDetailsMatch[1].trim() : "",
      assessmentMilitaryHistory: militaryMatch ? militaryMatch[1].trim() : "",
      assessmentMilitaryHistoryDetails: militaryDetailsMatch ? militaryDetailsMatch[1].trim() : "",
      assessmentFamilyHistory: familyHistoryMatch ? familyHistoryMatch[1].trim() : "",
      assessmentFamilyMhSudAbuse: familyMhSudMatch ? familyMhSudMatch[1].trim() : "",
      assessmentTraumaHistory: traumaHistoryMatch ? traumaHistoryMatch[1].trim() : "",
      assessmentSocialSupport: socialSupportMatch ? socialSupportMatch[1].trim() : "",
      assessmentEducationWorkHistory: educationWorkMatch ? educationWorkMatch[1].trim() : "",
      assessmentReturnWorkSchool: returnWorkSchoolMatch ? returnWorkSchoolMatch[1].trim() : "",
      assessmentReturnWorkSchoolWhy: returnWorkSchoolWhyMatch ? returnWorkSchoolWhyMatch[1].trim() : "",
      assessmentAllergies: allergiesMatch ? allergiesMatch[1].trim() : "",
      assessmentRecreationalActivities: recreationalMatch ? recreationalMatch[1].split(",").map((item) => item.trim()).filter(Boolean) : [],
      assessmentRecreationalOther: recreationalOtherMatch ? recreationalOtherMatch[1].trim() : "",
      assessmentCulturalPreferences: culturalMatch ? culturalMatch[1].trim() : "",
      assessmentStrengths: strengthsMatch ? strengthsMatch[1].trim() : "",
      assessmentRecommendations: recommendationsMatch ? recommendationsMatch[1].trim() : "",
      assessmentResidentParticipation: residentParticipationMatch ? residentParticipationMatch[1].trim() : "",
      assessmentBody: bodyMatch ? bodyMatch[1].trim() : value,
    };
  };

  const buildAssessmentValue = (
    memberName,
    memberDob,
    assessmentType,
    assessmentDate,
    assessmentCot,
    assessmentExpirationDate,
    assessmentCopyInChart,
    assessmentClientHistory,
    assessmentSymptoms,
    assessmentTriggerStatus,
    assessmentTriggerType,
    assessmentBehavioralHealthHistory,
    assessmentSubstanceAbuseHistory,
    assessmentCoOccurringDisorders,
    assessmentHospitalizations,
    assessmentLivingEnvironment,
    assessmentLivingEnvironmentDetails,
    assessmentMedications,
    assessmentMedicalConcerns,
    assessmentLegalHistory,
    assessmentLegalHistoryDetails,
    assessmentGuardianshipInfo,
    assessmentGuardianshipDetails,
    assessmentMilitaryHistory,
    assessmentMilitaryHistoryDetails,
    assessmentFamilyHistory,
    assessmentFamilyMhSudAbuse,
    assessmentTraumaHistory,
    assessmentSocialSupport,
    assessmentEducationWorkHistory,
    assessmentReturnWorkSchool,
    assessmentReturnWorkSchoolWhy,
    assessmentAllergies,
    assessmentRecreationalActivities,
    assessmentRecreationalOther,
    assessmentCulturalPreferences,
    assessmentStrengths,
    assessmentRecommendations,
    assessmentResidentParticipation,
    assessmentBody
  ) => {
    return [
      "Pastalino Manor LLC",
      "Assessment",
      `Member Name: ${memberName || ""}`,
      `D.O.B: ${memberDob || ""}`,
      `Assessment Type: ${assessmentType || "Initial"}`,
      `Assessment Date: ${assessmentDate || new Date().toISOString().slice(0, 10)}`,
      `COT: ${assessmentCot || ""} | Expiration Date: ${assessmentExpirationDate || ""} | Copy in Chart: ${assessmentCopyInChart || ""}`,
      `Client History: ${assessmentClientHistory || ""}`,
      `Symptoms Reported by Resident: ${assessmentSymptoms || ""}`,
      `Triggers: ${assessmentTriggerStatus || ""}`,
      `Trigger Type: ${assessmentTriggerType || ""}`,
      `Behavioral Health Hx: ${assessmentBehavioralHealthHistory || ""}`,
      `Substance Abuse History: ${assessmentSubstanceAbuseHistory || ""}`,
      `Co-occurring Disorder: ${Array.isArray(assessmentCoOccurringDisorders) ? assessmentCoOccurringDisorders.join(", ") : ""}`,
      `Hospitalizations in Last Year: ${assessmentHospitalizations || ""}`,
      `Living Environment Prior to Admission: ${assessmentLivingEnvironment || ""}`,
      `Living Environment Details: ${assessmentLivingEnvironmentDetails || ""}`,
      `Medications (Hospital Documents): ${assessmentMedications || ""}`,
      `Medical Concerns and Treatment: ${assessmentMedicalConcerns || ""}`,
      `Legal History: ${assessmentLegalHistory || ""}`,
      `Legal History Details: ${assessmentLegalHistoryDetails || ""}`,
      `Guardianship Info: ${assessmentGuardianshipInfo || ""}`,
      `Guardianship Details: ${assessmentGuardianshipDetails || ""}`,
      `Military History: ${assessmentMilitaryHistory || ""}`,
      `Military History Details: ${assessmentMilitaryHistoryDetails || ""}`,
      `Family History: ${assessmentFamilyHistory || ""}`,
      `Family MH/SUD/Abuse History: ${assessmentFamilyMhSudAbuse || ""}`,
      `Trauma History: ${assessmentTraumaHistory || ""}`,
      `Social Support: ${assessmentSocialSupport || ""}`,
      `Educational and Work History: ${assessmentEducationWorkHistory || ""}`,
      `Return to Work/School Interest: ${assessmentReturnWorkSchool || ""}`,
      `Return to Work/School Why: ${assessmentReturnWorkSchoolWhy || ""}`,
      `Allergies: ${assessmentAllergies || ""}`,
      `Recreational Activities: ${Array.isArray(assessmentRecreationalActivities) ? assessmentRecreationalActivities.join(", ") : ""}`,
      `Recreational Other: ${assessmentRecreationalOther || ""}`,
      `Cultural Preferences: ${assessmentCulturalPreferences || ""}`,
      `Strengths: ${assessmentStrengths || ""}`,
      `Recommendations: ${assessmentRecommendations || ""}`,
      `Resident/Representative Participated: ${assessmentResidentParticipation || ""}`,
      "Assessment Notes:",
      assessmentBody || "",
    ].join("\n");
  };

  const parseTreatmentPlanValue = (value) => {
    if (!value) {
      return {
        treatmentPlanType: "Initial",
        treatmentPlanDate: "",
        treatmentPlanBody: "",
        treatmentPlanRows: [{ ...emptyTreatmentPlanRow }],
        treatmentPlanExtraColumns: [],
      };
    }

    const typeMatch = value.match(/Treatment Plan Type:\s*(Initial|Update|Review)/i);
    const dateMatch = value.match(/Treatment Plan Date:\s*([^\n]+)/i);
    const tableJsonMatch = value.match(/Treatment Plan Table \(JSON\):\s*([\s\S]*?)\nTreatment Plan Details:/i);

    let parsedRows = [{ ...emptyTreatmentPlanRow }];
    let parsedExtraColumns = [];
    if (tableJsonMatch?.[1]) {
      try {
        const candidate = JSON.parse(tableJsonMatch[1].trim());
        if (Array.isArray(candidate) && candidate.length > 0) {
          parsedRows = candidate.map((row) => ({
            presentingIssues: row?.presentingIssues || "",
            goal: row?.goal || "",
            service: row?.service || "",
            methods: row?.methods || "",
            frequency: row?.frequency || "",
            progressCommunication: row?.progressCommunication || "",
            extra: Array.isArray(row?.extra) ? row.extra : [],
          }));
        } else if (candidate && typeof candidate === "object") {
          parsedExtraColumns = Array.isArray(candidate.extraColumns) ? candidate.extraColumns.filter(Boolean) : [];
          if (Array.isArray(candidate.rows) && candidate.rows.length > 0) {
            parsedRows = candidate.rows.map((row) => ({
              presentingIssues: row?.presentingIssues || "",
              goal: row?.goal || "",
              service: row?.service || "",
              methods: row?.methods || "",
              frequency: row?.frequency || "",
              progressCommunication: row?.progressCommunication || "",
              extra: Array.isArray(row?.extra) ? row.extra : [],
            }));
          }
        }
      } catch {
        parsedRows = [{ ...emptyTreatmentPlanRow }];
        parsedExtraColumns = [];
      }
    }

    // Backward compatibility for older single-row format.
    const presentingIssuesMatch = value.match(/Presenting Issues:\s*([^\n]*)/i);
    const goalMatch = value.match(/Goal:\s*([^\n]*)/i);
    const serviceMatch = value.match(/Treatment Plan\/Service:\s*([^\n]*)/i);
    const methodsMatch = value.match(/Treatment Methods:\s*([^\n]*)/i);
    const frequencyMatch = value.match(/Frequency of Each Treatment:\s*([^\n]*)/i);
    const progressCommunicationMatch = value.match(/Methods\/Frequency of Comm Client Progress:\s*([^\n]*)/i);

    const hasLegacyRow = presentingIssuesMatch || goalMatch || serviceMatch || methodsMatch || frequencyMatch || progressCommunicationMatch;
    if (!tableJsonMatch && hasLegacyRow) {
      parsedRows = [{
        presentingIssues: presentingIssuesMatch ? presentingIssuesMatch[1].trim() : "",
        goal: goalMatch ? goalMatch[1].trim() : "",
        service: serviceMatch ? serviceMatch[1].trim() : "",
        methods: methodsMatch ? methodsMatch[1].trim() : "",
        frequency: frequencyMatch ? frequencyMatch[1].trim() : "",
        progressCommunication: progressCommunicationMatch ? progressCommunicationMatch[1].trim() : "",
        extra: [],
      }];
    }

    const bodyMatch = value.match(/Treatment Plan Details:\s*([\s\S]*)$/i);

    return {
      treatmentPlanType: typeMatch ? `${typeMatch[1].charAt(0).toUpperCase()}${typeMatch[1].slice(1).toLowerCase()}` : "Initial",
      treatmentPlanDate: dateMatch ? dateMatch[1].trim() : "",
      treatmentPlanRows: parsedRows.map((row) => ({
        ...row,
        extra: Array.isArray(row.extra)
          ? [...row.extra, ...Array(Math.max(0, parsedExtraColumns.length - row.extra.length)).fill("")].slice(0, parsedExtraColumns.length)
          : Array(parsedExtraColumns.length).fill(""),
      })),
      treatmentPlanExtraColumns: parsedExtraColumns,
      treatmentPlanBody: bodyMatch ? bodyMatch[1].trim() : value,
    };
  };

  const buildTreatmentPlanValue = (
    memberName,
    memberDob,
    treatmentPlanType,
    treatmentPlanDate,
    treatmentPlanRows,
    treatmentPlanExtraColumns,
    treatmentPlanBody
  ) => {
    const safeColumns = Array.isArray(treatmentPlanExtraColumns) ? treatmentPlanExtraColumns : [];
    const safeRows = Array.isArray(treatmentPlanRows) && treatmentPlanRows.length > 0
      ? treatmentPlanRows.map((row) => ({
        presentingIssues: row?.presentingIssues || "",
        goal: row?.goal || "",
        service: row?.service || "",
        methods: row?.methods || "",
        frequency: row?.frequency || "",
        progressCommunication: row?.progressCommunication || "",
        extra: Array.isArray(row?.extra)
          ? [...row.extra, ...Array(Math.max(0, safeColumns.length - row.extra.length)).fill("")].slice(0, safeColumns.length)
          : Array(safeColumns.length).fill(""),
      }))
      : [{ ...emptyTreatmentPlanRow, extra: Array(safeColumns.length).fill("") }];

    const structuredTable = {
      extraColumns: safeColumns,
      rows: safeRows,
    };

    return [
      "Pastalino Manor LLC",
      "Treatment Plan",
      `Member Name: ${memberName || ""}`,
      `D.O.B: ${memberDob || ""}`,
      `Treatment Plan Type: ${treatmentPlanType || "Initial"}`,
      `Treatment Plan Date: ${treatmentPlanDate || new Date().toISOString().slice(0, 10)}`,
      "Treatment Plan Table (JSON):",
      JSON.stringify(structuredTable),
      "Treatment Plan Details:",
      treatmentPlanBody || "",
    ].join("\n");
  };

  const parseDischargePlanningValue = (value) => {
    if (!value) {
      return {
        dischargePlanningType: "Initial",
        dischargePlanningDate: "",
        dischargePlanningBody: "",
        dischargeGender: "",
        dischargeCoe: false,
        dischargeCoeDate: "",
        dischargeCot: false,
        dischargeVoluntary: false,
        dischargeCurrentFacilityInformation: "Pastalino Manor",
        dischargeReturningResidence: "",
        dischargePsychiatricDiagnosis: "",
        dischargeMedicalDiagnosis: "",
        dischargeMedications: "SEE MARS",
        dischargeIdentifiedStrengths: "",
        dischargeNaturalSupports: "",
        dischargeCulturalPriorities: "",
        dischargeReadinessHygiene: "",
        dischargeReadinessMeds: "",
        dischargeReadinessFireSafety: "",
        dischargeReadinessMoodStability: "",
        dischargeReadinessFamilyInvolved: "",
        dischargeRecommendations: "",
        dischargeAftercareFamilyPeer: "",
        dischargeAftercareOutpatientTherapies: "",
        dischargeAftercareMedicationManagement: "",
        dischargeAftercareCommunitySupports: "",
        dischargeAppointments: getDefaultDischargeAppointments(),
        dischargeSignatureClinician: "",
        dischargePrintNameClinician: "",
        dischargeDateClinician: "",
        dischargeSignatureAdministrator: "",
        dischargePrintNameAdministrator: "",
        dischargeDateAdministrator: "",
        dischargeParticipationAcknowledged: false,
        dischargeSignatureResident: "",
        dischargePrintNameResident: "",
        dischargeDateResident: "",
        dischargeSignatureRepresentative: "",
        dischargePrintNameRepresentative: "",
        dischargeDateRepresentative: "",
      };
    }

    const typeMatch = value.match(/Discharge Planning Type:\s*(Initial|Update|Review)/i);
    const dateMatch = value.match(/Discharge Planning Date:\s*([^\n]+)/i);
    const structuredMatch = value.match(/Discharge Planning Structured \(JSON\):\s*([\s\S]*?)\nDischarge Planning Details:/i);
    const bodyMatch = value.match(/Discharge Planning Details:\s*([\s\S]*)$/i);

    const defaults = {
      dischargeGender: "",
      dischargeCoe: false,
      dischargeCoeDate: "",
      dischargeCot: false,
      dischargeVoluntary: false,
      dischargeCurrentFacilityInformation: "Pastalino Manor",
      dischargeReturningResidence: "",
      dischargePsychiatricDiagnosis: "",
      dischargeMedicalDiagnosis: "",
      dischargeMedications: "SEE MARS",
      dischargeIdentifiedStrengths: "",
      dischargeNaturalSupports: "",
      dischargeCulturalPriorities: "",
      dischargeReadinessHygiene: "",
      dischargeReadinessMeds: "",
      dischargeReadinessFireSafety: "",
      dischargeReadinessMoodStability: "",
      dischargeReadinessFamilyInvolved: "",
      dischargeRecommendations: "",
      dischargeAftercareFamilyPeer: "",
      dischargeAftercareOutpatientTherapies: "",
      dischargeAftercareMedicationManagement: "",
      dischargeAftercareCommunitySupports: "",
      dischargeAppointments: getDefaultDischargeAppointments(),
      dischargeSignatureClinician: "",
      dischargePrintNameClinician: "",
      dischargeDateClinician: "",
      dischargeSignatureAdministrator: "",
      dischargePrintNameAdministrator: "",
      dischargeDateAdministrator: "",
      dischargeParticipationAcknowledged: false,
      dischargeSignatureResident: "",
      dischargePrintNameResident: "",
      dischargeDateResident: "",
      dischargeSignatureRepresentative: "",
      dischargePrintNameRepresentative: "",
      dischargeDateRepresentative: "",
    };

    let structured = { ...defaults };
    if (structuredMatch?.[1]) {
      try {
        const candidate = JSON.parse(structuredMatch[1].trim());
        structured = {
          ...defaults,
          ...candidate,
          dischargeAppointments: Array.isArray(candidate?.dischargeAppointments)
            ? candidate.dischargeAppointments.map((item, idx) => ({
              name: item?.name || getDefaultDischargeAppointments()[idx]?.name || `Appointment ${idx + 1}`,
              provider: item?.provider || "",
              date: item?.date || "",
              time: item?.time || "",
            }))
            : getDefaultDischargeAppointments(),
        };
      } catch {
        structured = { ...defaults };
      }
    }

    return {
      dischargePlanningType: typeMatch ? `${typeMatch[1].charAt(0).toUpperCase()}${typeMatch[1].slice(1).toLowerCase()}` : "Initial",
      dischargePlanningDate: dateMatch ? dateMatch[1].trim() : "",
      ...structured,
      dischargePlanningBody: bodyMatch ? bodyMatch[1].trim() : value,
    };
  };

  const buildDischargePlanningValue = (
    memberName,
    memberDob,
    dischargePlanningType,
    dischargePlanningDate,
    dischargeStructured,
    dischargePlanningBody
  ) => {
    return [
      "Pastalino Manor LLC",
      "Discharge Planning",
      `Member Name: ${memberName || ""}`,
      `D.O.B: ${memberDob || ""}`,
      `Discharge Planning Type: ${dischargePlanningType || "Initial"}`,
      `Discharge Planning Date: ${dischargePlanningDate || new Date().toISOString().slice(0, 10)}`,
      "Discharge Planning Structured (JSON):",
      JSON.stringify(dischargeStructured || {}),
      "Discharge Planning Details:",
      dischargePlanningBody || "",
    ].join("\n");
  };

  useEffect(() => {
    api.get("/members").then((res) => {
      setMembers(res.data);
      if (!selectedMemberId && res.data[0]) {
        setSelectedMemberId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedMemberId) {
      setDocuments([]);
      setIncidents([]);
      return;
    }

    api.get("/documents", { params: { ownerType: "member", ownerId: selectedMemberId } }).then((res) => setDocuments(res.data));
    api.get("/incidents", { params: { memberId: selectedMemberId } }).then((res) => setIncidents(res.data));

    const selectedMember = members.find((member) => member.id === selectedMemberId);
    if (selectedMember) {
      const parsedAssessment = parseAssessmentValue(selectedMember.assessments || "");
      const parsedTreatmentPlan = parseTreatmentPlanValue(selectedMember.treatmentPlan || "");
      const parsedDischargePlanning = parseDischargePlanningValue(selectedMember.dischargePlanning || "");
      setClinicalForm({
        assessment: parsedAssessment.assessmentBody,
        treatmentPlan: parsedTreatmentPlan.treatmentPlanBody,
        dischargePlanning: parsedDischargePlanning.dischargePlanningBody,
        assessmentType: parsedAssessment.assessmentType,
        assessmentDate: parsedAssessment.assessmentDate,
        assessmentCot: parsedAssessment.assessmentCot,
        assessmentExpirationDate: parsedAssessment.assessmentExpirationDate,
        assessmentCopyInChart: parsedAssessment.assessmentCopyInChart,
        assessmentClientHistory: parsedAssessment.assessmentClientHistory,
        assessmentSymptoms: parsedAssessment.assessmentSymptoms,
        assessmentTriggerStatus: parsedAssessment.assessmentTriggerStatus,
        assessmentTriggerType: parsedAssessment.assessmentTriggerType,
        assessmentBehavioralHealthHistory: parsedAssessment.assessmentBehavioralHealthHistory,
        assessmentSubstanceAbuseHistory: parsedAssessment.assessmentSubstanceAbuseHistory,
        assessmentCoOccurringDisorders: parsedAssessment.assessmentCoOccurringDisorders,
        assessmentHospitalizations: parsedAssessment.assessmentHospitalizations,
        assessmentLivingEnvironment: parsedAssessment.assessmentLivingEnvironment,
        assessmentLivingEnvironmentDetails: parsedAssessment.assessmentLivingEnvironmentDetails,
        assessmentMedications: parsedAssessment.assessmentMedications,
        assessmentMedicalConcerns: parsedAssessment.assessmentMedicalConcerns,
        assessmentLegalHistory: parsedAssessment.assessmentLegalHistory,
        assessmentLegalHistoryDetails: parsedAssessment.assessmentLegalHistoryDetails,
        assessmentGuardianshipInfo: parsedAssessment.assessmentGuardianshipInfo,
        assessmentGuardianshipDetails: parsedAssessment.assessmentGuardianshipDetails,
        assessmentMilitaryHistory: parsedAssessment.assessmentMilitaryHistory,
        assessmentMilitaryHistoryDetails: parsedAssessment.assessmentMilitaryHistoryDetails,
        assessmentFamilyHistory: parsedAssessment.assessmentFamilyHistory,
        assessmentFamilyMhSudAbuse: parsedAssessment.assessmentFamilyMhSudAbuse,
        assessmentTraumaHistory: parsedAssessment.assessmentTraumaHistory,
        assessmentSocialSupport: parsedAssessment.assessmentSocialSupport,
        assessmentEducationWorkHistory: parsedAssessment.assessmentEducationWorkHistory,
        assessmentReturnWorkSchool: parsedAssessment.assessmentReturnWorkSchool,
        assessmentReturnWorkSchoolWhy: parsedAssessment.assessmentReturnWorkSchoolWhy,
        assessmentAllergies: parsedAssessment.assessmentAllergies,
        assessmentRecreationalActivities: parsedAssessment.assessmentRecreationalActivities,
        assessmentRecreationalOther: parsedAssessment.assessmentRecreationalOther,
        assessmentCulturalPreferences: parsedAssessment.assessmentCulturalPreferences,
        assessmentStrengths: parsedAssessment.assessmentStrengths,
        assessmentRecommendations: parsedAssessment.assessmentRecommendations,
        assessmentResidentParticipation: parsedAssessment.assessmentResidentParticipation,
        treatmentPlanType: parsedTreatmentPlan.treatmentPlanType,
        treatmentPlanDate: parsedTreatmentPlan.treatmentPlanDate,
        treatmentPlanRows: parsedTreatmentPlan.treatmentPlanRows,
        treatmentPlanExtraColumns: parsedTreatmentPlan.treatmentPlanExtraColumns,
        dischargePlanningType: parsedDischargePlanning.dischargePlanningType,
        dischargePlanningDate: parsedDischargePlanning.dischargePlanningDate,
        dischargeGender: parsedDischargePlanning.dischargeGender,
        dischargeCoe: parsedDischargePlanning.dischargeCoe,
        dischargeCoeDate: parsedDischargePlanning.dischargeCoeDate,
        dischargeCot: parsedDischargePlanning.dischargeCot,
        dischargeVoluntary: parsedDischargePlanning.dischargeVoluntary,
        dischargeCurrentFacilityInformation: parsedDischargePlanning.dischargeCurrentFacilityInformation,
        dischargeReturningResidence: parsedDischargePlanning.dischargeReturningResidence,
        dischargePsychiatricDiagnosis: parsedDischargePlanning.dischargePsychiatricDiagnosis,
        dischargeMedicalDiagnosis: parsedDischargePlanning.dischargeMedicalDiagnosis,
        dischargeMedications: parsedDischargePlanning.dischargeMedications,
        dischargeIdentifiedStrengths: parsedDischargePlanning.dischargeIdentifiedStrengths,
        dischargeNaturalSupports: parsedDischargePlanning.dischargeNaturalSupports,
        dischargeCulturalPriorities: parsedDischargePlanning.dischargeCulturalPriorities,
        dischargeReadinessHygiene: parsedDischargePlanning.dischargeReadinessHygiene,
        dischargeReadinessMeds: parsedDischargePlanning.dischargeReadinessMeds,
        dischargeReadinessFireSafety: parsedDischargePlanning.dischargeReadinessFireSafety,
        dischargeReadinessMoodStability: parsedDischargePlanning.dischargeReadinessMoodStability,
        dischargeReadinessFamilyInvolved: parsedDischargePlanning.dischargeReadinessFamilyInvolved,
        dischargeRecommendations: parsedDischargePlanning.dischargeRecommendations,
        dischargeAftercareFamilyPeer: parsedDischargePlanning.dischargeAftercareFamilyPeer,
        dischargeAftercareOutpatientTherapies: parsedDischargePlanning.dischargeAftercareOutpatientTherapies,
        dischargeAftercareMedicationManagement: parsedDischargePlanning.dischargeAftercareMedicationManagement,
        dischargeAftercareCommunitySupports: parsedDischargePlanning.dischargeAftercareCommunitySupports,
        dischargeAppointments: parsedDischargePlanning.dischargeAppointments,
        dischargeSignatureClinician: parsedDischargePlanning.dischargeSignatureClinician,
        dischargePrintNameClinician: parsedDischargePlanning.dischargePrintNameClinician,
        dischargeDateClinician: parsedDischargePlanning.dischargeDateClinician,
        dischargeSignatureAdministrator: parsedDischargePlanning.dischargeSignatureAdministrator,
        dischargePrintNameAdministrator: parsedDischargePlanning.dischargePrintNameAdministrator,
        dischargeDateAdministrator: parsedDischargePlanning.dischargeDateAdministrator,
        dischargeParticipationAcknowledged: parsedDischargePlanning.dischargeParticipationAcknowledged,
        dischargeSignatureResident: parsedDischargePlanning.dischargeSignatureResident,
        dischargePrintNameResident: parsedDischargePlanning.dischargePrintNameResident,
        dischargeDateResident: parsedDischargePlanning.dischargeDateResident,
        dischargeSignatureRepresentative: parsedDischargePlanning.dischargeSignatureRepresentative,
        dischargePrintNameRepresentative: parsedDischargePlanning.dischargePrintNameRepresentative,
        dischargeDateRepresentative: parsedDischargePlanning.dischargeDateRepresentative,
      });
    }
  }, [selectedMemberId]);

  useEffect(() => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    if (!selectedMember) {
      return;
    }

    const parsedAssessment = parseAssessmentValue(selectedMember.assessments || "");
    const parsedTreatmentPlan = parseTreatmentPlanValue(selectedMember.treatmentPlan || "");
    const parsedDischargePlanning = parseDischargePlanningValue(selectedMember.dischargePlanning || "");

    setClinicalForm({
      assessment: parsedAssessment.assessmentBody,
      treatmentPlan: parsedTreatmentPlan.treatmentPlanBody,
      dischargePlanning: parsedDischargePlanning.dischargePlanningBody,
      assessmentType: parsedAssessment.assessmentType,
      assessmentDate: parsedAssessment.assessmentDate,
      assessmentCot: parsedAssessment.assessmentCot,
      assessmentExpirationDate: parsedAssessment.assessmentExpirationDate,
      assessmentCopyInChart: parsedAssessment.assessmentCopyInChart,
      assessmentClientHistory: parsedAssessment.assessmentClientHistory,
      assessmentSymptoms: parsedAssessment.assessmentSymptoms,
      assessmentTriggerStatus: parsedAssessment.assessmentTriggerStatus,
      assessmentTriggerType: parsedAssessment.assessmentTriggerType,
      assessmentBehavioralHealthHistory: parsedAssessment.assessmentBehavioralHealthHistory,
      assessmentSubstanceAbuseHistory: parsedAssessment.assessmentSubstanceAbuseHistory,
      assessmentCoOccurringDisorders: parsedAssessment.assessmentCoOccurringDisorders,
      assessmentHospitalizations: parsedAssessment.assessmentHospitalizations,
      assessmentLivingEnvironment: parsedAssessment.assessmentLivingEnvironment,
      assessmentLivingEnvironmentDetails: parsedAssessment.assessmentLivingEnvironmentDetails,
      assessmentMedications: parsedAssessment.assessmentMedications,
      assessmentMedicalConcerns: parsedAssessment.assessmentMedicalConcerns,
      assessmentLegalHistory: parsedAssessment.assessmentLegalHistory,
      assessmentLegalHistoryDetails: parsedAssessment.assessmentLegalHistoryDetails,
      assessmentGuardianshipInfo: parsedAssessment.assessmentGuardianshipInfo,
      assessmentGuardianshipDetails: parsedAssessment.assessmentGuardianshipDetails,
      assessmentMilitaryHistory: parsedAssessment.assessmentMilitaryHistory,
      assessmentMilitaryHistoryDetails: parsedAssessment.assessmentMilitaryHistoryDetails,
      assessmentFamilyHistory: parsedAssessment.assessmentFamilyHistory,
      assessmentFamilyMhSudAbuse: parsedAssessment.assessmentFamilyMhSudAbuse,
      assessmentTraumaHistory: parsedAssessment.assessmentTraumaHistory,
      assessmentSocialSupport: parsedAssessment.assessmentSocialSupport,
      assessmentEducationWorkHistory: parsedAssessment.assessmentEducationWorkHistory,
      assessmentReturnWorkSchool: parsedAssessment.assessmentReturnWorkSchool,
      assessmentReturnWorkSchoolWhy: parsedAssessment.assessmentReturnWorkSchoolWhy,
      assessmentAllergies: parsedAssessment.assessmentAllergies,
      assessmentRecreationalActivities: parsedAssessment.assessmentRecreationalActivities,
      assessmentRecreationalOther: parsedAssessment.assessmentRecreationalOther,
      assessmentCulturalPreferences: parsedAssessment.assessmentCulturalPreferences,
      assessmentStrengths: parsedAssessment.assessmentStrengths,
      assessmentRecommendations: parsedAssessment.assessmentRecommendations,
      assessmentResidentParticipation: parsedAssessment.assessmentResidentParticipation,
      treatmentPlanType: parsedTreatmentPlan.treatmentPlanType,
      treatmentPlanDate: parsedTreatmentPlan.treatmentPlanDate,
      treatmentPlanRows: parsedTreatmentPlan.treatmentPlanRows,
      treatmentPlanExtraColumns: parsedTreatmentPlan.treatmentPlanExtraColumns,
      dischargePlanningType: parsedDischargePlanning.dischargePlanningType,
      dischargePlanningDate: parsedDischargePlanning.dischargePlanningDate,
      dischargeGender: parsedDischargePlanning.dischargeGender,
      dischargeCoe: parsedDischargePlanning.dischargeCoe,
      dischargeCoeDate: parsedDischargePlanning.dischargeCoeDate,
      dischargeCot: parsedDischargePlanning.dischargeCot,
      dischargeVoluntary: parsedDischargePlanning.dischargeVoluntary,
      dischargeCurrentFacilityInformation: parsedDischargePlanning.dischargeCurrentFacilityInformation,
      dischargeReturningResidence: parsedDischargePlanning.dischargeReturningResidence,
      dischargePsychiatricDiagnosis: parsedDischargePlanning.dischargePsychiatricDiagnosis,
      dischargeMedicalDiagnosis: parsedDischargePlanning.dischargeMedicalDiagnosis,
      dischargeMedications: parsedDischargePlanning.dischargeMedications,
      dischargeIdentifiedStrengths: parsedDischargePlanning.dischargeIdentifiedStrengths,
      dischargeNaturalSupports: parsedDischargePlanning.dischargeNaturalSupports,
      dischargeCulturalPriorities: parsedDischargePlanning.dischargeCulturalPriorities,
      dischargeReadinessHygiene: parsedDischargePlanning.dischargeReadinessHygiene,
      dischargeReadinessMeds: parsedDischargePlanning.dischargeReadinessMeds,
      dischargeReadinessFireSafety: parsedDischargePlanning.dischargeReadinessFireSafety,
      dischargeReadinessMoodStability: parsedDischargePlanning.dischargeReadinessMoodStability,
      dischargeReadinessFamilyInvolved: parsedDischargePlanning.dischargeReadinessFamilyInvolved,
      dischargeRecommendations: parsedDischargePlanning.dischargeRecommendations,
      dischargeAftercareFamilyPeer: parsedDischargePlanning.dischargeAftercareFamilyPeer,
      dischargeAftercareOutpatientTherapies: parsedDischargePlanning.dischargeAftercareOutpatientTherapies,
      dischargeAftercareMedicationManagement: parsedDischargePlanning.dischargeAftercareMedicationManagement,
      dischargeAftercareCommunitySupports: parsedDischargePlanning.dischargeAftercareCommunitySupports,
      dischargeAppointments: parsedDischargePlanning.dischargeAppointments,
      dischargeSignatureClinician: parsedDischargePlanning.dischargeSignatureClinician,
      dischargePrintNameClinician: parsedDischargePlanning.dischargePrintNameClinician,
      dischargeDateClinician: parsedDischargePlanning.dischargeDateClinician,
      dischargeSignatureAdministrator: parsedDischargePlanning.dischargeSignatureAdministrator,
      dischargePrintNameAdministrator: parsedDischargePlanning.dischargePrintNameAdministrator,
      dischargeDateAdministrator: parsedDischargePlanning.dischargeDateAdministrator,
      dischargeParticipationAcknowledged: parsedDischargePlanning.dischargeParticipationAcknowledged,
      dischargeSignatureResident: parsedDischargePlanning.dischargeSignatureResident,
      dischargePrintNameResident: parsedDischargePlanning.dischargePrintNameResident,
      dischargeDateResident: parsedDischargePlanning.dischargeDateResident,
      dischargeSignatureRepresentative: parsedDischargePlanning.dischargeSignatureRepresentative,
      dischargePrintNameRepresentative: parsedDischargePlanning.dischargePrintNameRepresentative,
      dischargeDateRepresentative: parsedDischargePlanning.dischargeDateRepresentative,
    });
  }, [members, selectedMemberId]);

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({ name: file.name, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedMemberId || !documentTitle.trim() || !selectedFile) {
      return;
    }

    setIsUploading(true);
    try {
      await api.post("/documents", {
        ownerType: "member",
        ownerId: selectedMemberId,
        category: documentCategory || "Member File",
        title: documentTitle.trim(),
        fileName: selectedFile.name,
        fileUrl: selectedFile.dataUrl,
        expiresAt: expiryDate ? new Date(expiryDate).getTime() : null,
      });

      setDocumentTitle("");
      setDocumentCategory("Member File");
      setExpiryDate("");
      setSelectedFile(null);
      setUploadKey((value) => value + 1);
      const response = await api.get("/documents", { params: { ownerType: "member", ownerId: selectedMemberId } });
      setDocuments(response.data);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    const confirmed = window.confirm("Delete this uploaded document?");
    if (!confirmed) {
      return;
    }

    await api.delete(`/documents/${documentId}`);
    const response = await api.get("/documents", { params: { ownerType: "member", ownerId: selectedMemberId } });
    setDocuments(response.data);
  };

  const handleCreateMember = async () => {
    if (!canAddClients || !memberCreateForm.name.trim()) {
      return;
    }

    try {
      await api.post("/members", {
        name: memberCreateForm.name.trim(),
        dob: memberCreateForm.dob,
        guardian: memberCreateForm.guardian,
        insurance: memberCreateForm.insurance,
        physician: memberCreateForm.physician,
      });

      const refreshedMembers = await api.get("/members");
      setMembers(refreshedMembers.data);
      if (refreshedMembers.data[0]) {
        const created = refreshedMembers.data.find((item) => item.name === memberCreateForm.name.trim());
        if (created) {
          setSelectedMemberId(created.id);
        }
      }
      setMemberCreateForm({ name: "", dob: "", guardian: "", insurance: "", physician: "" });
      setMemberCreateMessage("Client added.");
    } catch (error) {
      setMemberCreateMessage(error?.response?.data?.message || "Unable to add client.");
    }
  };

  const handleAssessmentChecklistChange = (field, option) => (event) => {
    setClinicalForm((prev) => ({
      ...prev,
      [field]: event.target.checked
        ? [...prev[field], option]
        : prev[field].filter((item) => item !== option),
    }));
  };

  const handleDischargeAppointmentChange = (index, key, value) => {
    setClinicalForm((prev) => {
      const nextAppointments = [...prev.dischargeAppointments];
      nextAppointments[index] = { ...nextAppointments[index], [key]: value };
      return { ...prev, dischargeAppointments: nextAppointments };
    });
  };

  const handleSaveClinicalSection = async (field) => {
    if (!selectedMemberId) {
      return;
    }

    const selectedMember = members.find((member) => member.id === selectedMemberId);
    const payloadByField = {
      assessment: {
        assessments: buildAssessmentValue(
          selectedMember?.name || "",
          selectedMember?.dob || "",
          clinicalForm.assessmentType,
          clinicalForm.assessmentDate,
          clinicalForm.assessmentCot,
          clinicalForm.assessmentExpirationDate,
          clinicalForm.assessmentCopyInChart,
          clinicalForm.assessmentClientHistory,
          clinicalForm.assessmentSymptoms,
          clinicalForm.assessmentTriggerStatus,
          clinicalForm.assessmentTriggerType,
          clinicalForm.assessmentBehavioralHealthHistory,
          clinicalForm.assessmentSubstanceAbuseHistory,
          clinicalForm.assessmentCoOccurringDisorders,
          clinicalForm.assessmentHospitalizations,
          clinicalForm.assessmentLivingEnvironment,
          clinicalForm.assessmentLivingEnvironmentDetails,
          clinicalForm.assessmentMedications,
          clinicalForm.assessmentMedicalConcerns,
          clinicalForm.assessmentLegalHistory,
          clinicalForm.assessmentLegalHistoryDetails,
          clinicalForm.assessmentGuardianshipInfo,
          clinicalForm.assessmentGuardianshipDetails,
          clinicalForm.assessmentMilitaryHistory,
          clinicalForm.assessmentMilitaryHistoryDetails,
          clinicalForm.assessmentFamilyHistory,
          clinicalForm.assessmentFamilyMhSudAbuse,
          clinicalForm.assessmentTraumaHistory,
          clinicalForm.assessmentSocialSupport,
          clinicalForm.assessmentEducationWorkHistory,
          clinicalForm.assessmentReturnWorkSchool,
          clinicalForm.assessmentReturnWorkSchoolWhy,
          clinicalForm.assessmentAllergies,
          clinicalForm.assessmentRecreationalActivities,
          clinicalForm.assessmentRecreationalOther,
          clinicalForm.assessmentCulturalPreferences,
          clinicalForm.assessmentStrengths,
          clinicalForm.assessmentRecommendations,
          clinicalForm.assessmentResidentParticipation,
          clinicalForm.assessment
        ),
      },
      treatmentPlan: {
        treatmentPlan: buildTreatmentPlanValue(
          selectedMember?.name || "",
          selectedMember?.dob || "",
          clinicalForm.treatmentPlanType,
          clinicalForm.treatmentPlanDate,
          clinicalForm.treatmentPlanRows,
          clinicalForm.treatmentPlanExtraColumns,
          clinicalForm.treatmentPlan
        ),
      },
      dischargePlanning: {
        dischargePlanning: buildDischargePlanningValue(
          selectedMember?.name || "",
          selectedMember?.dob || "",
          clinicalForm.dischargePlanningType,
          clinicalForm.dischargePlanningDate,
          {
            dischargeGender: clinicalForm.dischargeGender,
            dischargeCoe: clinicalForm.dischargeCoe,
            dischargeCoeDate: clinicalForm.dischargeCoeDate,
            dischargeCot: clinicalForm.dischargeCot,
            dischargeVoluntary: clinicalForm.dischargeVoluntary,
            dischargeCurrentFacilityInformation: clinicalForm.dischargeCurrentFacilityInformation,
            dischargeReturningResidence: clinicalForm.dischargeReturningResidence,
            dischargePsychiatricDiagnosis: clinicalForm.dischargePsychiatricDiagnosis,
            dischargeMedicalDiagnosis: clinicalForm.dischargeMedicalDiagnosis,
            dischargeMedications: clinicalForm.dischargeMedications,
            dischargeIdentifiedStrengths: clinicalForm.dischargeIdentifiedStrengths,
            dischargeNaturalSupports: clinicalForm.dischargeNaturalSupports,
            dischargeCulturalPriorities: clinicalForm.dischargeCulturalPriorities,
            dischargeReadinessHygiene: clinicalForm.dischargeReadinessHygiene,
            dischargeReadinessMeds: clinicalForm.dischargeReadinessMeds,
            dischargeReadinessFireSafety: clinicalForm.dischargeReadinessFireSafety,
            dischargeReadinessMoodStability: clinicalForm.dischargeReadinessMoodStability,
            dischargeReadinessFamilyInvolved: clinicalForm.dischargeReadinessFamilyInvolved,
            dischargeRecommendations: clinicalForm.dischargeRecommendations,
            dischargeAftercareFamilyPeer: clinicalForm.dischargeAftercareFamilyPeer,
            dischargeAftercareOutpatientTherapies: clinicalForm.dischargeAftercareOutpatientTherapies,
            dischargeAftercareMedicationManagement: clinicalForm.dischargeAftercareMedicationManagement,
            dischargeAftercareCommunitySupports: clinicalForm.dischargeAftercareCommunitySupports,
            dischargeAppointments: clinicalForm.dischargeAppointments,
            dischargeSignatureClinician: clinicalForm.dischargeSignatureClinician,
            dischargePrintNameClinician: clinicalForm.dischargePrintNameClinician,
            dischargeDateClinician: clinicalForm.dischargeDateClinician,
            dischargeSignatureAdministrator: clinicalForm.dischargeSignatureAdministrator,
            dischargePrintNameAdministrator: clinicalForm.dischargePrintNameAdministrator,
            dischargeDateAdministrator: clinicalForm.dischargeDateAdministrator,
            dischargeParticipationAcknowledged: clinicalForm.dischargeParticipationAcknowledged,
            dischargeSignatureResident: clinicalForm.dischargeSignatureResident,
            dischargePrintNameResident: clinicalForm.dischargePrintNameResident,
            dischargeDateResident: clinicalForm.dischargeDateResident,
            dischargeSignatureRepresentative: clinicalForm.dischargeSignatureRepresentative,
            dischargePrintNameRepresentative: clinicalForm.dischargePrintNameRepresentative,
            dischargeDateRepresentative: clinicalForm.dischargeDateRepresentative,
          },
          clinicalForm.dischargePlanning
        ),
      },
    };

    const successByField = {
      assessment: "Client assessment saved.",
      treatmentPlan: "Treatment plan saved.",
      dischargePlanning: "Discharge planning saved.",
    };

    setSavingClinicalField(field);
    setClinicalMessages((prev) => ({ ...prev, [field]: "" }));
    try {
      await api.put(`/members/${selectedMemberId}`, payloadByField[field]);

      const refreshedMembers = await api.get("/members");
      setMembers(refreshedMembers.data);
      setClinicalMessages((prev) => ({ ...prev, [field]: successByField[field] }));
    } finally {
      setSavingClinicalField("");
    }
  };

  const handleSaveIncident = async () => {
    if (!selectedMemberId || !incidentForm.description.trim()) {
      return;
    }

    setIsSavingIncident(true);
    setIncidentMessage("");
    try {
      await api.post("/incidents", {
        memberId: selectedMemberId,
        incidentType: incidentForm.incidentType,
        incidentDate: incidentForm.incidentDate || new Date().toISOString(),
        description: incidentForm.description.trim(),
        witnesses: incidentForm.witnesses,
        immediateActions: incidentForm.immediateActions,
        notifications: incidentForm.notifications,
        followUp: incidentForm.followUp,
        correctiveActions: incidentForm.correctiveActions,
      });

      const response = await api.get("/incidents", { params: { memberId: selectedMemberId } });
      setIncidents(response.data);
      setIncidentForm({
        incidentType: "General",
        incidentDate: "",
        description: "",
        witnesses: "",
        immediateActions: "",
        notifications: "",
        followUp: "",
        correctiveActions: "",
      });
      setIncidentMessage("Incident report saved.");
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handlePrintAssessment = () => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    const assessmentBody = buildAssessmentValue(
      selectedMember?.name || "",
      selectedMember?.dob || "",
      clinicalForm.assessmentType,
      clinicalForm.assessmentDate,
      clinicalForm.assessmentCot,
      clinicalForm.assessmentExpirationDate,
      clinicalForm.assessmentCopyInChart,
      clinicalForm.assessmentClientHistory,
      clinicalForm.assessmentSymptoms,
      clinicalForm.assessmentTriggerStatus,
      clinicalForm.assessmentTriggerType,
      clinicalForm.assessmentBehavioralHealthHistory,
      clinicalForm.assessmentSubstanceAbuseHistory,
      clinicalForm.assessmentCoOccurringDisorders,
      clinicalForm.assessmentHospitalizations,
      clinicalForm.assessmentLivingEnvironment,
      clinicalForm.assessmentLivingEnvironmentDetails,
      clinicalForm.assessmentMedications,
      clinicalForm.assessmentMedicalConcerns,
      clinicalForm.assessmentLegalHistory,
      clinicalForm.assessmentLegalHistoryDetails,
      clinicalForm.assessmentGuardianshipInfo,
      clinicalForm.assessmentGuardianshipDetails,
      clinicalForm.assessmentMilitaryHistory,
      clinicalForm.assessmentMilitaryHistoryDetails,
      clinicalForm.assessmentFamilyHistory,
      clinicalForm.assessmentFamilyMhSudAbuse,
      clinicalForm.assessmentTraumaHistory,
      clinicalForm.assessmentSocialSupport,
      clinicalForm.assessmentEducationWorkHistory,
      clinicalForm.assessmentReturnWorkSchool,
      clinicalForm.assessmentReturnWorkSchoolWhy,
      clinicalForm.assessmentAllergies,
      clinicalForm.assessmentRecreationalActivities,
      clinicalForm.assessmentRecreationalOther,
      clinicalForm.assessmentCulturalPreferences,
      clinicalForm.assessmentStrengths,
      clinicalForm.assessmentRecommendations,
      clinicalForm.assessmentResidentParticipation,
      clinicalForm.assessment
    );

    openRecordPrintView({
      title: `Assessment - ${selectedMember?.name || "Member"}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Member", value: selectedMember?.name || "" },
        { label: "DOB", value: selectedMember?.dob || "" },
        { label: "Assessment Type", value: clinicalForm.assessmentType },
        { label: "Assessment Date", value: clinicalForm.assessmentDate },
      ],
      body: assessmentBody,
    });
  };

  const handlePrintTreatmentPlan = () => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    const treatmentBody = buildTreatmentPlanValue(
      selectedMember?.name || "",
      selectedMember?.dob || "",
      clinicalForm.treatmentPlanType,
      clinicalForm.treatmentPlanDate,
      clinicalForm.treatmentPlanRows,
      clinicalForm.treatmentPlanExtraColumns,
      clinicalForm.treatmentPlan
    );

    openRecordPrintView({
      title: `Treatment Plan - ${selectedMember?.name || "Member"}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Member", value: selectedMember?.name || "" },
        { label: "DOB", value: selectedMember?.dob || "" },
        { label: "Plan Type", value: clinicalForm.treatmentPlanType },
        { label: "Plan Date", value: clinicalForm.treatmentPlanDate },
      ],
      body: treatmentBody,
    });
  };

  const handlePrintDischargePlanning = () => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    const dischargeBody = buildDischargePlanningValue(
      selectedMember?.name || "",
      selectedMember?.dob || "",
      clinicalForm.dischargePlanningType,
      clinicalForm.dischargePlanningDate,
      {
        dischargeGender: clinicalForm.dischargeGender,
        dischargeCoe: clinicalForm.dischargeCoe,
        dischargeCoeDate: clinicalForm.dischargeCoeDate,
        dischargeCot: clinicalForm.dischargeCot,
        dischargeVoluntary: clinicalForm.dischargeVoluntary,
        dischargeCurrentFacilityInformation: clinicalForm.dischargeCurrentFacilityInformation,
        dischargeReturningResidence: clinicalForm.dischargeReturningResidence,
        dischargePsychiatricDiagnosis: clinicalForm.dischargePsychiatricDiagnosis,
        dischargeMedicalDiagnosis: clinicalForm.dischargeMedicalDiagnosis,
        dischargeMedications: clinicalForm.dischargeMedications,
        dischargeIdentifiedStrengths: clinicalForm.dischargeIdentifiedStrengths,
        dischargeNaturalSupports: clinicalForm.dischargeNaturalSupports,
        dischargeCulturalPriorities: clinicalForm.dischargeCulturalPriorities,
        dischargeReadinessHygiene: clinicalForm.dischargeReadinessHygiene,
        dischargeReadinessMeds: clinicalForm.dischargeReadinessMeds,
        dischargeReadinessFireSafety: clinicalForm.dischargeReadinessFireSafety,
        dischargeReadinessMoodStability: clinicalForm.dischargeReadinessMoodStability,
        dischargeReadinessFamilyInvolved: clinicalForm.dischargeReadinessFamilyInvolved,
        dischargeRecommendations: clinicalForm.dischargeRecommendations,
        dischargeAftercareFamilyPeer: clinicalForm.dischargeAftercareFamilyPeer,
        dischargeAftercareOutpatientTherapies: clinicalForm.dischargeAftercareOutpatientTherapies,
        dischargeAftercareMedicationManagement: clinicalForm.dischargeAftercareMedicationManagement,
        dischargeAftercareCommunitySupports: clinicalForm.dischargeAftercareCommunitySupports,
        dischargeAppointments: clinicalForm.dischargeAppointments,
        dischargeSignatureClinician: clinicalForm.dischargeSignatureClinician,
        dischargePrintNameClinician: clinicalForm.dischargePrintNameClinician,
        dischargeDateClinician: clinicalForm.dischargeDateClinician,
        dischargeSignatureAdministrator: clinicalForm.dischargeSignatureAdministrator,
        dischargePrintNameAdministrator: clinicalForm.dischargePrintNameAdministrator,
        dischargeDateAdministrator: clinicalForm.dischargeDateAdministrator,
        dischargeParticipationAcknowledged: clinicalForm.dischargeParticipationAcknowledged,
        dischargeSignatureResident: clinicalForm.dischargeSignatureResident,
        dischargePrintNameResident: clinicalForm.dischargePrintNameResident,
        dischargeDateResident: clinicalForm.dischargeDateResident,
        dischargeSignatureRepresentative: clinicalForm.dischargeSignatureRepresentative,
        dischargePrintNameRepresentative: clinicalForm.dischargePrintNameRepresentative,
        dischargeDateRepresentative: clinicalForm.dischargeDateRepresentative,
      },
      clinicalForm.dischargePlanning
    );

    openRecordPrintView({
      title: `Discharge Planning - ${selectedMember?.name || "Member"}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Member", value: selectedMember?.name || "" },
        { label: "DOB", value: selectedMember?.dob || "" },
        { label: "Plan Type", value: clinicalForm.dischargePlanningType },
        { label: "Plan Date", value: clinicalForm.dischargePlanningDate },
      ],
      body: dischargeBody,
    });
  };

  const handlePrintIncident = (incident) => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    const incidentBody = [
      `Description: ${incident.description || ""}`,
      `Witnesses: ${incident.witnesses || "-"}`,
      `Immediate Actions: ${incident.immediateActions || "-"}`,
      `Notifications: ${incident.notifications || "-"}`,
      `Follow Up: ${incident.followUp || "-"}`,
      `Corrective Actions: ${incident.correctiveActions || "-"}`,
    ].join("\n\n");

    openRecordPrintView({
      title: `Incident Report - ${selectedMember?.name || "Member"}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Type", value: incident.incidentType || "General" },
        { label: "Date", value: incident.incidentDate ? new Date(incident.incidentDate).toLocaleString() : "" },
        { label: "Member", value: selectedMember?.name || selectedMemberId },
      ],
      body: incidentBody,
    });
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Member Record Center
      </Typography>
      <FormControl size="small" sx={{ mb: 3, minWidth: 220 }}>
        <InputLabel id="member-record-print-size-label">Print size</InputLabel>
        <Select labelId="member-record-print-size-label" value={printPageSize} label="Print size" onChange={(event) => setPrintPageSize(event.target.value)}>
          <MenuItem value="A4">A4</MenuItem>
          <MenuItem value="Letter">Letter</MenuItem>
          <MenuItem value="Legal">Legal</MenuItem>
        </Select>
      </FormControl>

      {canAddClients && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" mb={2}>Add Client</Typography>
          <Stack spacing={2}>
            <TextField label="Client Name" value={memberCreateForm.name} onChange={(event) => setMemberCreateForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
            <TextField label="DOB" type="date" InputLabelProps={{ shrink: true }} value={memberCreateForm.dob} onChange={(event) => setMemberCreateForm((prev) => ({ ...prev, dob: event.target.value }))} fullWidth />
            <TextField label="Guardian" value={memberCreateForm.guardian} onChange={(event) => setMemberCreateForm((prev) => ({ ...prev, guardian: event.target.value }))} fullWidth />
            <TextField label="Insurance" value={memberCreateForm.insurance} onChange={(event) => setMemberCreateForm((prev) => ({ ...prev, insurance: event.target.value }))} fullWidth />
            <TextField label="Primary Physician" value={memberCreateForm.physician} onChange={(event) => setMemberCreateForm((prev) => ({ ...prev, physician: event.target.value }))} fullWidth />
            <Button variant="contained" onClick={handleCreateMember} disabled={!memberCreateForm.name.trim()}>
              Add Client
            </Button>
            {memberCreateMessage && <Alert severity={memberCreateMessage.includes("added") ? "success" : "error"}>{memberCreateMessage}</Alert>}
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Upload member files and PDFs
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="member-select-label">Select member</InputLabel>
            <Select labelId="member-select-label" value={selectedMemberId} label="Select member" onChange={(event) => setSelectedMemberId(event.target.value)}>
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Document title" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} fullWidth />
          <TextField label="Category" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)} fullWidth />
          <TextField label="Expiry date" type="date" InputLabelProps={{ shrink: true }} value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} fullWidth />

          <Button variant="outlined" component="label">
            Choose PDF or image
            <input key={uploadKey} hidden accept=".pdf,image/*" type="file" onChange={handleFileSelection} />
          </Button>

          {selectedFile ? (
            <Typography variant="body2" color="text.secondary">
              Selected file: {selectedFile.name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Upload a PDF or scanned image for this member.
            </Typography>
          )}

          <Button variant="contained" onClick={handleUpload} disabled={isUploading || !selectedMemberId || !documentTitle.trim() || !selectedFile}>
            {isUploading ? "Uploading..." : "Upload member file"}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Uploaded files for {members.find((member) => member.id === selectedMemberId)?.name || "selected member"}
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.title}</TableCell>
                <TableCell>{document.category || "Member File"}</TableCell>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => window.open(document.fileUrl, "_blank", "noopener,noreferrer")}
                      disabled={!document.fileUrl}
                    >
                      View
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteDocument(document.id)}>
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Client Assessment Folder</Typography>
        <Paper
          variant="outlined"
          sx={{
            width: { xs: "100%", md: "210mm" },
            minHeight: { xs: "auto", md: "297mm" },
            mx: "auto",
            p: { xs: 2, md: 3 },
            backgroundColor: "#fff",
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography
                sx={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: { xs: "2.25rem", md: "48px" },
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                Pastalino Manor LLC
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: "24px" }}>Assessment</Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 1,
                  fontSize: "12px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Assessment Type:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={clinicalForm.assessmentType}
                      onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentType: event.target.value }))}
                      sx={{ fontSize: "12px", height: 32 }}
                    >
                      <MenuItem value="Initial">Initial</MenuItem>
                      <MenuItem value="Update">Update</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260, justifyContent: "flex-end" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Date:
                  </Typography>
                  <TextField
                    type="date"
                    value={clinicalForm.assessmentDate}
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentDate: event.target.value }))}
                    size="small"
                    sx={{ minWidth: 170, "& .MuiInputBase-input": { fontSize: "12px", py: 0.75 } }}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 320 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Name:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                      value={selectedMemberId}
                      onChange={(event) => setSelectedMemberId(event.target.value)}
                      sx={{ fontSize: "14px", height: 34 }}
                    >
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Date of Birth: {members.find((member) => member.id === selectedMemberId)?.dob || ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "nowrap", overflowX: "auto" }}>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  COT:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={clinicalForm.assessmentCot}
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentCot: event.target.value }))}
                    sx={{ fontSize: "12px", height: 32 }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Expiration Date:
                </Typography>
                <TextField
                  type="date"
                  value={clinicalForm.assessmentExpirationDate}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentExpirationDate: event.target.value }))}
                  size="small"
                  sx={{ minWidth: 160, "& .MuiInputBase-input": { fontSize: "12px", py: 0.75 } }}
                />
                <Typography sx={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Copy in Chart:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select
                    value={clinicalForm.assessmentCopyInChart}
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentCopyInChart: event.target.value }))}
                    sx={{ fontSize: "12px", height: 32 }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Client History"
                value={clinicalForm.assessmentClientHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentClientHistory: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <FormControl fullWidth size="small">
                <InputLabel id="assessment-symptoms-label">A. Symptoms Reported by Resident</InputLabel>
                <Select
                  labelId="assessment-symptoms-label"
                  value={clinicalForm.assessmentSymptoms}
                  label="A. Symptoms Reported by Resident"
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentSymptoms: event.target.value }))}
                >
                  <MenuItem value="">Select</MenuItem>
                  {symptomOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-triggers-label">B. Triggers</InputLabel>
                  <Select
                    labelId="assessment-triggers-label"
                    value={clinicalForm.assessmentTriggerStatus}
                    label="B. Triggers"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentTriggerStatus: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={clinicalForm.assessmentTriggerStatus !== "Yes"}>
                  <InputLabel id="assessment-trigger-type-label">Trigger Type</InputLabel>
                  <Select
                    labelId="assessment-trigger-type-label"
                    value={clinicalForm.assessmentTriggerType}
                    label="Trigger Type"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentTriggerType: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {triggerOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="C. Behavioral Health Hx"
                value={clinicalForm.assessmentBehavioralHealthHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentBehavioralHealthHistory: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="D. Substance Abuse History"
                value={clinicalForm.assessmentSubstanceAbuseHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentSubstanceAbuseHistory: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 1 }}>
                  E. Co-occurring Disorder
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {coOccurringOptions.map((option) => (
                    <FormControlLabel
                      key={option}
                      sx={{ m: 0, whiteSpace: "nowrap" }}
                      control={<Checkbox checked={clinicalForm.assessmentCoOccurringDisorders.includes(option)} onChange={handleAssessmentChecklistChange("assessmentCoOccurringDisorders", option)} />}
                      label={option}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                label="F. Hospitalizations in the last year (psych and medical)"
                value={clinicalForm.assessmentHospitalizations}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentHospitalizations: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-living-env-label">G. Living Environment (prior to admission)</InputLabel>
                  <Select
                    labelId="assessment-living-env-label"
                    value={clinicalForm.assessmentLivingEnvironment}
                    label="G. Living Environment (prior to admission)"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentLivingEnvironment: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {livingEnvironmentOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Living Environment Details"
                  value={clinicalForm.assessmentLivingEnvironmentDetails}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentLivingEnvironmentDetails: event.target.value }))}
                  fullWidth
                />
              </Box>

              <TextField
                label="H. Medications (as noted in hospital documents)"
                value={clinicalForm.assessmentMedications}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentMedications: event.target.value }))}
                multiline
                rows={6}
                fullWidth
              />

              <TextField
                label="I. Medical Concerns and Treatment"
                value={clinicalForm.assessmentMedicalConcerns}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentMedicalConcerns: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-legal-history-label">J. Legal History</InputLabel>
                  <Select
                    labelId="assessment-legal-history-label"
                    value={clinicalForm.assessmentLegalHistory}
                    label="J. Legal History"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentLegalHistory: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {legalHistoryOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Legal History Details"
                  value={clinicalForm.assessmentLegalHistoryDetails}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentLegalHistoryDetails: event.target.value }))}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-guardianship-label">K. Guardianship Info</InputLabel>
                  <Select
                    labelId="assessment-guardianship-label"
                    value={clinicalForm.assessmentGuardianshipInfo}
                    label="K. Guardianship Info"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentGuardianshipInfo: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {guardianshipOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Guardianship Details"
                  value={clinicalForm.assessmentGuardianshipDetails}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentGuardianshipDetails: event.target.value }))}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-military-label">L. Military History</InputLabel>
                  <Select
                    labelId="assessment-military-label"
                    value={clinicalForm.assessmentMilitaryHistory}
                    label="L. Military History"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentMilitaryHistory: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {militaryHistoryOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Military History Details"
                  value={clinicalForm.assessmentMilitaryHistoryDetails}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentMilitaryHistoryDetails: event.target.value }))}
                  fullWidth
                />
              </Box>

              <TextField
                label="M. Family History (marital status, children, parents, siblings)"
                value={clinicalForm.assessmentFamilyHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentFamilyHistory: event.target.value }))}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Family HX of Mental Illness / Substance Use / Abuse"
                value={clinicalForm.assessmentFamilyMhSudAbuse}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentFamilyMhSudAbuse: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="HX of Traumatic Events"
                value={clinicalForm.assessmentTraumaHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentTraumaHistory: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="N. Social Support"
                value={clinicalForm.assessmentSocialSupport}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentSocialSupport: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="O. Educational and Work History"
                value={clinicalForm.assessmentEducationWorkHistory}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentEducationWorkHistory: event.target.value }))}
                multiline
                rows={3}
                fullWidth
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assessment-return-work-school-label">Return to Work/School?</InputLabel>
                  <Select
                    labelId="assessment-return-work-school-label"
                    value={clinicalForm.assessmentReturnWorkSchool}
                    label="Return to Work/School?"
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentReturnWorkSchool: event.target.value }))}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {yesNoUnsureOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Why"
                  value={clinicalForm.assessmentReturnWorkSchoolWhy}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentReturnWorkSchoolWhy: event.target.value }))}
                  fullWidth
                />
              </Box>

              <TextField
                label="P. Allergies (food and medication)"
                value={clinicalForm.assessmentAllergies}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentAllergies: event.target.value }))}
                fullWidth
              />

              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 1 }}>
                  Recreational Activities Checklist
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {recreationalOptions.map((option) => (
                    <FormControlLabel
                      key={option}
                      sx={{ m: 0, whiteSpace: "nowrap" }}
                      control={<Checkbox checked={clinicalForm.assessmentRecreationalActivities.includes(option)} onChange={handleAssessmentChecklistChange("assessmentRecreationalActivities", option)} />}
                      label={option}
                    />
                  ))}
                </Box>
                <TextField
                  label="Recreational Other"
                  value={clinicalForm.assessmentRecreationalOther}
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentRecreationalOther: event.target.value }))}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </Box>

              <TextField
                label="Cultural Preferences"
                value={clinicalForm.assessmentCulturalPreferences}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentCulturalPreferences: event.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="Strengths"
                value={clinicalForm.assessmentStrengths}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentStrengths: event.target.value }))}
                fullWidth
              />

              <TextField
                label="Recommendations"
                value={clinicalForm.assessmentRecommendations}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentRecommendations: event.target.value }))}
                multiline
                rows={4}
                fullWidth
              />

              <FormControl fullWidth size="small">
                <InputLabel id="assessment-resident-participation-label">Resident/Representative Participated</InputLabel>
                <Select
                  labelId="assessment-resident-participation-label"
                  value={clinicalForm.assessmentResidentParticipation}
                  label="Resident/Representative Participated"
                  onChange={(event) => setClinicalForm((prev) => ({ ...prev, assessmentResidentParticipation: event.target.value }))}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                const selectedMember = members.find((member) => member.id === selectedMemberId);
                setClinicalForm((prev) => ({
                  ...prev,
                  assessment: buildComprehensiveAssessmentTemplate({
                    memberName: selectedMember?.name || "",
                    memberDob: selectedMember?.dob || "",
                    assessmentDate: prev.assessmentDate,
                    cot: prev.assessmentCot,
                    expirationDate: prev.assessmentExpirationDate,
                    copyInChart: prev.assessmentCopyInChart,
                  }),
                }));
              }}
              disabled={!selectedMemberId}
            >
              Load Full Assessment Template
            </Button>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={() => handleSaveClinicalSection("assessment")} disabled={!selectedMemberId || savingClinicalField === "assessment"}>
                {savingClinicalField === "assessment" ? "Saving..." : "Save Client Assessment"}
              </Button>
              <Button variant="outlined" onClick={handlePrintAssessment} disabled={!selectedMemberId}>
                Read / Print
              </Button>
            </Stack>

            {clinicalMessages.assessment && <Alert severity="success">{clinicalMessages.assessment}</Alert>}
          </Stack>
        </Paper>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Treatment Plan Folder</Typography>
        <Paper
          variant="outlined"
          sx={{ width: { xs: "100%", md: "210mm" }, minHeight: { xs: "auto", md: "297mm" }, mx: "auto", p: { xs: 2, md: 3 }, backgroundColor: "#fff" }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "2.25rem", md: "48px" }, lineHeight: 1, textTransform: "uppercase" }}>
                Pastalino Manor LLC
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: "24px" }}>Treatment Plan</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Treatment Plan Type:</Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={clinicalForm.treatmentPlanType}
                      onChange={(event) => setClinicalForm((prev) => ({ ...prev, treatmentPlanType: event.target.value }))}
                      sx={{ fontSize: "12px", height: 32 }}
                    >
                      <MenuItem value="Initial">Initial</MenuItem>
                      <MenuItem value="Update">Update</MenuItem>
                      <MenuItem value="Review">Review</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260, justifyContent: "flex-end" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Date:</Typography>
                  <TextField
                    type="date"
                    value={clinicalForm.treatmentPlanDate}
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, treatmentPlanDate: event.target.value }))}
                    size="small"
                    sx={{ minWidth: 170, "& .MuiInputBase-input": { fontSize: "12px", py: 0.75 } }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 320 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Name:</Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} sx={{ fontSize: "14px", height: 34 }}>
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Date of Birth: {members.find((member) => member.id === selectedMemberId)?.dob || ""}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ border: "1px solid #d9d9d9", borderRadius: 1, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Presenting Issues</TableCell>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Goal</TableCell>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Treatment Plan / Service</TableCell>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Treatment Methods</TableCell>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Frequency of Each Treatment</TableCell>
                    <TableCell sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd" }}>Methods/Frequency of Comm Client Progress</TableCell>
                    {clinicalForm.treatmentPlanExtraColumns.map((columnName, columnIndex) => (
                      <TableCell key={`tp-col-${columnIndex}`} sx={{ fontWeight: 700, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #bdbdbd", minWidth: 180 }}>
                        <TextField
                          size="small"
                          value={columnName}
                          onChange={(event) => {
                            const nextColumns = [...clinicalForm.treatmentPlanExtraColumns];
                            nextColumns[columnIndex] = event.target.value;
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanExtraColumns: nextColumns }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 700, width: 80, borderBottom: "1px solid #bdbdbd" }}>Row</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clinicalForm.treatmentPlanRows.map((row, index) => (
                    <TableRow key={`tp-row-${index}`}>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 180, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.presentingIssues}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], presentingIssues: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 180, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.goal}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], goal: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 220, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.service}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], service: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 200, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.methods}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], methods: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 220, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.frequency}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], frequency: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", minWidth: 260, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                        <TextField
                          multiline
                          minRows={3}
                          value={row.progressCommunication}
                          onChange={(event) => {
                            const nextRows = [...clinicalForm.treatmentPlanRows];
                            nextRows[index] = { ...nextRows[index], progressCommunication: event.target.value };
                            setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                          }}
                          fullWidth
                        />
                      </TableCell>
                      {clinicalForm.treatmentPlanExtraColumns.map((_, columnIndex) => (
                        <TableCell key={`tp-extra-cell-${index}-${columnIndex}`} sx={{ verticalAlign: "top", minWidth: 180, borderRight: "1px solid #bdbdbd", borderBottom: "1px solid #e0e0e0" }}>
                          <TextField
                            multiline
                            minRows={3}
                            value={Array.isArray(row.extra) ? (row.extra[columnIndex] || "") : ""}
                            onChange={(event) => {
                              const nextRows = [...clinicalForm.treatmentPlanRows];
                              const currentExtra = Array.isArray(nextRows[index].extra)
                                ? [...nextRows[index].extra]
                                : Array(clinicalForm.treatmentPlanExtraColumns.length).fill("");
                              currentExtra[columnIndex] = event.target.value;
                              nextRows[index] = { ...nextRows[index], extra: currentExtra };
                              setClinicalForm((prev) => ({ ...prev, treatmentPlanRows: nextRows }));
                            }}
                            fullWidth
                          />
                        </TableCell>
                      ))}
                      <TableCell sx={{ verticalAlign: "top", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>{index + 1}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() =>
                  setClinicalForm((prev) => ({
                    ...prev,
                    treatmentPlanRows: [
                      ...prev.treatmentPlanRows,
                      { ...emptyTreatmentPlanRow, extra: Array(prev.treatmentPlanExtraColumns.length).fill("") },
                    ],
                  }))
                }
              >
                Add Row
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setClinicalForm((prev) => ({
                    ...prev,
                    treatmentPlanExtraColumns: [...prev.treatmentPlanExtraColumns, `Column ${prev.treatmentPlanExtraColumns.length + 1}`],
                    treatmentPlanRows: prev.treatmentPlanRows.map((row) => ({
                      ...row,
                      extra: [...(Array.isArray(row.extra) ? row.extra : []), ""],
                    })),
                  }))
                }
              >
                Add Column
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() =>
                  setClinicalForm((prev) => ({
                    ...prev,
                    treatmentPlanRows: prev.treatmentPlanRows.length > 1 ? prev.treatmentPlanRows.slice(0, -1) : prev.treatmentPlanRows,
                  }))
                }
                disabled={clinicalForm.treatmentPlanRows.length <= 1}
              >
                Remove Last Row
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() =>
                  setClinicalForm((prev) => ({
                    ...prev,
                    treatmentPlanExtraColumns: prev.treatmentPlanExtraColumns.length > 0 ? prev.treatmentPlanExtraColumns.slice(0, -1) : prev.treatmentPlanExtraColumns,
                    treatmentPlanRows: prev.treatmentPlanRows.map((row) => ({
                      ...row,
                      extra: Array.isArray(row.extra) && row.extra.length > 0 ? row.extra.slice(0, -1) : [],
                    })),
                  }))
                }
                disabled={clinicalForm.treatmentPlanExtraColumns.length === 0}
              >
                Remove Last Column
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={() => handleSaveClinicalSection("treatmentPlan")} disabled={!selectedMemberId || savingClinicalField === "treatmentPlan"}>
                {savingClinicalField === "treatmentPlan" ? "Saving..." : "Save Treatment Plan"}
              </Button>
              <Button variant="outlined" onClick={handlePrintTreatmentPlan} disabled={!selectedMemberId}>
                Read / Print
              </Button>
            </Stack>
            {clinicalMessages.treatmentPlan && <Alert severity="success">{clinicalMessages.treatmentPlan}</Alert>}
          </Stack>
        </Paper>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Discharge Planning Folder</Typography>
        <Paper
          variant="outlined"
          sx={{ width: { xs: "100%", md: "210mm" }, minHeight: { xs: "auto", md: "297mm" }, mx: "auto", p: { xs: 2, md: 3 }, backgroundColor: "#fff" }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "2.25rem", md: "48px" }, lineHeight: 1, textTransform: "uppercase" }}>
                Pastalino Manor LLC
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: "24px" }}>Discharge Planning</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Discharge Planning Type:</Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={clinicalForm.dischargePlanningType}
                      onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePlanningType: event.target.value }))}
                      sx={{ fontSize: "12px", height: 32 }}
                    >
                      <MenuItem value="Initial">Initial</MenuItem>
                      <MenuItem value="Update">Update</MenuItem>
                      <MenuItem value="Review">Review</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260, justifyContent: "flex-end" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Date:</Typography>
                  <TextField
                    type="date"
                    value={clinicalForm.dischargePlanningDate}
                    onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePlanningDate: event.target.value }))}
                    size="small"
                    sx={{ minWidth: 170, "& .MuiInputBase-input": { fontSize: "12px", py: 0.75 } }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 320 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Name:</Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} sx={{ fontSize: "14px", height: 34 }}>
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Date of Birth: {members.find((member) => member.id === selectedMemberId)?.dob || ""}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>Member Information</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Member Name" value={members.find((member) => member.id === selectedMemberId)?.name || ""} fullWidth disabled />
              <TextField label="DOB" value={members.find((member) => member.id === selectedMemberId)?.dob || ""} fullWidth disabled />
              <TextField
                label="Gender"
                value={clinicalForm.dischargeGender}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeGender: event.target.value }))}
                fullWidth
              />
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
              <FormControlLabel
                control={<Checkbox checked={clinicalForm.dischargeCot} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeCot: event.target.checked }))} />}
                label="COT"
              />
              <TextField
                label="COT Date"
                type="date"
                value={clinicalForm.dischargeCoeDate}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeCoeDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 180 }}
              />
              <FormControlLabel
                control={<Checkbox checked={clinicalForm.dischargeVoluntary} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeVoluntary: event.target.checked }))} />}
                label="Voluntary"
              />
            </Stack>

            <TextField
              label="Current Facility Information"
              value={clinicalForm.dischargeCurrentFacilityInformation}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeCurrentFacilityInformation: event.target.value }))}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel id="discharge-returning-residence-label">Returning to own/family residence?</InputLabel>
              <Select
                labelId="discharge-returning-residence-label"
                value={clinicalForm.dischargeReturningResidence}
                label="Returning to own/family residence?"
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReturningResidence: event.target.value }))}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Psychiatric Diagnosis"
              value={clinicalForm.dischargePsychiatricDiagnosis}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePsychiatricDiagnosis: event.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Medical Diagnosis"
              value={clinicalForm.dischargeMedicalDiagnosis}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeMedicalDiagnosis: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Medications"
              value={clinicalForm.dischargeMedications}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeMedications: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Identified Strengths"
              value={clinicalForm.dischargeIdentifiedStrengths}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeIdentifiedStrengths: event.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Natural Supports"
              value={clinicalForm.dischargeNaturalSupports}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeNaturalSupports: event.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Cultural Priorities"
              value={clinicalForm.dischargeCulturalPriorities}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeCulturalPriorities: event.target.value }))}
              multiline
              rows={2}
              fullWidth
            />

            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>Discharge Readiness</Typography>
            <Box sx={{ border: "1px solid #d9d9d9", borderRadius: 1, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Readiness Item</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>1. Able to complete hygiene tasks without assistance/reminders for 3 consecutive months</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={clinicalForm.dischargeReadinessHygiene} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReadinessHygiene: event.target.value }))}>
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Y">Y</MenuItem>
                          <MenuItem value="N">N</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2. Able to self-administer meds without assistance/reminders 100% of the time for 3 months</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={clinicalForm.dischargeReadinessMeds} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReadinessMeds: event.target.value }))}>
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Y">Y</MenuItem>
                          <MenuItem value="N">N</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>3. Able to remain safe in case of fire as demonstrated verbally</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={clinicalForm.dischargeReadinessFireSafety} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReadinessFireSafety: event.target.value }))}>
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Y">Y</MenuItem>
                          <MenuItem value="N">N</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>4. Able to maintain mood stability without assistance/redirection</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={clinicalForm.dischargeReadinessMoodStability} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReadinessMoodStability: event.target.value }))}>
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Y">Y</MenuItem>
                          <MenuItem value="N">N</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>5. Family/guardian/supports have been involved in discharge planning</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={clinicalForm.dischargeReadinessFamilyInvolved} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeReadinessFamilyInvolved: event.target.value }))}>
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Y">Y</MenuItem>
                          <MenuItem value="N">N</MenuItem>
                          <MenuItem value="NA">NA</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <TextField
              label="Recommendations"
              value={clinicalForm.dischargeRecommendations}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeRecommendations: event.target.value }))}
              multiline
              rows={2}
              fullWidth
            />

            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>Anticipated Aftercare Services</Typography>
            <TextField
              label="1) Family/Peer Support Interventions"
              value={clinicalForm.dischargeAftercareFamilyPeer}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeAftercareFamilyPeer: event.target.value }))}
              fullWidth
            />
            <TextField
              label="2) Outpatient Health Therapies"
              value={clinicalForm.dischargeAftercareOutpatientTherapies}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeAftercareOutpatientTherapies: event.target.value }))}
              fullWidth
            />
            <TextField
              label="3) Outpatient Medication Management"
              value={clinicalForm.dischargeAftercareMedicationManagement}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeAftercareMedicationManagement: event.target.value }))}
              fullWidth
            />
            <TextField
              label="4) Community Supports"
              value={clinicalForm.dischargeAftercareCommunitySupports}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeAftercareCommunitySupports: event.target.value }))}
              fullWidth
            />

            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>List Discharge Appointments</Typography>
            <Box sx={{ border: "1px solid #d9d9d9", borderRadius: 1, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Appointment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clinicalForm.dischargeAppointments.map((appointment, index) => (
                    <TableRow key={`discharge-appt-${index}`}>
                      <TableCell>{appointment.name}</TableCell>
                      <TableCell>
                        <TextField
                          value={appointment.provider}
                          onChange={(event) => handleDischargeAppointmentChange(index, "provider", event.target.value)}
                          fullWidth
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date"
                          value={appointment.date}
                          onChange={(event) => handleDischargeAppointmentChange(index, "date", event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          value={appointment.time}
                          onChange={(event) => handleDischargeAppointmentChange(index, "time", event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>Signatures</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              <TextField
                label="BHP/RN/LPN/MD Signature"
                value={clinicalForm.dischargeSignatureClinician}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeSignatureClinician: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Print Name"
                value={clinicalForm.dischargePrintNameClinician}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePrintNameClinician: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Date"
                type="date"
                value={clinicalForm.dischargeDateClinician}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeDateClinician: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Administrator Signature"
                value={clinicalForm.dischargeSignatureAdministrator}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeSignatureAdministrator: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Administrator Print Name"
                value={clinicalForm.dischargePrintNameAdministrator}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePrintNameAdministrator: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Administrator Date"
                type="date"
                value={clinicalForm.dischargeDateAdministrator}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeDateAdministrator: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <FormControlLabel
              control={<Checkbox checked={clinicalForm.dischargeParticipationAcknowledged} onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeParticipationAcknowledged: event.target.checked }))} />}
              label="I was encouraged to participate and was involved in treatment and discharge planning decisions"
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Resident Signature"
                value={clinicalForm.dischargeSignatureResident}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeSignatureResident: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Resident Print Name"
                value={clinicalForm.dischargePrintNameResident}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePrintNameResident: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Resident Date"
                type="date"
                value={clinicalForm.dischargeDateResident}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeDateResident: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Representative Signature"
                value={clinicalForm.dischargeSignatureRepresentative}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeSignatureRepresentative: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Representative Print Name"
                value={clinicalForm.dischargePrintNameRepresentative}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePrintNameRepresentative: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Representative Date"
                type="date"
                value={clinicalForm.dischargeDateRepresentative}
                onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargeDateRepresentative: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <TextField
              label="Discharge Planning Notes"
              multiline
              rows={4}
              value={clinicalForm.dischargePlanning}
              onChange={(event) => setClinicalForm((prev) => ({ ...prev, dischargePlanning: event.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={() => handleSaveClinicalSection("dischargePlanning")} disabled={!selectedMemberId || savingClinicalField === "dischargePlanning"}>
                {savingClinicalField === "dischargePlanning" ? "Saving..." : "Save Discharge Planning"}
              </Button>
              <Button variant="outlined" onClick={handlePrintDischargePlanning} disabled={!selectedMemberId}>
                Read / Print
              </Button>
            </Stack>
            {clinicalMessages.dischargePlanning && <Alert severity="success">{clinicalMessages.dischargePlanning}</Alert>}
          </Stack>
        </Paper>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Incident Report Form</Typography>
        <Paper
          variant="outlined"
          sx={{ width: { xs: "100%", md: "210mm" }, minHeight: { xs: "auto", md: "297mm" }, mx: "auto", p: { xs: 2, md: 3 }, backgroundColor: "#fff" }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "2.25rem", md: "48px" }, lineHeight: 1, textTransform: "uppercase" }}>
                Pastalino Manor LLC
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: "24px" }}>Incident Report</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 260 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Incident Type:</Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={incidentForm.incidentType}
                      onChange={(event) => setIncidentForm((prev) => ({ ...prev, incidentType: event.target.value }))}
                      sx={{ fontSize: "12px", height: 32 }}
                    >
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="Behavioral">Behavioral</MenuItem>
                      <MenuItem value="Medical">Medical</MenuItem>
                      <MenuItem value="Safety">Safety</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 280, justifyContent: "flex-end" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>Date:</Typography>
                  <TextField
                    type="datetime-local"
                    value={incidentForm.incidentDate}
                    onChange={(event) => setIncidentForm((prev) => ({ ...prev, incidentDate: event.target.value }))}
                    size="small"
                    sx={{ minWidth: 190, "& .MuiInputBase-input": { fontSize: "12px", py: 0.75 } }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 320 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Name:</Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} sx={{ fontSize: "14px", height: 34 }}>
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                  Date of Birth: {members.find((member) => member.id === selectedMemberId)?.dob || ""}
                </Typography>
              </Box>
            </Box>

          <TextField
            label="Description"
            multiline
            rows={3}
            value={incidentForm.description}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, description: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Witnesses"
            value={incidentForm.witnesses}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, witnesses: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Immediate Actions"
            multiline
            rows={2}
            value={incidentForm.immediateActions}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, immediateActions: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Notifications"
            multiline
            rows={2}
            value={incidentForm.notifications}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, notifications: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Follow Up"
            multiline
            rows={2}
            value={incidentForm.followUp}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, followUp: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Corrective Actions"
            multiline
            rows={2}
            value={incidentForm.correctiveActions}
            onChange={(event) => setIncidentForm((prev) => ({ ...prev, correctiveActions: event.target.value }))}
            fullWidth
          />
          <Button variant="contained" onClick={handleSaveIncident} disabled={isSavingIncident || !selectedMemberId || !incidentForm.description.trim()}>
            {isSavingIncident ? "Saving..." : "Submit Incident Report"}
          </Button>
          {incidentMessage && <Alert severity="success">{incidentMessage}</Alert>}
          </Stack>
        </Paper>

        <Typography variant="subtitle1" mt={3} mb={1}>Incident history</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Witnesses</TableCell>
              <TableCell>Record Export</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell>{incident.incidentType || "General"}</TableCell>
                <TableCell>{incident.incidentDate ? new Date(incident.incidentDate).toLocaleString() : "-"}</TableCell>
                <TableCell>{incident.description}</TableCell>
                <TableCell>{incident.witnesses || "-"}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => handlePrintIncident(incident)}>
                    Read / Print
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No incidents for selected member.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Member overview</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Guardian</TableCell>
              <TableCell>Insurance</TableCell>
              <TableCell>Primary care</TableCell>
              <TableCell>Face Sheet</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.guardian}</TableCell>
                <TableCell>{member.insurance}</TableCell>
                <TableCell>{member.physician}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openFaceSheetForMember(member.id)}>
                    Open Face Sheet
                  </Button>
                </TableCell>
                <TableCell>
                  <Chip label={member.status || "active"} color="success" size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>Clinical and administrative record areas</Typography>
        <Stack spacing={1}>
          {members.map((member) => (
            <Box key={member.id} sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1">{member.name}</Typography>
              <Typography variant="body2">Demographics: {member.demographics ? "Stored" : "Pending entry"}</Typography>
              <Typography variant="body2">Clinical documents: {member.clinicalDocuments ? "Stored" : "Pending entry"}</Typography>
              <Typography variant="body2">Medication management: {member.medications ? "Stored" : "Pending entry"}</Typography>
              <Typography variant="body2">Emergency contacts: {member.emergencyContacts || "Pending entry"}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
