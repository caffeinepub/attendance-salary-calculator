import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculatePayout(year: bigint, month: bigint): Promise<{
        tourDays: bigint;
        grossSalary: number;
        workingDays: bigint;
        sundayOvertimes: bigint;
        leaveDays: bigint;
        payout: number;
    }>;
    getCallerUserRole(): Promise<UserRole>;
    getMonthAttendance(year: bigint, month: bigint): Promise<Array<[bigint, string]>>;
    getSalary(): Promise<number>;
    isCallerAdmin(): Promise<boolean>;
    removeAttendance(year: bigint, month: bigint, day: bigint): Promise<void>;
    setAttendance(year: bigint, month: bigint, day: bigint, status: string, note: string): Promise<void>;
    setSalary(amount: number): Promise<void>;
}
