import type { SavingsGoal } from "@/types";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Loader2, Repeat } from "lucide-react";

type RecurringModalProps = {
  goal: SavingsGoal;
  onClose: () => void;
};

export const RecurringModal = ({ goal, onClose }: RecurringModalProps) => {
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createRecurring = useMutation(api.savings.createRecurringDeposit);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const next = new Date();
      if (frequency === "weekly") next.setDate(next.getDate() + 7);
      else next.setMonth(next.getMonth() + 1);

      await createRecurring({
        goalId: goal._id,
        amount: Number(amount),
        frequency,
        nextDepositDate: next.toISOString().slice(0, 10),
      });

      onClose();
    } catch (err) {
      setError(
        (err as Error).message || "Could not schedule recurring deposit",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose;
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>Schedule recurring deposit</DialogTitle>
            <DialogDescription>{goal.name}</DialogDescription>
          </div>
        </DialogHeader>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <Label htmlFor="recurring-amount">Amount</Label>
            <Input
              id="recurring-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as "weekly" | "monthly")}
            >
              <SelectTrigger className="w-full" type="button">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Repeat size={14} />
              )}{" "}
              Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
