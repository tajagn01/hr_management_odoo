"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Search,
    Mail,
    Phone,
    Briefcase,
    Building2,
    Calendar,
    Loader2,
    RefreshCw
} from "lucide-react";

interface TeamMember {
    id: string;
    fullName: string;
    employeeCode: string;
    department: string;
    designation: string;
    phone: string | null;
    joiningDate: string;
    user: {
        email: string;
    };
}

export default function TeamPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTeamMembers = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/employees");
            const data = await res.json();
            setTeamMembers(data.employees || []);
            setFilteredMembers(data.employees || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching team members:", error);
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredMembers(teamMembers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = teamMembers.filter(
                (member) =>
                    member.fullName.toLowerCase().includes(query) ||
                    member.employeeCode.toLowerCase().includes(query) ||
                    member.department.toLowerCase().includes(query) ||
                    member.designation.toLowerCase().includes(query)
            );
            setFilteredMembers(filtered);
        }
    }, [searchQuery, teamMembers]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
                    <p className="text-muted-foreground">
                        Manage and view your team members ({teamMembers.length} total)
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTeamMembers} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, code, department, or designation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Team Members Grid */}
            {filteredMembers.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No team members found</p>
                            <p className="text-sm">
                                {searchQuery ? "Try adjusting your search" : "No employees assigned to you yet"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map((member) => (
                        <Card key={member.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="text-sm font-semibold">
                                            {member.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{member.fullName}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs">
                                                {member.employeeCode}
                                            </Badge>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{member.designation}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{member.department}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{member.user.email}</span>
                                </div>
                                {member.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span>{member.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs">
                                        Joined {new Date(member.joiningDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
