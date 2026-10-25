import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatDate, money } from "@/lib/utils";
import type { GoalWithStats } from "@/types";
import { Check, GripVertical, Repeat } from "lucide-react";

type GoalCardProps = {
  goal: GoalWithStats;
  index: number;
  isRecurring: boolean;
  onOpen: (goal: GoalWithStats) => void;
};

export const GoalCard = ({
  goal,
  index,
  isRecurring,
  onOpen,
}: GoalCardProps) => {
  const featured = index === 0 && goal.stats.progress < 100;
  const isCompleted = goal?.stats.progress >= 100;
  const progress = goal?.stats.progress;

  const cardClass = [
    "goal-card",
    featured ? "goal-card-featured" : "",
    isCompleted ? "goal-card-completed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardStyle: React.CSSProperties = isCompleted
    ? {
        background: "linear-gradient(to bottom right, #1a6b42, #28a869)",
        borderColor: "rgba(80, 220, 150, 0.4)",
      }
    : progress > 0
      ? {
          background: `linear-gradient(to bottom right, rgba(189, 51, 22, ${Math.min(progress / 100, 0.5)}), rgba(255, 84, 44, ${Math.min(progress / 100 + 0.15, 0.65)})${progress >= 70 ? `, rgba(80, 220, 150, ${Math.min((progress - 70) / 30, 0.4)})` : ""})`,
        }
      : {};

  const percentClass = isCompleted
    ? "text-success"
    : featured
      ? "text-primary"
      : "text-white";

  return (
    <article
      className={cardClass}
      style={cardStyle}
      onClick={() => onOpen(goal)}
      tabIndex={0}
      onKeyDown={(e) => e.key == "Enter" && onOpen(goal)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="goal-card-name">{goal.name}</div>

        <div className="flex items-center gap-2">
          {isRecurring && (
            <span
              title="Recurring deposit active"
              className="flex items-center justify-center bg-accent-foreground/15 rounded-md p-1 text-accent-foreground"
            >
              <Repeat size={12} />
            </span>
          )}

          {isCompleted && (
            <Badge variant="success">
              <Check size={9} /> COMPLETE
            </Badge>
          )}

          <span className="goal-card-drag-handle text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
            <GripVertical size={14} />
          </span>
        </div>
      </div>

      <div>
        <div className={`goal-card-percent ${percentClass}`}>
          {goal?.stats.progress}%
        </div>

        <Progress value={goal?.stats.progress} />
        <div className="goal-card-meta">
          {money(goal?.stats.saved)} of {money(goal?.targetAmount)}
          <span>&middot;</span> {formatDate(goal?.deadline)}
        </div>
      </div>
    </article>
  );
};
