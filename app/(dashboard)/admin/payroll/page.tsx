"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IndianRupee,
  Search,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  FileText,
  MoreVertical,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PayrollData {
  id: string; // Employee ID
  payrollId?: string; // Payroll Record ID
  name: string;
  email: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate: string | null;
}

export default function AdminPayrollPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("January 2026");
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollData | null>(null);
  const [editFormData, setEditFormData] = useState({
    baseSalary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
  });
  const [adminBudget, setAdminBudget] = useState(600000); // Admin's available budget
  const [isAdjustBudgetOpen, setIsAdjustBudgetOpen] = useState(false);

  // Month options
  const months = [
    "January 2026",
    "February 2026",
    "March 2026",
    "April 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
  ];

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    fetchPayrollData();
    return () => clearInterval(timer);
  }, []);

  // Fetch payroll data using the optimized global query
  // Fetch payroll data using the optimized global query
  const { data: employeesData, isLoading: isLoadingPayroll, isRefetching, refetch } = useQuery({
    queryKey: ['employees', 'with-payroll'],
    queryFn: async () => {
      const res = await fetch("/api/employees?includePayroll=true", { cache: "no-store" });
      return res.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (employeesData?.employees) {
      const payrollList = employeesData.employees.map((emp: any) => {
        const payrollInfo = emp.payroll || {
          basicSalary: 0,
          hra: 0,
          allowances: 0,
          deductions: 0,
          netSalary: 0,
        };

        // Estimate bonus (can be updated later when bonus field is added)
        const bonus = Math.round((payrollInfo.basicSalary || 0) * 0.1); // 10% of base

        return {
          id: emp.id,
          payrollId: payrollInfo.id, // Capture real payroll ID if it exists
          name: emp.fullName,
          email: emp.user?.email || "",
          department: emp.department,
          baseSalary: payrollInfo.basicSalary || 0,
          bonus,
          deductions: payrollInfo.deductions || 0,
          netSalary: (payrollInfo.basicSalary || 0) + (payrollInfo.hra || 0) + (payrollInfo.allowances || 0) - (payrollInfo.deductions || 0),
          status: "pending", // Default to pending for demo
          paidDate: null,
        };
      });
      setPayrollData(payrollList);
      setLoading(false);
    }
  }, [employeesData]);

  const fetchPayrollData = async () => {
    // Wrapper to support manual refresh via refetch
    await refetch();
  };

  // Calculate stats
  const totalBaseSalary = payrollData.reduce((sum, e) => sum + e.baseSalary, 0);
  const totalBonus = payrollData.reduce((sum, e) => sum + e.bonus, 0);
  const totalDeductions = payrollData.reduce((sum, e) => sum + e.deductions, 0);
  const totalNetSalary = payrollData.reduce((sum, e) => sum + e.netSalary, 0);
  const paidCount = payrollData.filter(e => e.status === "paid").length;
  const pendingCount = payrollData.filter(e => e.status === "pending").length;
  const processingCount = payrollData.filter(e => e.status === "processing").length;

  const departments = [...new Set(payrollData.map(e => e.department))];

  // Filter data
  const filteredData = payrollData.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    await Promise.all([
      refetch(),
      minDelay
    ]);
    setIsRefreshing(false);
  };

  const handleExportPayslips = () => {
    // Create CSV content
    const headers = ["Employee Name", "Email", "Department", "Base Salary", "HRA", "Allowances", "Deductions", "Net Salary", "Status"];
    const rows = filteredData.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.baseSalary.toString(),
      (emp.baseSalary * 0.1).toString(), // Estimate HRA as 10% of base
      (emp.bonus).toString(),
      emp.deductions.toString(),
      emp.netSalary.toString(),
      emp.status
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payslips_${selectedMonth.replace(/\s/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditEmployee = (employee: PayrollData) => {
    setSelectedEmployee(employee);
    setEditFormData({
      baseSalary: employee.baseSalary,
      hra: Math.round(employee.baseSalary * 0.1),
      allowances: employee.bonus,
      deductions: employee.deductions,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEmployeeSalary = async () => {
    if (!selectedEmployee) return;

    try {
      const isUpdate = !!selectedEmployee.payrollId;
      const method = isUpdate ? "PUT" : "POST";

      const payload: any = {
        basicSalary: editFormData.baseSalary,
        hra: editFormData.hra,
        allowances: editFormData.allowances,
        deductions: editFormData.deductions,
      };

      if (isUpdate) {
        payload.id = selectedEmployee.payrollId;
      } else {
        payload.employeeId = selectedEmployee.id;
      }

      const res = await fetch("/api/payroll", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state - verify success first
        // If it was a create (POST), we need to refetch to get the new payroll ID
        if (!isUpdate) {
          await refetch();
        } else {
          // Optimistic update for edits
          setPayrollData(prev => prev.map(emp =>
            emp.id === selectedEmployee.id
              ? {
                ...emp,
                baseSalary: editFormData.baseSalary,
                bonus: editFormData.allowances,
                deductions: editFormData.deductions,
                netSalary: (editFormData.baseSalary + editFormData.hra + editFormData.allowances) - editFormData.deductions,
              }
              : emp
          ));
        }
        setIsEditDialogOpen(false);
      } else {
        console.error("Failed to save payroll:", data.error);
      }
    } catch (error) {
      console.error("Error updating payroll:", error);
    }
  };

  const handleProcessPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPayrollData(prev => prev.map(e =>
        e.status === "pending" ? { ...e, status: "paid" } : e
      ));
      setIsProcessing(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate remaining budget
  const totalPayroll = payrollData.reduce((sum, e) => sum + e.netSalary, 0);
  const remainingBudget = adminBudget - totalPayroll;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Budget Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Budget Allocated</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(adminBudget)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdjustBudgetOpen(true)}
                className="mt-2"
              >
                Adjust Budget
              </Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Payroll (All Employees)</p>
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalPayroll)}</p>
              <p className="text-xs text-muted-foreground mt-2">{payrollData.length} employees</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
              <p className={`text-3xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remainingBudget)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {remainingBudget >= 0 ? 'Available' : 'Overbudget'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Details</h1>
          <p className="text-muted-foreground">Manage and send employee salaries</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted && currentTime && (
            <Badge variant="outline" className="hidden md:flex font-mono px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Badge>
          )}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || isRefetching} className="hidden md:flex">
            <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRefetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing || isRefetching}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNetSalary)}</div>
            <p className="text-xs text-muted-foreground">{payrollData.length} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Base Salary</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBaseSalary)}</div>
            <p className="text-xs text-muted-foreground">Monthly total</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bonuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBonus)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">Tax & benefits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge className="bg-green-500">{paidCount} Paid</Badge>
              <Badge className="bg-amber-500">{pendingCount} Pending</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm md:text-lg px-3 py-1 md:px-4 md:py-2">
                <Calendar className="h-4 w-4 mr-2" />
                {selectedMonth}
              </Badge>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex gap-2">
              <Button variant="outline" onClick={handleExportPayslips}>
                <Download className="h-4 w-4 mr-2" />
                Export Payslips
              </Button>
              <Button
                onClick={handleProcessPayroll}
                disabled={isProcessing || pendingCount === 0}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Process Pending ({pendingCount})
                  </>
                )}
              </Button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExportPayslips}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Payslips
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleProcessPayroll}
                    disabled={isProcessing || pendingCount === 0}
                    className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Process Pending ({pendingCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Details</CardTitle>
          <CardDescription>Employee salary breakdown for {selectedMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card View - Premium Redesign */}
          <div className="md:hidden space-y-4">
            {filteredData.map((employee) => (
              <div key={employee.id} className="bg-card rounded-xl border shadow-sm relative overflow-hidden">
                {/* Decorative top pattern */}
                <div className="h-1.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80"></div>

                <div className="p-4">
                  {/* Header: Employee & Net Salary */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {employee.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Net Salary</span>
                      <p className="font-bold text-xl leading-none text-foreground">{formatCurrency(employee.netSalary)}</p>
                    </div>
                  </div>

                  {/* Receipt Details */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 mb-4 font-mono text-sm border border-border/50">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-xs">Base Salary</span>
                      <span>{formatCurrency(employee.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600 dark:text-green-500">
                      <span className="flex items-center gap-1 text-xs"><TrendingUp className="h-3 w-3" /> Bonus</span>
                      <span>+{formatCurrency(employee.bonus)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                      <span className="flex items-center gap-1 text-xs"><AlertCircle className="h-3 w-3" /> Deductions</span>
                      <span>-{formatCurrency(employee.deductions)}</span>
                    </div>
                    <div className="border-t border-dashed my-2 opacity-50"></div>
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(employee.netSalary)}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      {getStatusBadge(employee.status)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-full text-xs font-medium"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Adjust
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
                <Banknote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">No payroll records found</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="hidden md:block rounded-lg border">
            <div className="overflow-x-auto w-full max-w-[calc(100vw-3rem)] md:max-w-full">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-right p-4 font-medium">Base Salary</th>
                    <th className="text-right p-4 font-medium">HRA</th>
                    <th className="text-right p-4 font-medium">Allowances</th>
                    <th className="text-right p-4 font-medium">Deductions</th>
                    <th className="text-right p-4 font-medium">Net Salary</th>
                    <th className="text-center p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {employee.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{employee.department}</Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(employee.baseSalary)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(Math.round(employee.baseSalary * 0.25))}
                      </td>
                      <td className="p-4 text-right text-green-600 font-medium">
                        +{formatCurrency(employee.bonus)}
                      </td>
                      <td className="p-4 text-right text-red-600 font-medium">
                        -{formatCurrency(employee.deductions)}
                      </td>
                      <td className="p-4 text-right font-bold text-lg">
                        {formatCurrency(employee.netSalary)}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td className="p-4" colSpan={2}>Total ({filteredData.length} employees)</td>
                    <td className="p-4 text-right">{formatCurrency(filteredData.reduce((sum, e) => sum + e.baseSalary, 0))}</td>
                    <td className="p-4 text-right">{formatCurrency(filteredData.reduce((sum, e) => sum + Math.round(e.baseSalary * 0.25), 0))}</td>
                    <td className="p-4 text-right text-green-600">+{formatCurrency(filteredData.reduce((sum, e) => sum + e.bonus, 0))}</td>
                    <td className="p-4 text-right text-red-600">-{formatCurrency(filteredData.reduce((sum, e) => sum + e.deductions, 0))}</td>
                    <td className="p-4 text-right text-lg">{formatCurrency(filteredData.reduce((sum, e) => sum + e.netSalary, 0))}</td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Salary - {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Update the salary structure for this employee
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="baseSalary">Base Salary</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  value={editFormData.baseSalary}
                  onChange={(e) => setEditFormData({ ...editFormData, baseSalary: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hra">HRA (House Rent Allowance)</Label>
                <Input
                  id="hra"
                  type="number"
                  value={editFormData.hra}
                  onChange={(e) => setEditFormData({ ...editFormData, hra: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="allowances">Other Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={editFormData.allowances}
                  onChange={(e) => setEditFormData({ ...editFormData, allowances: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deductions">Deductions (PF, Tax, etc.)</Label>
                <Input
                  id="deductions"
                  type="number"
                  value={editFormData.deductions}
                  onChange={(e) => setEditFormData({ ...editFormData, deductions: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Gross Salary (estimated)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(editFormData.baseSalary + editFormData.hra + editFormData.allowances)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Net Salary (estimated)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency((editFormData.baseSalary + editFormData.hra + editFormData.allowances) - editFormData.deductions)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployeeSalary}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Budget Dialog */}
      <Dialog open={isAdjustBudgetOpen} onOpenChange={setIsAdjustBudgetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Payroll Budget</DialogTitle>
            <DialogDescription>
              Set the total monthly budget available for employee salaries
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="budgetAmount">Total Monthly Budget</Label>
              <Input
                id="budgetAmount"
                type="number"
                value={adminBudget}
                onChange={(e) => setAdminBudget(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Budget Allocated:</span>
                <span className="font-semibold">{formatCurrency(adminBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Payroll:</span>
                <span className="font-semibold">{formatCurrency(totalPayroll)}</span>
              </div>
              <div className="h-px bg-border"></div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining Balance:</span>
                <span className={`font-bold text-lg ${adminBudget - totalPayroll >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(adminBudget - totalPayroll)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAdjustBudgetOpen(false)}>
              Save Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
