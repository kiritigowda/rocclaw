import type { AgentState, FocusFilter } from "@/features/agents/state/store";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AgentAvatar } from "./AgentAvatar";
import {
  NEEDS_APPROVAL_BADGE_CLASS,
  resolveAgentStatusBadgeClass,
  resolveAgentStatusLabel,
} from "./colorSemantics";
import { EmptyStatePanel } from "./EmptyStatePanel";
import { Plus } from "lucide-react";

type FleetSidebarProps = {
  agents: AgentState[];
  selectedAgentId: string | null;
  filter: FocusFilter;
  onFilterChange: (next: FocusFilter) => void;
  onSelectAgent: (agentId: string) => void;
  onCreateAgent: () => void;
  createDisabled?: boolean;
  createBusy?: boolean;
};

export const FleetSidebar = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
  createDisabled = false,
  createBusy = false,
  className,
}: FleetSidebarProps & { className?: string }) => {
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousTopByAgentIdRef = useRef<Map<string, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const agentOrderKey = useMemo(() => agents.map((agent) => agent.agentId).join("|"), [agents]);

  useLayoutEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();

    const getTopInScrollContent = (node: HTMLElement) =>
      node.getBoundingClientRect().top - scrollerRect.top + scroller.scrollTop;

    const nextTopByAgentId = new Map<string, number>();
    const agentIds = agentOrderKey.length === 0 ? [] : agentOrderKey.split("|");
    for (const agentId of agentIds) {
      const node = rowRefs.current.get(agentId);
      if (!node) continue;
      const nextTop = getTopInScrollContent(node);
      nextTopByAgentId.set(agentId, nextTop);
      const previousTop = previousTopByAgentIdRef.current.get(agentId);
      if (typeof previousTop !== "number") continue;
      const deltaY = previousTop - nextTop;
      if (Math.abs(deltaY) < 0.5) continue;
      if (typeof node.animate !== "function") continue;
      node.animate(
        [{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0px)" }],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    }
    previousTopByAgentIdRef.current = nextTopByAgentId;
  }, [agentOrderKey]);

  return (
    <aside
      className={`glass-panel fade-up-delay ui-panel ui-depth-sidepanel relative flex h-full flex-1 flex-col gap-3 bg-sidebar p-3 border-r border-sidebar-border ${className || ""}`}
      data-testid="fleet-sidebar"
    >
      { /* Header */ }
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="console-title type-page-title text-foreground">Agents ({agents.length})</p>
      </div>

      { /* Agent Grid - 2 columns */ }
      <div ref={scrollContainerRef} className="ui-scroll min-h-0 flex-1 overflow-auto">
        {agents.length === 0 ? (
          <EmptyStatePanel title="No agents available." compact className="p-3 text-xs" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {agents.map((agent) => {
              const selected = selectedAgentId === agent.agentId;
              const avatarSeed = agent.avatarSeed ?? agent.agentId;
              return (
                <button
                  key={agent.agentId}
                  ref={(node) => {
                    if (node) {
                      rowRefs.current.set(agent.agentId, node);
                      return;
                    }
                    rowRefs.current.delete(agent.agentId);
                  }}
                  type="button"
                  data-testid={`fleet-agent-row-${agent.agentId}`}
                  className={`group relative ui-card flex flex-col items-center justify-center gap-2 p-3 text-center border transition-colors aspect-square ${
                    selected
                      ? "ui-card-selected"
                      : "hover:bg-surface-2/45"
                  }`}
                  onClick={() => onSelectAgent(agent.agentId)}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      agent.status === "running" ? "bg-green-500" :
                      agent.status === "error" ? "bg-red-500" :
                      agent.status === "idle" ? "bg-slate-400" :
                      "bg-amber-500"
                    }`}
                  />
                  <AgentAvatar
                    seed={avatarSeed}
                    name={agent.name}
                    avatarUrl={agent.avatarUrl ?? null}
                    size={48}
                    isSelected={selected}
                  />
                  <div className="min-w-0 w-full">
                    <p className="type-secondary-heading truncate text-foreground text-sm">
                      {agent.name}
                    </p>                    
                    {agent.awaitingUserInput ? (
                      <span className={`ui-badge ${NEEDS_APPROVAL_BADGE_CLASS} text-[10px] mt-1`} data-status="approval">
                        Needs approval
                      </span>
                    ) : (
                      <span className={`text-[10px] text-muted-foreground mt-1 ${resolveAgentStatusBadgeClass(agent.status)}`}>
                        {resolveAgentStatusLabel(agent.status)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      { /* New Agent Button - Bottom */ }
      <button
        type="button"
        data-testid="fleet-new-agent-button"
        className="ui-btn-primary flex items-center justify-center gap-2 px-3 py-3 font-mono text-[12px] font-medium tracking-[0.02em] disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground mt-auto"
        onClick={onCreateAgent}
        disabled={createDisabled || createBusy}
      >
        <Plus className="w-4 h-4" />
        {createBusy ? "Creating..." : "New Agent"}
      </button>
    </aside>
  );
};
