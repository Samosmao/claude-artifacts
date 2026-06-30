// Parses raw streamed text for <artifact filename="...">...</artifact> tags.
// Returns clean display text (with artifact tags replaced by a unique
// `\u0000ARTIFACT_CARD:<filename>\u0000` marker token) plus a list of
// artifacts found (complete or still streaming). ChatPanel turns the marker
// into a clickable file-card component instead of raw markdown text.

const ARTIFACT_REGEX = /<artifact filename="([^"]+)">([\s\S]*?)<\/artifact>/g;
const OPEN_TAG_REGEX = /<artifact filename="([^"]+)">([\s\S]*)$/;

export const CARD_MARKER_PREFIX = "\u0000ARTIFACT_CARD:";
export const CARD_MARKER_SUFFIX = "\u0000";

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

  for (const a of artifacts) {
    displayText = displayText.replace(
      a.raw,
      `\n\n${CARD_MARKER_PREFIX}${a.filename}:complete${CARD_MARKER_SUFFIX}\n\n`
    );
  }

  // 2. Detect an artifact tag that has opened but not yet closed (streaming)
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
      `\n\n${CARD_MARKER_PREFIX}${filename}:streaming${CARD_MARKER_SUFFIX}\n\n`
    );
  }

  return { displayText: displayText.trim(), artifacts };
}

// Splits display text into an array of { type: 'text'|'card', ... } segments
// so ChatPanel can render markdown for text and a custom component for cards.
export function splitDisplaySegments(displayText = "") {
  const segments = [];
  const re = new RegExp(
    `${CARD_MARKER_PREFIX}([^\u0000]+)${CARD_MARKER_SUFFIX}`,
    "g"
  );
  let lastIndex = 0;
  let m;
  while ((m = re.exec(displayText)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "text", content: displayText.slice(lastIndex, m.index) });
    }
    const [filename, status] = m[1].split(/:(?=[^:]*$)/);
    segments.push({ type: "card", filename, complete: status === "complete" });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < displayText.length) {
    segments.push({ type: "text", content: displayText.slice(lastIndex) });
  }
  return segments;
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
