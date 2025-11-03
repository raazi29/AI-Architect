# Production Deployment Guide

## Overview
This guide covers deploying the AR Interior Design platform to production with frontend on Vercel and backend on Render/Railway.

## Prerequisites
- Node.js 18+ installed locally
- Python 3.9+ installed locally
- Git repository set up
- All API keys configured in `.env` file

## Backend Deployment (Render/Railway)

### Option 1: Railway Deployment

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Connect your repository

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Python and use `Backend/railway.json`

3. **Configure Environment Variables**
   ```bash
   GROQ_API_KEY=your-groq-api-key
   GEMINI_API_KEY=your-gemini-api-key
   HUGGING_FACE_API_TOKEN=your-hugging-face-token
   PEXELS_API_KEY=your-pexels-api-key
   PIXABAY_API_KEY=your-pixabay-api-key
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key
   UNSPLASH_SECRET_KEY=your-unsplash-secret-key
   CLIENT_ID=your-wikimedia-client-id
   CLIENT_SECRET=your-wikimedia-client-secret
   ACCESS_TOKEN=your-wikimedia-access-token
   ```

4. **Get Backend URL**
   - Railway provides a URL like `https://your-app.railway.app`
   - Update frontend environment variables

### Option 2: Render Deployment

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Connect your repository

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Use `Backend/render.yaml` configuration

3. **Configure Environment Variables**
   - Same as Railway configuration above

## Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Connect your repository

2. **Configure Project**
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Use `vercel.json` configuration

3. **Set Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

## Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down URL and anon key

2. **Run Database Schema**
   - Copy contents of `supabase_schema.sql`
   - Run in Supabase SQL editor

3. **Configure RLS Policies**
   - Enable Row Level Security on all tables
   - Set up appropriate policies for your use case

## Post-Deployment Checklist

### Backend Verification
- [ ] Health check endpoint responds: `GET /health`
- [ ] AI image generation works: `POST /generate-interior`
- [ ] Floor plan generation works: `POST /floor-plan`
- [ ] Design feed works: `GET /feed`
- [ ] All AI services respond correctly

### Frontend Verification
- [ ] Homepage loads without errors
- [ ] Dark mode toggle works
- [ ] All navigation links work
- [ ] AI Generator produces images
- [ ] Design feed loads images
- [ ] AR placement loads (if applicable)
- [ ] Shopping page loads products
- [ ] All forms submit correctly

### Real-time Features
- [ ] Supabase connection established
- [ ] Real-time subscriptions work
- [ ] Presence tracking functional
- [ ] Chat features work (if implemented)

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Images load efficiently
- [ ] No console errors
- [ ] Mobile responsiveness works

## Monitoring & Maintenance

### Error Monitoring
- Set up error logging in Supabase
- Monitor Vercel function logs
- Track backend error rates

### Performance Monitoring
- Use Vercel Analytics
- Monitor API response times
- Track user engagement

### Security
- Regularly update dependencies
- Monitor API key usage
- Review access logs

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend URL in backend allowlist

2. **API Key Issues**
   - Verify all environment variables are set
   - Check API key validity and quotas

3. **Database Connection**
   - Verify Supabase credentials
   - Check RLS policies

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Support
- Check application logs in respective platforms
- Review error messages in browser console
- Test API endpoints directly with tools like Postman

## Environment Variables Reference

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
```

### Backend
```bash
GROQ_API_KEY=
GEMINI_API_KEY=
HUGGING_FACE_API_TOKEN=
PEXELS_API_KEY=
PIXABAY_API_KEY=
UNSPLASH_ACCESS_KEY=
UNSPLASH_SECRET_KEY=
CLIENT_ID=
CLIENT_SECRET=
ACCESS_TOKEN=
```

## Success Criteria
✅ Backend deployed and responding to health checks
✅ Frontend deployed and loading without errors
✅ All AI features working with real API calls
✅ Dark mode toggle functional
✅ Real-time features operational
✅ Zero runtime errors in production
✅ Performance metrics within acceptable ranges

