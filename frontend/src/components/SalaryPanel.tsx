import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetSalary, useSetSalary } from "@/hooks/useQueries";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SalaryPanel() {
  const { data: currentSalary, isLoading } = useGetSalary();
  const setSalary = useSetSalary();
  const [inputValue, setInputValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentSalary !== undefined && currentSalary > 0) {
      setInputValue(String(currentSalary));
    }
  }, [currentSalary]);

  const handleSave = async () => {
    const amount = Number.parseFloat(inputValue);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }
    try {
      await setSalary.mutateAsync(amount);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Salary saved successfully!");
    } catch {
      toast.error("Failed to save salary");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-display font-semibold">
          <Wallet className="h-4 w-4 text-accent" />
          Monthly Gross Salary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              ₹
            </span>
            <Input
              id="salary-input"
              data-ocid="salary.input"
              type="number"
              min="0"
              step="1000"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="50000"
              className="pl-7 rounded-lg"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={setSalary.isPending || isLoading}
            data-ocid="salary.save_button"
            className="rounded-lg min-w-[80px]"
          >
            {setSalary.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
        {currentSalary !== undefined && currentSalary > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Current:{" "}
            <span className="font-semibold text-foreground">
              ₹{currentSalary.toLocaleString("en-IN")}
            </span>
            /month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
