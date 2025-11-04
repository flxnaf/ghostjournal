# Supabase Email Authentication Setup

## Overview

replik now supports full email confirmation for public deployments. Users will receive a confirmation email after signing up.

---

## Setup Instructions

### 1. Configure Email Provider in Supabase

Go to your Supabase Dashboard → **Authentication** → **Email**

#### Option A: Use Supabase's Built-in Email (Development)
- Supabase provides a basic email service for testing
- Emails may go to spam
- **Recommended for development only**

#### Option B: Configure Custom SMTP (Production Recommended)
For production, configure a custom SMTP provider:

1. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.)

**Example with Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password
Sender email: your-email@gmail.com
Sender name: replik
```

**Example with SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: YOUR_SENDGRID_API_KEY
Sender email: noreply@yourdomain.com
Sender name: replik
```

---

### 2. Enable/Disable Email Confirmation

**For Development (Skip Email Confirmation):**
1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to "Confirm email"
3. **Toggle OFF** "Enable email confirmations"
4. Save

Users will be logged in immediately after signup.

**For Production (Require Email Confirmation):**
1. Keep "Confirm email" **ON** (default)
2. Users must click the link in their email to activate their account

---

### 3. Customize Email Templates (Optional)

Go to **Authentication** → **Email Templates**

You can customize:
- **Confirm signup** - Sent when new users sign up
- **Magic Link** - For passwordless login (if enabled)
- **Change Email Address** - When users change their email
- **Reset Password** - Password recovery emails

**Example Confirmation Email:**
```html
<h2>Confirm your email</h2>
<p>Welcome to replik! Click the link below to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

---

### 4. Configure Redirect URLs

Go to **Authentication** → **URL Configuration**

Add your allowed redirect URLs:
- **Development:** `http://localhost:3000/**`
- **Production:** `https://yourdomain.com/**`

These URLs are where users will be redirected after clicking the email confirmation link.

---

## How It Works

### With Email Confirmation Enabled:

1. **User Signs Up**
   - User fills out signup form
   - Account created (but not confirmed)
   - Redirected to `/auth/confirm` page
   - No session created yet

2. **Email Sent**
   - Supabase sends confirmation email
   - Contains link: `https://yourdomain.com/auth/callback?code=...`

3. **User Clicks Link**
   - Redirected to `/auth/callback` route
   - Code exchanged for session
   - Session cookies set
   - Redirected to app (`/`)

4. **User Logged In**
   - Session is active
   - Can use the app normally

### Without Email Confirmation:

1. **User Signs Up**
   - User fills out signup form
   - Account created immediately
   - Session created instantly
   - Logged in and ready to use app

---

## Testing Email Confirmation

### Development Testing:

1. Enable email confirmation in Supabase
2. Sign up with your email
3. Check your email (including spam folder)
4. Click the confirmation link
5. You should be redirected to the app and logged in

### Check Supabase Email Logs:

Go to **Authentication** → **Logs** to see:
- Email sent status
- Delivery errors
- Click events

---

## Troubleshooting

### Emails Not Arriving:

1. **Check spam folder**
2. **Verify SMTP settings** (if using custom SMTP)
3. **Check Supabase logs** for email errors
4. **Ensure sender email is verified** (required by most SMTP providers)
5. **Rate limits** - Supabase free tier has email limits

### "Invalid code" Error:

- Confirmation links expire after 24 hours
- User may have clicked an old link
- Ask user to request a new confirmation email

### Users Stuck on Confirmation Page:

- Email confirmation is enabled but emails aren't sending
- Temporarily disable email confirmation for development
- Or configure custom SMTP provider

---

## Environment Variables

The app automatically uses your Supabase configuration from `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

No additional configuration needed!

---

## Production Checklist

Before going live:

- [ ] Configure custom SMTP provider (not Supabase default)
- [ ] Customize email templates with your branding
- [ ] Test email delivery to common providers (Gmail, Outlook, etc.)
- [ ] Add production URL to allowed redirect URLs
- [ ] Set up email monitoring/alerts
- [ ] Consider rate limits for your SMTP provider
- [ ] Enable email confirmation for security
- [ ] Test the full signup → confirm → login flow

---

## Support

For issues with email delivery, check:
1. Supabase Dashboard → Authentication → Logs
2. Your SMTP provider's dashboard/logs
3. Supabase Community Forum
4. [Supabase Docs - Auth Email](https://supabase.com/docs/guides/auth/auth-email)

---

**Note:** For hackathons/demos, you may want to disable email confirmation for easier testing. For production, always enable it for security.

