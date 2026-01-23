"use client";

import { memo } from "react";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const ChatButton = memo(function ChatButton({
  isOpen,
  onClick,
}: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fd-ring focus:ring-offset-2 sm:h-14 sm:w-14"
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? (
        <svg
          className="h-6 w-6"
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
      ) : (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
    </button>
  );
});
