# 🔐 OAuth Setup Guide — Google & Facebook Login

Before users can sign in with Google or Facebook, you need to configure each provider in two places: their developer console, and your Supabase dashboard. This takes about 15 minutes total.

---

## Step 1 — Set your Redirect URL in Supabase

Before touching Google or Facebook, grab your redirect URL from Supabase. You'll need it in both setups.

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://magiccauldron.github.io/Cauldron
   ```
3. Also add `http://localhost:3000` for local testing
4. Click **Save**

---

## Step 2 — Google OAuth

### A) Create Google OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - Fill in App name: `Pantry Cauldron`
   - Add your email as developer contact
   - Click **Save and Continue** through the rest
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: `Pantry Cauldron Web`
   - Authorised JavaScript origins:
     ```
     https://ultcwpsxdqoztyhjjujq.supabase.co
     ```
   - Authorised redirect URIs:
     ```
     https://ultcwpsxdqoztyhjjujq.supabase.co/auth/v1/callback
     ```
5. Click **Create** — copy the **Client ID** and **Client Secret**

### B) Enable Google in Supabase

1. Go to **Supabase → Authentication → Providers → Google**
2. Toggle **Enable Google provider** ON
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

---

## Step 3 — Facebook OAuth

### A) Create a Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **Create App → Consumer → Next**
3. App name: `Pantry Cauldron` → Create
4. On the dashboard, find **Facebook Login** and click **Set Up**
5. Choose **Web**, enter your site URL:
   ```
   https://magiccauldron.github.io/Cauldron
   ```
6. Go to **Facebook Login → Settings** in the left sidebar
7. Under **Valid OAuth Redirect URIs** add:
   ```
   https://ultcwpsxdqoztyhjjujq.supabase.co/auth/v1/callback
   ```
8. Click **Save Changes**
9. Go to **Settings → Basic** — copy your **App ID** and **App Secret**

### B) Enable Facebook in Supabase

1. Go to **Supabase → Authentication → Providers → Facebook**
2. Toggle **Enable Facebook provider** ON
3. Paste your **App ID** and **App Secret**
4. Click **Save**

---

## Step 4 — Enable GitHub Pages

1. Go to your repo: `github.com/MagicCauldron/Cauldron`
2. Click **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` · Folder: `/ (root)`
5. Click **Save**

Your app will be live at:
👉 **https://magiccauldron.github.io/Cauldron**

---

## Step 5 — Run the Database Schema

If you haven't already run `schema.sql` in Supabase:

1. Go to **Supabase → SQL Editor → New Query**
2. Paste the entire contents of `schema.sql`
3. Click **Run**

This creates all your tables, RLS policies, and triggers (including the auto-profile trigger that fires when any user signs up — via Google, Facebook, or email).

---

## ✅ What works after setup

| Feature | Status |
|---|---|
| Google Sign In | ✅ One tap, uses their Google profile photo |
| Facebook Sign In | ✅ One tap, uses their Facebook name/photo |
| Email Sign In | ✅ Fallback option (collapsed by default) |
| Auto profile creation | ✅ Handled by DB trigger on signup |
| Pantry data saved per user | ✅ Row-level security — users only see their own data |
| Session persists on refresh | ✅ Supabase handles token storage |
| Profile photo in header | ✅ Pulled from Google/Facebook automatically |

---

## ⚠️ Facebook App — Go Live

Facebook apps start in **Development mode** — only you can log in.
To allow real users:

1. Go to **developers.facebook.com → your app**
2. Click the toggle at the top: **Development → Live**
3. You'll need to submit for App Review if you request extra permissions (you don't for basic login)
