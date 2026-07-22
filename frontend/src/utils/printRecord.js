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

export function openRecordPrintView({
  title,
  pageSize = "A4",
  subtitle = "",
  fields = [],
  body = "",
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
    ? formatNarrativeHtml(body)
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
      @page { size: ${selectedPageSize}; margin: 12mm; }
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
        margin-bottom: 12px;
      }
      .toolbar button {
        border: 0;
        border-radius: 6px;
        background: var(--brand);
        color: #fff;
        padding: 9px 14px;
        font-size: 13px;
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
        margin: 14px 0 8px;
        font-size: 12px;
        color: var(--brand);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
        border: 1px solid var(--line);
      }
      th, td {
        border: 1px solid var(--line);
        padding: 8px 9px;
        font-size: 12px;
        vertical-align: top;
        line-height: 1.35;
      }
      th {
        width: 33%;
        background: var(--panel);
        text-align: left;
        font-weight: 600;
      }
      .body-panel {
        border: 1px solid var(--line);
        padding: 10px;
        min-height: 80px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 10px;
        margin-bottom: 10px;
      }
      .meta-item {
        font-size: 14px;
        font-weight: 700;
      }
      .section-block {
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
      }
      .kv-row {
        display: flex;
        gap: 6px;
        margin-bottom: 6px;
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
        margin: 0 0 6px;
        line-height: 1.45;
        font-size: 12px;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.45;
        margin: 0;
      }
      .meta {
        margin-top: 10px;
        color: var(--muted);
        font-size: 10px;
      }
      @media print {
        .no-print { display: none; }
        .sheet { max-width: none; }
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
