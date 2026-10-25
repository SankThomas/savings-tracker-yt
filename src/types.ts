import type { Doc } from "../convex/_generated/dataModel";

export type SavingsGoal = Doc<"savingsGoals">;
export type SavingsTransactions = Doc<"savingsTransactions">;
export type RecurringDeposits = Doc<"recurringDeposits">;

export type GoalStats = {
  saved: number;
  progress: number;
  remaining: number;
  rows: SavingsTransactions[];
};

export type GoalWithStats = SavingsGoal & { stats: GoalStats };

export type ModalState =
  | { type: "goal" }
  | {
      type: "editGoal";
      goalId: SavingsGoal["_id"];
    }
  | {
      type: "transaction";
      goal: SavingsGoal;
      transactionType: "deposit" | "withdrawal";
    }
  | { type: "recurring"; goal: SavingsGoal };

export type FilterValue = "all" | "active" | "completed";
export type SortValue =
  | "priority"
  | "deadline"
  | "progress"
  | "amount"
  | "alphabetical";

export type ChartType = "bar" | "line";
export type ChartRange =
  | "1d"
  | "1w"
  | "1m"
  | "3m"
  | "6m"
  | "1y"
  | "2y"
  | "3y"
  | "lifetime";
