import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { styles, colors } from "../styles.js";

export default function ArtifactPanel({ artifacts, activeFilename, setActiveFilename }) {
  const [copied, setCopied] = useState(false);

  const filenames = Object.keys(artifacts);
  const active = activeFilename ? artifacts[activeFilename] : null;

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
    <div style={styles.artifactColumn}>
      <div style={styles.artifactHeader}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Artifacts</span>
        {filenames.length > 0 && (
          <button style={styles.iconBtn("primary")} onClick={handleDownloadZip}>
            ⬇ Download All (.zip)
          </button>
        )}
      </div>

      {filenames.length > 0 && (
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
            <div>No artifacts yet.</div>
            <div>Generated code blocks will show up here as cards you can review and download.</div>
          </div>
        ) : (
          <div style={styles.codeBlockWrap}>
            <div style={styles.codeBlockHeader}>
              <span style={styles.filename}>
                {active.filename} {!active.complete && <em style={{ color: colors.textFaint }}>(streaming…)</em>}
              </span>
              <div style={styles.actionBtnRow}>
                <button style={styles.iconBtn()} onClick={handleCopy}>
                  {copied ? "✓ Copied" : "Copy Code"}
                </button>
                <button style={styles.iconBtn()} onClick={handleDownloadSingle}>
                  Download File
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
