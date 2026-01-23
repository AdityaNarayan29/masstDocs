"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMermaid } from "./ChatMermaid";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
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
}: ChatMessageProps) {
  const parts = useMemo(
    () => parseContent(message.content),
    [message.content]
  );
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-fd-primary text-fd-primary-foreground"
            : "bg-fd-muted text-fd-foreground"
        }`}
      >
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
      </div>
    </div>
  );
});
