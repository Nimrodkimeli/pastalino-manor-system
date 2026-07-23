const express = require("express");
const twilio = require("twilio");
const {
  CONSENT_OPTED_IN,
  CONSENT_OPTED_OUT,
  parseInboundKeyword,
  recordInboundSms,
  updateSmsConsent,
} = require("../services/smsConsent");

const router = express.Router();

router.get("/sms/webhook", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "SMS webhook is live. Twilio must send POST requests to this URL.",
  });
});

function twimlMessage(text) {
  const safeText = String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safeText}</Message></Response>`;
}

function isSignatureValidationEnabled() {
  return String(process.env.TWILIO_VALIDATE_SIGNATURES || "true").toLowerCase() !== "false";
}

function resolvedWebhookUrl(req) {
  const configuredUrl = String(process.env.TWILIO_SMS_WEBHOOK_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl;
  }
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

function validateTwilioWebhookSignature(req, res, next) {
  if (!isSignatureValidationEnabled()) {
    return next();
  }

  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!authToken) {
    return res.status(500).json({ message: "TWILIO_AUTH_TOKEN_NOT_CONFIGURED" });
  }

  const signature = String(req.get("X-Twilio-Signature") || "").trim();
  if (!signature) {
    return res.status(403).json({ message: "TWILIO_SIGNATURE_MISSING" });
  }

  const webhookUrl = resolvedWebhookUrl(req);
  const isValid = twilio.validateRequest(authToken, signature, webhookUrl, req.body);
  if (!isValid) {
    return res.status(403).json({ message: "TWILIO_SIGNATURE_INVALID" });
  }

  return next();
}

router.post("/sms/webhook", express.urlencoded({ extended: false }), validateTwilioWebhookSignature, async (req, res) => {
  const from = String(req.body.From || "").trim();
  const to = String(req.body.To || "").trim();
  const body = String(req.body.Body || "").trim();
  const keyword = parseInboundKeyword(body);

  try {
    await recordInboundSms({
      from,
      to,
      body,
      keywordType: keyword.type,
      keyword: keyword.keyword,
    });

    if (keyword.type === "opt-in") {
      await updateSmsConsent({
        phoneNumber: from,
        consentStatus: CONSENT_OPTED_IN,
        source: "via-text",
        keyword: keyword.keyword,
      });

      res.set("Content-Type", "text/xml");
      return res.status(200).send(
        twimlMessage(
          "Pastalino Manor: You are now opted in to transactional SMS notifications. Msg frequency varies. Msg and data rates may apply. Reply HELP for help. Reply STOP to opt out."
        )
      );
    }

    if (keyword.type === "opt-out") {
      await updateSmsConsent({
        phoneNumber: from,
        consentStatus: CONSENT_OPTED_OUT,
        source: "via-text",
        keyword: keyword.keyword,
      });

      res.set("Content-Type", "text/xml");
      return res.status(200).send(
        twimlMessage("Pastalino Manor: You are opted out and will no longer receive SMS messages. Reply START to opt back in.")
      );
    }

    if (keyword.type === "help") {
      res.set("Content-Type", "text/xml");
      return res.status(200).send(
        twimlMessage("Pastalino Manor: For support, contact notifications@pastalinomanor.llc. Reply STOP to opt out.")
      );
    }

    res.set("Content-Type", "text/xml");
    return res.status(200).send(
      twimlMessage("Pastalino Manor: Reply START to opt in, HELP for help, or STOP to opt out.")
    );
  } catch (error) {
    console.error("[sms-webhook] failed", error);
    res.set("Content-Type", "text/xml");
    return res.status(200).send(twimlMessage("Pastalino Manor: We could not process your request right now. Please try again later."));
  }
});

module.exports = router;
