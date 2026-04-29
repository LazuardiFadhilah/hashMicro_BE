# Vercel Deployment Guide

## Fixed Issues
✅ Database connection now works in serverless environment
✅ Proper handler export for Vercel
✅ Connection pooling to avoid multiple DB connections

## Environment Variables Required

Go to your Vercel project settings → Environment Variables and add:

```
MONGODB_URI=mongodb+srv://Cluster22955:123Lazuardi.@cluster22955.mxxqrt0.mongodb.net/student-management
JWT_SECRET=your-jwt-secret-change-in-production
NODE_ENV=production
```

## Deployment Steps

### Option 1: Redeploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find your project `hash-micro-be`
3. Go to Settings → Environment Variables
4. Add the 3 variables above if not already added
5. Go to Deployments tab
6. Click "..." on latest deployment → Redeploy

### Option 2: Deploy via Git Push
```bash
cd backend
git add .
git commit -m "Fix Vercel serverless handler"
git push
```

Vercel will auto-deploy if connected to your Git repo.

### Option 3: Deploy via Vercel CLI
```bash
cd backend
npm i -g vercel  # if not installed
vercel --prod
```

## Testing After Deployment

Test the API endpoints:

```bash
# Health check
curl https://hash-micro-be.vercel.app/

# Login
curl -X POST https://hash-micro-be.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ardi@gmail.com","password":"password123"}'

# Get students (with token)
curl https://hash-micro-be.vercel.app/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Issues

### 1. Still getting 500 error?
- Check Vercel logs: Project → Deployments → Click deployment → View Function Logs
- Verify environment variables are set correctly
- Make sure MongoDB URI is accessible from Vercel's servers

### 2. Database connection timeout?
- MongoDB Atlas: Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
- This is needed because Vercel uses dynamic IPs

### 3. JWT errors?
- Make sure JWT_SECRET is set in Vercel environment variables
- Must be the same secret used to create existing tokens

## Update Frontend

After backend is working, update frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=https://hash-micro-be.vercel.app
```

Then restart your frontend dev server:
```bash
cd frontend
npm run dev
```
