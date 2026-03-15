import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type DayAttendance,
  useMonthAttendance,
  useRemoveAttendance,
  useSetAttendance,
} from "@/hooks/useQueries";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface StatusBadgeProps {
  status: string;
  small?: boolean;
}

function StatusBadge({ status, small }: StatusBadgeProps) {
  const cls = small
    ? "text-[9px] px-1 py-0 leading-4"
    : "text-[10px] px-1.5 py-0.5";
  if (status === "working") {
    return (
      <span
        className={`inline-block rounded font-semibold bg-working-light text-working ${cls}`}
      >
        Work
      </span>
    );
  }
  if (status === "leave") {
    return (
      <span
        className={`inline-block rounded font-semibold bg-leave-light text-leave ${cls}`}
      >
        Leave
      </span>
    );
  }
  if (status === "tour") {
    return (
      <span
        className={`inline-block rounded font-semibold bg-tour-light text-tour ${cls}`}
      >
        Tour
      </span>
    );
  }
  return null;
}

function StatusDot({ status }: { status: string }) {
  if (status === "working") {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-sm" />
    );
  }
  if (status === "leave") {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
    );
  }
  if (status === "tour") {
    return (
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-sm" />
    );
  }
  return null;
}

interface CalendarViewProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarView({
  year,
  month,
  onPrev,
  onNext,
}: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("");
  const [noteValue, setNoteValue] = useState("");

  const { data: attendance = [], isLoading } = useMonthAttendance(year, month);
  const setAttendance = useSetAttendance();
  const removeAttendance = useRemoveAttendance();

  const attendanceMap = new Map<number, DayAttendance>(
    attendance.map((a) => [a.day, a]),
  );

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  const daysInMonth = new Date(year, month, 0).getDate();

  const openDayDialog = (day: number) => {
    const data = attendanceMap.get(day);
    setSelectedDay(day);
    setStatusValue(data?.status || "");
    // Use note from backend data first, fallback to localStorage for legacy
    setNoteValue(
      data?.note ||
        localStorage.getItem(`attendance-note-${year}-${month}-${day}`) ||
        "",
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDay) return;
    if (!statusValue) {
      toast.error("Please select a status");
      return;
    }
    try {
      await setAttendance.mutateAsync({
        year,
        month,
        day: selectedDay,
        status: statusValue,
        note: noteValue,
      });
      toast.success("Attendance saved!");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  const handleDelete = async () => {
    if (!selectedDay) return;
    try {
      await removeAttendance.mutateAsync({ year, month, day: selectedDay });
      localStorage.removeItem(
        `attendance-note-${year}-${month}-${selectedDay}`,
      );
      toast.success("Attendance cleared");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to clear attendance");
    }
  };

  // Build cells: leading nulls + days 1..N + trailing nulls
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from(
    { length: firstDayOfMonth },
    (_, i) => -(i + 1),
  );
  const cells: number[] = [...leadingBlanks, ...dayNumbers];
  while (cells.length % 7 !== 0) {
    cells.push(-(cells.length + 100));
  }

  const selectedData = selectedDay ? attendanceMap.get(selectedDay) : undefined;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          data-ocid="calendar.prev_button"
          className="rounded-xl h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-display font-bold text-foreground tracking-tight">
          {MONTHS[month - 1]} {year}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          data-ocid="calendar.next_button"
          className="rounded-xl h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-[11px] font-bold py-1.5 uppercase tracking-widest ${
              d === "Sun" ? "text-leave" : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          data-ocid="calendar.loading_state"
          className="flex items-center justify-center py-12 text-muted-foreground"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Calendar grid */}
      {!isLoading && (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (cell <= 0) {
              return <div key={`filler-${cell}`} className="min-h-[60px]" />;
            }

            const day = cell;
            const data = attendanceMap.get(day);
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            const isSunday = dayOfWeek === 0;
            const isToday = isCurrentMonth && today.getDate() === day;
            const isOT = data?.status === "working" && isSunday;

            let cellBg = "bg-card hover:bg-muted/30";
            let cellBorder = "border-border";
            if (data?.status === "working") {
              cellBg = "bg-working-light";
              cellBorder = "border-working/40";
            } else if (data?.status === "leave") {
              cellBg = "bg-leave-light";
              cellBorder = "border-leave/40";
            } else if (data?.status === "tour") {
              cellBg = "bg-tour-light";
              cellBorder = "border-tour/40";
            }

            return (
              <motion.button
                key={day}
                whileTap={{ scale: 0.93 }}
                onClick={() => openDayDialog(day)}
                data-ocid={`calendar.day_cell.${day}`}
                className={`relative min-h-[60px] p-1.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer select-none ${
                  cellBg
                } ${cellBorder} ${
                  isToday ? "ring-2 ring-primary/50 ring-offset-1" : ""
                }`}
              >
                <span
                  className={`text-xs font-bold leading-none ${
                    isToday
                      ? "text-primary"
                      : isSunday
                        ? "text-leave"
                        : "text-foreground"
                  }`}
                >
                  {day}
                </span>
                {data?.status && (
                  <div className="flex justify-center mt-1.5">
                    <StatusDot status={data.status} />
                  </div>
                )}
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {data?.status && <StatusBadge status={data.status} small />}
                </div>
                {isOT && (
                  <span
                    title="Sunday Overtime"
                    className="absolute top-0.5 right-0.5 text-overtime"
                  >
                    <Star className="h-3 w-3 fill-overtime" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          <span className="text-xs text-muted-foreground">Working</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span className="text-xs text-muted-foreground">Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
          <span className="text-xs text-muted-foreground">Tour</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-overtime text-overtime" />
          <span className="text-xs text-muted-foreground">Sunday OT</span>
        </div>
      </div>

      {/* Day Entry Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {selectedDay &&
                    `${MONTHS[month - 1]} ${selectedDay}, ${year}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <div className="space-y-1.5">
                  <Label htmlFor="day-status" className="text-sm font-medium">
                    Attendance Status
                  </Label>
                  <Select value={statusValue} onValueChange={setStatusValue}>
                    <SelectTrigger
                      id="day-status"
                      data-ocid="day_entry.status_select"
                      className="rounded-lg"
                    >
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">✅ Working</SelectItem>
                      <SelectItem value="leave">🏖️ Leave</SelectItem>
                      <SelectItem value="tour">✈️ Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="day-note" className="text-sm font-medium">
                    Note{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="day-note"
                    data-ocid="day_entry.textarea"
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Add a note about this day..."
                    className="resize-none rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
                {selectedData && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={removeAttendance.isPending}
                    data-ocid="day_entry.delete_button"
                    className="sm:mr-auto"
                  >
                    {removeAttendance.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    Clear Day
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="day_entry.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={setAttendance.isPending}
                  data-ocid="day_entry.save_button"
                >
                  {setAttendance.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : null}
                  {setAttendance.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
