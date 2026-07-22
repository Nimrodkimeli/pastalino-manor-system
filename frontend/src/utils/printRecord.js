const PAGE_SIZE_MAP = {
  A4: "210mm 297mm",
  Letter: "8.5in 11in",
  Legal: "8.5in 14in",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNarrativeHtml(body) {
  const text = String(body || "").trim();
  if (!text) {
    return '<p class="paragraph">No narrative provided.</p>';
  }

  const blocks = text.split(/\n\s*\n/).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length) {
        return "";
      }

      const rows = lines
        .map((line) => {
          const dividerIndex = line.indexOf(":");
          if (dividerIndex > 0) {
            const label = line.slice(0, dividerIndex).trim();
            const value = line.slice(dividerIndex + 1).trim();
            return `<div class="kv-row"><span class="kv-label">${escapeHtml(label)}:</span><span class="kv-value">${escapeHtml(value)}</span></div>`;
          }

          return `<p class="paragraph">${escapeHtml(line)}</p>`;
        })
        .join("");

      return `<section class="section-block">${rows}</section>`;
    })
    .join("");
}

function getBodyHeading(noteType) {
  switch (noteType) {
    case "progress_note":
      return "Progress Note Sections";
    case "group_note":
      return "Group Note Sections";
    case "counselling_note":
      return "Individual Counseling Sections";
    case "art_meeting":
      return "Art Meeting Sections";
    default:
      return "Note Sections";
  }
}

function parseKeyValueText(body) {
  const entries = [];
  String(body || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const dividerIndex = line.indexOf(":");
      if (dividerIndex > 0) {
        entries.push({
          label: line.slice(0, dividerIndex).trim(),
          value: line.slice(dividerIndex + 1).trim(),
        });
      } else {
        entries.push({ label: "", value: line });
      }
    });

  return entries;
}

function renderSectionBlock(title, fields) {
  const rows = fields
    .filter((field) => field.value)
    .map((field) => {
      if (!field.label) {
        return `<p class="paragraph">${escapeHtml(field.value)}</p>`;
      }

      return `<div class="kv-row"><span class="kv-label">${escapeHtml(field.label)}:</span><span class="kv-value">${escapeHtml(field.value)}</span></div>`;
    })
    .join("");

  if (!rows) {
    return "";
  }

  return `<section class="section-block"><div class="section-heading">${escapeHtml(title)}</div>${rows}</section>`;
}

function renderInlineFieldRow(fields) {
  const items = fields
    .filter((field) => field.value)
    .map((field) => `<div class="inline-field"><span class="inline-label">${escapeHtml(field.label)}:</span><span class="inline-value">${escapeHtml(field.value)}</span></div>`)
    .join("");

  return items ? `<div class="inline-row">${items}</div>` : "";
}

