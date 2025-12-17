"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DesignType = "HLD" | "LLD" | "BOTH" | null;

interface TreeNode {
  id: string;
  label: string;
  href?: string;
  designType?: DesignType;
  children?: TreeNode[];
  isSection?: boolean;
}

// The complete learning tree structure
const learningTree: TreeNode = {
  id: "start",
  label: "System Design",
  href: "/sd",
  children: [
    {
      id: "fundamentals",
      label: "1. Fundamentals",
      isSection: true,
      children: [
        {
          id: "what-is-sd",
          label: "What is System Design?",
          href: "/sd/fundamentals/what-is-system-design",
          designType: "HLD",
        },
        {
          id: "how-to-approach",
          label: "How to Approach SD?",
          href: "/sd/fundamentals/solve",
          designType: "HLD",
        },
        {
          id: "core-concepts",
          label: "Core Concepts",
          isSection: true,
          children: [
            {
              id: "scalability",
              label: "Scalability",
              href: "/sd/fundamentals/scalability",
              designType: "HLD",
            },
            {
              id: "latency-throughput",
              label: "Latency vs Throughput",
              href: "/sd/fundamentals/latency-throughput",
              designType: "HLD",
            },
            { id: "availability", label: "Availability", href: "/sd/fundamentals/availability", designType: "HLD" },
            { id: "consistency", label: "Consistency", href: "/sd/fundamentals/consistency", designType: "HLD" },
          ],
        },
        {
          id: "theorems",
          label: "Theorems",
          isSection: true,
          children: [
            {
              id: "cap",
              label: "CAP Theorem",
              href: "/sd/fundamentals/cap-theorem",
              designType: "HLD",
            },
            {
              id: "pacelc",
              label: "PACELC Theorem",
              href: "/sd/fundamentals/pacelc-theorem",
              designType: "HLD",
            },
          ],
        },
        {
          id: "consistency-patterns",
          label: "Consistency Patterns",
          isSection: true,
          children: [
            {
              id: "weak-consistency",
              label: "Weak Consistency",
              href: "/sd/fundamentals/weak-consistency",
              designType: "HLD",
            },
            {
              id: "eventual-consistency",
              label: "Eventual Consistency",
              href: "/sd/fundamentals/eventual-consistency",
              designType: "HLD",
            },
            {
              id: "strong-consistency",
              label: "Strong Consistency",
              href: "/sd/fundamentals/strong-consistency",
              designType: "HLD",
            },
          ],
        },
        {
          id: "availability-patterns",
          label: "Availability Patterns",
          isSection: true,
          children: [
            { id: "failover", label: "Fail-Over", href: "/sd/fundamentals/failover", designType: "HLD" },
            { id: "replication", label: "Replication", href: "/sd/fundamentals/replication", designType: "HLD" },
          ],
        },
      ],
    },
    {
      id: "building-blocks",
      label: "2. Building Blocks",
      isSection: true,
      children: [
        {
          id: "networking",
          label: "Networking",
          isSection: true,
          children: [
            { id: "dns", label: "DNS", href: "/sd/building-blocks/dns", designType: "HLD" },
            { id: "cdn", label: "CDN", href: "/sd/building-blocks/cdn", designType: "HLD" },
            { id: "load-balancer", label: "Load Balancer", href: "/sd/building-blocks/load-balancer", designType: "HLD" },
            { id: "reverse-proxy", label: "Reverse Proxy", href: "/sd/building-blocks/reverse-proxy", designType: "HLD" },
          ],
        },
        {
          id: "databases",
          label: "Databases",
          isSection: true,
          children: [
            {
              id: "sql-nosql",
              label: "SQL vs NoSQL",
              href: "/sd/system-components/db",
              designType: "HLD",
            },
            { id: "sharding", label: "Sharding", href: "/sd/building-blocks/sharding", designType: "HLD" },
            { id: "replication-db", label: "Replication", href: "/sd/fundamentals/replication", designType: "HLD" },
            { id: "indexing", label: "Indexing", href: "/sd/building-blocks/indexing", designType: "BOTH" },
          ],
        },
        {
          id: "caching",
          label: "Caching",
          isSection: true,
          children: [
            {
              id: "cache-strategies",
              label: "Cache Strategies",
              href: "/sd/building-blocks/cache-strategies",
              designType: "HLD",
            },
            { id: "cache-aside", label: "Cache-Aside", href: "/sd/building-blocks/cache-aside", designType: "HLD" },
            { id: "write-through", label: "Write-Through", href: "/sd/building-blocks/write-through", designType: "HLD" },
            { id: "write-behind", label: "Write-Behind", href: "/sd/building-blocks/write-behind", designType: "HLD" },
          ],
        },
        {
          id: "async",
          label: "Asynchronism",
          isSection: true,
          children: [
            {
              id: "message-queues",
              label: "Message Queues",
              href: "/sd/building-blocks/message-queues",
              designType: "HLD",
            },
            { id: "task-queues", label: "Task Queues", href: "/sd/building-blocks/task-queues", designType: "HLD" },
            { id: "pub-sub", label: "Pub/Sub", href: "/sd/building-blocks/pub-sub", designType: "HLD" },
          ],
        },
      ],
    },
    {
      id: "communication",
      label: "3. Communication",
      isSection: true,
      children: [
        { id: "http", label: "HTTP", href: "/sd/communication/http", designType: "BOTH" },
        { id: "rest", label: "REST", href: "/sd/communication/rest", designType: "BOTH" },
        { id: "grpc", label: "gRPC", href: "/sd/communication/grpc", designType: "BOTH" },
        { id: "graphql", label: "GraphQL", href: "/sd/communication/graphql", designType: "BOTH" },
        { id: "websockets", label: "WebSockets", href: "/sd/communication/websockets", designType: "HLD" },
        { id: "sse", label: "Server-Sent Events", href: "/sd/communication/sse", designType: "HLD" },
      ],
    },
    {
      id: "architecture",
      label: "4. Architecture",
      isSection: true,
      children: [
        {
          id: "microservices",
          label: "Microservices",
          href: "/sd/fundamentals/microservices",
          designType: "BOTH",
        },
        {
          id: "service-discovery",
          label: "Service Discovery",
          href: "/sd/architecture/service-discovery",
          designType: "HLD",
        },
        { id: "api-gateway", label: "API Gateway", href: "/sd/architecture/api-gateway", designType: "HLD" },
        {
          id: "micro-frontends",
          label: "Micro Frontends",
          href: "/sd/fundamentals/micro-frontends",
          designType: "BOTH",
        },
      ],
    },
    {
      id: "design-patterns",
      label: "5. Design Patterns",
      isSection: true,
      children: [
        { id: "circuit-breaker", label: "Circuit Breaker", href: "/sd/design-patterns/circuit-breaker", designType: "HLD" },
        { id: "bulkhead", label: "Bulkhead", href: "/sd/design-patterns/bulkhead", designType: "HLD" },
        { id: "cqrs", label: "CQRS", href: "/sd/design-patterns/cqrs", designType: "BOTH" },
        { id: "event-sourcing", label: "Event Sourcing", href: "/sd/design-patterns/event-sourcing", designType: "BOTH" },
        { id: "saga", label: "Saga Pattern", href: "/sd/design-patterns/saga", designType: "HLD" },
        { id: "strangler-fig", label: "Strangler Fig", href: "/sd/design-patterns/strangler-fig", designType: "HLD" },
      ],
    },
    {
      id: "lld-concepts",
      label: "6. LLD Concepts",
      isSection: true,
      children: [
        {
          id: "solid",
          label: "SOLID Principles",
          href: "/sd/fundamentals/solid",
          designType: "LLD",
        },
        {
          id: "design-patterns-lld",
          label: "Design Patterns",
          href: "/sd/fundamentals/design-patterns-lld",
          designType: "LLD",
        },
        {
          id: "monorepo",
          label: "Monorepo",
          href: "/sd/fundamentals/monorepo",
          designType: "LLD",
        },
      ],
    },
    {
      id: "estimation",
      label: "7. Estimation",
      isSection: true,
      children: [
        {
          id: "back-envelope",
          label: "Back of Envelope",
          href: "/sd/fundamentals/estimate",
          designType: "HLD",
        },
        {
          id: "capacity-planning",
          label: "Capacity Planning",
          href: "/sd/fundamentals/capacity-planning",
          designType: "HLD",
        },
      ],
    },
    {
      id: "case-studies",
      label: "8. Case Studies",
      isSection: true,
      children: [
        {
          id: "streaming",
          label: "Streaming",
          isSection: true,
          children: [
            {
              id: "netflix",
              label: "Netflix",
              href: "/sd/case-studies/netflix",
              designType: "HLD",
            },
            {
              id: "youtube",
              label: "YouTube",
              href: "/sd/case-studies/youtube",
              designType: "HLD",
            },
          ],
        },
        {
          id: "social",
          label: "Social Media",
          isSection: true,
          children: [
            {
              id: "instagram",
              label: "Instagram",
              href: "/sd/case-studies/instagram",
              designType: "HLD",
            },
            {
              id: "twitter",
              label: "Twitter",
              href: "/sd/case-studies/twitter",
              designType: "HLD",
            },
          ],
        },
        {
          id: "messaging",
          label: "Messaging",
          isSection: true,
          children: [
            {
              id: "whatsapp",
              label: "WhatsApp",
              href: "/sd/case-studies/whatsapp",
              designType: "HLD",
            },
            {
              id: "slack",
              label: "Slack",
              href: "/sd/case-studies/slack",
              designType: "HLD",
            },
          ],
        },
        {
          id: "ridesharing",
          label: "Ride Sharing",
          isSection: true,
          children: [
            {
              id: "uber",
              label: "Uber",
              href: "/sd/case-studies/uber",
              designType: "HLD",
            },
          ],
        },
        {
          id: "ecommerce",
          label: "E-Commerce",
          isSection: true,
          children: [
            {
              id: "amazon",
              label: "Amazon",
              href: "/sd/case-studies/amazon",
              designType: "HLD",
            },
            {
              id: "stripe",
              label: "Stripe",
              href: "/sd/case-studies/stripe",
              designType: "HLD",
            },
          ],
        },
        {
          id: "productivity",
          label: "Productivity",
          isSection: true,
          children: [
            {
              id: "google-docs",
              label: "Google Docs",
              href: "/sd/case-studies/google-docs",
              designType: "HLD",
            },
            {
              id: "google-drive",
              label: "Google Drive",
              href: "/sd/case-studies/google-drive",
              designType: "HLD",
            },
            {
              id: "dropbox-sign",
              label: "Dropbox Sign",
              href: "/sd/case-studies/dropbox-sign",
              designType: "HLD",
            },
          ],
        },
        {
          id: "coding",
          label: "Coding Platforms",
          isSection: true,
          children: [
            {
              id: "leetcode",
              label: "LeetCode",
              href: "/sd/case-studies/leetcode",
              designType: "HLD",
            },
            {
              id: "chess",
              label: "Chess.com",
              href: "/sd/case-studies/chess-com",
              designType: "HLD",
            },
          ],
        },
        {
          id: "other-cases",
          label: "Other Systems",
          isSection: true,
          children: [
            {
              id: "atm",
              label: "ATM System",
              href: "/sd/case-studies/atm-system",
              designType: "LLD",
            },
            { id: "url-shortener", label: "URL Shortener", href: "/sd/case-studies/url-shortener", designType: "HLD" },
            { id: "rate-limiter", label: "Rate Limiter", href: "/sd/case-studies/rate-limiter", designType: "HLD" },
            {
              id: "notification",
              label: "Notification System",
              href: "/sd/case-studies/notification-system",
              designType: "HLD",
            },
          ],
        },
      ],
    },
  ],
};

