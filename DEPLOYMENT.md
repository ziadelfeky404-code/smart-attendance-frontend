# CampusMind - Deployment Guide

A complete step-by-step guide to deploy this system using free services: **Vercel** (frontend), **Render** (backend), and **Supabase** (PostgreSQL database).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                         │
│                   Next.js 14 - RTL Arabic UI                     │
│                         Port: 3000                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Render)                             │
│              Node.js + Express + TypeScript                      │
│                         Port: 5000                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ PostgreSQL Connection
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Database (Supabase)                            │
│                    PostgreSQL 15+                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

You'll need to create accounts on these free services:

| Service | Purpose | Free Tier | Signup Link |
|---------|---------|-----------|-------------|
| **Supabase** | PostgreSQL Database | 500MB storage, 2GB transfer/month | https://supabase.com/dashboard |
| **Render** | Backend API Hosting | 750 hours/month, sleeps after 15min inactivity | https://dashboard.render.com |
| **Vercel** | Frontend Hosting | 100GB bandwidth/month | https://vercel.com |
| **Gmail** | OTP Email Delivery | Built into any Gmail account | https://gmail.com |

---

## Phase 1: Database Setup (Supabase)

### Step 1.1: Create a Supabase Project

1. Go to https://supabase.com/dashboard and sign in
2. Click **New Project**
3. Fill in the details:
   - **Name**: `smart-attendance`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to provision (~2 minutes)

### Step 1.2: Get Your Database Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[project-id]:[password]@db.[project-id].supabase.co:5432/postgres
   ```
5. Save this for later (Step 4.2)

### Step 1.3: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a **New Query**
3. Copy the contents of `server/src/database/schema.sql` and paste
4. Click **Run** to execute

### Step 1.4: Run Database Seed (Optional - Creates Test Users)

1. Create another **New Query** in SQL Editor
2. Copy the contents of `server/src/database/seed.sql` and paste
3. Click **Run** to execute

**Test accounts created:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartuniversity.edu | Admin@123 |
| Doctor | doctor@smartuniversity.edu | Doctor@123 |
| Student | student1@smartuniversity.edu | Student@123 |

---

## Phase 2: Backend Deployment (Render)

### Step 2.1: Prepare Your Backend

1. Go to your project directory
2. Create a new GitHub repository for your backend
3. Push the `server` folder to GitHub:
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial backend commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smart-attendance-backend.git
   git push -u origin main
   ```

### Step 2.2: Create a Render Web Service

1. Go to https://dashboard.render.com
2. Sign in with GitHub
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `smart-attendance-api`
   - **Region**: Choose closest region
   - **Branch**: `main`
   - **Root Directory**: Leave empty (if repo is backend-only) or `server` (if monorepo)
   - **Runtime**: **Node**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### Step 2.3: Add Environment Variables

Click **Environment** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render assigns this |
| `DATABASE_URL` | Your Supabase connection string (from Step 1.2) | Format: `postgresql://postgres.[id]:[pass]@db.[id].supabase.co:5432/postgres` |
| `JWT_SECRET` | Generate a 64-character random string | Use: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Generate another 64-character random string | Different from JWT_SECRET |
| `QR_SECRET` | Generate a 64-character random string | Used for HMAC signing |
| `SMTP_HOST` | `smtp.gmail.com` | |
| `SMTP_PORT` | `587` | |
| `SMTP_SECURE` | `false` | |
| `SMTP_USER` | Your Gmail address | e.g., `youremail@gmail.com` |
| `SMTP_PASS` | Gmail App Password | See Step 2.4 |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Update after frontend deploy |
| `ALLOWED_ORIGIN` | `https://your-frontend.vercel.app` | Update after frontend deploy |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Update after frontend deploy |

### Step 2.4: Gmail App Password Setup

1. Go to https://myaccount.google.com
2. Click **Security** → **2-Step Verification** → Enable it
3. Go to **App Passwords** (search in settings)
4. Select app: **Mail**, Select device: **Other (Custom name)**
5. Enter `Smart Attendance System`
6. Copy the 16-character password
7. Use this as `SMTP_PASS` environment variable

**Important:** Use a dedicated Gmail account for this. The app password will stop working if you change your Google account password.

### Step 2.5: Deploy

1. Click **Create Web Service**
2. Render will start building (takes 3-5 minutes)
3. Monitor logs for errors
4. Once deployed, your backend URL will be: `https://smart-attendance-api.onrender.com`

### Step 2.6: Test Backend API

```bash
# Test health endpoint
curl https://smart-attendance-api.onrender.com/api/health

# Test login
curl -X POST https://smart-attendance-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartuniversity.edu","password":"Admin@123"}'
```