function formatProgressNoteHtml(body) {
  const entries = parseKeyValueText(body);
  const lookup = new Map(entries.map((entry) => [entry.label.toLowerCase(), entry.value]));
  const findValue = (...labels) => {
    for (const label of labels) {
      const value = lookup.get(label.toLowerCase());
      if (value) {
        return value;
      }
    }
    return "";
  };

  const sections = [
    renderSectionBlock("Shift Information", [
      { label: "Date", value: findValue("Date") },
      { label: "Shift Coverage", value: findValue("Shift Coverage") },
      { label: "Shift Hours", value: findValue("Shift Hours") },
    ]),
    renderSectionBlock("Medication", [
      { label: "Did Client Self-Administer Medication?", value: findValue("Did Client Self-Administer Medication?") },
    ]) + renderInlineFieldRow([
      { label: "Prompts", value: findValue("Prompts") },
      { label: "Number of Prompts", value: findValue("Number of Prompts") },
    ]) + renderSectionBlock("Medication Details", [
      { label: "Client Knows Regarding Medications", value: findValue("Client Knows Regarding Medications") },
      { label: "Does Client Have 7-Day Medication Supply?", value: findValue("Does Client Have 7-Day Medication Supply?") },
      { label: "Medication Observation", value: findValue("Medication Observation") },
    ]),
    renderSectionBlock("ADL / ILS", [
      { label: "Does Client Complete ADL's?", value: findValue("Does Client Complete ADL's?") },
    ]) + renderInlineFieldRow([
      { label: "ADL Prompting/Assistance", value: findValue("ADL Prompting/Assistance") },
      { label: "PCS Tasks", value: findValue("PCS Tasks") },
    ]) + renderInlineFieldRow([
      { label: "ADL Assistance Provided With", value: findValue("ADL Assistance Provided With") },
      { label: "Did Client Complete ILS?", value: findValue("Did Client Complete ILS?") },
    ]) + renderInlineFieldRow([
      { label: "ILS Prompting", value: findValue("ILS Prompting") },
      { label: "ILS Activity", value: findValue("ILS Activity") },
    ]),
    renderSectionBlock("Activities and Appointments", [
      { label: "Activities Participated In", value: findValue("Activities Participated In") },
    ]) + renderInlineFieldRow([
      { label: "Did Client Attend Any Appointment?", value: findValue("Did Client Attend Any Appointment?") },
      { label: "Appointment Type", value: findValue("Appointment Type") },
    ]) + renderInlineFieldRow([
      { label: "Did Client Participate In Counseling?", value: findValue("Did Client Participate In Counseling?") },
      { label: "If Refused, Reason", value: findValue("If Refused, Reason") },
    ]),
    renderSectionBlock("Behavioral Support", [
      { label: "Behavioral Issues Observed", value: findValue("Behavioral Issues Observed") },
    ]) + renderInlineFieldRow([
      { label: "Safety Checks Completed", value: findValue("Safety Checks Completed") },
      { label: "Behavioral Risk Status", value: findValue("Behavioral Risk Status") },
    ]) + renderInlineFieldRow([
      { label: "Hygiene/Nutrition Support", value: findValue("Hygiene/Nutrition Support") },
      { label: "Shift Handoff Status", value: findValue("Shift Handoff Status") },
    ]),
    renderSectionBlock("Shift Notes", [
      { label: "Day Shift Notes", value: findValue("Day Shift Notes") },
      { label: "Night Shift Checks", value: findValue("Night Shift Checks") },
      { label: "Night Shift Notes", value: findValue("Night Shift Notes") },
      { label: "Compliance and Checks", value: findValue("Compliance and Checks") },
      { label: "Additional Progress Notes", value: findValue("Additional Progress Notes") },
    ]),
  ]
    .filter(Boolean)
    .join("");

  const remainingEntries = entries.filter((entry) => !entry.label || !lookup.has(entry.label.toLowerCase()));
  const fallback = remainingEntries.length
    ? renderSectionBlock("Narrative", remainingEntries)
    : "";

  return `${sections}${fallback}` || '<p class="paragraph">No narrative provided.</p>';
}