// Helper to count descendants
const countDescendants = (node: TreeNode): number => {
  if (!node.children) return 0;
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0
  );
};

// Topic Node - the clickable cards
function TopicNode({
  node,
  onToggle,
  onNavigate,
  onUncheck,
  isExpanded,
  hasChildren,
  isVisited = false,
}: {
  node: TreeNode;
  onToggle: (id: string) => void;
  onNavigate: (href: string, nodeId: string) => void;
  onUncheck: (nodeId: string) => void;
  isExpanded: boolean;
  hasChildren: boolean;
  isVisited?: boolean;
}) {
  const isSection = node.isSection;
  const childCount = countDescendants(node);

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggle(node.id);
    } else if (node.href) {
      // If already visited, uncheck instead of navigating
      if (isVisited) {
        onUncheck(node.id);
      } else {
        onNavigate(node.href, node.id);
      }
    }
  }, [hasChildren, node.id, node.href, onToggle, onNavigate, onUncheck, isVisited]);

  // Color schemes based on type (light and dark theme support)
  const getColors = () => {
    if (isSection) {
      return {
        bg: "bg-slate-100 dark:bg-slate-800/80",
        border: "border-slate-300 dark:border-slate-600",
        hover:
          "hover:border-slate-400 hover:bg-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700",
        text: "text-slate-700 dark:text-slate-200",
      };
    }
    switch (node.designType) {
      case "HLD":
        return {
          bg: "bg-emerald-500 dark:bg-emerald-600",
          border: "border-emerald-600 dark:border-emerald-500",
          hover:
            "hover:border-emerald-700 hover:bg-emerald-400 dark:hover:border-emerald-300 dark:hover:bg-emerald-500",
          text: "text-white",
        };
      case "LLD":
        return {
          bg: "bg-blue-500 dark:bg-blue-600",
          border: "border-blue-600 dark:border-blue-500",
          hover:
            "hover:border-blue-700 hover:bg-blue-400 dark:hover:border-blue-300 dark:hover:bg-blue-500",
          text: "text-white",
        };
      case "BOTH":
        return {
          bg: "bg-violet-500 dark:bg-violet-600",
          border: "border-violet-600 dark:border-violet-500",
          hover:
            "hover:border-violet-700 hover:bg-violet-400 dark:hover:border-violet-300 dark:hover:bg-violet-500",
          text: "text-white",
        };
      default:
        return {
          bg: "bg-gray-500 dark:bg-gray-600",
          border: "border-gray-600 dark:border-gray-500",
          hover:
            "hover:border-gray-700 hover:bg-gray-400 dark:hover:border-gray-300 dark:hover:bg-gray-500",
          text: "text-white",
        };
    }
  };

  const colors = getColors();

  return (
    <button
      onClick={handleClick}
      className={`
        relative px-4 py-2 rounded-lg border-2 transition-all duration-200
        ${colors.bg} ${colors.border} ${colors.hover} ${colors.text}
        ${hasChildren || node.href ? "cursor-pointer" : "cursor-default"}
        shadow-lg hover:shadow-xl hover:scale-105 active:scale-100
        ${isVisited && !isSection ? "opacity-60 ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900" : ""}
      `}
    >
      <div className='flex items-center gap-2'>
        {/* Expand/collapse arrow for sections */}
        {hasChildren && (
          <span
            className='transition-transform duration-200 text-xs opacity-80'
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
        )}

        {/* Label */}
        <span className='font-medium text-sm whitespace-nowrap'>
          {node.label}
        </span>

        {/* Type badge */}
        {node.designType && !isSection && (
          <span className='px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded'>
            {node.designType}
          </span>
        )}

        {/* Child count when collapsed */}
        {hasChildren && !isExpanded && childCount > 0 && (
          <span className='px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded-full'>
            +{childCount}
          </span>
        )}

        {/* Link arrow */}
        {node.href && !hasChildren && !isVisited && (
          <span className='opacity-60 text-xs'>→</span>
        )}

        {/* Visited checkmark */}
        {isVisited && !isSection && (
          <span className='text-xs opacity-80' title='Click to unmark'>
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

// Connector line SVG with flowing animation
function ConnectorLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <svg width='3' height='32' className='text-slate-400 dark:text-slate-500' style={{ marginTop: "-1px", marginBottom: "-1px" }}>
        {/* Base line (static) */}
        <line
          x1='1.5'
          y1='0'
          x2='1.5'
          y2='32'
          stroke='currentColor'
          strokeWidth='3'
          strokeOpacity='0.3'
        />
        {/* Animated flowing line */}
        <line
          x1='1.5'
          y1='0'
          x2='1.5'
          y2='32'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
          strokeDasharray='8 24'
        >
          <animate
            attributeName='stroke-dashoffset'
            values='32;0'
            dur='1.5s'
            repeatCount='indefinite'
          />
        </line>
      </svg>
    </div>
  );
}

// Children container box with charging animation
function ChildrenBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className='relative p-4 rounded-xl overflow-hidden'
      style={{
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "12px",
        animation: "fadeInScale 0.4s ease-out forwards",
      }}
    >
      {/* Animated charging border overlay */}
      <div
        className='absolute inset-0 rounded-xl pointer-events-none dark:hidden'
        style={{
          background: `
            linear-gradient(180deg, transparent, transparent) padding-box,
            linear-gradient(180deg, #cbd5e1, #e2e8f0, #cbd5e1) border-box
          `,
          border: "2px solid transparent",
          borderRadius: "12px",
          animation: "borderChargePulse 6s ease-in-out infinite",
        }}
      />
      <div
        className='absolute inset-0 rounded-xl pointer-events-none hidden dark:block'
        style={{
          background: `
            linear-gradient(180deg, transparent, transparent) padding-box,
            linear-gradient(180deg, #475569, #64748b, #475569) border-box
          `,
          border: "2px solid transparent",
          borderRadius: "12px",
          animation: "borderChargePulse 6s ease-in-out infinite",
        }}
      />
      {/* Static border underneath */}
      <div
        className='absolute inset-0 rounded-xl pointer-events-none border-2 border-slate-300 dark:border-slate-600'
        style={{
          borderWidth: "2px",
          borderRadius: "12px",
        }}
      />
      <div className='relative flex flex-wrap justify-center gap-3'>{children}</div>
    </div>
  );
}