---

## Phase 3: Frontend Deployment (Vercel)

### Step 3.1: Prepare Your Frontend

1. Create a new GitHub repository for your frontend
2. Push the `frontend` folder to GitHub:
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial frontend commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smart-attendance-frontend.git
   git push -u origin main
   ```

### Step 3.2: Create a Vercel Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: **Next.js**
   - **Root Directory**: `./` (or `frontend` if monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3.3: Add Environment Variables

Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://smart-attendance-api.onrender.com/api` |
| `NEXT_PUBLIC_APP_NAME` | `نظام الحضور الذكي` |

### Step 3.4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~3 minutes)
3. Your frontend URL: `https://smart-attendance-frontend.vercel.app`

---

## Phase 4: Update Backend CORS Configuration

Now that you have your frontend URL, update the Render environment variables:

1. Go to Render Dashboard → Your Web Service → **Environment**
2. Update these variables with your actual frontend URL:
   - `FRONTEND_URL`: `https://smart-attendance-frontend.vercel.app`
   - `ALLOWED_ORIGIN`: `https://smart-attendance-frontend.vercel.app`
   - `CORS_ORIGIN`: `https://smart-attendance-frontend.vercel.app`
3. Click **Save Changes**
4. Render will auto-redeploy

---

## Phase 5: Update Frontend Environment (Optional)

If you want to test locally with production API, create `.env.local`:

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=https://smart-attendance-api.onrender.com/api" > .env.local
```

---

## Phase 6: Verify Deployment

### Test Login Flow

1. Open `https://smart-attendance-frontend.vercel.app`
2. Click **تسجيل الدخول** (Login)
3. Login with: `admin@smartuniversity.edu` / `Admin@123`
4. You should see the admin dashboard

### Test OTP Email

1. As admin, go to **الأطباء** (Doctors)
2. Create a new doctor with a real email
3. Check that doctor's email for OTP code

---

## Custom Domain (Optional)

### Vercel Frontend

1. Go to Project Settings → **Domains**
2. Add your domain (e.g., `attendance.youruni.edu`)
3. Follow DNS configuration instructions

### Render Backend

1. Upgrade to **Paid Plan** (required for custom domains)
2. Go to Service → **Settings** → **Custom Domains**
3. Add your domain

---

## Troubleshooting

### Backend Won't Start

Check Render logs for:
- **Database connection error**: Verify `DATABASE_URL` is correct
- **Missing env vars**: Ensure all required variables are set
- **Build failed**: Check `npm run build` works locally

### CORS Errors

- Verify `ALLOWED_ORIGIN` matches your frontend URL exactly
- Include protocol (`https://`)
- No trailing slash

### OTP Not Sending

1. Verify Gmail App Password is correct
2. Check spam folder
3. Test SMTP connection:
   ```bash
   curl -X POST https://smart-attendance-api.onrender.com/api/otp/generate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"type":"PASSWORD_RESET"}'
   ```

### Frontend 500 Error

1. Check browser console for specific error
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure backend is running and responsive

### Database Connection Issues

1. Supabase might be sleeping - wake it up by running a query in dashboard
2. Check connection string format
3. Verify IP whitelist (if using Supabase Network restrictions)

---

## Performance Notes

### Free Tier Limitations

**Render (Free):**
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month = ~31 days of continuous uptime

**Supabase (Free):**
- 500MB storage limit
- 2GB transfer/month
- Rate limiting on free tier

**Vercel (Free):**
- 100GB bandwidth/month
- Serverless function timeout: 10 seconds

### Optimization Tips

1. **Reduce cold starts**: Upgrade to Render $7/month plan
2. **Database limits**: Monitor usage in Supabase dashboard
3. **Bandwidth**: Enable caching headers in Next.js

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET (64 chars)
- [ ] Generated strong QR_SECRET (64 chars)
- [ ] Enabled 2FA on Gmail account
- [ ] Set `NODE_ENV=production`
- [ ] Verified CORS origin is correct
- [ ] Enabled rate limiting (already built-in)
- [ ] Database has SSL enabled (Supabase default)

---

## Maintenance

### Updating the Backend

1. Push changes to GitHub
2. Render auto-deploys on new commits

### Updating the Frontend

1. Push changes to GitHub
2. Vercel auto-deploys on new commits

### Database Backups

Supabase provides daily automatic backups on free tier. For manual backups:
```bash
pg_dump -h db.[project-id].supabase.co -U postgres -d postgres > backup.sql
```

### Monitoring

- Render: Built-in metrics and logs
- Vercel: Built-in analytics
- Supabase: Project insights dashboard

---

## Support

For issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly with curl
