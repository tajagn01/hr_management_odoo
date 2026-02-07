"use client";

import { useMemo } from "react";
import { useCurrentEmployee, usePayroll } from "@/lib/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Eye,
  Wallet,
  CreditCard,
  Building2,
  Shield,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeePayrollPage() {
  const { employeeId } = useCurrentEmployee();
  const { data: payrollData, isLoading: loading } = usePayroll(employeeId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const payroll = useMemo(() => {
    const raw = payrollData?.payroll;
    if (!raw) return null;

    const gross = raw.basicSalary + raw.hra + raw.allowances;

    const allowancesBreakdown = {
      transport: Math.round(raw.allowances * 0.3),
      medical: Math.round(raw.allowances * 0.25),
      special: Math.round(raw.allowances * 0.45),
    };

    const deductionsBreakdown = {
      pf: Math.round(raw.deductions * 0.35),
      tax: Math.round(raw.deductions * 0.55),
      insurance: Math.round(raw.deductions * 0.10),
    };

    return {
      ...raw,
      gross,
      allowancesBreakdown,
      deductionsBreakdown,
      totalDeductions: raw.deductions,
    };
  }, [payrollData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
          <p className="text-muted-foreground">View your salary details and payment history</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No payroll information available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPayroll = {
    month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    payDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    status: "processing",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
          <p className="text-muted-foreground">View your salary details and payment history</p>
        </div>
        <Badge variant="secondary" className="mt-2 md:mt-0">
          <Eye className="h-3 w-3 mr-1" />
          Read Only
        </Badge>
      </div>

      {/* Current Month Summary */}
      <Card className="border-2 border-green-200 dark:border-green-900 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                Current Month Salary
              </CardTitle>
              <CardDescription>{currentPayroll.month}</CardDescription>
            </div>
            <Badge variant={currentPayroll.status === "paid" ? "default" : "secondary"}>
              {currentPayroll.status === "paid" ? "Paid" : "Processing"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm border border-border">
              <p className="text-sm text-muted-foreground">Gross Salary</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(payroll.gross)}</p>
            </div>
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm border border-border">
              <p className="text-sm text-muted-foreground">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(payroll.totalDeductions)}</p>
            </div>
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm col-span-2 border border-border">
              <p className="text-sm text-muted-foreground">Net Salary (Take Home)</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(payroll.netSalary)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                Expected on {new Date(currentPayroll.payDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Earnings
            </CardTitle>
            <CardDescription>Your salary components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span>Basic Salary</span>
              </div>
              <span className="font-semibold">{formatCurrency(payroll.basicSalary)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <span>House Rent Allowance (HRA)</span>
              </div>
              <span className="font-semibold">{formatCurrency(payroll.hra)}</span>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Other Allowances</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transport Allowance</span>
                  <span>{formatCurrency(payroll.allowancesBreakdown.transport)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Medical Allowance</span>
                  <span>{formatCurrency(payroll.allowancesBreakdown.medical)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Special Allowance</span>
                  <span>{formatCurrency(payroll.allowancesBreakdown.special)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="font-semibold text-green-700">Total Earnings</span>
              <span className="font-bold text-green-700">{formatCurrency(payroll.gross)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Deductions
            </CardTitle>
            <CardDescription>Statutory and other deductions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <span>Provident Fund (PF)</span>
                  <p className="text-xs text-muted-foreground">12% of Basic</p>
                </div>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(payroll.deductionsBreakdown.pf)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <span>Income Tax (TDS)</span>
                  <p className="text-xs text-muted-foreground">As per tax slab</p>
                </div>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(payroll.deductionsBreakdown.tax)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Shield className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <span>Health Insurance</span>
                  <p className="text-xs text-muted-foreground">Employee contribution</p>
                </div>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(payroll.deductionsBreakdown.insurance)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="font-semibold text-red-700">Total Deductions</span>
              <span className="font-bold text-red-700">-{formatCurrency(payroll.totalDeductions)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-linear-to-r from-green-500 to-emerald-500 rounded-lg text-white">
              <span className="font-semibold">Net Pay</span>
              <span className="text-2xl font-bold">{formatCurrency(payroll.netSalary)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your past salary payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-20">
                  <p className="font-semibold">{currentPayroll.month.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{currentPayroll.month.split(" ")[1]}</p>
                </div>
                <div className="hidden md:block">
                  <Badge variant="secondary">Current</Badge>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Gross</p>
                  <p className="font-medium">{formatCurrency(payroll.gross)}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="font-medium text-red-600">-{formatCurrency(payroll.totalDeductions)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Net Pay</p>
                  <p className="font-bold text-green-600">{formatCurrency(payroll.netSalary)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const headers = ['Month', 'Basic Salary', 'HRA', 'Allowances', 'Gross', 'Deductions', 'Net Salary'];
                  const row = [
                    new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                    payroll.basicSalary,
                    payroll.hra || 0,
                    payroll.allowances || 0,
                    payroll.gross,
                    payroll.totalDeductions,
                    payroll.netSalary
                  ];
                  const csv = [headers.join(','), row.join(',')].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `payslip_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                This is a read-only view of your payroll. For any discrepancies or queries regarding
                your salary, please contact the HR or Payroll department. You cannot modify any payroll data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
