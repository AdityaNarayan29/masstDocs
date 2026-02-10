"use client";

import { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMermaid } from "./ChatMermaid";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onFeedback?: (messageId: string, feedback: 'up' | 'down') => void;
}

type ContentPart = { type: "text" | "mermaid"; content: string };

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  // More flexible regex - handles optional newline after ```mermaid
  const mermaidRegex = /```mermaid\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = mermaidRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "mermaid", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content }];
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onFeedback,
}: ChatMessageProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  // Check if this is a Deep Research message
  const isDeepResearch = message.content.startsWith("[Deep Research]");
  const displayContent = isDeepResearch
    ? message.content.replace("[Deep Research] ", "")
    : message.content;

  const parts = useMemo(
    () => parseContent(displayContent),
    [displayContent]
  );
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-0.5 ${
          isUser
            ? isDeepResearch
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              : "bg-fd-primary text-fd-primary-foreground"
            : "bg-fd-muted text-fd-foreground"
        }`}
      >
        {/* Deep Research Badge */}
        {isUser && isDeepResearch && (
          <div className="flex items-center gap-1.5 text-xs opacity-90 pt-1 pb-0.5">
            <svg
              className="w-3 h-3"
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
            <span className="font-medium">Deep Research</span>
          </div>
        )}
        {parts.map((part, index) =>
          part.type === "mermaid" ? (
            <ChatMermaid key={index} chart={part.content} />
          ) : (
            <div key={index} className="chat-markdown text-sm">
              <ReactMarkdown
                components={{
                  // Headers
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                  ),
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed">{children}</p>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="my-2 ml-5 list-disc space-y-1 [&>li]:pl-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-2 ml-5 list-decimal space-y-1 [&>li]:pl-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed marker:text-fd-foreground">{children}</li>
                  ),
                  // Code
                  code: ({ className, children }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-fd-background/50 px-1 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-fd-background/50 p-2 rounded text-xs font-mono overflow-x-auto my-2">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-fd-background/50 p-2 rounded overflow-x-auto my-2">
                      {children}
                    </pre>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-fd-primary underline hover:opacity-80"
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {children}
                    </a>
                  ),
                  // Bold and italic
                  strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic">{children}</em>
                  ),
                  // Blockquote
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-fd-border pl-3 my-2 italic opacity-90">
                      {children}
                    </blockquote>
                  ),
                  // Horizontal rule
                  hr: () => <hr className="my-3 border-fd-border" />,
                }}
              >
                {part.content}
              </ReactMarkdown>
            </div>
          )
        )}

        {/* Sources section for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-fd-border/50">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-1 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${sourcesExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
            </button>
            {sourcesExpanded && (
              <div className="mt-2 space-y-1">
                {message.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    className="block text-xs text-fd-primary hover:underline truncate"
                    title={source.title}
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback buttons for assistant messages */}
        {!isUser && onFeedback && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-fd-border/50">
            <span className="text-xs text-fd-muted-foreground mr-2">Helpful?</span>
            <button
              onClick={() => onFeedback(message.id, 'up')}
              className={`p-1 rounded hover:bg-fd-background/50 transition-colors ${
                message.feedback === 'up' ? 'text-green-500' : 'text-fd-muted-foreground hover:text-green-500'
              }`}
              aria-label="Thumbs up"
              title="Helpful"
            >
              <svg className="w-4 h-4" fill={message.feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              onClick={() => onFeedback(message.id, 'down')}
              className={`p-1 rounded hover:bg-fd-background/50 transition-colors ${
                message.feedback === 'down' ? 'text-red-500' : 'text-fd-muted-foreground hover:text-red-500'
              }`}
              aria-label="Thumbs down"
              title="Not helpful"
            >
              <svg className="w-4 h-4" fill={message.feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
