# Customer Panel

The customer panel is the main interface for logged-in customers (role `CUSTOMER`). Access it at **/dashboard** after logging in.

## Login

- **Email:** customer@flight.com  
- **Password:** Admin123!

After login, customers are redirected to **/dashboard**.

## Features Implemented

### 1. Customer Dashboard (/dashboard)
- **Welcome message** with user's first name
- **Quick search** – mini flight search form
- **Upcoming trips** – next 3 upcoming bookings with flight details, countdown to departure, and quick actions (View details, Web check-in)
- **Recent searches** – last 5 searches with one-click re-search
- **Loyalty points** – balance card with link to full history
- **Quick links** – My Bookings, My Profile, Saved Routes, Support
- **Saved routes** – section when the user has saved routes

### 2. Flight Search & Booking
- **Search** (/search) – existing search with:
  - Search history saved automatically when the user is logged in
  - **Save route** button on each result (adds to wishlist)
- **Checkout** (/checkout) – existing multi-step flow (passenger details → payment)
- **Bookings** – under /dashboard/bookings with filters (All, Confirmed, Pending, Cancelled, Checked-in)

### 3. My Bookings (/dashboard/bookings)
- List with status filters
- Each card: PNR, status, route, airline, date/time, passengers, amount
- Link to booking detail

### 4. Booking Detail (/dashboard/bookings/:pnr)
- Full itinerary, passengers, total amount
- Web check-in (when status is Confirmed)
- Cancel booking

### 5. My Profile (/dashboard/profile)
- First name, last name, phone (existing profile form)

### 6. Loyalty & Rewards (/dashboard/loyalty)
- Points balance, total earned, total redeemed
- How to earn points
- Points history table

### 7. Saved Routes / Wishlist (/dashboard/wishlist)
- List of saved routes (origin → destination)
- Quick **Search** button to open search with pre-filled route
- **Remove** from wishlist

### 8. Search History (/dashboard/search-history)
- Last 20 searches
- **Search again** – one-click re-search
- **Clear all** – delete all history
- Delete single entry

### 9. Notifications (/dashboard/notifications)
- List of all notifications with read/unread state
- **Mark as read** per notification
- **Mark all as read**
- Notification bell in header with unread count and dropdown (recent 5, “View all” link)

### 10. Help & Support (/dashboard/help)
- Searchable FAQ (Booking & Payments, Cancellations & Refunds, Web Check-in)
- Accordion answers
- Contact: Email, Phone, Live chat

### 11. Settings (/dashboard/settings)
- Tabs: Account, Notifications, Preferences
- Account: email, change password note
- Notifications and Preferences placeholders for future options

## Layout & Navigation

- **Customer layout** – sidebar with:
  - Overview: Dashboard, Search Flights
  - Bookings: My Bookings
  - Account: My Profile, Loyalty & Rewards, Saved Routes, Search History
  - Support: Notifications, Help & Support, Settings
- **Header** – breadcrumbs, “Search Flights” button, notification bell (with badge), user name, Logout
- **Collapsible sidebar** – collapse/expand on desktop; overlay on mobile with menu button

## API (User Routes)

All under `/api/user` (auth required):

- `GET /notifications` – list + unreadCount
- `PATCH /notifications/:id/read` – mark one read
- `PATCH /notifications/read-all` – mark all read
- `GET /search-history`, `POST /search-history`, `DELETE /search-history/:id`, `DELETE /search-history`
- `GET /saved-routes`, `POST /saved-routes`, `DELETE /saved-routes/:id`
- `GET /loyalty/transactions` – points history

See **docs/API.md** for full request/response details.

## Database

New models (already applied via `prisma db push`):

- **SearchHistory** – userId, origin, destination, dates, tripType, adults, children, infants, cabinClass
- **SavedRoute** – userId, origin, destination, priceAlert, targetPrice, cabinClass
- **LoyaltyTransaction** – userId, type, points, balanceAfter, description, bookingId
- **UserNotification** – optional `metadata` field added

Seed creates a sample notification for the customer user.

## Routing Summary

| Path | Access | Layout |
|------|--------|--------|
| / | Public | Main |
| /search | Public | Main |
| /login, /register | Public | Main |
| /dashboard/* | Customer only | Customer (sidebar) |
| /bookings, /bookings/:pnr | Logged-in | Main (header links for customers go to /dashboard/bookings) |
| /checkout | Logged-in | Main |
| /profile | Logged-in | Main (customers use /dashboard/profile from header) |
| /admin/* | Admin/Agent | Admin |

Customers who log in are redirected to **/dashboard**. From the main header, “Dashboard”, “My Bookings”, and the profile name link into the customer panel (**/dashboard**, **/dashboard/bookings**, **/dashboard/profile**).
