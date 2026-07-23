const { get, run } = require("../db");

let tablesReady = false;

async function ensureTables() {
  if (tablesReady) {
    return;
  }

  await run(
    `CREATE TABLE IF NOT EXISTS sms_consent (
      phoneNumber TEXT PRIMARY KEY,
      consentStatus TEXT NOT NULL DEFAULT 'unknown',
      consentSource TEXT,
      lastKeyword TEXT,
      updatedAt INTEGER NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS sms_inbound_events (
      id TEXT PRIMARY KEY,
      fromPhone TEXT NOT NULL,
      toPhone TEXT,
      body TEXT,
      keywordType TEXT,
      keyword TEXT,
      createdAt INTEGER NOT NULL
    )`
  );

  tablesReady = true;
}

const CONSENT_OPTED_IN = "opted_in";
const CONSENT_OPTED_OUT = "opted_out";
const CONSENT_UNKNOWN = "unknown";

const OPT_IN_KEYWORDS = new Set(["START", "YES", "UNSTOP"]);
const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);

function normalizePhoneNumber(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("+")) {
    return rawValue;
  }

  const digits = rawValue.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return rawValue;
}

function parseInboundKeyword(value) {
  const keyword = String(value || "").trim().toUpperCase();
  if (OPT_IN_KEYWORDS.has(keyword)) {
    return { keyword, type: "opt-in" };
  }
  if (OPT_OUT_KEYWORDS.has(keyword)) {
    return { keyword, type: "opt-out" };
  }
  if (HELP_KEYWORDS.has(keyword)) {
    return { keyword, type: "help" };
  }
  return { keyword, type: "other" };
}

function shouldRequireOptIn() {
  return String(process.env.SMS_REQUIRE_OPT_IN || "true").toLowerCase() !== "false";
}

async function ensureSmsConsentForPhone(phoneNumber) {
  await ensureTables();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    return { success: false, reason: "PHONE_REQUIRED" };
  }

  const existing = await get("SELECT phoneNumber FROM sms_consent WHERE phoneNumber = ?", [normalizedPhone]);
  if (existing) {
    return { success: true, phoneNumber: normalizedPhone, created: false };
  }

  await run(
    `INSERT INTO sms_consent (phoneNumber, consentStatus, consentSource, updatedAt)
      VALUES (?, ?, ?, ?)`,
    [normalizedPhone, CONSENT_UNKNOWN, "system", Date.now()]
  );

  return { success: true, phoneNumber: normalizedPhone, created: true };
}

async function updateSmsConsent({ phoneNumber, consentStatus, source, keyword }) {
  await ensureTables();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    return { success: false, reason: "PHONE_REQUIRED" };
  }

  await ensureSmsConsentForPhone(normalizedPhone);

  await run(
    `UPDATE sms_consent
      SET consentStatus = ?, consentSource = ?, lastKeyword = ?, updatedAt = ?
      WHERE phoneNumber = ?`,
    [consentStatus, source || "unknown", keyword || "", Date.now(), normalizedPhone]
  );

  return {
    success: true,
    phoneNumber: normalizedPhone,
    consentStatus,
    source: source || "unknown",
    keyword: keyword || "",
  };
}

async function getSmsConsent(phoneNumber) {
  await ensureTables();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    return {
      phoneNumber: "",
      consentStatus: CONSENT_UNKNOWN,
      consentSource: "unknown",
      lastKeyword: "",
      updatedAt: null,
      requiresOptIn: shouldRequireOptIn(),
    };
  }

  const row = await get("SELECT * FROM sms_consent WHERE phoneNumber = ?", [normalizedPhone]);
  if (!row) {
    return {
      phoneNumber: normalizedPhone,
      consentStatus: CONSENT_UNKNOWN,
      consentSource: "unknown",
      lastKeyword: "",
      updatedAt: null,
      requiresOptIn: shouldRequireOptIn(),
    };
  }

  return {
    phoneNumber: row.phoneNumber,
    consentStatus: row.consentStatus,
    consentSource: row.consentSource || "unknown",
    lastKeyword: row.lastKeyword || "",
    updatedAt: row.updatedAt || null,
    requiresOptIn: shouldRequireOptIn(),
  };
}

async function canSendSmsTo(phoneNumber) {
  const consent = await getSmsConsent(phoneNumber);

  if (!consent.phoneNumber) {
    return { allowed: false, reason: "PHONE_REQUIRED", consent };
  }

  if (!consent.requiresOptIn) {
    return { allowed: true, reason: null, consent };
  }

  if (consent.consentStatus === CONSENT_OPTED_IN) {
    return { allowed: true, reason: null, consent };
  }

  if (consent.consentStatus === CONSENT_OPTED_OUT) {
    return { allowed: false, reason: "SMS_OPTED_OUT", consent };
  }

  return { allowed: false, reason: "SMS_NOT_OPTED_IN", consent };
}

async function recordInboundSms({ from, to, body, keywordType, keyword }) {
  await ensureTables();
  const normalizedFrom = normalizePhoneNumber(from);
  const normalizedTo = normalizePhoneNumber(to);
  await run(
    `INSERT INTO sms_inbound_events (id, fromPhone, toPhone, body, keywordType, keyword, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `sms-in-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      normalizedFrom,
      normalizedTo,
      String(body || ""),
      String(keywordType || "other"),
      String(keyword || ""),
      Date.now(),
    ]
  );
}

module.exports = {
  CONSENT_OPTED_IN,
  CONSENT_OPTED_OUT,
  CONSENT_UNKNOWN,
  canSendSmsTo,
  getSmsConsent,
  normalizePhoneNumber,
  parseInboundKeyword,
  recordInboundSms,
  shouldRequireOptIn,
  updateSmsConsent,
};
