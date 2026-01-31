import type { SearchFlightsInput } from '../validators/flights.js';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../utils/prisma.js';

export async function searchFlights(params: SearchFlightsInput) {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    tripType,
    adults,
    children,
    infants,
    cabinClass,
    page,
    pageSize,
    sortBy = 'price',
    sortOrder = 'asc',
  } = params;

  // Use UTC noon so date comparison works across timezones
  const depDate = new Date(departureDate + 'T12:00:00.000Z');
  const dayOfWeek = depDate.getUTCDay(); // 0 = Sunday
  const dayStr = String(dayOfWeek);
  const dateOnly = new Date(departureDate + 'T00:00:00.000Z');

  const flights = await prisma.flight.findMany({
    where: {
      originId: origin.toUpperCase(),
      destinationId: destination.toUpperCase(),
      daysOfOperation: { contains: dayStr },
    },
    include: {
      airline: true,
      origin: true,
      destination: true,
      aircraft: true,
      flightInventory: {
        where: { date: dateOnly },
        take: 1,
      },
      pricingRules: {
        where: { cabinClass: cabinClass as any },
        take: 1,
      },
    },
  });

  const totalPassengers = adults + children + infants;
  const results: any[] = [];

  for (const f of flights) {
    const inv = f.flightInventory[0];
    const pricing = f.pricingRules[0];
    if (!inv || !pricing) continue;

    const available =
      cabinClass === 'ECONOMY'
        ? inv.availableEconomy
        : cabinClass === 'BUSINESS'
        ? inv.availableBusiness
        : inv.availableFirstClass;
    if (available < totalPassengers) continue;

    const baseFare = Number(pricing.baseFare) * Number(pricing.dynamicMultiplier);
    const taxes = Number(pricing.taxes);
    const pricePerPax = baseFare + taxes;
    const totalPrice = pricePerPax * totalPassengers;

    results.push({
      id: f.id,
      segments: [
        {
          id: f.id,
          flightNumber: `${f.airline.code}${f.flightNumber}`,
          airline: {
            id: f.airline.id,
            name: f.airline.name,
            code: f.airline.code,
            logoUrl: f.airline.logoUrl,
          },
          origin: f.origin,
          destination: f.destination,
          departureTime: f.departureTime,
          arrivalTime: f.arrivalTime,
          duration: f.durationMinutes,
          cabinClass,
          availableSeats: available,
          price: totalPrice,
          stops: 0,
        },
      ],
      totalDuration: f.durationMinutes,
      totalPrice,
      departureDate,
    });
  }

  if (sortBy === 'price') {
    results.sort((a, b) => (sortOrder === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice));
  } else if (sortBy === 'duration') {
    results.sort((a, b) => (sortOrder === 'asc' ? a.totalDuration - b.totalDuration : b.totalDuration - a.totalDuration));
  } else if (sortBy === 'departure') {
    results.sort((a, b) => {
      const segA = a.segments[0];
      const segB = b.segments[0];
      const cmp = segA.departureTime.localeCompare(segB.departureTime);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const items = results.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
