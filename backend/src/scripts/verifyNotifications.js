require("dotenv").config({ override: true });

const { sendMailMessage, verifySmtpConnection } = require("../services/email");
const {
  getNotificationProviderStatus,
  sendSmsNotification,
  verifySmsProvider,
} = require("../services/notifications");

function buildTestMessage() {
  const timestamp = new Date().toISOString();
  return {
    subject: "Pastalino notification test",
    text: [
      "This is a safe test notification from Pastalino Manor System.",
      "No appointment action is required.",
      `Timestamp: ${timestamp}`,
    ].join("\n"),
  };
}

function isTwilioBlockedDestination(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("verified recipient") || message.includes("trial phone number") || message.includes("not assigned for messaging");
}

async function sendSafeTests() {
  const { subject, text } = buildTestMessage();
  const results = [];

  if (process.env.TEST_NOTIFICATION_EMAIL) {
    try {
      results.push(
        await sendMailMessage({
          to: process.env.TEST_NOTIFICATION_EMAIL,
          subject,
          text,
        })
      );
    } catch (error) {
      results.push({
        success: false,
        channel: "email",
        to: process.env.TEST_NOTIFICATION_EMAIL,
        reason: error.message,
      });
    }
  } else {
    results.push({
      success: false,
      channel: "email",
      skipped: true,
      reason: "TEST_NOTIFICATION_EMAIL_NOT_CONFIGURED",
    });
  }

  if (process.env.TEST_NOTIFICATION_PHONE) {
    try {
      results.push(
        await sendSmsNotification({
          to: process.env.TEST_NOTIFICATION_PHONE,
          message: text,
        })
      );
    } catch (error) {
      if (isTwilioBlockedDestination(error)) {
        results.push({
          success: false,
          channel: "sms",
          to: process.env.TEST_NOTIFICATION_PHONE,
          skipped: true,
          reason: "TWILIO_BLOCKED_DESTINATION",
          detail: error.message,
        });
        return results;
      }

      results.push({
        success: false,
        channel: "sms",
        to: process.env.TEST_NOTIFICATION_PHONE,
        reason: error.message,
      });
    }
  } else {
    results.push({
      success: false,
      channel: "sms",
      skipped: true,
      reason: "TEST_NOTIFICATION_PHONE_NOT_CONFIGURED",
    });
  }

  return results;
}

async function main() {
  const shouldSend = process.argv.includes("--send");

  const output = {
    status: getNotificationProviderStatus(),
    verification: {
      email: await verifySmtpConnection().catch((error) => ({ success: false, reason: error.message })),
      sms: await verifySmsProvider().catch((error) => ({ success: false, reason: error.message })),
    },
  };

  if (shouldSend) {
    output.tests = await sendSafeTests();
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
