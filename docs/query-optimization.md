# Query Optimization Guide

## Overview
This document outlines query optimization strategies implemented in the HR Management System.

## Implemented Optimizations

### 1. Database Indexes
**File**: `prisma/migrations/add_performance_indexes.sql`

Indexes added for:
- Employee lookups by department, designation, manager
- Attendance queries by employee and date
- Leave requests by employee and status
- Payroll by employee
- User lookups by email and role

### 2. Caching Strategy
**File**: `lib/cache.ts`

In-memory caching with TTL for:
- Employee data (5 min TTL)
- Attendance records (5 min TTL)
- Dashboard data (2 min TTL)
- Monthly attendance (10 min TTL)

### 3. Query Patterns

#### Optimized Employee Queries
```typescript
// BAD: N+1 query problem
const employees = await prisma.employee.findMany();
for (const emp of employees) {
  const payroll = await prisma.payroll.findUnique({ where: { employeeId: emp.id } });
}

// GOOD: Use include to fetch related data
const employees = await prisma.employee.findMany({
  include: {
    payroll: true,
    manager: { select: { fullName: true } }
  }
});
```

#### Optimized Attendance Queries
```typescript
// BAD: Fetching all fields
const attendance = await prisma.attendance.findMany({
  where: { employeeId }
});

// GOOD: Select only needed fields
const attendance = await prisma.attendance.findMany({
  where: { employeeId },
  select: {
    id: true,
    date: true,
    status: true,
    workingHours: true
  }
});
```

### 4. Pagination
Always use pagination for large datasets:

```typescript
const PAGE_SIZE = 50;

const employees = await prisma.employee.findMany({
  take: PAGE_SIZE,
  skip: page * PAGE_SIZE,
  orderBy: { createdAt: 'desc' }
});
```

### 5. Batch Operations
Use `createMany` and `updateMany` for bulk operations:

```typescript
// BAD: Multiple individual inserts
for (const emp of employees) {
  await prisma.employee.create({ data: emp });
}

// GOOD: Single batch insert
await prisma.employee.createMany({
  data: employees,
  skipDuplicates: true
});
```

## Performance Monitoring

### Slow Query Detection
Monitor queries taking >100ms:

```typescript
// In lib/prisma.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  const duration = after - before;
  if (duration > 100) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration
    });
  }
  
  return result;
});
```

### Cache Hit Rate
Monitor cache effectiveness:

```typescript
const stats = cache.stats();
logger.info('Cache stats', stats);
```

## Recommendations

### Short-term
1. ✅ Add database indexes (DONE)
2. ✅ Implement caching (DONE)
3. Monitor slow queries
4. Add query result pagination

### Long-term
1. Implement Redis for distributed caching
2. Add database connection pooling
3. Consider read replicas for heavy read workloads
4. Implement query result streaming for large datasets

## Query Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Employee list | <50ms | TBD |
| Attendance check-in | <100ms | TBD |
| Dashboard load | <200ms | TBD |
| Leave approval | <100ms | TBD |
| Payroll calculation | <500ms | TBD |

## Testing

Run performance tests:
```bash
# Test query performance
npm run test:performance

# Analyze slow queries
npm run analyze:queries
```
