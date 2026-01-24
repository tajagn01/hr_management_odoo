"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Briefcase,
  MessageSquare,
  Loader2,
  RefreshCw,
  Filter,
  CalendarDays,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    employeeCode: string;
    department: string;
    designation: string;
  };
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getLeaveTypeBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "paid":
      return <Badge variant="outline" className="border-green-300 text-green-700">Paid Leave</Badge>;
    case "sick":
      return <Badge variant="outline" className="border-blue-300 text-blue-700">Sick Leave</Badge>;
    case "unpaid":
      return <Badge variant="outline" className="border-amber-300 text-amber-700">Unpaid Leave</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function AdminLeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filter === "all" ? "/api/leave" : `/api/leave?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.leaveRequests) {
        setLeaveRequests(data.leaveRequests);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleAction = (request: LeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminComment("");
    setIsDialogOpen(true);
  };

  const processRequest = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: actionType === "approve" ? "APPROVED" : "REJECTED",
          adminComment: adminComment || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process request");
      }

      // Refresh data
      await fetchLeaveRequests();
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminComment("");
    } catch (error) {
      console.error("Error processing leave request:", error);
      alert(error instanceof Error ? error.message : "Failed to process request");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status.toLowerCase() === "pending").length;
  const approvedCount = leaveRequests.filter(r => r.status.toLowerCase() === "approved").length;
  const rejectedCount = leaveRequests.filter(r => r.status.toLowerCase() === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">Review and manage employee leave applications</p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex">
          <Button variant="outline" onClick={fetchLeaveRequests} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Mobile Actions Menu */}
        <div className="md:hidden self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={fetchLeaveRequests} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("all")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold">{leaveRequests.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("pending")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("approved")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("rejected")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">Filter:</span>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize whitespace-nowrap"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
          <CardDescription>
            {filter === "all" ? "All leave requests" : `Showing ${filter} requests`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leave requests found</p>
              <p className="text-sm">Leave requests from employees will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile Ticket View - Premium Redesign */}
              <div className="md:hidden space-y-4">
                {leaveRequests.map((request) => (
                  <div key={`mobile-${request.id}`} className="bg-card rounded-xl border shadow-sm overflow-hidden relative">
                    {/* Left colored accent based on status */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${request.status.toLowerCase() === 'approved' ? 'bg-green-500' :
                      request.status.toLowerCase() === 'rejected' ? 'bg-red-500' : 'bg-amber-400'
                      }`} />

                    <div className="p-4 pl-5">
                      {/* Header: Date & Status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Start Date</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono">{new Date(request.startDate).getDate()}</span>
                            <span className="text-sm font-medium text-muted-foreground uppercase">{new Date(request.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {getStatusBadge(request.status)}
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {request.days} day{request.days > 1 ? 's' : ''} • {request.type}
                          </span>
                        </div>
                      </div>

                      {/* Employee & Content */}
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8 border border-background">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{request.employee.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold leading-none">{request.employee.fullName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{request.employee.designation}</p>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="text-sm bg-background border rounded px-2 py-1.5 text-muted-foreground italic">
                            "{request.reason}"
                          </div>
                        )}

                        {request.adminComment && (
                          <div className="mt-2 text-xs flex gap-1.5 text-blue-600">
                            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{request.adminComment}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {request.status.toLowerCase() === "pending" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <Button
                            variant="outline"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleAction(request, "reject")}
                          >
                            Reject
                          </Button>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200"
                            onClick={() => handleAction(request, "approve")}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (Hidden on Mobile) */}
              <div className="hidden md:block space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 border rounded-lg ${request.status.toLowerCase() === "pending"
                      ? "border-amber-200 bg-amber-50/50"
                      : ""
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Employee Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{request.employee.fullName}</p>
                            <p className="text-sm text-muted-foreground">{request.employee.employeeCode}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{request.employee.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{request.employee.designation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {request.startDate !== request.endDate && (
                                <> - {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getLeaveTypeBadge(request.type)}
                            <span className="text-muted-foreground">({request.days} day{request.days > 1 ? "s" : ""})</span>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                            <p className="text-sm">{request.reason}</p>
                          </div>
                        )}

                        {request.adminComment && (
                          <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${request.status.toLowerCase() === "approved" ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"
                            }`}>
                            <MessageSquare className={`h-4 w-4 mt-0.5 ${request.status.toLowerCase() === "approved" ? "text-green-600" : "text-red-600"
                              }`} />
                            <div>
                              <p className={`text-xs font-medium ${request.status.toLowerCase() === "approved" ? "text-green-600" : "text-red-600"
                                }`}>Admin Comment</p>
                              <p className={`text-sm ${request.status.toLowerCase() === "approved" ? "text-green-700" : "text-red-700"
                                }`}>{request.adminComment}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:min-w-40">
                        <p className="text-xs text-muted-foreground text-right">
                          Applied: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.status.toLowerCase() === "pending" && (
                          <div className="flex gap-2 lg:flex-col">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleAction(request, "approve")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleAction(request, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className={actionType === "approve" ? "text-green-600" : "text-red-600"}>
              {actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  {actionType === "approve" ? "Approving" : "Rejecting"} leave request from{" "}
                  <strong>{selectedRequest.employee.fullName}</strong> for{" "}
                  <strong>{selectedRequest.days} day{selectedRequest.days > 1 ? "s" : ""}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium">{selectedRequest.employee.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leave Type</span>
                  {getLeaveTypeBadge(selectedRequest.type)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>
                    {new Date(selectedRequest.startDate).toLocaleDateString()} -{" "}
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span>{selectedRequest.days} day{selectedRequest.days > 1 ? "s" : ""}</span>
                </div>
                {selectedRequest.reason && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="mt-1">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comment (Optional)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Add any notes for the employee..."
                      : "Please provide a reason for rejection..."
                  }
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={processRequest}
              disabled={isProcessing}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm Approval</>
                  ) : (
                    <><XCircle className="h-4 w-4 mr-2" />Confirm Rejection</>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
