# How to run the Flight Reservation app (simple steps)

You need: **Node.js**, **PostgreSQL**, and a **terminal** (or VS Code terminal).

---

## Option A: Easiest – use Docker for the database

If you have **Docker** installed:

1. **Start only the database** (from the project folder):
   ```bash
   docker run -d --name flight-db -e POSTGRES_USER=flight -e POSTGRES_PASSWORD=flight -e POSTGRES_DB=flight_reservation -p 5432:5432 postgres:16-alpine
   ```
2. **Wait a few seconds**, then continue with “Step 2” below (create tables and seed).

The `.env` in `server/` is already set for this: user `flight`, password `flight`, database `flight_reservation`.

---

## Option B: Use PostgreSQL installed on your computer

1. **Install PostgreSQL**  
   - Windows: [PostgreSQL download](https://www.postgresql.org/download/windows/)  
   - Mac: `brew install postgresql`  
   - Linux: `sudo apt install postgresql` (or your package manager)

2. **Create the database and user**  
   Open a terminal and run (use your PostgreSQL username if different):
   ```bash
   # Linux/Mac: switch to postgres user and open psql, or use:
   createdb flight_reservation
   ```
   If your PostgreSQL has a password, edit **`server/.env`** and set:
   ```text
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/flight_reservation
   ```
   Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your real PostgreSQL login.

3. **If you use a different user/password**  
   Open **`server/.env`** and change this line:
   ```text
   DATABASE_URL=postgresql://flight:flight@localhost:5432/flight_reservation
   ```
   to:
   ```text
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/flight_reservation
   ```

---

## Step 2: Create tables and add sample data (everyone does this)

Open a terminal **in the project folder** (the one that has `package.json` and the `client` / `server` folders) and run:

```bash
# 1) Create database tables
npm run db:push

# 2) Add sample flights, airports, and test users (IMPORTANT – without this the website will show no data!)
npm run db:seed
```

If both commands finish without errors, the database is ready. **You must run `db:seed`** so that flights, airports, and login users appear on the website.

---

## Step 3: Start the app

In the **same project folder** run:

```bash
npm run dev
```

This starts:

- **Backend (API)** at: http://localhost:5000  
- **Frontend (website)** at: http://localhost:5173  

Open your browser and go to: **http://localhost:5173**

---

## Step 4: Log in and try it

- **Admin:**  
  - Email: `admin@flight.com`  
  - Password: `Admin123!`  

- **Normal user:**  
  - Email: `customer@flight.com`  
  - Password: `Admin123!`  

Try: **Search Flights** → From: **DEL**, To: **BOM**, pick a date → Search → pick a flight → **Select** → fill passenger details → **Continue to payment** → **Confirm payment**.

---

## If something goes wrong

| Problem | What to do |
|--------|------------|
| `npm run db:push` says “can’t connect” | PostgreSQL is not running, or `DATABASE_URL` in `server/.env` is wrong (user, password, port 5432). |
| Port 5000 or 5173 already in use | Stop the other app using that port, or change `PORT` in `server/.env` (e.g. 5001) and in the client proxy if needed. |
| “Module not found” or “command not found” | In the project folder run: `npm install` |

---

## Short version (if you already use Docker)

```bash
docker run -d --name flight-db -e POSTGRES_USER=flight -e POSTGRES_PASSWORD=flight -e POSTGRES_DB=flight_reservation -p 5432:5432 postgres:16-alpine
cd "/home/hussain/Downloads/flight reservation project"
npm run db:push
npm run db:seed
npm run dev
```

Then open http://localhost:5173 and log in with `admin@flight.com` / `Admin123!`.
