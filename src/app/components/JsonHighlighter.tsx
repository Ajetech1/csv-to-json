"use client";

interface JsonHighlighterProps {
  data: object[];
  maxRows?: number;
}

function highlightValue(value: unknown): string {
  if (value === null) return `<span class="json-null">null</span>`;
  if (typeof value === "boolean") return `<span class="json-bool">${value}</span>`;
  if (typeof value === "number") return `<span class="json-number">${value}</span>`;
  if (typeof value === "string") {
    const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `<span class="json-string">"${escaped}"</span>`;
  }
  return String(value);
}

function formatObject(obj: Record<string, unknown>, indent: number): string {
  const pad = "  ".repeat(indent);
  const innerPad = "  ".repeat(indent + 1);
  const keys = Object.keys(obj);
  if (keys.length === 0) return "{}";
  const lines = keys.map((key) => {
    const escapedKey = key.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `${innerPad}<span class="json-key">"${escapedKey}"</span><span class="json-bracket">: </span>${highlightValue(obj[key])}`;
  });
  return `<span class="json-bracket">{</span>\n${lines.join(",\n")}\n${pad}<span class="json-bracket">}</span>`;
}

export default function JsonHighlighter({ data, maxRows = 50 }: JsonHighlighterProps) {
  const displayData = data.slice(0, maxRows);
  const truncated = data.length > maxRows;

  const lines = displayData.map((row, i) => {
    const comma = i < displayData.length - 1 || truncated ? "," : "";
    return `  ${formatObject(row as Record<string, unknown>, 1)}${comma}`;
  });

  if (truncated) {
    lines.push(`  <span class="json-null">/* ... ${data.length - maxRows} more rows hidden in preview */</span>`);
  }

  const html = `<span class="json-bracket">[</span>\n${lines.join("\n")}\n<span class="json-bracket">]</span>`;

  return (
    <pre
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
