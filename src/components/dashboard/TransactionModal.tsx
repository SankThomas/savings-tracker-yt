import type { ModalState } from "@/types";
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
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ArrowDownToLine, Loader2, Plus } from "lucide-react";

type TransactionModalProps = {
  modal: Extract<ModalState, { type: "transaction" }>;
  onClose: () => void;
};

export const TransactionModal = ({ modal, onClose }: TransactionModalProps) => {
  const { goal, transactionType } = modal;
  const addTransaction = useMutation(api.savings.addTransaction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isWithdrawal = transactionType === "withdrawal";

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    if (!amount || amount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        goalId: goal._id,
        transactionType,
        amount,
        note: String(form.get("note") || "").trim() || null,
        transactionDate:
          String(form.get("date")) || new Date().toISOString().slice(0, 10),
      });

      onClose();
    } catch (err) {
      setError((err as Error).message || "Could not save transaction");
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
              {isWithdrawal ? "Record a withdrawal" : "Add a deposit"}
            </DialogTitle>
            <DialogDescription>{goal.name}</DialogDescription>
          </div>
        </DialogHeader>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="100"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={today}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              name="note"
              placeholder={
                isWithdrawal
                  ? "What did you use it for?"
                  : "What are you saving for?"
              }
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isWithdrawal ? (
                <ArrowDownToLine size={14} />
              ) : (
                <Plus size={14} />
              )}
              {isWithdrawal ? "Save withdrawal" : "Save deposit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
