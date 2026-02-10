"use client";

import { memo, useState, useCallback, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string, isResearch: boolean) => void;
  disabled?: boolean;
  isResearchMode: boolean;
  onToggleResearchMode: () => void;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
  isResearchMode,
  onToggleResearchMode,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed, isResearchMode);
      setInput("");
    }
  }, [input, disabled, onSend, isResearchMode]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t border-fd-border p-3">
      {/* Research Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onToggleResearchMode}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            isResearchMode
              ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
              : "bg-fd-muted text-fd-muted-foreground hover:bg-fd-accent border border-transparent"
          } disabled:opacity-50`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Deep Research
        </button>
        {isResearchMode && (
          <span className="text-xs text-fd-muted-foreground">
            Multi-step analysis
          </span>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isResearchMode
              ? "Ask a complex system design question..."
              : "Ask about system design..."
          }
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fd-ring disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={`rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            isResearchMode
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              : "bg-blue-600 text-white dark:bg-blue-500"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
});
