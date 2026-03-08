const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const stations = [
    { name: 'MIT-ADT Main Gate', latitude: 18.4901, longitude: 74.0264 },
    { name: 'Food Tech/Mandir', latitude: 18.4925, longitude: 74.0270 },
    { name: 'IT Building', latitude: 18.4930, longitude: 74.0250 },
    { name: 'IOD/Bioengineering', latitude: 18.4915, longitude: 74.0280 },
    { name: 'Raj Mess', latitude: 18.4940, longitude: 74.0260 },
    { name: 'Sport Complex', latitude: 18.4880, longitude: 74.0290 },
  ]

  for (const s of stations) {
    const station = await prisma.station.upsert({
      where: { name: s.name },
      update: {},
      create: {
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
      },
    })
    console.log(`Upserted station: ${station.name}`)

    // Create 3 available bikes per station for demo purposes
    const existingBikes = await prisma.bike.count({
      where: { stationId: station.id }
    })
    
    if (existingBikes === 0) {
      await prisma.bike.createMany({
        data: Array.from({ length: 3 }).map(() => ({
          stationId: station.id,
          status: 'AVAILABLE',
          battery: Math.floor(Math.random() * (100 - 60 + 1) + 60) // 60-100%
        }))
      })
      console.log(`Created bikes for ${station.name}`)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
