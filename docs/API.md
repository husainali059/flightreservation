# Flight Reservation API

Base URL: `/api` (e.g. `http://localhost:5000/api`)

## Authentication

Most endpoints require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (body: email, password, firstName, lastName) |
| POST | `/auth/login` | Login (body: email, password) |
| POST | `/auth/logout` | Logout (requires auth) |
| POST | `/auth/refresh-token` | Refresh access token (body: refreshToken) |
| POST | `/auth/forgot-password` | Request password reset (body: email) |
| POST | `/auth/reset-password` | Reset password (body: token, password) |

### Airports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/airports/search?q=` | Autocomplete airports |

### Flights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flights/search` | Search flights (query: origin, destination, departureDate, returnDate?, tripType, adults, children, infants, cabinClass, page, pageSize, sortBy?, sortOrder?) |
| GET | `/flights/airlines` | List airlines |
| GET | `/flights/:id` | Flight details |
| GET | `/flights/:id/seats?date=` | Seat map for flight on date |

### Bookings (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create booking (body: flightIds, departureDates, cabinClass, passengers, contactEmail, contactPhone, promoCode?) |
| GET | `/bookings` | List user bookings (?status=) |
| GET | `/bookings/:pnr` | Booking by PNR |
| PUT | `/bookings/:pnr/modify` | Modify booking |
| DELETE | `/bookings/:pnr/cancel` | Cancel booking |
| POST | `/bookings/:pnr/checkin` | Web check-in |
| GET | `/bookings/:pnr/ticket` | E-ticket details |

### Payments (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-intent` | Create Stripe PaymentIntent (body: bookingId, amount) |
| POST | `/payments/confirm` | Confirm payment (body: paymentIntentId, bookingId) |
| POST | `/payments/refund` | Request refund (body: bookingId) |

### User (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | Get profile |
| PUT | `/user/profile` | Update profile (body: firstName?, lastName?, phone?, dateOfBirth?) |
| GET | `/user/travelers` | Saved travelers |
| POST | `/user/travelers` | Add saved traveler |
| GET | `/user/loyalty-points` | Loyalty points balance |
| GET | `/user/loyalty/transactions` | Loyalty points history (?limit=) |
| GET | `/user/notifications` | Notifications (?unread=true, ?limit=) |
| PATCH | `/user/notifications/:id/read` | Mark notification read |
| PATCH | `/user/notifications/read-all` | Mark all notifications read |
| GET | `/user/search-history` | Search history (?limit=) |
| POST | `/user/search-history` | Save search (body: origin, destination, departureDate, returnDate?, tripType, adults, children?, infants?, cabinClass) |
| DELETE | `/user/search-history/:id` | Delete one search |
| DELETE | `/user/search-history` | Clear all search history |
| GET | `/user/saved-routes` | Saved routes (wishlist) |
| POST | `/user/saved-routes` | Add saved route (body: origin, destination, priceAlert?, targetPrice?, cabinClass?) |
| DELETE | `/user/saved-routes/:id` | Remove saved route |

### Admin (auth required, role ADMIN or AGENT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/bookings` | All bookings (?status=, page, pageSize) |
| GET | `/admin/users` | All users (page, pageSize) |
| GET | `/admin/analytics` | Dashboard stats |
| POST | `/admin/flights` | Create flight (ADMIN only) |
| PUT | `/admin/flights/:id` | Update flight (ADMIN only) |
| DELETE | `/admin/flights/:id` | Delete flight (ADMIN only) |

## Response format

- Success: `{ success: true, data: ... }`
- Error: `{ success: false, error: "message" }`

## Status codes

- 200 OK
- 201 Created
- 400 Bad Request (validation)
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests (rate limit)
