import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCalculatePayout } from "@/hooks/useQueries";
import {
  Briefcase,
  IndianRupee,
  Loader2,
  Plane,
  RefreshCw,
  UmbrellaOff,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function StatCard({ label, value, icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="bg-card rounded-xl border border-border/60 shadow-xs p-4 flex items-center gap-3"
    >
      <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-display font-bold text-foreground leading-none mt-0.5">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

interface DashboardPanelProps {
  year: number;
  month: number;
}

export function DashboardPanel({ year, month }: DashboardPanelProps) {
  const {
    data: payout,
    isLoading,
    refetch,
    isFetching,
  } = useCalculatePayout(year, month);

  const dailyRate =
    payout && payout.grossSalary > 0
      ? payout.grossSalary / 26 // assuming 26 working days/month standard
      : 0;

  const deductions =
    payout && payout.leaveDays > 0 && payout.grossSalary > 0
      ? (payout.grossSalary / 26) * payout.leaveDays
      : 0;

  const overtimeBonus =
    payout && payout.sundayOvertimes > 0 && payout.grossSalary > 0
      ? (payout.grossSalary / 26) * payout.sundayOvertimes
      : 0;

  return (
    <div className="space-y-4">
      {/* Payout highlight card */}
      <motion.div
        data-ocid="dashboard.payout_card"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-card"
      >
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                Monthly Payout
              </p>
              {isLoading || isFetching ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin opacity-70" />
                  <span className="text-sm opacity-70">Calculating...</span>
                </div>
              ) : (
                <p className="text-4xl font-display font-bold mt-1 tracking-tight">
                  ₹
                  {payout
                    ? payout.payout.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })
                    : "0"}
                </p>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              data-ocid="dashboard.refresh_button"
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-xl"
            >
              <RefreshCw
                className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {payout && payout.grossSalary > 0 && (
            <div className="mt-4 pt-3 border-t border-white/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Gross Salary</span>
                <span className="font-semibold">
                  ₹{payout.grossSalary.toLocaleString("en-IN")}
                </span>
              </div>
              {dailyRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Daily Rate</span>
                  <span className="font-semibold">
                    ₹
                    {dailyRate.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}
              {deductions > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Leave Deductions</span>
                  <span className="font-semibold text-red-300">
                    -₹
                    {deductions.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}
              {overtimeBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Sunday OT Bonus</span>
                  <span className="font-semibold text-yellow-300">
                    +₹
                    {overtimeBonus.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Working Days"
          value={payout?.workingDays ?? "—"}
          icon={<Briefcase className="h-4 w-4 text-working" />}
          color="bg-working-light"
          delay={0.05}
        />
        <StatCard
          label="Leave Days"
          value={payout?.leaveDays ?? "—"}
          icon={<UmbrellaOff className="h-4 w-4 text-leave" />}
          color="bg-leave-light"
          delay={0.1}
        />
        <StatCard
          label="Tour Days"
          value={payout?.tourDays ?? "—"}
          icon={<Plane className="h-4 w-4 text-tour" />}
          color="bg-tour-light"
          delay={0.15}
        />
        <StatCard
          label="Sunday OT"
          value={payout?.sundayOvertimes ?? "—"}
          icon={<Zap className="h-4 w-4 text-overtime" />}
          color="bg-amber-50"
          delay={0.2}
        />
      </div>

      {!payout && !isLoading && (
        <p className="text-xs text-center text-muted-foreground py-2">
          Mark attendance days to see your payout calculation.
        </p>
      )}
    </div>
  );
}
