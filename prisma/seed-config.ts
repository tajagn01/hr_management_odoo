import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking CompanyConfig...')

    // @ts-ignore
    const config = await prisma.companyConfig.findFirst()

    if (!config) {
        console.log('No config found. Creating default CompanyConfig...')
        // @ts-ignore
        await prisma.companyConfig.create({
            data: {
                officeStartTime: '09:00',
                officeEndTime: '18:00',
                gracePeriodMinutes: 15,
                workingDays: [1, 2, 3, 4, 5, 6],
                minimumHoursForFullDay: 8.0,
                minimumHoursForHalfDay: 4.0
            }
        })
        console.log('Default config created.')
    } else {
        console.log('CompanyConfig already exists.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
