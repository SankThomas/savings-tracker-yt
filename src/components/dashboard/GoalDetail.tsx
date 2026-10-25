import type { SavingsGoal, SavingsTransactions } from "@/types";
import { useState } from "react";
import { getGoalStats } from "./Dashboard";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { formatDate, money } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpDown,
  CalendarDays,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";

type GoalDetailProps = {
  goal: SavingsGoal;
  transactions: SavingsTransactions[];
  onClose: () => void;
  onDeposit: (goal: SavingsGoal) => void;
  onWithdrawal: (goal: SavingsGoal) => void;
  onRecurring: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
};

export const GoalDetail = ({
  goal,
  transactions,
  onClose,
  onDeposit,
  onWithdrawal,
  onRecurring,
  onEdit,
}: GoalDetailProps) => {
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = getGoalStats(goal, transactions);
  const deleteGoal = useMutation(api.savings.deleteGoal);
  const deleteTransaction = useMutation(api.savings.deleteTransaction);

  const isCompleted = stats.progress >= 100;

  const deposits = stats.rows.filter((t) => t.transactionType === "deposit");
  const average = deposits.length
    ? deposits.reduce((sum, t) => sum + Number(t.amount), 0) / deposits.length
    : 0;
  const projectedDate =
    average && stats.remaining > 0
      ? new Date(
          Date.now() + Math.ceil(stats.remaining / average) * 30 * 86400000,
        )
      : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      await deleteGoal({ id: goal._id });
      setShowDeleteDialog(false);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Could not delete goal.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTransaction = async (id: SavingsTransactions["_id"]) => {
    try {
      await deleteTransaction({ id });
    } catch (err) {
      setError((err as Error).message || "Could not delete transaction");
    }
  };

  const exportToCSV = () => {
    const rows: string[][] = [
      ["Goal", "Date", "Type", "Amount", "Note"],
      ...stats.rows.map((t) => [
        goal.name,
        t.transactionDate,
        t.transactionType,
        String(t.amount),
        t.note || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `${goal.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-history.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-h-130 overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <div>
              <DialogTitle>{goal.name}</DialogTitle>
              <DialogDescription>
                {isCompleted ? "Goal completed" : "Keep building momentum"}
              </DialogDescription>
            </div>
          </DialogHeader>

          {error && <div className="error-banner">{error}</div>}

          <div className="detail-layout">
            <div className="detail-left-col">
              <div
                className={`detail-progress-section ${isCompleted ? "detail-progress-completed" : "detail-progress-active"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="detail-progress-label">Progress</span>

                  {isCompleted && <Badge variant="success">COMPLETE</Badge>}
                </div>

                <div className="detail-progress-value">{stats.progress}%</div>

                <Progress value={stats.progress} />
              </div>

              <div className="detail-grid">
                <div className="detail-stat-box">
                  <span className="detail-stat-label">Saved</span>
                  <b className="detail-stat-value">{money(stats.saved)}</b>
                </div>

                <div className="detail-stat-box">
                  <span className="detail-stat-label">Remaining</span>
                  <b className="detail-stat-value">{money(stats.remaining)}</b>
                </div>

                <div className="detail-stat-box">
                  <span className="detail-stat-label">Target date</span>
                  <b className="detail-stat-value">
                    {goal.deadline ? formatDate(goal.deadline) : "None"}
                  </b>
                </div>
              </div>

              {projectedDate && (
                <p className="projected-date">
                  <CalendarDays
                    size={13}
                    className="inline mr-1.5 align-middle"
                  />
                  Projected completion around{" "}
                  {projectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  based on your average deposits.
                </p>
              )}

              <div className="detail-actions">
                <Button
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={() => onDeposit(goal)}
                >
                  <Plus size={14} /> Deposit
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onWithdrawal(goal)}
                  aria-label="Add withdrawal"
                >
                  <ArrowDownToLine size={14} />
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onRecurring(goal)}
                  aria-label="Schedul recurring deposity"
                >
                  <Repeat size={14} />
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onEdit(goal)}
                  aria-label="Edit goal"
                >
                  <Pencil size={14} />
                </Button>
              </div>
            </div>

            <div className="detail-right-col">
              <div className="detail-history-title">Transaction history</div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stats.rows.length ? (
                  stats.rows.map((t) => (
                    <div key={t._id} className="detail-history-row group">
                      <div>
                        {t.note ||
                          (t.transactionType === "deposit"
                            ? "Deposit"
                            : "Withdrawal")}
                        <div className="detail-history-date">
                          {formatDate(t.transactionDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <b
                          className={
                            t.transactionType === "deposit"
                              ? "text-success"
                              : "text-primary"
                          }
                        >
                          {t.transactionType === "withdrawal" ? "-" : "+"}
                          {money(Number(t.amount))}
                        </b>

                        <button
                          onClick={() => handleDeleteTransaction(t._id)}
                          className="detail-history-delete group-hover:opacity-100"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No transactions yet.
                  </span>
                )}
              </div>

              <div className="detail-footer">
                <Button
                  variant="quiet"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={13} /> Delete goal
                </Button>
                <Button variant="secondary" onClick={exportToCSV}>
                  <ArrowUpDown size={13} /> Export CSV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{goal.name}</strong>? This
              will also permanently delete all transaction history for this
              goal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose>
              <Button variant="secondary" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting..." : "Delete goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
