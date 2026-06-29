// Parses raw streamed text for <artifact filename="...">...</artifact> tags.
// Returns clean display text (with artifact tags replaced by a short notice)
// plus a list of artifacts found (complete or still streaming).

const ARTIFACT_REGEX = /<artifact filename="([^"]+)">([\s\S]*?)<\/artifact>/g;
const OPEN_TAG_REGEX = /<artifact filename="([^"]+)">([\s\S]*)$/;

export function parseArtifacts(rawText) {
  const artifacts = [];
  let displayText = rawText;

  // 1. Find all fully closed artifact blocks
  let match;
  ARTIFACT_REGEX.lastIndex = 0;
  while ((match = ARTIFACT_REGEX.exec(rawText)) !== null) {
    artifacts.push({
      filename: match[1],
      code: match[2].trim(),
      complete: true,
      raw: match[0],
    });
  }

  // Replace closed artifacts with a clean inline notice
  for (const a of artifacts) {
    displayText = displayText.replace(
      a.raw,
      `\n\n*(Created/Updated code for \`${a.filename}\` in the right panel)*\n\n`
    );
  }

  // 2. Detect an artifact tag that has opened but not yet closed (still streaming)
  const openMatch = displayText.match(OPEN_TAG_REGEX);
  if (openMatch) {
    const filename = openMatch[1];
    const partialCode = openMatch[2];
    artifacts.push({
      filename,
      code: partialCode.trim(),
      complete: false,
      raw: openMatch[0],
    });
    displayText = displayText.replace(
      openMatch[0],
      `\n\n*(Generating code for \`${filename}\`… watch the right panel)*\n\n`
    );
  }

  return { displayText: displayText.trim(), artifacts };
}

// Guess a Monaco/Prism-style language tag from a filename (used for display only)
export function languageFromFilename(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] || "plaintext";
}
