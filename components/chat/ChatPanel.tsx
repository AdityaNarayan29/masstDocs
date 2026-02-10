"use client";

import { memo, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ResearchProgress } from "./ResearchProgress";
import type { ChatMessage as ChatMessageType, ResearchState } from "@/types/chat";

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSend: (message: string, isResearch: boolean) => void;
  isLoading: boolean;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isResearchMode: boolean;
  onToggleResearchMode: () => void;
  researchState: ResearchState | null;
}

export const ChatPanel = memo(function ChatPanel({
  messages,
  onSend,
  isLoading,
  onClose,
  isExpanded,
  onToggleExpand,
  isResearchMode,
  onToggleResearchMode,
  researchState,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, researchState]);

  // Dynamic classes based on expanded state - mobile-first responsive design
  const panelClasses = isExpanded
    ? "fixed inset-2 z-50 flex flex-col rounded-lg border border-fd-border bg-fd-card shadow-2xl sm:inset-4 md:inset-8 lg:inset-16"
    : "fixed inset-2 z-50 flex flex-col rounded-lg border border-fd-border bg-fd-card shadow-xl sm:inset-auto sm:bottom-20 sm:right-4 sm:h-[500px] sm:w-[380px] md:w-[420px]";

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
        <div>
          <h3 className="font-semibold text-fd-foreground flex items-center gap-2">
            System Design Assistant
            {isResearchMode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400">
                Research
              </span>
            )}
          </h3>
          <p className="text-xs text-fd-muted-foreground">
            {isResearchMode
              ? "Multi-step deep research enabled"
              : "Ask about concepts, patterns, or case studies"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand/Collapse button - hidden on mobile since chat is already fullscreen */}
          <button
            onClick={onToggleExpand}
            className="hidden sm:block rounded p-1.5 hover:bg-fd-muted transition-colors"
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
        {messages.length === 0 && !researchState && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-fd-muted-foreground">
              <div className="mb-2 text-2xl">👋</div>
              <p className="font-medium">How can I help you?</p>
              <p className="mt-1 text-xs">
                Try asking about CAP theorem, load balancing, or Netflix
                architecture!
              </p>
              <p className="mt-3 text-xs text-purple-500 dark:text-purple-400">
                Toggle &quot;Deep Research&quot; for comprehensive multi-step analysis
              </p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Research Progress Indicator */}
        {researchState && researchState.isActive && (
          <ResearchProgress
            step={researchState.step}
            message={researchState.message}
            subQueries={researchState.subQueries}
            sources={researchState.sources}
          />
        )}

        {isLoading && !researchState?.isActive && (
          <div className="mb-3 flex items-start gap-2">
            {/* Assistant avatar */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
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
      <ChatInput
        onSend={onSend}
        disabled={isLoading}
        isResearchMode={isResearchMode}
        onToggleResearchMode={onToggleResearchMode}
      />
    </div>
  );
});
