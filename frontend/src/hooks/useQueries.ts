import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface DayAttendance {
  day: number;
  status: string;
  note: string;
}

export interface PayoutResult {
  workingDays: number;
  leaveDays: number;
  tourDays: number;
  sundayOvertimes: number;
  grossSalary: number;
  payout: number;
}

// Backend returns status as "working: <note>" format.
// Parse into separate status and note fields.
function parseStatusText(raw: string): { status: string; note: string } {
  const idx = raw.indexOf(": ");
  if (idx !== -1) {
    return { status: raw.slice(0, idx), note: raw.slice(idx + 2) };
  }
  return { status: raw, note: "" };
}

export function useMonthAttendance(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<DayAttendance[]>({
    queryKey: ["attendance", year, month],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.getMonthAttendance(BigInt(year), BigInt(month));
      return data.map(([day, rawStatus]: [bigint, string]) => {
        const { status, note } = parseStatusText(rawStatus);
        return { day: Number(day), status, note };
      });
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSalary() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["salary"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getSalary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCalculatePayout(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<PayoutResult | null>({
    queryKey: ["payout", year, month],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.calculatePayout(BigInt(year), BigInt(month));
      return {
        workingDays: Number(result.workingDays),
        leaveDays: Number(result.leaveDays),
        tourDays: Number(result.tourDays),
        sundayOvertimes: Number(result.sundayOvertimes),
        grossSalary: result.grossSalary,
        payout: result.payout,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      year: number;
      month: number;
      day: number;
      status: string;
      note: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.setAttendance(
        BigInt(vars.year),
        BigInt(vars.month),
        BigInt(vars.day),
        vars.status,
        vars.note,
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", vars.year, vars.month],
      });
      queryClient.invalidateQueries({
        queryKey: ["payout", vars.year, vars.month],
      });
    },
  });
}

export function useRemoveAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { year: number; month: number; day: number }) => {
      if (!actor) throw new Error("No actor");
      await actor.removeAttendance(
        BigInt(vars.year),
        BigInt(vars.month),
        BigInt(vars.day),
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", vars.year, vars.month],
      });
      queryClient.invalidateQueries({
        queryKey: ["payout", vars.year, vars.month],
      });
    },
  });
}

export function useSetSalary() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("No actor");
      await actor.setSalary(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary"] });
      queryClient.invalidateQueries({ queryKey: ["payout"] });
    },
  });
}
