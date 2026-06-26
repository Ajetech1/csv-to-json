"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import JsonHighlighter from "./components/JsonHighlighter";

interface ParseOptions {
  header: boolean;
  skipEmpty: boolean;
  trimFields: boolean;
  dynamicTyping: boolean;
  delimiter: string;
}

interface ParseResult {
  data: object[];
  fields: string[];
  rowCount: number;
  colCount: number;
  fileSize: string;
  fileName: string;
  parseTime: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ParseOptions>({
    header: true,
    skipEmpty: true,
    trimFields: true,
    dynamicTyping: true,
    delimiter: "auto",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawJson = result ? JSON.stringify(result.data, null, 2) : "";

  const processFile = useCallback(
    (file: File) => {
      if (!file) return;
      const allowed = [
        "text/csv",
        "application/vnd.ms-excel",
        "text/plain",
        "application/csv",
      ];
      if (!allowed.includes(file.type) && !file.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file (.csv)");
        return;
      }
      setIsProcessing(true);
      setError(null);
      setResult(null);
      const start = performance.now();
      Papa.parse(file, {
        header: options.header,
        skipEmptyLines: options.skipEmpty,
        dynamicTyping: options.dynamicTyping,
        delimiter: options.delimiter === "auto" ? "" : options.delimiter,
        transformHeader: options.trimFields ? (h) => h.trim() : undefined,
        transform: options.trimFields
          ? (v) => (typeof v === "string" ? v.trim() : v)
          : undefined,
        complete: (results) => {
          const elapsed = performance.now() - start;
          const fields = options.header
            ? (results.meta.fields ?? [])
            : results.data[0]
              ? (results.data[0] as string[]).map((_, i) => `column_${i + 1}`)
              : [];
          setResult({
            data: results.data as object[],
            fields,
            rowCount: results.data.length,
            colCount: fields.length,
            fileSize: formatBytes(file.size),
            fileName: file.name,
            parseTime: Math.round(elapsed),
          });
          setIsProcessing(false);
          setActiveTab("preview");
        },
        error: (err) => {
          setError(err.message);
          setIsProcessing(false);
        },
      });
    },
    [options],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([rawJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName.replace(/\.csv$/i, "") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Re-parse when options change if file already loaded
  const fileRef = useRef<File | null>(null);
  useEffect(() => {
    if (fileRef.current) processFile(fileRef.current);
  }, [options, processFile]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--accent-muted)",
            border: "1px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-hover)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="12" y2="17" />
          </svg>
        </div>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            CSV → JSON Converter
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 2 }}>
            Upload a CSV file and download a clean JSON array — no data leaves
            your browser
          </p>
        </div>
        {result && (
          <button
            className="btn btn-outline"
            onClick={reset}
            style={{ marginLeft: "auto", fontSize: 13 }}
          >
            ↩ New file
          </button>
        )}
      </div>

      {/* Options Panel */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 24 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Parse options
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0 32px",
          }}
        >
          {(
            [
              ["header", "First row is header"],
              ["skipEmpty", "Skip empty rows"],
              ["trimFields", "Trim whitespace"],
              ["dynamicTyping", "Auto-detect types"],
            ] as [keyof ParseOptions, string][]
          ).map(([key, label]) => (
            <div className="option-row" key={key}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {label}
              </span>
              <button
                className={`toggle ${options[key] ? "on" : ""}`}
                onClick={() => setOptions((o) => ({ ...o, [key]: !o[key] }))}
                aria-label={label}
              />
            </div>
          ))}
          <div className="option-row">
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Delimiter
            </span>
            <select
              value={options.delimiter}
              onChange={(e) =>
                setOptions((o) => ({ ...o, delimiter: e.target.value }))
              }
            >
              <option value="auto">Auto-detect</option>
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!result && !isProcessing && (
        <div
          className={`drop-zone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            const file = e.dataTransfer.files[0];
            if (file) fileRef.current = file;
            handleDrop(e);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) fileRef.current = file;
              handleFileChange(e);
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "var(--accent-muted)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-hover)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16,16 12,12 8,16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Drop your CSV file here
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                or click to browse — supports .csv files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div className="loading-bar" style={{ marginBottom: 20 }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Parsing CSV…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#ef44441a",
            border: "1px solid #ef444440",
            borderRadius: 10,
            padding: "14px 18px",
            color: "var(--danger)",
            fontSize: 14,
            marginTop: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Rows", value: result.rowCount.toLocaleString() },
              { label: "Columns", value: result.colCount.toString() },
              { label: "File size", value: result.fileSize },
              { label: "Parse time", value: result.parseTime + "ms" },
            ].map(({ label, value }) => (
              <div className="stat-card" key={label}>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* File name badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              className="badge"
              style={{
                background: "var(--success-muted)",
                color: "var(--success)",
              }}
            >
              ✓ {result.fileName}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {result.fields.slice(0, 5).join(", ")}
              {result.fields.length > 5
                ? ` +${result.fields.length - 5} more`
                : ""}
            </span>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <button className="btn btn-success" onClick={downloadJson}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download .json
            </button>
            <button className="btn btn-outline" onClick={copyToClipboard}>
              {copied ? (
                "✓ Copied!"
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy JSON
                </>
              )}
            </button>
          </div>

          {/* Tabs + code panel */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  className={`tab ${activeTab === "preview" ? "active" : ""}`}
                  onClick={() => setActiveTab("preview")}
                >
                  Highlighted preview
                </button>
                <button
                  className={`tab ${activeTab === "raw" ? "active" : ""}`}
                  onClick={() => setActiveTab("raw")}
                >
                  Raw JSON
                </button>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {result.rowCount > 50
                  ? `Showing 50 of ${result.rowCount} rows`
                  : `${result.rowCount} rows`}
              </span>
            </div>
            <div
              style={{
                padding: 20,
                maxHeight: 520,
                overflowY: "auto",
                background: "var(--bg-surface)",
              }}
            >
              {activeTab === "preview" ? (
                <JsonHighlighter data={result.data} maxRows={50} />
              ) : (
                <pre
                  style={{
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {rawJson.slice(0, 20000)}
                  {rawJson.length > 20000
                    ? "\n\n/* truncated in view — download for full output */"
                    : ""}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 48,
        }}
      >
        All processing happens in your browser — no data is uploaded to any
        server.
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--warning)",
          marginTop: 10,
        }}
      >
        © 2026 GIS Team, Ikeja Electric Plc
      </p>
    </div>
  );
}
