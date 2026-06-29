import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { styles, colors } from "../styles.js";
import { MODELS } from "../models.js";

export default function ChatPanel({ messages, onSend, isStreaming, selectedModel, setSelectedModel, availableModels }) {
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
        <span>Artifacts Clone Chat</span>
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
      {activeModelMeta?.note && (
        <div style={{ ...styles.modelNote, padding: "4px 20px 0 20px" }}>{activeModelMeta.note}</div>
      )}

      <div style={styles.chatMessages} ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ color: colors.textFaint, fontSize: 13.5, marginTop: 20 }}>
            Ask me to build something — e.g. "Create a Python script that scrapes
            headlines" — and the generated code will appear in the panel on the right.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={styles.bubbleRow(m.role)}>
            <div style={styles.bubble(m.role)}>
              <ReactMarkdown>{m.displayText || ""}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chatInputBar}>
        <textarea
          style={styles.textarea}
          rows={1}
          placeholder="Message the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
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
