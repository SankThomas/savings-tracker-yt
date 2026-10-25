import type { SavingsGoal } from "@/types";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CirclePlus, Loader2 } from "lucide-react";

type GoalModalProps = {
  goal?: SavingsGoal;
  onClose: () => void;
};

export const GoalModal = ({ goal, onClose }: GoalModalProps) => {
  const createGoal = useMutation(api.savings.createGoal);
  const updateGoal = useMutation(api.savings.updateGoal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    setName(goal?.name ?? "");
    setTargetAmount(goal?.targetAmount ? String(goal.targetAmount) : "");
    setDeadline(goal?.deadline ?? "");
    setPriority(goal?.priority !== null ? String(goal?.priority) : "");
  }, [goal?.name, goal?.targetAmount, goal?.deadline, goal?.priority]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const target = Number(targetAmount);
    const dl = deadline || null;
    const priorityRaw = priority.trim();
    const prio = priorityRaw ? Number(priorityRaw) : null;

    if (!trimmedName) {
      setError("Goal name is required");
      return;
    }
    if (!target || target <= 0) {
      setError("Target amount must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      if (goal) {
        await updateGoal({
          id: goal._id,
          name: trimmedName,
          targetAmount: target,
          deadline: dl,
          priority: prio,
        })
      } else {
        await createGoal({ name: trimmedName, targetAmount: target, deadline: dl, priority: prio });
      }

      onClose();
    } catch (err) {
      setError((err as Error).message || "Could not save goal.")
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>
              {goal ? "Edit goal" : "Create a new goal"}
            </DialogTitle>
            <DialogDescription>
              Give your next milestone a name and a number
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <Label htmlFor="name">Goal name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g Weekend in Mombasa"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="targetAmount">Target amount</Label>
            <Input
              id="targetAmount"
              name="targetAmount"
              type="number"
              min="1"
              step="1"
              placeholder="2500"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              min={today}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="priority">Priority (optional)</Label>
            <Input
              id="priority"
              name="priority"
              type="number"
              min="0"
              step="1"
              placeholder="Auto (based on existing goals)"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear higher in the list. Leave blank for auto.
            </p>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CirclePlus size={14} />
              )}

              {goal ? "Save changes" : "Create goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