export function openRecordPrintView({
  title,
  pageSize = "A4",
  subtitle = "",
  fields = [],
  body = "",
  noteType = "",
  organizationName = "Pastalino Manor LLC",
  organizationFontSize = 48,
  titleFontSize = 24,
  metaLeftLabel = "",
  metaLeftValue = "",
  metaRightLabel = "",
  metaRightValue = "",
  renderBodyAsSections = false,
  headerLabel = "",
  autoPrint = false,
}) {
  const selectedPageSize = PAGE_SIZE_MAP[pageSize] || PAGE_SIZE_MAP.A4;
  const safeOrganizationFontSize = Number.isFinite(Number(organizationFontSize)) ? Number(organizationFontSize) : 48;
  const safeTitleFontSize = Number.isFinite(Number(titleFontSize)) ? Number(titleFontSize) : 24;
  const metaLeftText = metaLeftLabel || metaLeftValue ? `${metaLeftLabel ? `${metaLeftLabel}: ` : ""}${metaLeftValue || ""}` : "";
  const metaRightText = metaRightLabel || metaRightValue ? `${metaRightLabel ? `${metaRightLabel}: ` : ""}${metaRightValue || ""}` : "";
  const bodyHtml = renderBodyAsSections
    ? `<div class="section-heading">${escapeHtml(getBodyHeading(noteType))}</div>${formatNarrativeHtml(body)}`
    : `<pre>${escapeHtml(body)}</pre>`;

  const popup = window.open("about:blank", "_blank", "width=980,height=1100");
  if (!popup) {
    alert("Popup blocked. Please allow popups to print this record.");
    return;
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --ink: #1a1a1a;
        --muted: #5a6168;
        --brand: #0f4c81;
        --line: #c8d0d8;
        --panel: #f3f6f9;
      }
      @page { size: ${selectedPageSize}; margin: 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        color: var(--ink);
        margin: 0;
        background: #fff;
      }
      .sheet {
        width: 100%;
        margin: 0 auto;
      }
      .toolbar {
        margin-bottom: 8px;
      }
      .toolbar button {
        border: 0;
        border-radius: 6px;
        background: var(--brand);
        color: #fff;
        padding: 7px 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .header {
        border: 1px solid var(--line);
        border-left: 5px solid var(--brand);
        background: linear-gradient(180deg, #ffffff, #f9fbfd);
        padding: 14px 16px;
        margin-bottom: 12px;
      }
      .org-title {
        text-align: center;
        font-weight: 700;
        font-size: ${safeOrganizationFontSize}px;
        line-height: 1;
        margin: 0;
        text-transform: uppercase;
      }
      h1 {
        font-size: ${safeTitleFontSize}px;
        margin: 8px 0 0;
        line-height: 1.2;
        text-align: center;
      }
      .subtitle {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .section-title {
        margin: 10px 0 6px;
        font-size: 11px;
        color: var(--brand);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        border: 1px solid var(--line);
      }
      th, td {
        border: 1px solid var(--line);
        padding: 6px 8px;
        font-size: 12px;
        vertical-align: top;
        line-height: 1.25;
      }
      th {
        width: 33%;
        background: var(--panel);
        text-align: left;
        font-weight: 600;
      }
      .body-panel {
        border: 1px solid var(--line);
        padding: 7px;
        min-height: 64px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        margin-bottom: 8px;
      }
      .meta-item {
        font-size: 12px;
        font-weight: 700;
      }
      .section-block {
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 7px 8px;
        margin-bottom: 6px;
      }
      .inline-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        margin: 0 0 6px;
      }
      .inline-field {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex: 1 1 180px;
        min-width: 180px;
      }
      .inline-label {
        font-weight: 700;
        white-space: nowrap;
      }
      .inline-value {
        min-width: 0;
        flex: 1;
      }
      .inline-value, .kv-value {
        line-height: 1.3;
        font-size: 12px;
      }
      .section-heading {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 6px;
        color: var(--brand);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .kv-row {
        display: flex;
        gap: 6px;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }
      .kv-label {
        font-weight: 700;
      }
      .kv-value {
        flex: 1;
        min-width: 120px;
      }
      .paragraph {
        margin: 0 0 4px;
        line-height: 1.3;
        font-size: 12px;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.3;
        margin: 0;
      }
      .meta {
        margin-top: 8px;
        color: var(--muted);
        font-size: 10px;
      }
      @media print {
        .no-print { display: none; }
        .sheet { max-width: none; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sheet { zoom: 0.96; }
        tr, th, td { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="toolbar no-print">
        <button onclick="window.print()">Print / Save PDF</button>
      </div>
      <header class="header">
        <p class="org-title">${escapeHtml(organizationName)}</p>
        <h1>${escapeHtml(headerLabel || title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
        ${(metaLeftText || metaRightText)
          ? `<div class="meta-row"><div class="meta-item">${escapeHtml(metaLeftText)}</div><div class="meta-item">${escapeHtml(metaRightText)}</div></div>`
          : ""}
      </header>
      <div class="section-title">Narrative</div>
      <div class="body-panel">
        ${bodyHtml}
      </div>
      <p class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    </div>
  </body>
</html>`;

  let rendered = false;

  try {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    rendered = true;
  } catch {
    rendered = false;
  }

  // Fallback for browsers that restrict popup document writing.
  if (!rendered) {
    try {
      const encoded = encodeURIComponent(html);
      popup.location.replace(`data:text/html;charset=utf-8,${encoded}`);
      rendered = true;
    } catch {
      rendered = false;
    }
  }

  if (!rendered) {
    alert("Unable to render preview in this browser window. Please try again.");
    popup.close();
    return;
  }

  if (autoPrint) {
    popup.onload = () => {
      popup.focus();
      popup.print();
    };
  }
}
