import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flight.com' },
    update: {},
    create: {
      email: 'admin@flight.com',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: { firstName: 'Admin', lastName: 'User' },
      },
    },
    include: { profile: true },
  });
  console.log('Admin user:', admin.email);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@flight.com' },
    update: {},
    create: {
      email: 'customer@flight.com',
      passwordHash,
      role: 'CUSTOMER',
      emailVerified: true,
      profile: {
        create: { firstName: 'John', lastName: 'Customer' },
      },
    },
    include: { profile: true },
  });
  console.log('Customer user: customer@flight.com');

  await prisma.userNotification.upsert({
    where: { id: 'notif-welcome-1' },
    update: {},
    create: {
      id: 'notif-welcome-1',
      userId: customer.id,
      title: 'Welcome to FlightReserve',
      message: 'Your account is ready. Search flights and manage your bookings from your dashboard.',
      type: 'PROMO',
      read: false,
    },
  });
  console.log('Sample notification for customer created');

  const airports = [
    { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
    { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
    { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' },
    { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
    { code: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
    { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
    { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', timezone: 'Europe/London' },
    { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', timezone: 'America/New_York' },
  ];

  for (const a of airports) {
    await prisma.airport.upsert({
      where: { code: a.code },
      update: a,
      create: a,
    });
  }
  console.log('Airports seeded:', airports.length);

  const airlines = [
    { name: 'Air India', code: 'AI' },
    { name: 'IndiGo', code: '6E' },
    { name: 'SpiceJet', code: 'SG' },
    { name: 'Emirates', code: 'EK' },
    { name: 'British Airways', code: 'BA' },
  ];

  const airlineIds: string[] = [];
  for (const a of airlines) {
    const rec = await prisma.airline.upsert({
      where: { code: a.code },
      update: { name: a.name },
      create: a,
    });
    airlineIds.push(rec.id);
  }
  console.log('Airlines seeded:', airlines.length);

  const aircraft = await prisma.aircraft.upsert({
    where: { id: 'aircraft-default-1' },
    update: {},
    create: {
      id: 'aircraft-default-1',
      model: 'Boeing 737-800',
      manufacturer: 'Boeing',
      totalSeats: 180,
      economySeats: 162,
      businessSeats: 18,
      firstClassSeats: 0,
    },
  });

  const flightData = [
    { origin: 'DEL', destination: 'BOM', number: '101', duration: 145 },
    { origin: 'DEL', destination: 'BLR', number: '102', duration: 175 },
    { origin: 'BOM', destination: 'DEL', number: '201', duration: 145 },
    { origin: 'BOM', destination: 'DXB', number: '301', duration: 210 },
    { origin: 'DEL', destination: 'DXB', number: '401', duration: 240 },
    { origin: 'BLR', destination: 'MAA', number: '501', duration: 60 },
  ];

  for (const f of flightData) {
    const airlineId = airlineIds[f.number.length % airlineIds.length];
    const existing = await prisma.flight.findFirst({
      where: { originId: f.origin, destinationId: f.destination, flightNumber: f.number },
    });
    const flight = existing ?? (await prisma.flight.create({
      data: {
        airlineId,
        flightNumber: f.number,
        originId: f.origin,
        destinationId: f.destination,
        aircraftId: aircraft.id,
        departureTime: '08:00',
        arrivalTime: '10:30',
        durationMinutes: f.duration,
        daysOfOperation: '0,1,2,3,4,5,6',
      },
    }));

    for (const cabin of ['ECONOMY', 'BUSINESS'] as const) {
      await prisma.pricingRule.upsert({
        where: {
          flightId_cabinClass: { flightId: flight.id, cabinClass: cabin },
        },
        update: {},
        create: {
          flightId: flight.id,
          cabinClass: cabin,
          baseFare: cabin === 'ECONOMY' ? 80 : 350,
          taxes: 25,
          dynamicMultiplier: 1,
        },
      });
    }

    if (existing) continue;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    for (let d = 0; d < 90; d++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + d);
      await prisma.flightInventory.upsert({
        where: {
          flightId_date: { flightId: flight.id, date },
        },
        update: {},
        create: {
          flightId: flight.id,
          date,
          availableEconomy: 162,
          availableBusiness: 18,
          availableFirstClass: 0,
        },
      });
    }
  }
  console.log('Flights and inventory seeded');

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validFrom: new Date(0),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      minBookingAmount: 100,
    },
  });
  console.log('Promo code WELCOME10 created');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
