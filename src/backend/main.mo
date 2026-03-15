import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type DayStatus = {
    #working : Text;
    #leave : Text;
    #tour : Text;
  };

  module DayStatus {
    public func compareByDay(a : (Nat, DayStatus), b : (Nat, DayStatus)) : Order.Order {
      let (dayA, _) = a;
      let (dayB, _) = b;
      Nat.compare(dayA, dayB);
    };

    public func toText(status : DayStatus) : Text {
      switch (status) {
        case (#working(note)) {
          "working: " # note;
        };
        case (#leave(note)) {
          "leave: " # note;
        };
        case (#tour(note)) {
          "tour: " # note;
        };
      };
    };
  };

  type AttendanceRecord = Map.Map<Nat, DayStatus>;
  let attendance = Map.empty<Principal, Map.Map<Nat, Map.Map<Nat, AttendanceRecord>>>();
  let salaries = Map.empty<Principal, Float>();

  // Public self-registration: any authenticated user can register themselves as a user.
  public shared ({ caller }) func registerUser() : async () {
    AccessControl.register(accessControlState, caller);
  };

  func getOrCreateAttendanceRecord(user : Principal, year : Nat, month : Nat) : AttendanceRecord {
    switch (attendance.get(user)) {
      case (null) {
        let newYear = Map.empty<Nat, Map.Map<Nat, AttendanceRecord>>();
        let newMonth = Map.empty<Nat, AttendanceRecord>();
        let newRecord = Map.empty<Nat, DayStatus>();
        newMonth.add(month, newRecord);
        newYear.add(year, newMonth);
        attendance.add(user, newYear);
        newRecord;
      };
      case (?yearsMap) {
        switch (yearsMap.get(year)) {
          case (null) {
            let newMonth = Map.empty<Nat, AttendanceRecord>();
            let newRecord = Map.empty<Nat, DayStatus>();
            newMonth.add(month, newRecord);
            yearsMap.add(year, newMonth);
            newRecord;
          };
          case (?monthsMap) {
            switch (monthsMap.get(month)) {
              case (null) {
                let newRecord = Map.empty<Nat, DayStatus>();
                monthsMap.add(month, newRecord);
                newRecord;
              };
              case (?record) { record };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func setAttendance(year : Nat, month : Nat, day : Nat, status : Text, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set attendance");
    };

    let dayStatus = switch (status) {
      case ("working") { #working(note) };
      case ("leave") { #leave(note) };
      case ("tour") { #tour(note) };
      case (_) { Runtime.trap("Invalid status") };
    };

    let record = getOrCreateAttendanceRecord(caller, year, month);
    record.add(day, dayStatus);
  };

  public shared ({ caller }) func removeAttendance(year : Nat, month : Nat, day : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove attendance");
    };

    switch (attendance.get(caller)) {
      case (null) { Runtime.trap("No attendance records found") };
      case (?yearsMap) {
        switch (yearsMap.get(year)) {
          case (null) { Runtime.trap("No records for this year") };
          case (?monthsMap) {
            switch (monthsMap.get(month)) {
              case (null) { Runtime.trap("No records for this month") };
              case (?record) {
                if (not record.containsKey(day)) {
                  Runtime.trap("Attendance record does not exist");
                };
                record.remove(day);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getMonthAttendance(year : Nat, month : Nat) : async [(Nat, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return []; // Return empty for unregistered/unauthorized users
    };

    switch (attendance.get(caller)) {
      case (null) { [] };
      case (?yearsMap) {
        switch (yearsMap.get(year)) {
          case (null) { [] };
          case (?monthsMap) {
            switch (monthsMap.get(month)) {
              case (null) { [] };
              case (?record) {
                record.toArray().sort(DayStatus.compareByDay).map(func((day, status)) { (day, DayStatus.toText(status)) });
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func setSalary(amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set salary");
    };
    if (amount <= 0.0) { Runtime.trap("Invalid salary amount") };
    salaries.add(caller, amount);
  };

  public query ({ caller }) func getSalary() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return 0.0; // Return 0 for unauthorized/unregistered users
    };
    switch (salaries.get(caller)) {
      case (null) { 0.0 }; // Return 0 if salary not yet set
      case (?salary) { salary };
    };
  };

  public query ({ caller }) func calculatePayout(year : Nat, month : Nat) : async {
    workingDays : Nat;
    leaveDays : Nat;
    tourDays : Nat;
    sundayOvertimes : Nat;
    grossSalary : Float;
    payout : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate payout");
    };

    let grossSalary = switch (salaries.get(caller)) {
      case (null) { Runtime.trap("Salary not set") };
      case (?salary) { salary };
    };

    let daysInMonth = getDaysInMonth(year, month);
    let dailyRate = grossSalary / daysInMonth.toFloat();
    var workingDays = 0;
    var leaveDays = 0;
    var tourDays = 0;
    var sundayOvertimes = 0;

    switch (attendance.get(caller)) {
      case (null) {};
      case (?yearsMap) {
        switch (yearsMap.get(year)) {
          case (null) {};
          case (?monthsMap) {
            switch (monthsMap.get(month)) {
              case (null) {};
              case (?record) {
                for (day in record.keys()) {
                  switch (record.get(day)) {
                    case (null) { workingDays += 1 };
                    case (?status) {
                      switch (status) {
                        case (#working(_)) {
                          workingDays += 1;
                          if (isSunday(year, month, day)) {
                            sundayOvertimes += 1;
                          };
                        };
                        case (#leave(_)) { leaveDays += 1 };
                        case (#tour(_)) { tourDays += 1 };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };

    let fullMonthDays = daysInMonth - (workingDays + leaveDays + tourDays);
    let payout = (workingDays + tourDays + fullMonthDays).toFloat() * dailyRate + sundayOvertimes.toFloat() * dailyRate;

    {
      workingDays;
      leaveDays;
      tourDays;
      sundayOvertimes;
      grossSalary;
      payout;
    };
  };

  func getDaysInMonth(year : Nat, month : Nat) : Nat {
    switch (month) {
      case (1 or 3 or 5 or 7 or 8 or 10 or 12) { 31 };
      case (4 or 6 or 9 or 11) { 30 };
      case (2) {
        if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) { 29 } else { 28 };
      };
      case (_) { Runtime.trap("Invalid month: " # month.toText()) };
    };
  };

  func isSunday(year : Nat, month : Nat, day : Nat) : Bool {
    var weekday = (1 + day - 1) % 7;
    weekday == 0;
  };
};
