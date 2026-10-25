import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  savingsGoals: defineTable({
    userId: v.string(),
    name: v.string(),
    targetAmount: v.number(),
    deadline: v.union(v.string(), v.null()),
    priority: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  savingsTransactions: defineTable({
    goalId: v.id("savingsGoals"),
    transactionType: v.string(),
    amount: v.number(),
    note: v.union(v.string(), v.null()),
    transactionDate: v.string(),
    createdAt: v.number(),
  }).index("by_goal", ["goalId"]),

  recurringDeposits: defineTable({
    goalId: v.id("savingsGoals"),
    amount: v.number(),
    frequency: v.string(),
    nextDepositDate: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_goal", ["goalId"]),
});

export default schema;
