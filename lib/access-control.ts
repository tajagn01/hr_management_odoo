// @ts-nocheck
/**
 * Role-Based Access Control Utilities
 * Centralized functions for authorization and team filtering
 */

import { prisma } from "@/lib/prisma";

export interface UserWithEmployee {
    id: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    employee: {
        id: string;
        fullName: string;
        managerId: string | null;
    } | null;
}

/**
 * Get authorized employee IDs based on user role
 * 
 * @param user - User with employee profile
 * @param requestedEmployeeId - Optional specific employee ID to check access for
 * @returns Array of employee IDs the user can access
 * @throws Error if unauthorized
 */
export async function getAuthorizedEmployeeIds(
    user: UserWithEmployee,
    requestedEmployeeId?: string
): Promise<string[]> {
    if (user.role === "ADMIN") {
        // Admins can access all employees
        if (requestedEmployeeId) {
            return [requestedEmployeeId];
        }

        const allEmployees = await prisma.employee.findMany({
            select: { id: true },
        });
        return allEmployees.map((e) => e.id);
    }

    if (user.role === "MANAGER" && user.employee) {
        // Managers can access their team only
        // @ts-ignore
        const teamEmployees = await prisma.employee.findMany({
            where: { managerId: user.employee.id },
            select: { id: true },
        });
        const teamIds = teamEmployees.map((e) => e.id);

        // Also include the manager themselves
        const allAccessibleIds = [...teamIds, user.employee.id];

        if (requestedEmployeeId) {
            // Check if requested employee is in manager's team
            if (!allAccessibleIds.includes(requestedEmployeeId)) {
                throw new Error("Unauthorized: Employee not in your team");
            }
            return [requestedEmployeeId];
        }

        return allAccessibleIds;
    }

    if (user.role === "EMPLOYEE" && user.employee) {
        // Employees can only access themselves
        if (requestedEmployeeId && requestedEmployeeId !== user.employee.id) {
            throw new Error("Unauthorized: Can only access own data");
        }
        return [user.employee.id];
    }

    throw new Error("No employee profile found");
}

/**
 * Check if user can approve leave requests
 * Admins can approve all, Managers can approve their team's requests
 */
export async function canApproveLeave(
    user: UserWithEmployee,
    leaveRequestId: string
): Promise<boolean> {
    if (user.role === "ADMIN") {
        return true;
    }

    if (user.role === "MANAGER" && user.employee) {
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: { employee: true },
        });

        if (!leaveRequest) {
            return false;
        }

        // Check if the leave request is from a team member
        // @ts-ignore
        return leaveRequest.employee.managerId === user.employee.id;
    }

    return false;
}

/**
 * Get team members for a manager
 */
export async function getTeamMembers(managerId: string) {
    return await prisma.employee.findMany({
        // @ts-ignore
        where: { managerId },
        include: {
            user: {
                select: {
                    email: true,
                    isActive: true,
                },
            },
        },
        orderBy: {
            fullName: "asc",
        },
    });
}

/**
 * Build Prisma where clause for employee filtering based on role
 */
export function buildEmployeeWhereClause(
    user: UserWithEmployee,
    requestedEmployeeId?: string
): any {
    if (user.role === "ADMIN") {
        return requestedEmployeeId ? { id: requestedEmployeeId } : {};
    }

    if (user.role === "MANAGER" && user.employee) {
        if (requestedEmployeeId) {
            // Manager can see themselves
            if (requestedEmployeeId === user.employee.id) {
                return { id: requestedEmployeeId };
            }
            // Manager can see their team
            return {
                id: requestedEmployeeId,
                // @ts-ignore
                managerId: user.employee.id
            };
        }
        return {
            OR: [
                // @ts-ignore
                { managerId: user.employee.id },
                { id: user.employee.id },
            ],
        };
    }

    if (user.role === "EMPLOYEE" && user.employee) {
        return { id: user.employee.id };
    }

    return { id: "invalid" }; // No results
}
