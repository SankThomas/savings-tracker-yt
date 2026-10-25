import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";

type AuthMode = "signin" | "signup";
type ResetStep = "request" | "verify" | null;

function authError(err: unknown, fallback: string): string {
  const msg = (err as Error)?.message ?? "";
  if (/password/i.test(msg) && /short|length|at least/i.test(msg))
    return "Password must be at least 8 characters.";
  if (/email/i.test(msg) && /already|exists|registered/i.test(msg))
    return "An account with this email already exists. Try signing in instead.";
  if (/email/i.test(msg) && /invalid|not found|no user/i.test(msg))
    return "No account found with this email. Check the address or sign up first.";
  if (/code/i.test(msg) && /invalid|expired|incorrect/i.test(msg))
    return "That verification code is invalid or has expired. Request a new one.";
  if (/password/i.test(msg) && /incorrect|wrong|invalid|match/i.test(msg))
    return "Incorrect password. Please try again.";
  if (/rate/i.test(msg))
    return "Too many attempts. Please wait a moment and try again.";
  return fallback;
}

export const AuthScreen = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>(null);
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuthActions();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetCode = params.get("code");
    const resetEmail = params.get("email");
    if (resetCode) {
      if (resetEmail) setEmail(resetEmail);
      setCode(resetCode);
      setResetStep("verify");
    }
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn("password", { email, password, flow: "signIn" });
      } else {
        await signIn("password", { email, password, flow: "signUp" });
      }
    } catch (err) {
      setError(
        authError(
          err,
          mode === "signin"
            ? "Could not sign in . Check your email and password"
            : "Could not create account. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", { email, flow: "reset" });
      setResetSent(true);
    } catch (err) {
      setError(authError(err, "Could not send reset code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", {
        email,
        newPassword: password,
        code,
        flow: "reset-verification",
      });
    } catch (err) {
      setError(
        authError(
          err,
          "Could not reset password. Check your code and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (resetStep) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5">
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => {
              setResetStep(null);
              setError("");
              setResetSent(false);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {resetStep === "request"
                ? "Enter your email and we will send you a verification code"
                : "Enter the code from your email and your new password"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {resetStep === "request" && resetSent && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-3 text-xs text-success flex items-center gap-2">
              <CheckCircle2 size={14} /> Reset code sent! Check your email.
            </div>
          )}

          {resetStep === "request" ? (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-1 5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                Send reset code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Verification code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-password">New password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                Set new password
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-full border-[3px] border-primary rotate-[-32deg] relative">
            <div className="absolute inset-1 left-1 rounded-full border-2 border-primary" />
            <div className="absolute inset-2 left-2 rounded-full border-2 border-primary" />
          </div>

          <span className="text-base font-bold tracking-tght">
            Savings Tracker
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to track your savings goals."
              : "Start building toward your goals today."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>

          {mode === "signin" && (
            <button
              onClick={() => {
                setResetStep("request");
                setError("");
                setResetSent(false);
              }}
              className="font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