// Small connector line between button and children box
function SmallConnector() {
  return (
    <svg
      className='text-slate-400 dark:text-slate-500'
      width='3'
      height='16'
      style={{ marginTop: "-1px", marginBottom: "-1px" }}
    >
      {/* Base line (static) */}
      <line
        x1='1.5'
        y1='0'
        x2='1.5'
        y2='16'
        stroke='currentColor'
        strokeWidth='3'
        strokeOpacity='0.3'
      />
      {/* Animated flowing line */}
      <line
        x1='1.5'
        y1='0'
        x2='1.5'
        y2='16'
        stroke='currentColor'
        strokeWidth='3'
        strokeDasharray='4 12'
      >
        <animate
          attributeName='stroke-dashoffset'
          values='16;0'
          dur='1.5s'
          repeatCount='indefinite'
        />
      </line>
    </svg>
  );
}

// Roadmap Section - renders a node and its children
function RoadmapSection({
  node,
  expandedNodes,
  onToggle,
  onNavigate,
  onUncheck,
  visitedNodes,
}: {
  node: TreeNode;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (href: string, nodeId: string) => void;
  onUncheck: (nodeId: string) => void;
  visitedNodes: Set<string>;
  isRoot?: boolean;
}) {
  const hasChildren = !!(node.children && node.children.length > 0);
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div className='flex flex-col items-center'>
      {/* The node itself */}
      <TopicNode
        node={node}
        onToggle={onToggle}
        onNavigate={onNavigate}
        onUncheck={onUncheck}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        isVisited={visitedNodes.has(node.id)}
      />

      {/* Children */}
      {hasChildren && isExpanded && node.children && (
        <>
          <SmallConnector />
          <ChildrenBox>
            {node.children.map((child) => {
              const childHasChildren = !!(
                child.children && child.children.length > 0
              );
              const childIsExpanded = expandedNodes.has(child.id);

              return (
                <div key={child.id} className='flex flex-col items-center'>
                  <TopicNode
                    node={child}
                    onToggle={onToggle}
                    onNavigate={onNavigate}
                    onUncheck={onUncheck}
                    isExpanded={childIsExpanded}
                    hasChildren={childHasChildren}
                    isVisited={visitedNodes.has(child.id)}
                  />

                  {/* Nested children (subsections) */}
                  {childHasChildren && childIsExpanded && child.children && (
                    <>
                      <SmallConnector />
                      <ChildrenBox>
                        {child.children.map((grandchild) => {
                          const gcHasChildren = !!(
                            grandchild.children && grandchild.children.length > 0
                          );
                          const gcIsExpanded = expandedNodes.has(grandchild.id);

                          return (
                            <div
                              key={grandchild.id}
                              className='flex flex-col items-center'
                            >
                              <TopicNode
                                node={grandchild}
                                onToggle={onToggle}
                                onNavigate={onNavigate}
                                onUncheck={onUncheck}
                                isExpanded={gcIsExpanded}
                                hasChildren={gcHasChildren}
                                isVisited={visitedNodes.has(grandchild.id)}
                              />

                              {/* Level 4 children */}
                              {gcHasChildren &&
                                gcIsExpanded &&
                                grandchild.children && (
                                  <>
                                    <SmallConnector />
                                    <ChildrenBox>
                                      {grandchild.children.map((ggc) => (
                                        <TopicNode
                                          key={ggc.id}
                                          node={ggc}
                                          onToggle={onToggle}
                                          onNavigate={onNavigate}
                                          onUncheck={onUncheck}
                                          isExpanded={false}
                                          hasChildren={false}
                                          isVisited={visitedNodes.has(ggc.id)}
                                        />
                                      ))}
                                    </ChildrenBox>
                                  </>
                                )}
                            </div>
                          );
                        })}
                      </ChildrenBox>
                    </>
                  )}
                </div>
              );
            })}
          </ChildrenBox>
        </>
      )}
    </div>
  );
}

