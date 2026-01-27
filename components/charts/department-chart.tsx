"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface DepartmentData {
  department: string;
  employees: number;
  color: string;
}

const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"];

export function DepartmentChart() {
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'with-payroll'],
    queryFn: async () => {
      const res = await fetch("/api/employees?includePayroll=true");
      return res.json();
    },
    staleTime: Infinity,
    placeholderData: keepPreviousData
  });

  const data = useMemo(() => {
    if (!employeesData?.employees) return [];

    const employees = employeesData.employees;

    // Group employees by department
    const departmentMap = new Map<string, number>();
    employees.forEach((emp: any) => {
      const dept = emp.department || "Other";
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
    });

    // Convert to chart data format
    return Array.from(departmentMap.entries())
      .map(([department, count], index) => ({
        department,
        employees: count,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.employees - a.employees); // Sort by employee count
  }, [employeesData]);

  if (!employeesData || !employeesData.employees) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading department data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No department data available</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300} minHeight={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" allowDecimals={false} />
        <YAxis dataKey="department" type="category" width={80} className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="employees" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
