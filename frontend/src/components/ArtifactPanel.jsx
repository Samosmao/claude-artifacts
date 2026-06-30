import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { styles, colors } from "../styles.js";

export default function ArtifactPanel({ artifacts, activeFilename, setActiveFilename, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const filenames = Object.keys(artifacts);
  const active = activeFilename ? artifacts[activeFilename] : null;

  // Don't render anything until there's actually something to show — the
  // empty "No artifacts yet" placeholder is never shown standing alone in
  // the layout anymore; the panel only opens once a file card is tapped.
  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadSingle = async () => {
    if (!active) return;
    const blob = new Blob([active.code], { type: "text/plain;charset=utf-8" });
    saveAs(blob, active.filename);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    filenames.forEach((name) => {
      zip.file(name, artifacts[name].code);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "artifact-project.zip");
  };

  return (
    <div style={styles.artifactOverlay(isOpen)}>
      <div style={styles.artifactHeader}>
        <button style={styles.backBtn} onClick={onClose} aria-label="Close artifacts panel">
          ✕
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Artifacts</span>
        {filenames.length > 1 && (
          <button style={styles.iconBtn("primary")} onClick={handleDownloadZip}>
            ⬇ All (.zip)
          </button>
        )}
      </div>

      {filenames.length > 1 && (
        <div style={styles.artifactTabs}>
          {filenames.map((name) => (
            <div
              key={name}
              style={styles.tab(name === activeFilename)}
              onClick={() => setActiveFilename(name)}
            >
              {name}
              {!artifacts[name].complete && " ●"}
            </div>
          ))}
        </div>
      )}

      <div style={styles.artifactBody}>
        {!active ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 28 }}>{"</>"}</div>
            <div>No artifact selected.</div>
          </div>
        ) : (
          <div style={styles.codeBlockWrap}>
            <div style={styles.codeBlockHeader}>
              <span style={styles.filename}>
                {active.filename} {!active.complete && <em style={{ color: colors.textFaint }}>(streaming…)</em>}
              </span>
              <div style={styles.actionBtnRow}>
                <button style={styles.iconBtn()} onClick={handleCopy}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button style={styles.iconBtn()} onClick={handleDownloadSingle}>
                  Download
                </button>
              </div>
            </div>
            <pre style={styles.pre}>
              <code>{active.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
