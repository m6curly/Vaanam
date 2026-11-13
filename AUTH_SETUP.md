# VAANAM — Supabase and Google sign-in setup

VAANAM uses Supabase Auth for Google sign-in, a Row Level Security (RLS)-protected Postgres table for workspace state, and a private Supabase Storage bucket for source files. No VAANAM password is created. Google accounts are not restricted to `@gmail.com` by the application.

## 1. Create the Supabase project

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Choose the project region deliberately; it affects where account and workspace data are stored.
3. Open **SQL Editor** and run the complete `vaanam-supabase.sql` file from this project.
4. Open **Project Settings → API** and copy the Project URL and a browser-safe **Publishable key** (`sb_publishable_…`). A legacy `anon` key is also accepted.

The SQL creates:

- `public.vaanam_workspace_state`, with one saved workspace snapshot per user and workspace.
- RLS policies so a signed-in user can only read, insert, update or delete their own rows.
- The private `vaanam-workspace-assets` Storage bucket and policies that bind each file path to the authenticated user's ID.

## 2. Configure Google as an Auth provider

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Configure the OAuth consent screen. While the Google app is in **Testing**, only accounts listed as test users can sign in. Publish the consent configuration when ready for general access, following Google's verification requirements for the scopes and audience you use.
3. Create an OAuth Client ID with application type **Web application**.
4. In the Google OAuth client, add your VAANAM domain (for example, `https://your-domain.example`) under **Authorized JavaScript origins**. Add the Supabase callback URL under **Authorized redirect URIs**. It is shown in Supabase under **Authentication → Sign In / Providers → Google** and normally has this form:

   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

5. Copy the Google Client ID and Client Secret into the Google provider settings in Supabase, enable the provider, and save.
6. In Supabase, open **Authentication → URL Configuration**:
   - Set **Site URL** to the production VAANAM origin, for example `https://your-domain.example`.
   - Add redirect URLs for every origin that should be allowed, including the production domain and any staging/local development origin. Example: `https://your-domain.example/**`, `https://www.your-domain.example/**`, and `http://localhost:3000/**`.

The Google redirect URI is the Supabase callback URL, not `/api/auth/google` and not the VAANAM page URL. The VAANAM page URL belongs in Supabase's allowed redirect URL list.

## 3. Add the environment variables to hosting

For Vercel, open the VAANAM project → **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Supabase Project URL, e.g. `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Publishable key (`sb_publishable_…`) or legacy `anon` key |

`SUPABASE_PUBLISHABLE_KEY` is accepted as an alternative to `SUPABASE_ANON_KEY`. Set the variables for the environments you deploy (Production, Preview and/or Development), then redeploy.

**Never put a `service_role` key or an `sb_secret_…` key in a browser bundle, `SUPABASE_ANON_KEY`, or any public environment variable.** The `/api/supabase-config` route deliberately refuses recognised service-role/secret keys. The browser-safe key is still public; RLS policies are what protect the user data.

## 4. Deploy and verify

1. Deploy the project to Vercel (or another host that supports Node.js serverless functions and static files from the project root).
2. Open the production URL over HTTPS and select **Continue with Google**.
3. Sign in with a Google account. The app should return to the page you started from and show the account email in the shared VAANAM header.
4. Change a setting or run a tool. The header should report **Cloud saved** after the save completes.
5. In Supabase **Authentication → Users**, confirm the account exists. In **Table Editor → vaanam_workspace_state**, confirm one row appears for the active workspace. Uploaded files should appear under the private `vaanam-workspace-assets` bucket in a folder named with the user's Auth ID.
6. Sign out and sign back in, or open VAANAM on another device. The workspace state and backed-up source files should be restored.

## 5. What is saved

When signed in, VAANAM automatically saves:

- Workspace form values and selections.
- Map centre, zoom and supported workspace-specific settings.
- A short summary of the most recent completed analysis/download.
- Source files selected in OSM History, Change Detection and LST, in the private Storage bucket.

The OSM History XML import is limited to 30 MB by the tool. Other source-file backups are limited to 100 MiB by the app and SQL bucket configuration, subject to any lower file-size limit imposed by the Supabase plan.

Raster calculations still run locally in the browser. Saved source rasters and settings are restored so the analysis can be run again; generated GeoTIFF/CSV downloads are not automatically uploaded as project outputs. The Home OSM downloader saves its selections and last-run summary, not the downloaded export files. Keep downloaded outputs in your own storage.

Without signing in, ordinary settings are saved in that browser's local storage. Source files are available only for the current browser session and are not backed up to your Supabase account. To back up a source file, sign in and select it again.

## 6. Local development

Use a Node.js environment and Vercel's development server so `/api/supabase-config` is available:

```bash
npx vercel dev
```

Configure the environment variables in Vercel or a local ignored `.env` file. A basic static server can preview the pages, but Google sign-in and cloud persistence will remain unavailable unless the serverless config route is running.

## Operational notes

- Review `legal.html` and replace every bracketed operator/contact placeholder with accurate, monitored details before public launch.
- Confirm the project region, billing plan, Storage limits, retention, backups and account recovery arrangements in Supabase.
- The app stores email/account identity through Supabase Auth, but it does not currently gate public workspace pages behind login. RLS protects saved account data and storage; it does not make the analysis interface private.
- Do not upload classified, confidential, restricted or otherwise sensitive data unless your organisation has approved the storage provider and its configuration.
