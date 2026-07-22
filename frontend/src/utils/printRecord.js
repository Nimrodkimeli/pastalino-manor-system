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

export function openRecordPrintView({
  title,
  pageSize = "A4",
  subtitle = "",
  fields = [],
  body = "",
  autoPrint = false,
}) {
  const selectedPageSize = PAGE_SIZE_MAP[pageSize] || PAGE_SIZE_MAP.A4;
  const rowsHtml = fields
    .map(({ label, value }) => {
      if (value === undefined || value === null || value === "") {
        return "";
      }

      return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
    })
    .join("");

  const popup = window.open("", "_blank", "noopener,noreferrer,width=980,height=1100");
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
      h1 {
        font-size: 21px;
        margin: 0;
        line-height: 1.2;
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
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
      </header>
      ${rowsHtml ? `<div class="section-title">Record Details</div><table><tbody>${rowsHtml}</tbody></table>` : ""}
      <div class="section-title">Narrative</div>
      <div class="body-panel">
        <pre>${escapeHtml(body)}</pre>
      </div>
      <p class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    </div>
  </body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  if (autoPrint) {
    popup.onload = () => {
      popup.focus();
      popup.print();
    };
  }
}
