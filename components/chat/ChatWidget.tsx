"use client";

import { useState, useCallback } from "react";
import { ChatButton } from "./ChatButton";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage, ResearchState } from "@/types/chat";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [researchState, setResearchState] = useState<ResearchState | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleToggleResearchMode = useCallback(() => {
    setIsResearchMode((prev) => {
      const newValue = !prev;
      // Auto-expand when entering research mode
      if (newValue) {
        setIsExpanded(true);
      }
      return newValue;
    });
  }, []);

  const handleRegularChat = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    "Sorry, I encountered an error. Please check that the API keys are configured and try again.",
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const handleResearchChat = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `[Deep Research] ${content}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setResearchState({
      isActive: true,
      step: "decompose",
      message: "Starting research...",
    });

    const assistantMessageId = `assistant-${Date.now()}`;

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content }),
      });

      if (!response.ok) {
        throw new Error(`Research request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let assistantContent = "";
      let hasStartedResponse = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "progress") {
                setResearchState({
                  isActive: true,
                  step: parsed.step,
                  message: parsed.message,
                  subQueries: parsed.subQueries,
                  sources: parsed.sources,
                });
              } else if (parsed.type === "token" && parsed.text) {
                // First token - create the assistant message
                if (!hasStartedResponse) {
                  hasStartedResponse = true;
                  setResearchState((prev) =>
                    prev ? { ...prev, isActive: false } : null
                  );

                  const assistantMessage: ChatMessage = {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                }

                assistantContent += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              } else if (parsed.type === "error") {
                throw new Error(parsed.message);
              }
            } catch (e) {
              // Skip invalid JSON lines unless it's our thrown error
              if (e instanceof Error && e.message !== "Unexpected token") {
                throw e;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Research error:", error);

      // Add error message if we haven't started the response yet
      const errorMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content:
          "Sorry, the research agent encountered an error. Please check that the API keys are configured and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setResearchState(null);
    }
  }, []);

  const handleSend = useCallback(
    async (content: string, isResearch: boolean) => {
      if (isResearch) {
        await handleResearchChat(content);
      } else {
        await handleRegularChat(content);
      }
    },
    [handleRegularChat, handleResearchChat]
  );

  return (
    <>
      {/* Backdrop overlay with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-fd-background/50 backdrop-blur-[2px]"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}
      {isOpen && (
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          onClose={handleClose}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          isResearchMode={isResearchMode}
          onToggleResearchMode={handleToggleResearchMode}
          researchState={researchState}
        />
      )}
      <ChatButton isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
