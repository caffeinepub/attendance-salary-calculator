import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarDays, LogIn, LogOut, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { DashboardPanel } from "./components/DashboardPanel";
import { SalaryPanel } from "./components/SalaryPanel";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-card border border-border/60 shadow-card rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
          <CalendarDays className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Attendance Tracker
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Track your work days, leave, and tours — and calculate your exact
          monthly payout.
        </p>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="auth.login_button"
          className="w-full rounded-xl h-11 font-semibold"
          size="lg"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {isLoggingIn ? "Signing in..." : "Sign In to Continue"}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Secure login via Internet Identity
        </p>
      </motion.div>
    </div>
  );
}

function AttendanceApp() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-display font-bold text-base text-foreground tracking-tight">
              Attendance Tracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {shortPrincipal && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg">
                <User className="h-3 w-3" />
                <span className="font-mono">{shortPrincipal}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground rounded-lg h-8"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Salary panel */}
        <div className="mb-6">
          <SalaryPanel />
        </div>

        {/* Main layout: calendar + dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar - larger on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-3 bg-card border border-border/60 rounded-2xl shadow-card p-4 sm:p-5"
          >
            <CalendarView
              year={year}
              month={month}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </motion.div>

          {/* Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-2"
          >
            <DashboardPanel year={year} month={month} />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-red-400">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const { isLoginSuccess, isInitializing } = useInternetIdentity();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      {isInitializing ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : isLoginSuccess ? (
        <AttendanceApp />
      ) : (
        <LoginScreen />
      )}
    </QueryClientProvider>
  );
}
