import { useQuery } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Loader2 } from "lucide-react";

export default function App() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const goals = useQuery(api.savings.listGoals, isAuthenticated ? {} : "skip");
  const transactions = useQuery(
    api.savings.listTransactions,
    isAuthenticated ? {} : "skip",
  );
  const recurringDeposits = useQuery(
    api.savings.listRecurringDeposits,
    isAuthenticated ? {} : "skip",
  );

  const dataReady =
    goals !== undefined &&
    transactions !== undefined &&
    recurringDeposits !== undefined;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;

  if (!dataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Dashboard
      goals={goals || []}
      transactions={transactions || []}
      recurringDeposits={recurringDeposits || []}
      onSignOut={signOut}
    />
  );
}
