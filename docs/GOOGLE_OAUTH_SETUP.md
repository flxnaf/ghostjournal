# Google OAuth Setup Guide

## Overview

replik now supports **"Sign in with Google"** for a seamless authentication experience. Users can sign up or log in using their Google account with just one click.

---

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Select **Web application**
   - Configure:
     - **Name:** replik
     - **Authorized JavaScript origins:**
       - Development: `http://localhost:3000`
       - Production: `https://yourdomain.com`
     - **Authorized redirect URIs:**
       - Development: `http://localhost:3000/auth/callback`
       - Production: `https://yourdomain.com/auth/callback`
   - Click **Create**

5. **Copy your credentials:**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxx`

---

### 2. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle **Enable**
5. Paste your Google OAuth credentials:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)
6. **Save**

---

### 3. Add Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
3. **Save**

---

## Testing

### Development Testing:

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click **"Sign Up"** or **"Log In"**
4. Click **"Continue with Google"**
5. You should be redirected to Google's OAuth consent screen
6. After authorizing, you'll be redirected back and logged in

### What to Expect:

- First-time users: Google asks for permission to share basic profile info
- Returning users: Instantly redirected back (no confirmation needed)
- User data (name, email) automatically saved to your database

---

## How It Works

### OAuth Flow:

1. **User Clicks "Continue with Google"**
   - `loginWithGoogle()` is called
   - User redirected to Google OAuth screen

2. **User Authorizes**
   - Google redirects to `/auth/callback?code=...`
   - Code exchanged for session

3. **Session Created**
   - Supabase creates auth session
   - User data saved to database
   - Redirected to app

4. **Logged In**
   - User can now use the app
   - No need for email confirmation

---

## User Data Handling

When a user signs in with Google, Supabase automatically provides:
- **Email:** `user.email`
- **Name:** `user.user_metadata.full_name`
- **Profile Picture:** `user.user_metadata.avatar_url`
- **Email Verified:** `user.email_confirmed_at` (always set)

This data is automatically synced to your Prisma database when the user first signs up.

---

## Benefits of Google OAuth

✅ **No Password Required:** Users don't need to remember another password  
✅ **Instant Verification:** Email is pre-verified by Google  
✅ **Faster Signup:** One-click authentication  
✅ **Better Security:** Google handles authentication  
✅ **Trust:** Users trust Google sign-in  

---

## Troubleshooting

### "Redirect URI mismatch" Error:

**Cause:** The callback URL doesn't match what's configured in Google Cloud Console

**Fix:**
1. Check Google Cloud Console → Credentials → Your OAuth Client
2. Ensure redirect URI exactly matches: `http://localhost:3000/auth/callback`
3. No trailing slash, case-sensitive

### "Access blocked: This app's request is invalid"

**Cause:** Google+ API not enabled or OAuth consent screen not configured

**Fix:**
1. Enable Google+ API in Google Cloud Console
2. Configure OAuth consent screen:
   - Go to **OAuth consent screen**
   - Fill in required fields
   - Add your email as a test user (if using External)

### Google Sign-In Button Not Working:

**Check:**
1. Supabase Google provider is **enabled**
2. Client ID and Secret are correct in Supabase
3. Redirect URLs match in both Google and Supabase
4. Browser console for errors

### User Not Created in Database:

**Cause:** The callback handler might not be triggering user creation

**Fix:**
- Check server logs for errors
- Ensure `/auth/callback` route exists and works
- User should be auto-created on first login

---

## Production Deployment

### Before Going Live:

- [ ] Add production domain to Google OAuth authorized origins
- [ ] Add production callback URL to authorized redirect URIs
- [ ] Update Supabase redirect URLs with production domain
- [ ] Test OAuth flow in production
- [ ] Configure OAuth consent screen for public use (not just test users)
- [ ] Consider branding customization in Google consent screen

### OAuth Consent Screen for Public Use:

1. Go to **OAuth consent screen** in Google Cloud Console
2. Switch from **Testing** to **Production**
3. Fill in all required information:
   - App name: replik
   - User support email
   - App logo (optional but recommended)
   - Privacy policy URL (required for production)
   - Terms of service URL (optional)
4. Submit for verification (if requesting sensitive scopes)

---

## Additional OAuth Providers

Want to add more providers? Here are some options supported by Supabase:

- **GitHub:** Developer-friendly
- **Discord:** For gaming communities
- **Twitter/X:** Social integration
- **Facebook:** Largest user base
- **Apple:** Required for iOS apps

Each follows a similar setup process:
1. Create app in provider's developer console
2. Get Client ID and Secret
3. Configure in Supabase → Authentication → Providers
4. Add redirect URLs

---

## Security Notes

### What Google Provides:

- User identity verification
- Email verification (no confirmation needed)
- Optional: profile picture, name

### What You Should Do:

- Still validate user data on your backend
- Don't trust user_metadata for sensitive operations
- Rate limit OAuth endpoints to prevent abuse
- Monitor for suspicious sign-in patterns

### Data Privacy:

- Only basic profile info is requested (email, name)
- No access to user's Google Drive, Calendar, etc.
- User can revoke access anytime in Google Account settings
- Make sure your privacy policy covers OAuth data usage

---

## Support

- **Google OAuth Issues:** [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Supabase OAuth Issues:** [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- **redirect_uri_mismatch:** Double-check all URLs match exactly

---

**Note:** For hackathon demos, Google OAuth works great even with "Testing" mode. For production, you'll need to publish the OAuth consent screen.

