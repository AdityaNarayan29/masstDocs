"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { TreeNode } from "@/lib/roadmap";
import { LEGACY_ROADMAP_IDS } from "@/lib/roadmap-legacy";
import { getSection } from "@/lib/tracks";


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
  // Neutral cards (Masst Reels v2: colour only means something). Done
  // pages get the "ok" ring below; sections read as headers.
  const getColors = () =>
    isSection
      ? {
          bg: "bg-fd-secondary",
          border: "border-fd-border",
          hover: "hover:bg-fd-accent",
          text: "text-fd-foreground font-extrabold",
        }
      : {
          bg: "bg-fd-card",
          border: "border-fd-border",
          hover: "hover:border-[var(--m-info)] hover:bg-fd-accent",
          text: "text-fd-foreground",
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
        ${isVisited && !isSection ? "opacity-60 ring-2 ring-[var(--m-ok)] ring-offset-2 ring-offset-fd-background" : ""}
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
      <svg width='3' height='32' className='text-fd-border' style={{ marginTop: "-1px", marginBottom: "-1px" }}>
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
        className='absolute inset-0 rounded-xl pointer-events-none border-2 border-fd-border'
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
      className='text-fd-border'
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

export default function SystemDesignRoadmap({ tree }: { tree: TreeNode }) {
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

  // Loading state for navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Reset loading state on page visibility change (handles browser back button)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      // e.persisted is true when page is restored from bfcache (back/forward navigation)
      if (e.persisted) {
        setIsNavigating(false);
        setNavigatingTo(null);
      }
    };

    // Also reset on visibility change as a fallback
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsNavigating(false);
        setNavigatingTo(null);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load visited nodes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Old roadmap ids are mapped to page URLs, which the roadmap now uses.
        const ids: string[] = JSON.parse(stored);
        setVisitedNodes(new Set(ids.map((id) => LEGACY_ROADMAP_IDS[id] ?? id)));
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

  const allNodes = useMemo(() => flattenTree(tree), [flattenTree, tree]);

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
  const findPathToNode = useCallback((targetId: string, node: TreeNode = tree, path: string[] = []): string[] | null => {
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
  }, [tree]);

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
      // Show loading state
      setIsNavigating(true);
      setNavigatingTo(href);
      // Update visited state
      toggleVisited(nodeId);
      // Use window.location for immediate, reliable navigation
      window.location.href = href;
    },
    [toggleVisited]
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
    setExpandedNodes(new Set(collectAll(tree)));
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(["start"]));
  }, []);

  // Count total topics
  const countTopics = useMemo(() => {
    const count = (node: TreeNode): number => {
      let total = node.href ? 1 : 0;
      if (node.children) {
        for (const child of node.children) {
          total += count(child);
        }
      }
      return total;
    };
    return count(tree);
  }, [tree]);

  // Get main sections (children of root)
  const mainSections = tree.children || [];
  const rootExpanded = expandedNodes.has("start");

  return (
    <div className='w-full relative'>
      {/* Loading Overlay */}
      {isNavigating && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='flex flex-col items-center gap-4 p-8 rounded-2xl bg-fd-card border border-fd-border shadow-2xl'>
            {/* Charging animation */}
            <div className='relative w-16 h-16'>
              <svg className='w-16 h-16 animate-spin' viewBox='0 0 64 64'>
                <circle
                  cx='32'
                  cy='32'
                  r='28'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                  className='text-fd-border'
                />
                <circle
                  cx='32'
                  cy='32'
                  r='28'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                  strokeDasharray='88 88'
                  strokeLinecap='round'
                  className='text-[var(--m-info)]'
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-lg'>→</span>
              </div>
            </div>
            <div className='text-center'>
              <p className='font-medium text-fd-foreground'>Loading...</p>
              <p className='text-xs text-fd-muted-foreground mt-1 max-w-48 truncate'>
                {navigatingTo}
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <span className='w-2 h-2 rounded bg-fd-muted-foreground' />
                ) : node.section ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-[var(--m-chip)] text-fd-muted-foreground">
                    {getSection(node.section).short}
                  </span>
                ) : null}
                <span className='flex-1'>{node.label}</span>
                {node.href && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToPage(node.href!);
                    }}
                    className='px-2 py-0.5 text-[10px] rounded bg-fd-primary text-fd-primary-foreground hover:opacity-90 transition-colors'
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
            className='px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--m-warn)] text-[#111114] hover:opacity-90 transition-colors'
          >
            Undo ({undoCountdown}s)
          </button>
        ) : (
          visitedNodes.size > 0 && (
            <button
              onClick={resetProgress}
              className='px-3 py-1.5 text-xs font-medium rounded-md bg-fd-card border border-fd-border hover:border-[var(--m-fail)] hover:text-[var(--m-fail)] transition-colors'
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
            node={tree}
            onToggle={toggleNode}
            onNavigate={onNavigate}
            onUncheck={handleUncheck}
            isExpanded={rootExpanded}
            hasChildren={true}
            isVisited={visitedNodes.has(tree.id)}
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
