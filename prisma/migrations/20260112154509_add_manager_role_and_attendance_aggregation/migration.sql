-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "workingHours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "managerId" TEXT;

-- CreateTable
CREATE TABLE "MonthlyAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "halfDays" INTEGER NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "totalWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayWiseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearlyAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "halfDays" INTEGER NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "totalWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgAttendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthWiseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearlyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyAttendance_employeeId_idx" ON "MonthlyAttendance"("employeeId");

-- CreateIndex
CREATE INDEX "MonthlyAttendance_year_month_idx" ON "MonthlyAttendance"("year", "month");

-- CreateIndex
CREATE INDEX "MonthlyAttendance_employeeId_year_month_idx" ON "MonthlyAttendance"("employeeId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAttendance_employeeId_year_month_key" ON "MonthlyAttendance"("employeeId", "year", "month");

-- CreateIndex
CREATE INDEX "YearlyAttendance_employeeId_idx" ON "YearlyAttendance"("employeeId");

-- CreateIndex
CREATE INDEX "YearlyAttendance_year_idx" ON "YearlyAttendance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "YearlyAttendance_employeeId_year_key" ON "YearlyAttendance"("employeeId", "year");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAttendance" ADD CONSTRAINT "MonthlyAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearlyAttendance" ADD CONSTRAINT "YearlyAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
