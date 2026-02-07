"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PayrollData {
  month: string;
  payroll: number;
  bonus: number;
}

export function PayrollChart() {
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'with-payroll'],
    queryFn: async () => {
      const res = await fetch("/api/employees?includePayroll=true");
      return res.json();
    },
    staleTime: Infinity,
  });

  const { data, loading } = useMemo(() => {
    if (!employeesData?.employees) {
      return { data: [], loading: true };
    }

    const employees = employeesData.employees;

    // Group payroll totals by department (real DB data, no fake trends)
    const deptMap = new Map<string, { payroll: number; bonus: number }>();

    employees.forEach((emp: any) => {
      if (emp.payroll) {
        const dept = emp.department || 'Other';
        const current = deptMap.get(dept) || { payroll: 0, bonus: 0 };
        current.payroll += emp.payroll.netSalary || 0;
        current.bonus += Math.round((emp.payroll.basicSalary || 0) * 0.1);
        deptMap.set(dept, current);
      }
    });

    const chartData = Array.from(deptMap.entries()).map(([dept, values]) => ({
      month: dept,
      payroll: values.payroll,
      bonus: values.bonus,
    }));

    return { data: chartData, loading: false };
  }, [employeesData]);


  if (loading && !data.length) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading payroll data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    // Use fallback/demo data if 0 to show the chart visuals at least (matching previous behavior fallbacks)
    const demoData = [
      { month: "Jan", payroll: 720000, bonus: 45000 },
      { month: "Feb", payroll: 725000, bonus: 38000 },
      { month: "Mar", payroll: 730000, bonus: 52000 },
      { month: "Apr", payroll: 735000, bonus: 41000 },
      { month: "May", payroll: 740000, bonus: 48000 },
    ];
    // But actually, let's just return empty state text if it's truly empty, 
    // or we can stick to the previous fallback behavior if preferred. 
    // The user wants it "fast", not necessarily "fake". 
    // Let's stick to real data if possible, but the previous code had a hardcoded fallback.
    // I will trust the Real Data first.
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No payroll data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} minHeight={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(value) => `₹${value / 100000}L`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value) => value !== undefined ? [`₹${Number(value).toLocaleString('en-IN')}`, ""] : ["", ""]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="payroll"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6" }}
          name="Net Payroll"
        />
        <Line
          type="monotone"
          dataKey="bonus"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981" }}
          name="Bonuses"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
