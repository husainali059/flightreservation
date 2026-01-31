# Flight Reservation System

A full-stack flight reservation website with React (TypeScript), Node.js (Express), PostgreSQL (Prisma), JWT auth, and Stripe payments.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **Payments:** Stripe (Razorpay optional)

## Project Structure

```
flight reservation project/
├── client/          # React frontend
├── server/          # Express API + Prisma
├── shared/          # Shared types and utilities
├── package.json     # Root workspace
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Clone and install

```bash
cd "flight reservation project"
npm install
```

### 2. Environment

Copy `.env.example` to `.env` in project root and in `server/` and `client/` if needed. Set at least:

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – random string for JWT signing
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` (for payments)

### 3. Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run development

```bash
npm run dev
```

- **API:** http://localhost:5000  
- **Frontend:** http://localhost:5173  

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Run client + server            |
| `npm run build`| Build all workspaces           |
| `npm run test` | Run tests                      |
| `db:push`      | Push Prisma schema to DB       |
| `db:seed`      | Seed sample data               |

## API Documentation

See [API.md](docs/API.md) for endpoint list and request/response formats.

## Security

- HTTPS in production
- Input validation (Zod)
- Rate limiting
- bcrypt for passwords
- JWT with refresh tokens
- CORS and security headers

## License

MIT
