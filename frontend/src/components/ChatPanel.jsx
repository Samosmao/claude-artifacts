import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { styles, colors } from "../styles.js";
import { MODELS } from "../models.js";
import { splitDisplaySegments } from "../artifactParser.js";

function FileCard({ filename, complete, onOpen }) {
  const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
  return (
    <div style={styles.fileCard} onClick={onOpen}>
      <div style={styles.fileCardIcon}>{"</>"}</div>
      <div style={styles.fileCardText}>
        <span style={styles.fileCardName}>{filename}</span>
        <span style={styles.fileCardSub}>
          {complete ? `${ext} · Click to open` : "Generating…"}
        </span>
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  isStreaming,
  selectedModel,
  setSelectedModel,
  availableModels,
  onOpenArtifact,
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const modelList = availableModels && availableModels.length > 0 ? availableModels : MODELS;
  const activeModelMeta = MODELS.find((m) => m.id === selectedModel);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.chatColumn}>
      <div style={styles.chatHeader}>
        <span style={styles.statusDot(isStreaming)} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Artifacts Clone Chat
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <select
            style={styles.modelSelect}
            value={selectedModel}
            disabled={isStreaming}
            onChange={(e) => setSelectedModel(e.target.value)}
            title={activeModelMeta?.note || ""}
          >
            {modelList.map((m) => {
              const id = typeof m === "string" ? m : m.id;
              const label = typeof m === "string" ? m : m.label;
              return (
                <option key={id} value={id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div style={styles.chatMessages} ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ color: colors.textFaint, fontSize: 13.5, marginTop: 20 }}>
            Ask me to build something — e.g. "Create a Python script that scrapes
            headlines" — and the generated code will appear as a file card you can tap to open.
          </div>
        )}
        {messages.map((m, i) => {
          const segments = splitDisplaySegments(m.displayText || "");
          return (
            <div key={i} style={styles.bubbleRow(m.role)}>
              <div style={styles.bubble(m.role)}>
                {segments.map((seg, j) =>
                  seg.type === "card" ? (
                    <FileCard
                      key={j}
                      filename={seg.filename}
                      complete={seg.complete}
                      onOpen={() => onOpenArtifact(seg.filename)}
                    />
                  ) : (
                    <ReactMarkdown key={j}>{seg.content}</ReactMarkdown>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.chatInputBar}>
        <div style={styles.inputWrap}>
          <span style={styles.inputLabel}>Message the assistant</span>
          <textarea
            style={styles.textarea}
            rows={1}
            placeholder="Type here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          style={styles.sendBtn(isStreaming || !input.trim())}
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