const STORAGE_KEY = "sd-roadmap-visited";

export default function SystemDesignRoadmap() {
  const router = useRouter();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    return new Set(["start"]);
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Progress tracking
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [resetBackup, setResetBackup] = useState<string[] | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load visited nodes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVisitedNodes(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save visited nodes to localStorage
  const saveVisited = useCallback((nodes: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...nodes]));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle node visited status
  const toggleVisited = useCallback((nodeId: string) => {
    setVisitedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      saveVisited(next);
      return next;
    });
  }, [saveVisited]);

  // Reset progress with undo
  const resetProgress = useCallback(() => {
    // Save backup for undo
    setResetBackup([...visitedNodes]);
    setVisitedNodes(new Set());
    saveVisited(new Set());
    setUndoCountdown(10);

    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Start countdown
    const countdown = () => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          setResetBackup(null);
          return 0;
        }
        undoTimeoutRef.current = setTimeout(countdown, 1000);
        return prev - 1;
      });
    };
    undoTimeoutRef.current = setTimeout(countdown, 1000);
  }, [visitedNodes, saveVisited]);

  // Undo reset
  const undoReset = useCallback(() => {
    if (resetBackup) {
      const restored = new Set(resetBackup);
      setVisitedNodes(restored);
      saveVisited(restored);
      setResetBackup(null);
      setUndoCountdown(0);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  }, [resetBackup, saveVisited]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // Flatten tree for search
  const flattenTree = useCallback((node: TreeNode): TreeNode[] => {
    const nodes: TreeNode[] = [node];
    if (node.children) {
      for (const child of node.children) {
        nodes.push(...flattenTree(child));
      }
    }
    return nodes;
  }, []);

  const allNodes = useMemo(() => flattenTree(learningTree), [flattenTree]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setSelectedResultIndex(0);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = allNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query)
    );
    setSearchResults(results);
    setSelectedResultIndex(0);
  }, [searchQuery, allNodes]);

  // Find path to node (for expanding parent nodes)
  const findPathToNode = useCallback((targetId: string, node: TreeNode = learningTree, path: string[] = []): string[] | null => {
    const currentPath = [...path, node.id];
    if (node.id === targetId) {
      return currentPath;
    }
    if (node.children) {
      for (const child of node.children) {
        const result = findPathToNode(targetId, child, currentPath);
        if (result) return result;
      }
    }
    return null;
  }, []);

  // Show in roadmap (expand parents to reveal node)
  const showInRoadmap = useCallback((node: TreeNode) => {
    const path = findPathToNode(node.id);
    if (path) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        path.forEach((id) => next.add(id));
        return next;
      });
    }
    setSearchQuery("");
    setSearchResults([]);
  }, [findPathToNode]);

  // Navigate to page
  const navigateToPage = useCallback((href: string) => {
    router.push(href);
    setSearchQuery("");
    setSearchResults([]);
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Only handle arrow keys when search has results
      if (searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      } else if (e.key === "Enter" && searchResults[selectedResultIndex]) {
        e.preventDefault();
        // Enter shows in roadmap
        showInRoadmap(searchResults[selectedResultIndex]);
      } else if (e.key === "Escape") {
        setSearchQuery("");
        setSearchResults([]);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, selectedResultIndex, showInRoadmap]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const onNavigate = useCallback(
    (href: string, nodeId: string) => {
      toggleVisited(nodeId);
      router.push(href);
    },
    [router, toggleVisited]
  );

  // Uncheck a visited node
  const handleUncheck = useCallback(
    (nodeId: string) => {
      setVisitedNodes((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        saveVisited(next);
        return next;
      });
    },
    [saveVisited]
  );

  const expandAll = useCallback(() => {
    const collectAll = (node: TreeNode): string[] => {
      const ids: string[] = [node.id];
      if (node.children) {
        for (const child of node.children) {
          ids.push(...collectAll(child));
        }
      }
      return ids;
    };
    setExpandedNodes(new Set(collectAll(learningTree)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(["start"]));
  }, []);

  // Count total topics
  const countTopics = useMemo(() => {
    const count = (node: TreeNode): number => {
      let total = node.isSection ? 0 : 1;
      if (node.children) {
        for (const child of node.children) {
          total += count(child);
        }
      }
      return total;
    };
    return count(learningTree);
  }, []);

  // Get main sections (children of root)
  const mainSections = learningTree.children || [];
  const rootExpanded = expandedNodes.has("start");

  return (
    <div className='w-full'>
      {/* Search */}
      <div className='relative max-w-md mx-auto mb-4'>
        <input
          ref={searchInputRef}
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search roadmap topics...'
          className='w-full px-4 py-2 pl-10 text-sm rounded-lg border border-fd-border bg-fd-card focus:outline-none focus:ring-2 focus:ring-fd-ring focus:border-transparent'
        />
        <svg
          className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fd-muted-foreground'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className='absolute z-50 w-full mt-1 bg-fd-card border border-fd-border rounded-lg shadow-lg max-h-64 overflow-auto'>
            {searchResults.map((node, index) => (
              <div
                key={node.id}
                onClick={() => showInRoadmap(node)}
                className={`w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                  index === selectedResultIndex
                    ? "bg-fd-accent"
                    : "hover:bg-fd-accent/50"
                }`}
              >
                {node.isSection ? (
                  <span className='w-2 h-2 rounded bg-slate-400 dark:bg-slate-600' />
                ) : node.designType === "HLD" ? (
                  <span className='px-1 py-0.5 text-[8px] font-bold bg-emerald-500 text-white rounded'>
                    HLD
                  </span>
                ) : node.designType === "LLD" ? (
                  <span className='px-1 py-0.5 text-[8px] font-bold bg-blue-500 text-white rounded'>
                    LLD
                  </span>
                ) : node.designType === "BOTH" ? (
                  <span className='px-1 py-0.5 text-[8px] font-bold bg-violet-500 text-white rounded'>
                    BOTH
                  </span>
                ) : null}
                <span className='flex-1'>{node.label}</span>
                {node.href && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToPage(node.href!);
                    }}
                    className='px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors'
                    title='Go to page'
                  >
                    Go →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className='flex flex-wrap justify-center items-center gap-4 mb-6'>
        <button
          onClick={expandAll}
          className='px-3 py-1.5 text-xs font-medium rounded-md bg-fd-card border border-fd-border hover:bg-fd-accent transition-colors'
        >
          Expand All
        </button>
        <span className='text-xs text-fd-muted-foreground'>
          {visitedNodes.size}/{countTopics} completed
        </span>
        <button
          onClick={collapseAll}
          className='px-3 py-1.5 text-xs font-medium rounded-md bg-fd-card border border-fd-border hover:bg-fd-accent transition-colors'
        >
          Collapse All
        </button>
        {undoCountdown > 0 ? (
          <button
            onClick={undoReset}
            className='px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors'
          >
            Undo ({undoCountdown}s)
          </button>
        ) : (
          visitedNodes.size > 0 && (
            <button
              onClick={resetProgress}
              className='px-3 py-1.5 text-xs font-medium rounded-md bg-fd-card border border-fd-border hover:bg-red-100 hover:border-red-300 dark:hover:bg-red-900/30 dark:hover:border-red-700 transition-colors'
            >
              Reset Progress
            </button>
          )
        )}
      </div>
      {/* Roadmap container */}
      <div className='w-full max-h-[700px] overflow-auto rounded-xl border border-fd-border p-8'>
        <div className='flex flex-col items-center min-w-fit'>
          {/* Root node */}
          <TopicNode
            node={learningTree}
            onToggle={toggleNode}
            onNavigate={onNavigate}
            onUncheck={handleUncheck}
            isExpanded={rootExpanded}
            hasChildren={true}
            isVisited={visitedNodes.has(learningTree.id)}
          />

          {/* Main sections flow */}
          {rootExpanded && (
            <>
              <ConnectorLine />

              <div className='flex flex-col items-center'>
                {mainSections.map((section, index) => (
                  <React.Fragment key={section.id}>
                    <RoadmapSection
                      node={section}
                      expandedNodes={expandedNodes}
                      onToggle={toggleNode}
                      onNavigate={onNavigate}
                      onUncheck={handleUncheck}
                      visitedNodes={visitedNodes}
                      isRoot={true}
                    />

                    {/* Connector between main sections */}
                    {index < mainSections.length - 1 && <ConnectorLine />}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className='text-center text-fd-muted-foreground text-xs mt-4'>
        Click sections to expand/collapse. Click topic cards to navigate to
        documentation.
      </p>
    </div>
  );
}
