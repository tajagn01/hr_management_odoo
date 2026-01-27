"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarPlus, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  MessageSquare,
  Loader2,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  adminComment: string | null;
  createdAt: string;
  employee: {
    id: string;
    fullName: string;
  };
}

interface Employee {
  id: string;
  fullName: string;
  employeeCode: string;
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getLeaveTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case "paid":
      return "Paid Leave";
    case "sick":
      return "Sick Leave";
    case "unpaid":
      return "Unpaid Leave";
    default:
      return type;
  }
};

const getLeaveTypeDisplayText = (type: string, balance: { paid: { remaining: number }, sick: { remaining: number }, unpaid: { remaining: number } }) => {
  switch (type) {
    case "PAID":
      return `Paid Leave (${balance.paid.remaining} days remaining)`;
    case "SICK":
      return `Sick Leave (${balance.sick.remaining} days remaining)`;
    case "UNPAID":
      return `Unpaid Leave (${balance.unpaid.remaining} days remaining)`;
    default:
      return "Select leave type";
  }
};

export default function EmployeeLeavePage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [leaveType, setLeaveType] = useState("PAID");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Leave balance (could be fetched from API)
  const leaveBalance = {
    paid: { total: 15, used: 0, remaining: 15 },
    sick: { total: 10, used: 0, remaining: 10 },
    unpaid: { total: 5, used: 0, remaining: 5 },
  };

  // Calculate used leaves from requests
  const calculateUsedLeaves = useCallback((requests: LeaveRequest[]) => {
    const balance = {
      paid: { total: 15, used: 0, remaining: 15 },
      sick: { total: 10, used: 0, remaining: 10 },
      unpaid: { total: 5, used: 0, remaining: 5 },
    };

    requests.forEach((req) => {
      if (req.status.toLowerCase() === "approved") {
        const type = req.type.toLowerCase() as "paid" | "sick" | "unpaid";
        if (balance[type]) {
          balance[type].used += req.days;
          balance[type].remaining = balance[type].total - balance[type].used;
        }
      }
    });

    return balance;
  }, []);

  const [calculatedBalance, setCalculatedBalance] = useState(leaveBalance);
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Calculate days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      
      // Normalize to start of day
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      // Add 1 because both dates are inclusive
      const days = daysDiff + 1;
      setCalculatedDays(days >= 1 ? days : 0);
    } else {
      setCalculatedDays(0);
    }
  }, [fromDate, toDate]);

  // Fetch employee data
  const fetchEmployee = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(`/api/employees?email=${session.user.email}`);
      const data = await res.json();
      if (data.employee) {
        setEmployee(data.employee);
        return data.employee.id;
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
    }
    return null;
  }, [session?.user?.email]);

  // Fetch leave requests
  const fetchLeaveRequests = useCallback(async (employeeId: string) => {
    try {
      const res = await fetch(`/api/leave?employeeId=${employeeId}`);
      const data = await res.json();
      if (data.leaveRequests) {
        setLeaveRequests(data.leaveRequests);
        setCalculatedBalance(calculateUsedLeaves(data.leaveRequests));
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateUsedLeaves]);

  useEffect(() => {
    const loadData = async () => {
      const empId = await fetchEmployee();
      if (empId) {
        await fetchLeaveRequests(empId);
      } else {
        setIsLoading(false);
      }
    };
    loadData();
    // mark mounted for client-only UI to avoid hydration mismatches
    setMounted(true);
  }, [fetchEmployee, fetchLeaveRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (!employee) {
      setError("Employee data not found. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          type: leaveType,
          startDate: fromDate,
          endDate: toDate,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit leave request");
      }

      setSuccess("Leave request submitted successfully!");
      setFromDate("");
      setToDate("");
      setReason("");
      
      // Refresh leave requests
      await fetchLeaveRequests(employee.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshData = async () => {
    if (employee) {
      setIsLoading(true);
      await fetchLeaveRequests(employee.id);
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status.toLowerCase() === "pending").length;
  const approvedCount = leaveRequests.filter(r => r.status.toLowerCase() === "approved").length;
  const rejectedCount = leaveRequests.filter(r => r.status.toLowerCase() === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave and track your requests</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-950 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-green-600">{calculatedBalance.paid.remaining}</span>
              <span className="text-sm text-muted-foreground">of {calculatedBalance.paid.total} days</span>
            </div>
            <Progress value={(calculatedBalance.paid.remaining / calculatedBalance.paid.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{calculatedBalance.paid.used} days used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-blue-600">{calculatedBalance.sick.remaining}</span>
              <span className="text-sm text-muted-foreground">of {calculatedBalance.sick.total} days</span>
            </div>
            <Progress value={(calculatedBalance.sick.remaining / calculatedBalance.sick.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{calculatedBalance.sick.used} days used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-amber-600">{calculatedBalance.unpaid.remaining}</span>
              <span className="text-sm text-muted-foreground">of {calculatedBalance.unpaid.total} days</span>
            </div>
            <Progress value={(calculatedBalance.unpaid.remaining / calculatedBalance.unpaid.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{calculatedBalance.unpaid.used} days used</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Apply Leave Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-blue-500" />
              Apply for Leave
            </CardTitle>
            <CardDescription>Submit a new leave request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="leave-type" className="text-sm font-medium">Leave Type</label>
                {mounted ? (
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="leave-type" className="w-full bg-background text-foreground border-input hover:bg-accent">
                      <SelectValue placeholder="Select leave type">
                        {getLeaveTypeDisplayText(leaveType, calculatedBalance)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem 
                        value="PAID" 
                        className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                      >
                        Paid Leave ({calculatedBalance.paid.remaining} days remaining)
                      </SelectItem>
                      <SelectItem 
                        value="SICK" 
                        className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                      >
                        Sick Leave ({calculatedBalance.sick.remaining} days remaining)
                      </SelectItem>
                      <SelectItem 
                        value="UNPAID" 
                        className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                      >
                        Unpaid Leave ({calculatedBalance.unpaid.remaining} days remaining)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 flex items-center px-3 rounded-md border border-input bg-background text-sm text-muted-foreground">{getLeaveTypeDisplayText(leaveType, calculatedBalance)}</div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="from-date" className="text-sm font-medium">From Date</label>
                  <input 
                    id="from-date"
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="to-date" className="text-sm font-medium">To Date</label>
                  <input 
                    id="to-date"
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Days Calculation Display */}
              {calculatedDays > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Total Days: <span className="font-bold">{calculatedDays}</span> {calculatedDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>
              )}

              {fromDate && toDate && calculatedDays <= 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-900 dark:text-red-100">
                      End date must be on or after start date
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">Reason</label>
                <textarea 
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                  className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none placeholder:text-muted-foreground"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !employee || calculatedDays <= 0 || !fromDate || !toDate || !reason.trim()}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Submit Request</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Request Statistics</CardTitle>
            <CardDescription>Overview of your leave requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Total Days Used This Year</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Paid Leave</span>
                  <span className="font-medium">{calculatedBalance.paid.used} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sick Leave</span>
                  <span className="font-medium">{calculatedBalance.sick.used} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unpaid Leave</span>
                  <span className="font-medium">{calculatedBalance.unpaid.used} days</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{calculatedBalance.paid.used + calculatedBalance.sick.used + calculatedBalance.unpaid.used} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>History of all your leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leave requests found</p>
              <p className="text-sm">Submit your first leave request above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{getLeaveTypeLabel(request.type)}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {request.startDate !== request.endDate && (
                            <> - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                          )}
                        </span>
                        <span className="text-muted-foreground">({request.days} day{request.days > 1 ? "s" : ""})</span>
                      </div>
                      {request.reason && <p className="text-sm mt-2">{request.reason}</p>}
                      
                      {request.adminComment && (
                        <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                          request.status.toLowerCase() === "approved" ? "bg-green-50" : "bg-red-50"
                        }`}>
                          <MessageSquare className={`h-4 w-4 mt-0.5 ${
                            request.status.toLowerCase() === "approved" ? "text-green-600" : "text-red-600"
                          }`} />
                          <div>
                            <p className={`text-xs font-medium ${
                              request.status.toLowerCase() === "approved" ? "text-green-600" : "text-red-600"
                            }`}>Admin Comment</p>
                            <p className={`text-sm ${
                              request.status.toLowerCase() === "approved" ? "text-green-700" : "text-red-700"
                            }`}>{request.adminComment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Applied on</p>
                      <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Leave Policy</h4>
              <p className="text-sm text-blue-700 mt-1">
                Leave requests cannot be modified once submitted. If you need to make changes, 
                please contact your manager or HR department. Minimum 3 days advance notice is 
                required for planned leaves.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
