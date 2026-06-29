import React, { useState, useRef, useEffect } from "react";
import ChatPanel from "./components/ChatPanel.jsx";
import ArtifactPanel from "./components/ArtifactPanel.jsx";
import { parseArtifacts } from "./artifactParser.js";
import { styles } from "./styles.js";
import { MODELS, DEFAULT_MODEL_ID } from "./models.js";

// 👉 Set this to your deployed Cloudflare Worker URL after `wrangler deploy`
const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://127.0.0.1:8787/api/chat";
const MODELS_URL = WORKER_URL.replace(/\/api\/chat\/?$/, "/api/models");

export default function App() {
  const [messages, setMessages] = useState([]); // { role, displayText, rawText }
  const [artifacts, setArtifacts] = useState({}); // filename -> { filename, code, complete }
  const [activeFilename, setActiveFilename] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [availableModels, setAvailableModels] = useState(MODELS);

  const historyRef = useRef([]); // raw {role, content} pairs sent to the API

  // Pull the live allowlist from the backend so the dropdown always matches
  // whatever models the Worker currently permits (falls back to the local
  // MODELS list in models.js if this fails, e.g. offline dev).
  useEffect(() => {
    fetch(MODELS_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.models?.length) {
          setAvailableModels(data.models);
          if (data.default) setSelectedModel(data.default);
        }
      })
      .catch(() => {
        /* keep local MODELS fallback */
      });
  }, []);

  const handleSend = async (userText) => {
    const userMsg = { role: "user", displayText: userText, rawText: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    historyRef.current = [...historyRef.current, { role: "user", content: userText }];

    setIsStreaming(true);

    // Placeholder assistant message that we will fill in as tokens stream
    let rawAssistantText = "";
    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", displayText: "", rawText: "" }]);

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyRef.current, model: selectedModel }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Workers AI streams Server-Sent-Events: "data: {...}\n\n"
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep last (possibly incomplete) chunk in buffer

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.replace(/^data:\s*/, "");
          if (jsonStr === "[DONE]") continue;

          try {
            const payload = JSON.parse(jsonStr);
            const token = payload.response ?? "";
            rawAssistantText += token;
          } catch {
            // ignore malformed partial JSON chunks
          }
        }

        applyAssistantUpdate(assistantIndex, rawAssistantText);
      }

      // Final flush in case anything is left in buffer
      if (buffer.trim().startsWith("data:")) {
        const jsonStr = buffer.trim().replace(/^data:\s*/, "");
        if (jsonStr && jsonStr !== "[DONE]") {
          try {
            const payload = JSON.parse(jsonStr);
            rawAssistantText += payload.response ?? "";
            applyAssistantUpdate(assistantIndex, rawAssistantText);
          } catch {
            /* ignore */
          }
        }
      }

      historyRef.current = [...historyRef.current, { role: "assistant", content: rawAssistantText }];
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIndex] = {
          role: "assistant",
          displayText: `⚠️ Error: ${err.message}. Check that your Worker URL is correct and CORS is enabled.`,
          rawText: "",
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Re-parses the accumulated raw text, updates the chat bubble + artifact panel
  function applyAssistantUpdate(assistantIndex, rawText) {
    const { displayText, artifacts: foundArtifacts } = parseArtifacts(rawText);

    setMessages((prev) => {
      const copy = [...prev];
      copy[assistantIndex] = { role: "assistant", displayText, rawText };
      return copy;
    });

    if (foundArtifacts.length > 0) {
      setArtifacts((prev) => {
        const next = { ...prev };
        foundArtifacts.forEach((a) => {
          next[a.filename] = a;
        });
        return next;
      });
      // Auto-focus the most recently produced artifact
      const latest = foundArtifacts[foundArtifacts.length - 1];
      setActiveFilename(latest.filename);
    }
  }

  return (
    <div style={styles.app}>
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        isStreaming={isStreaming}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
      />
      <ArtifactPanel
        artifacts={artifacts}
        activeFilename={activeFilename}
        setActiveFilename={setActiveFilename}
      />
    </div>
  );
}
