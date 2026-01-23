"use client";

import { memo, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSend: (message: string) => void;
  isLoading: boolean;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ChatPanel = memo(function ChatPanel({
  messages,
  onSend,
  isLoading,
  onClose,
  isExpanded,
  onToggleExpand,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Dynamic classes based on expanded state
  const panelClasses = isExpanded
    ? "fixed inset-4 z-50 flex flex-col rounded-lg border border-fd-border bg-fd-card shadow-2xl md:inset-8 lg:inset-16"
    : "fixed bottom-20 right-4 z-50 flex h-[500px] w-[380px] flex-col rounded-lg border border-fd-border bg-fd-card shadow-xl sm:w-[420px]";

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
        <div>
          <h3 className="font-semibold text-fd-foreground">
            System Design Assistant
          </h3>
          <p className="text-xs text-fd-muted-foreground">
            Ask about concepts, patterns, or case studies
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand/Collapse button */}
          <button
            onClick={onToggleExpand}
            className="rounded p-1.5 hover:bg-fd-muted transition-colors"
            aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              // Collapse icon - arrows pointing inward (complement of expand)
              <svg
                className="h-4 w-4 text-fd-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                />
              </svg>
            ) : (
              // Expand icon - arrows pointing outward (complement of collapse)
              <svg
                className="h-4 w-4 text-fd-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 9V4h5M15 4h5v5M4 15v5h5M15 20h5v-5"
                />
              </svg>
            )}
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="rounded p-1.5 hover:bg-fd-muted transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="h-4 w-4 text-fd-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-fd-muted-foreground">
              <div className="mb-2 text-2xl">👋</div>
              <p className="font-medium">How can I help you?</p>
              <p className="mt-1 text-xs">
                Try asking about CAP theorem, load balancing, or Netflix
                architecture!
              </p>
            </div>
          </div>
        )}
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-lg bg-fd-muted px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-fd-muted-foreground" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
});
