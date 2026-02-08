import { prisma } from './prisma';
import { logger } from './logger';

export enum AuditAction {
    // User actions
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    USER_DELETED = 'USER_DELETED',
    PASSWORD_RESET = 'PASSWORD_RESET',

    // Employee actions
    EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
    EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
    EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',

    // Attendance actions
    ATTENDANCE_CHECKED_IN = 'ATTENDANCE_CHECKED_IN',
    ATTENDANCE_CHECKED_OUT = 'ATTENDANCE_CHECKED_OUT',
    ATTENDANCE_UPDATED = 'ATTENDANCE_UPDATED',
    ATTENDANCE_AUTO_MARKED = 'ATTENDANCE_AUTO_MARKED',

    // Leave actions
    LEAVE_REQUESTED = 'LEAVE_REQUESTED',
    LEAVE_APPROVED = 'LEAVE_APPROVED',
    LEAVE_REJECTED = 'LEAVE_REJECTED',
    LEAVE_CANCELLED = 'LEAVE_CANCELLED',

    // Payroll actions
    PAYROLL_CREATED = 'PAYROLL_CREATED',
    PAYROLL_UPDATED = 'PAYROLL_UPDATED',
    PAYROLL_DELETED = 'PAYROLL_DELETED',

    // System actions
    SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED',
    BULK_OPERATION = 'BULK_OPERATION',
    DATA_EXPORT = 'DATA_EXPORT',
    DATA_IMPORT = 'DATA_IMPORT',
}

interface AuditLogData {
    action: AuditAction;
    userId?: string;
    userEmail?: string;
    targetId?: string;
    targetType?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
    try {
        // Log to structured logger
        logger.info('Audit log', {
            action: data.action,
            userId: data.userId,
            userEmail: data.userEmail,
            targetId: data.targetId,
            targetType: data.targetType,
            ipAddress: data.ipAddress,
        });

        // Store in database (if AuditLog model exists)
        // await prisma.auditLog.create({
        //   data: {
        //     action: data.action,
        //     userId: data.userId,
        //     userEmail: data.userEmail,
        //     targetId: data.targetId,
        //     targetType: data.targetType,
        //     changes: data.changes,
        //     metadata: data.metadata,
        //     ipAddress: data.ipAddress,
        //     userAgent: data.userAgent,
        //   },
        // });
    } catch (error) {
        logger.error('Failed to create audit log', { error, data });
    }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) {
    try {
        // This would query the AuditLog table
        // For now, return empty array
        logger.info('Audit logs requested', filters);
        return [];

        // When AuditLog model is added:
        // return await prisma.auditLog.findMany({
        //   where: {
        //     userId: filters.userId,
        //     action: filters.action,
        //     createdAt: {
        //       gte: filters.startDate,
        //       lte: filters.endDate,
        //     },
        //   },
        //   take: filters.limit || 100,
        //   skip: filters.offset || 0,
        //   orderBy: { createdAt: 'desc' },
        // });
    } catch (error) {
        logger.error('Failed to get audit logs', { error, filters });
        return [];
    }
}

/**
 * Helper to extract IP address from request
 */
export function getClientIP(request: Request): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    return realIP || undefined;
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
    return request.headers.get('user-agent') || undefined;
}

/**
 * Audit log middleware wrapper
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
    action: AuditAction,
    handler: T
): T {
    return (async (...args: any[]) => {
        const startTime = Date.now();

        try {
            const result = await handler(...args);

            const duration = Date.now() - startTime;
            logger.info('Action completed', { action, duration });

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Action failed', { action, duration, error });
            throw error;
        }
    }) as T;
}
