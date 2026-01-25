"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Calendar,
  Search,
  RefreshCw,
  Download,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface Employee {
  id: string;
  fullName: string;
  employeeCode: string;
  email?: string;
  phone: string | null;
  department: string;
  designation: string;
  status: string;
  joinDate: string;
  salary: number;
  role?: string;
  user?: {
    email: string;
    isActive: boolean;
    role?: string;
  };
}

export default function AdminEmployeesPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: data = { employees: [] }, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['employees', 'with-payroll'],
    queryFn: async () => {
      const res = await fetch("/api/employees?includePayroll=true");
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  // Extract employees from the response object
  const rawEmployees = data.employees || [];

  // Map to the Employee interface expected by the component
  const employees: Employee[] = useMemo(() => {
    return rawEmployees.map((emp: any) => ({
      id: emp.id,
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      email: emp.user?.email || "",
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      status: !emp.user?.isActive ? "inactive" : (!emp.profileCompleted ? "onboarding" : "active"),
      joinDate: new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      salary: emp.payroll?.netSalary || 0,
      role: emp.user?.role || "EMPLOYEE",
    })).filter((emp: any) => emp.role === "EMPLOYEE");
  }, [rawEmployees]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    await Promise.all([
      refetch(),
      minDelay
    ]);
    setIsRefreshing(false);
  };

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === "active").length;
    const departments = [...new Set(employees.map(e => e.department))];
    const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
    return { totalEmployees, activeEmployees, departments, totalPayroll };
  }, [employees]);


  // Filter data using useMemo
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage your organization&apos;s workforce</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isFetching || isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh} disabled={isFetching || isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`} />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Enter the details of the new employee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter full name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {stats.departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" placeholder="Enter role" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">Salary (₹)</Label>
                  <Input id="salary" type="number" placeholder="Enter salary" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Add Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{stats.activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.departments.length}</div>
            <p className="text-xs text-muted-foreground">Across organization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Salary</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEmployees > 0 ? formatCurrency(Math.round(stats.totalPayroll / stats.totalEmployees)) : formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payroll</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">Total cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>A list of all employees in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
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
                {stats.departments.map(dept => (
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee List Views */}

          {/* Mobile Card View - Premium Redesign */}
          <div className="md:hidden space-y-4">
            {isLoading && employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/30">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No employees found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee.id} className="bg-card rounded-xl border shadow-sm overflow-hidden relative">
                  {/* Status Indicator Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${employee.status === "active" ? "bg-green-500" : "bg-gray-300"}`} />

                  <div className="p-4 pl-5">
                    {/* Header: Avatar & Main Info */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                              {employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${employee.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base leading-tight">{employee.fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{employee.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 border-0">
                              {employee.designation}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3 mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Department</span>
                        <div className="font-medium flex items-center gap-1.5 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          {employee.department}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Joined</span>
                        <div className="font-medium flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-purple-500" />
                          {employee.joinDate}
                        </div>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Salary</span>
                        <span className="font-bold font-mono text-green-600 dark:text-green-500">{formatCurrency(employee.salary)}</span>
                      </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs border-dashed" asChild>
                        <a href={`mailto:${employee.email}`}>
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Email
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs border-dashed" asChild>
                        <a href={`tel:${employee.phone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Call
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-background">
            <div className="overflow-x-auto w-full">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Salary</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                          Loading employees...
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{employee.fullName}</p>
                              {employee.role === "MANAGER" && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                  Manager
                                </Badge>
                              )}
                              {employee.role === "ADMIN" && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Joined {employee.joinDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{employee.department}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{employee.designation}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatCurrency(employee.salary)}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          employee.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : employee.status === "onboarding"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-gray-500 hover:bg-gray-600"
                        }>
                          {employee.status === "active" ? "Active" : employee.status === "onboarding" ? "Onboarding" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isLoading && employees.length > 0 && filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found matching your filters
              </div>
            )}
            {!isLoading && employees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found in the system.
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {stats.totalEmployees} employees
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
