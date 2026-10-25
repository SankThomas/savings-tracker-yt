import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getUserId(ctx: any): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export const createGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    deadline: v.union(v.string(), v.null()),
    priority: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let priority: number;
    if (args.priority !== null && args.priority !== undefined) {
      priority = args.priority;
      for (const g of existing) {
        if (g.priority >= priority) {
          await ctx.db.patch(g._id, { priority: g.priority + 1 });
        }
      }
    } else {
      priority = existing.length;
    }

    const now = Date.now();
    const id = await ctx.db.insert("savingsGoals", {
      userId,
      name: args.name,
      targetAmount: args.targetAmount,
      deadline: args.deadline,
      priority,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("savingsGoals"),
    name: v.string(),
    targetAmount: v.number(),
    deadline: v.union(v.string(), v.null()),
    priority: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");

    const patch: Record<string, number | string | null> = {
      name: args.name,
      targetAmount: args.targetAmount,
      deadline: args.deadline,
      updateAt: Date.now(),
    };

    if (args.priority !== null && args.priority !== undefined) {
      patch.priority = args.priority;
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const listGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const goalIds = new Set(goals.map((g) => g._id));
    const all = await ctx.db.query("savingsTransactions").collect();

    return all.filter((t) => goalIds.has(t.goalId));
  },
});

export const listRecurringDeposits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const goalIds = new Set(goals.map((g) => g._id));
    const all = await ctx.db.query("recurringDeposits").collect();

    return all.filter((r) => goalIds.has(r.goalId));
  },
});

export const reorderGoals = mutation({
  args: { orderedIds: v.array(v.id("savingsGoals")) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    for (let i = 0; i < args.orderedIds.length; i++) {
      const goal = await ctx.db.get(args.orderedIds[i]);
      if (!goal || goal.userId !== userId) continue;
      await ctx.db.patch(args.orderedIds[i], {
        priority: args.orderedIds.length - 1,
      });
    }
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");

    const transactions = await ctx.db
      .query("savingsTransactions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();
    for (const t of transactions) await ctx.db.delete(t._id);

    const recurring = await ctx.db
      .query("recurringDeposits")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();
    for (const r of recurring) await ctx.db.delete(r._id);

    await ctx.db.delete(args.id);
  },
});

export const addTransaction = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    transactionType: v.string(),
    amount: v.number(),
    note: v.union(v.string(), v.null()),
    transactionDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");

    const id = await ctx.db.insert("savingsTransactions", {
      goalId: args.goalId,
      transactionType: args.transactionType,
      amount: args.amount,
      note: args.note,
      transactionDate: args.transactionDate,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("savingsTransactions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transaction not found");

    const goal = await ctx.db.get(tx.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const createRecurringDeposit = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(),
    frequency: v.string(),
    nextDepositDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");

    return await ctx.db.insert("recurringDeposits", {
      goalId: args.goalId,
      amount: args.amount,
      frequency: args.frequency,
      nextDepositDate: args.nextDepositDate,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const deleteRecurringDeposit = mutation({
  args: { id: v.id("recurringDeposits") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Recurring deposit not found");
    const goal = await ctx.db.get(r.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
  },
});