# Railway پر Backend Deploy کرنے کی گائیڈ

## Step 1: Railway Project بنائیں
1. [Railway.app](https://railway.app) پر جاؤ
2. **New Project** → **Deploy from GitHub** دبائیں
3. اپنی `flightreservation` repository select کریں

## Step 2: Dockerfile سے Deploy کریں
1. Railway میں: **Add Service** → **Dockerfile**
2. Dockerfile path: `server/dockerfile`
3. **Deploy** دبائیں

## Step 3: Environment Variables Set کریں
Railway dashboard میں اپنی service میں:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.zbcefxqqaluiplsgyewk:Bhatti65!!!@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?schema=public
JWT_SECRET=<اپنی مضبوط چابی>
JWT_REFRESH_SECRET=<اپنی refresh چابی>
FRONTEND_URL=https://<آپ کی netlify URL>
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**اہم :**
- DATABASE_URL: آپ کا Supabase connection string (pgBouncer endpoint)
- FRONTEND_URL: آپ کی Netlify/Vercel URL
- JWT_SECRET: کوئی بھی مضبوط random string (کم از کم 32 حروف)

## Step 4: Migrations چلائیں (اگر پہلے نہیں چلائے)
Railway میں اپنی service open کریں:
1. **Logs** tab میں server شروع ہو گیا check کریں
2. ✅ اگر migration خود run ہو گیا تو اگلے step پر جاؤ
3. اگر manual migration چاہیے:
   - Railway dashboard میں: **More** → **Command Palette**
   - اگر وہ option نہ ہو تو GitHub میں prisma seed commit کریں

## Step 5: Frontend کو Backend URL دیں
Netlify میں:
1. **Build & Deploy** → **Environment**
2. Variable add کریں: `VITE_API_URL=<آپ کی Railway URL>`
   - مثال: `https://flightbackend-production.up.railway.app`
3. **Redeploy site** دبائیں

## Step 6: Test کریں
1. Netlify frontend کھولیں
2. Login کریں (admin@flight.com / Admin123!)
3. Search flights - کام کر رہا ہے ✅

## Troubleshooting

### "MaxClientsInSessionMode" error
✅ یہ fix ہو چکا ہے Prisma singleton pattern سے

### "Cannot find @flight-reservation/shared"
✅ یہ fix ہو چکا ہے Dockerfile update سے

### "Cannot connect to database"
- DATABASE_URL check کریں (pgBouncer endpoint)
- Supabase میں IP whitelist check کریں (Railway سے allow کریں)

### Build میں "npm install" fail ہو
- node_modules پہلے delete کریں locally
- GitHub پر push دوبارہ کریں
- Railway میں redeploy کریں

## ہر بار جب code change ہو
1. GitHub پر commit + push کریں
2. Railway خود بخود redeploy کرے گا
3. یا manually Railway dashboard میں **Redeploy** دبائیں

## Production Tips
- Regular backups Supabase سے لیں
- Railway logs میں errors monitor کریں
- CORS اور JWT_SECRET production-ready ہے (check کریں)
