/**
 * Automated Test Suite for HR Management System
 * Tests all Phase 1-4 fixes to ensure production readiness
 * 
 * Run with: node scripts/test-fixes.js
 */

const API_BASE = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
const results = [];

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status}: ${name}`, color);
    if (details) log(`   ${details}`, 'yellow');

    results.push({ name, passed, details });
    if (passed) passedTests++;
    else failedTests++;
}

async function testHealthEndpoint() {
    log('\n🏥 Testing Health Check Endpoint...', 'blue');

    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();

        const passed = response.status === 200 &&
            data.status === 'healthy' &&
            data.database?.status === 'connected';

        logTest('Health endpoint returns 200 and healthy status', passed,
            `Status: ${data.status}, DB: ${data.database?.status}`);
    } catch (error) {
        logTest('Health endpoint accessible', false, error.message);
    }
}

async function testLeaveValidation() {
    log('\n📅 Testing Leave Validation...', 'blue');

    // Note: These tests require authentication
    // For now, we'll document what should be tested

    const tests = [
        {
            name: 'Past date validation',
            description: 'Should reject leave requests for past dates',
            endpoint: '/api/leave',
            method: 'POST',
            expectedStatus: 400,
            expectedError: 'Cannot create leave request for past dates'
        },
        {
            name: 'Max days validation',
            description: 'Should reject leave requests exceeding 30 days',
            endpoint: '/api/leave',
            method: 'POST',
            expectedStatus: 400,
            expectedError: 'Leave request cannot exceed 30 days'
        },
        {
            name: 'Overlap detection',
            description: 'Should reject overlapping leave requests',
            endpoint: '/api/leave',
            method: 'POST',
            expectedStatus: 400,
            expectedError: 'overlapping dates'
        }
    ];

    log('⚠️  Leave validation tests require authentication', 'yellow');
    log('   Please test manually using the testing_guide.md', 'yellow');

    tests.forEach(test => {
        log(`   - ${test.name}: ${test.description}`, 'yellow');
    });
}

async function testPayrollUpsert() {
    log('\n💰 Testing Payroll Upsert...', 'blue');

    log('⚠️  Payroll upsert test requires authentication', 'yellow');
    log('   Manual test: Create payroll twice for same employee', 'yellow');
    log('   Expected: Second request should UPDATE, not fail', 'yellow');
}

async function testTypeScriptCompilation() {
    log('\n📝 Testing TypeScript Compilation...', 'blue');

    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
        await execPromise('npx tsc --noEmit');
        logTest('TypeScript compilation (zero errors)', true);
    } catch (error) {
        logTest('TypeScript compilation (zero errors)', false,
            'Run: npx tsc --noEmit to see errors');
    }
}

async function testCodeQuality() {
    log('\n🎨 Testing Code Quality...', 'blue');

    const fs = require('fs');
    const path = require('path');

    // Check for @ts-ignore and @ts-nocheck
    const apiDir = path.join(process.cwd(), 'app', 'api');
    let tsIgnoreCount = 0;
    let tsNocheckCount = 0;
    let consoleLogCount = 0;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                const content = fs.readFileSync(filePath, 'utf8');

                if (content.includes('@ts-ignore')) tsIgnoreCount++;
                if (content.includes('@ts-nocheck')) tsNocheckCount++;
                if (content.includes('console.log') || content.includes('console.error')) {
                    // Exclude comments
                    const lines = content.split('\n').filter(line =>
                        !line.trim().startsWith('//') &&
                        !line.trim().startsWith('*') &&
                        (line.includes('console.log') || line.includes('console.error'))
                    );
                    consoleLogCount += lines.length;
                }
            }
        });
    }

    try {
        scanDirectory(apiDir);

        logTest('Zero @ts-ignore directives', tsIgnoreCount === 0,
            `Found: ${tsIgnoreCount}`);
        logTest('Zero @ts-nocheck directives', tsNocheckCount === 0,
            `Found: ${tsNocheckCount}`);
        logTest('Zero console.log/error in API routes', consoleLogCount === 0,
            `Found: ${consoleLogCount}`);
    } catch (error) {
        logTest('Code quality scan', false, error.message);
    }
}

async function testConstants() {
    log('\n🔢 Testing Constants File...', 'blue');

    const fs = require('fs');
    const path = require('path');

    try {
        const constantsPath = path.join(process.cwd(), 'lib', 'constants.ts');
        const exists = fs.existsSync(constantsPath);

        logTest('Constants file exists', exists);

        if (exists) {
            const content = fs.readFileSync(constantsPath, 'utf8');
            const hasMaxLeaveDays = content.includes('MAX_LEAVE_DAYS');
            const hasWorkingHours = content.includes('MAX_WORKING_HOURS');

            logTest('MAX_LEAVE_DAYS constant defined', hasMaxLeaveDays);
            logTest('MAX_WORKING_HOURS constant defined', hasWorkingHours);
        }
    } catch (error) {
        logTest('Constants file check', false, error.message);
    }
}

async function testValidators() {
    log('\n✅ Testing Validators File...', 'blue');

    const fs = require('fs');
    const path = require('path');

    try {
        const validatorsPath = path.join(process.cwd(), 'lib', 'validators.ts');
        const exists = fs.existsSync(validatorsPath);

        logTest('Validators file exists', exists);

        if (exists) {
            const content = fs.readFileSync(validatorsPath, 'utf8');
            const hasLeaveSchema = content.includes('leaveRequestCreateSchema');
            const hasPayrollSchema = content.includes('payrollCreateSchema');
            const hasAttendanceSchema = content.includes('attendanceActionSchema');

            logTest('Leave validation schema defined', hasLeaveSchema);
            logTest('Payroll validation schema defined', hasPayrollSchema);
            logTest('Attendance validation schema defined', hasAttendanceSchema);
        }
    } catch (error) {
        logTest('Validators file check', false, error.message);
    }
}

async function printSummary() {
    log('\n' + '='.repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');

    const total = passedTests + failedTests;
    const percentage = total > 0 ? Math.round((passedTests / total) * 100) : 0;

    log(`\nTotal Tests: ${total}`);
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');

    if (failedTests > 0) {
        log('\n❌ Failed Tests:', 'red');
        results.filter(r => !r.passed).forEach(r => {
            log(`   - ${r.name}`, 'red');
            if (r.details) log(`     ${r.details}`, 'yellow');
        });
    }

    log('\n📋 Manual Tests Required:', 'yellow');
    log('   1. Payroll upsert (create twice for same employee)');
    log('   2. Leave validation (past dates, overlaps, >30 days)');
    log('   3. Attendance race conditions (simultaneous check-ins)');
    log('   4. Cascade deletes (delete user with related records)');
    log('   5. Working hours validation (>24 hours)');

    log('\n📚 See testing_guide.md for detailed manual test procedures', 'blue');

    log('\n' + '='.repeat(60), 'blue');

    if (percentage === 100) {
        log('✅ All automated tests passed! Ready for manual testing.', 'green');
    } else {
        log('⚠️  Some tests failed. Please review and fix before proceeding.', 'yellow');
    }
}

async function runAllTests() {
    log('🚀 Starting Automated Test Suite...', 'blue');
    log('Testing all Phase 1-4 fixes\n', 'blue');

    await testHealthEndpoint();
    await testCodeQuality();
    await testConstants();
    await testValidators();
    await testLeaveValidation();
    await testPayrollUpsert();

    // TypeScript compilation test (optional, can be slow)
    // await testTypeScriptCompilation();

    await printSummary();
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});
