"use client";

import { useState, useEffect } from "react";
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
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();

      if (data.employees) {
        // Fetch payroll for each employee to get salary
        const employeesWithSalary = await Promise.all(
          data.employees.map(async (emp: any) => {
            let salary = 0;
            try {
              const payrollRes = await fetch(`/api/payroll?employeeId=${emp.id}`);
              const payrollData = await payrollRes.json();
              if (payrollData.payroll) {
                salary = payrollData.payroll.netSalary || 0;
              }
            } catch (error) {
              console.error(`Error fetching payroll for ${emp.id}:`, error);
            }

            return {
              id: emp.id,
              fullName: emp.fullName,
              employeeCode: emp.employeeCode,
              email: emp.user?.email || "",
              phone: emp.phone,
              department: emp.department,
              designation: emp.designation,
              status: emp.user?.isActive ? "active" : "inactive",
              joinDate: new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              salary,
              role: emp.user?.role || "EMPLOYEE",
            };
          })
        );

        // Filter out managers and admins - only show regular employees
        const regularEmployees = employeesWithSalary.filter(emp => emp.role === "EMPLOYEE");
        setEmployees(regularEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Calculate stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === "active").length;
  const departments = [...new Set(employees.map(e => e.department))];
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  // Filter data
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleRefresh = () => {
    fetchEmployees();
  };

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
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
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
                        {departments.map(dept => (
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
            <div className="text-3xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Across organization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Salary</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(Math.round(totalPayroll / totalEmployees))}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payroll</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPayroll)}</div>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Table */}
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {filteredEmployees.map((employee) => (
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
                        <Badge className={employee.status === "active" ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}>
                          {employee.status === "active" ? "Active" : "Inactive"}
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
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found matching your filters
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {totalEmployees} employees
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
