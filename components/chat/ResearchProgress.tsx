"use client";

import { useEffect, useState } from "react";

interface ResearchProgressProps {
  step: string;
  message: string;
  subQueries?: string[];
  sources?: { query: string; count: number }[];
}

export function ResearchProgress({
  step,
  message,
  subQueries,
  sources,
}: ResearchProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (step === "synthesize") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [step]);

  const steps = [
    { id: "decompose", label: "Analyze" },
    { id: "search", label: "Research" },
    { id: "synthesize", label: "Synthesize" },
  ];

  const getCurrentStepIndex = () => {
    if (step.startsWith("decompose")) return 0;
    if (step.startsWith("search")) return 1;
    if (step === "synthesize") return 2;
    return -1;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-xl p-4 mb-3">
      {/* Progress Steps - Horizontal Timeline */}
      <div className="relative mb-4">
        {/* Background Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-fd-muted" />

        {/* Progress Line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Step Circles */}
        <div className="relative flex justify-between">
          {steps.map((s, index) => (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                  index < currentIndex
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                    : index === currentIndex
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25 ring-4 ring-purple-500/20"
                    : "bg-fd-muted text-fd-muted-foreground"
                }`}
              >
                {index < currentIndex ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  index <= currentIndex
                    ? "text-fd-foreground"
                    : "text-fd-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="flex items-center gap-2 text-sm text-fd-foreground font-medium">
        {currentIndex >= 0 && currentIndex < 2 && (
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.1s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
          </div>
        )}
        <span>{message}{step === "synthesize" && dots}</span>
      </div>

      {/* Sub-queries Display */}
      {subQueries && subQueries.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-fd-muted-foreground uppercase tracking-wider mb-2 font-medium">
            Research Topics
          </div>
          <div className="flex flex-wrap gap-2">
            {subQueries.map((query, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources Found */}
      {sources && sources.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-fd-muted-foreground uppercase tracking-wider mb-2 font-medium">
            Sources Found
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-fd-background/50 rounded-lg px-3 py-2 border border-fd-border"
              >
                <span className="truncate text-fd-foreground font-medium">
                  {source.query}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold text-[10px]">
                  {source.count} docs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
