# How to Get Real API Keys for Design Feed

Your design feed is currently using placeholder images because the API keys in your `.env` file are default placeholder values. To get real, high-quality design photos, you need to obtain actual API keys from these services:

## 1. Pexels API (Free, Easy to Get)

1. Go to https://www.pexels.com/api/
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Once logged in, you'll receive your API key immediately
5. Replace the value in `.env`:
   ```
   PEXELS_API_KEY=YOUR_ACTUAL_PEXELS_KEY_HERE
   ```

**Rate Limits:** 200 requests/hour (free tier)

## 2. Unsplash API (Free, Requires Application)

1. Go to https://unsplash.com/developers
2. Click "Register as a Developer"
3. Create a free account
4. Create a new application:
   - Go to "Your Apps" → "New Application"
   - Accept the terms
   - Give your app a name and description
   - Submit the application
5. You'll receive two keys:
   - **Access Key** (public)
   - **Secret Key** (private)
6. Update your `.env`:
   ```
   UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_ACCESS_KEY
   UNSPLASH_SECRET_KEY=YOUR_UNSPLASH_SECRET_KEY
   ```

**Rate Limits:** 50 requests/hour (demo tier), can apply for production access

## 3. Pixabay API (Free, Easy to Get)

1. Go to https://pixabay.com/api/docs/
2. Click "Get API Key"
3. Create a free account
4. Once logged in, you'll receive your API key immediately
5. Replace the value in `.env`:
   ```
   PIXABAY_API_KEY=YOUR_ACTUAL_PIXABAY_KEY_HERE
   ```

**Rate Limits:** 100 requests/minute (free tier)

## After Getting Your API Keys

1. Update the `.env` file with your new API keys
2. Restart your backend server:
   ```bash
   # Stop the current backend (Ctrl+C in the terminal running it)
   # Then start it again:
   python Backend/main.py
   # OR if using the start script:
   .\start_backend.bat
   ```
3. Refresh your design feed page - you should now see real photos!

## Current Status (Using Placeholder API Keys)

Your app will still work with the default keys, but:
- ✅ Shows design-themed titles
- ✅ Uses Picsum.photos for actual (random) images
- ❌ Images are not specifically design-related
- ❌ Limited variety

## With Real API Keys

- ✅ High-quality professional design photos
- ✅ Actual interior design and architecture images
- ✅ Search functionality works properly
- ✅ Much more variety and freshness
- ✅ Better user experience

## Priority

**Recommended order:**
1. **Pexels** - Fastest to set up, great design content
2. **Pixabay** - Also fast, good supplementary content
3. **Unsplash** - Best quality, but requires app approval

Even getting just **one** of these (preferably Pexels) will dramatically improve your design feed!







