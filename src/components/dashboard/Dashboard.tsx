import type {
  GoalWithStats,
  ModalState,
  SortValue,
  FilterValue,
  GoalStats,
  RecurringDeposits,
  SavingsGoal,
  SavingsTransactions,
} from "@/types";
import { useMutation } from "convex/react";
import React, { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { ArrowUpDown, Filter, LogOut, Plus, Search } from "lucide-react";
import { StatsCards } from "./StatsCards";
import { DepositsChart } from "./DepositsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { GoalCard } from "./GoalCard";
import { GoalModal } from "./GoalModal";
import { TransactionModal } from "./TransactionModal";
import { RecurringModal } from "./RecurringModal";
import { GoalDetail } from "./GoalDetail";

export function getGoalStats(
  goal: SavingsGoal,
  transactions: SavingsTransactions[],
): GoalStats {
  const rows = transactions.filter((t) => t.goalId === goal._id);
  const saved = rows.reduce(
    (total, t) =>
      total +
      (t.transactionType === "withdrawal"
        ? -Number(t.amount)
        : Number(t.amount)),
    0,
  );
  const progress = Math.min(
    100,
    Math.round((saved / Number(goal.targetAmount)) * 100),
  );

  return {
    saved: Math.max(0, saved),
    progress,
    remaining: Math.max(0, Number(goal.targetAmount) - saved),
    rows,
  };
}

function SortableGoalCard({
  goal,
  index,
  isRecurring,
  onOpen,
}: {
  goal: GoalWithStats;
  index: number;
  isRecurring: boolean;
  onOpen: (goal: GoalWithStats) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(goal._id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GoalCard
        goal={goal}
        index={index}
        isRecurring={isRecurring}
        onOpen={onOpen}
      />
    </div>
  );
}

type DashboardProps = {
  goals: SavingsGoal[];
  transactions: SavingsTransactions[];
  recurringDeposits: RecurringDeposits[];
  onSignOut: () => void;
};

export const Dashboard = ({
  goals,
  transactions,
  recurringDeposits,
  onSignOut,
}: DashboardProps) => {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("deadline");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [search, setSearch] = useState("");
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const reorderGoals = useMutation(api.savings.reorderGoals);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const recurringGoalIds = useMemo(
    () => new Set(recurringDeposits.map((r) => r.goalId)),
    [recurringDeposits],
  );

  const enrichedGoals = useMemo<GoalWithStats[]>(
    () => goals.map((g) => ({ ...g, stats: getGoalStats(g, transactions) })),
    [goals, transactions],
  );

  const visibleGoals = useMemo(() => {
    let result = enrichedGoals;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    result = result.filter(
      (g) =>
        filter === "all" ||
        (filter === "active" && g.stats.progress < 100) ||
        (filter === "completed" && g.stats.progress >= 100),
    );

    if (sort === "priority" && localOrder) {
      result = [...result].sort((a, b) => {
        const ai = localOrder.indexOf(String(a._id));
        const bi = localOrder.indexOf(String(b._id));
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
    } else {
      result = [...result].sort((a, b) => {
        if (sort === "deadline")
          return (a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1;
        if (sort === "progress") return b.stats.progress - a.stats.progress;
        if (sort === "amount") return b.stats.saved - a.stats.saved;
        if (sort === "alphabetical") return a.name.localeCompare(b.name);

        return Number(b.priority) - Number(a.priority);
      });
    }

    return result;
  }, [enrichedGoals, filter, sort, search, localOrder]);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const ids = visibleGoals.map((g) => String(g._id));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(ids, oldIndex, newIndex);

    setLocalOrder(reordered);
    setSort("priority");

    try {
      await reorderGoals({
        orderedIds: reordered as Doc<"savingsGoals">["_id"][],
      });
    } catch (error) {}
  };

  const totalSavings = enrichedGoals.reduce((sum, g) => sum + g.stats.saved, 0);
  const completedCount = enrichedGoals.filter(
    (g) => g.stats.progress >= 100,
  ).length;

  const openNewGoal = () => setModal({ type: "goal" });
  const openEditGoal = (goal: SavingsGoal) =>
    setModal({ type: "editGoal", goalId: goal._id });
  const openDeposit = (goal: SavingsGoal) =>
    setModal({ type: "transaction", goal, transactionType: "deposit" });
  const openWithdrawal = (goal: SavingsGoal) =>
    setModal({ type: "transaction", goal, transactionType: "withdrawal" });
  const openRecurring = (goal: SavingsGoal) =>
    setModal({ type: "recurring", goal });
  const openDetail = (goal: GoalWithStats) => setSelectedGoal(goal);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-main flex items-center justify-between">
          <div className="brand-text">
            <span className="logo-mark">
              <span />
              <span />
            </span>
            Savings Tracker
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={openNewGoal}>
              <Plus size={15} /> New goal
            </Button>
            <Button
              variant="quiet"
              size="icon"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container-main mt-9 mb-17.5">
        <StatsCards
          totalSavings={totalSavings}
          activeCount={enrichedGoals.length - completedCount}
          completedCount={completedCount}
        />

        <DepositsChart transactions={transactions} />

        <div className="goals-header">
          <h1 className="goals-title">Your goals</h1>

          <div className="flex gap-2.5 flex-wrap">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goals..."
                className="search-input"
              />
            </div>

            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as FilterValue)}
            >
              <SelectTrigger aria-label="Filter goals" type="button">
                <Filter size={12} className="opacity-60" />
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All goals</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
              <SelectTrigger aria-label="Sort goals" type="button">
                <ArrowUpDown size={12} className="opacity-60" />
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="amount">Amount saved</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="goals-grid">
          {visibleGoals.length ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleGoals.map((g) => String(g._id))}
                strategy={rectSortingStrategy}
              >
                {visibleGoals.map((goal, index) => (
                  <SortableGoalCard
                    key={goal._id}
                    goal={goal}
                    index={index}
                    isRecurring={recurringGoalIds.has(goal._id)}
                    onOpen={openDetail}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="empty-state">
              <strong className="block text-foreground mb-1.5">
                {search.trim()
                  ? "No goals match your search"
                  : filter === "completed"
                    ? "No completed goals yet"
                    : "Your goals will appear here"}
              </strong>

              {!search.trim() &&
              enrichedGoals.length === 0 &&
              filter === "all" ? (
                <div className="mt-4">
                  <Button variant="primary" onClick={openNewGoal}>
                    <Plus size={14} /> Create your first goal
                  </Button>
                </div>
              ) : !search.trim() ? (
                "Try changing your filter to see other goals"
              ) : null}
            </div>
          )}
        </div>
      </main>

      {modal?.type === "goal" && <GoalModal onClose={() => setModal(null)} />}
      {modal?.type === "editGoal" &&
        (() => {
          const liveGoal = goals.find((g) => g._id === modal.goalId);
          if (!liveGoal) return null;
          return <GoalModal goal={liveGoal} onClose={() => setModal(null)} />;
        })()}

      {modal?.type === "transaction" && (
        <TransactionModal modal={modal} onClose={() => setModal(null)} />
      )}

      {modal?.type === "recurring" && (
        <RecurringModal goal={modal.goal} onClose={() => setModal(null)} />
      )}

      {selectedGoal && (
        <GoalDetail
          goal={selectedGoal}
          transactions={transactions}
          onClose={() => setSelectedGoal(null)}
          onDeposit={openDeposit}
          onWithdrawal={openWithdrawal}
          onRecurring={openRecurring}
          onEdit={openEditGoal}
        />
      )}
    </div>
  );
};
