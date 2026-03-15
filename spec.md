# Self-Attendance & Salary Calculator

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Calendar interface to mark each day as Working, Leave, or Tour, with a Note field per entry
- Monthly Gross Salary input field
- Salary calculation logic:
  - Working and Tour days = full day pay
  - Leave days = deducted (no pay)
  - Working on Sunday = +1 extra day's salary (overtime bonus)
- Dashboard showing: total working days, leave days, tour days, Sunday overtime count, and final monthly payout
- Month/year navigation to switch between months
- Persistence of attendance data per month

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Store attendance records keyed by (year, month, day) with status (Working/Leave/Tour) and note. Store salary config.
2. Frontend: Calendar grid view with day-click to set status, color-coded days, note modal/popover, salary input, dashboard summary panel.
