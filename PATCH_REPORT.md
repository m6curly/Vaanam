# VAANAM 3.0 — implementation and verification report

## Completed changes

- Added a shared VAANAM header, workspace navigation, account area, responsive styles, typography, colours and common control tokens across all five HTML pages.
- Removed the previous custom Google token/session implementation and replaced it with Supabase Auth Google OAuth.
- Added a small serverless configuration endpoint that exposes only the Supabase project URL and browser-safe publishable/anon key. It rejects recognised service-role and secret keys.
- Added per-workspace auto-save and restore for form fields, supported map views, OSM download selections, OSM History selection and recent result summaries.
- Added a private Supabase Storage bucket integration for source files in OSM History, Change Detection and LST.
- Added Postgres and Storage Row Level Security policies so signed-in users can only access their own workspace rows and uploaded files.
- Added race-safe file uploads, safer restoration sequencing, signed-in-account cache checks, cloud-save error messages and a clear-saved-work action.
- Updated setup, privacy and technical documentation for the Supabase integration.
- Added automated endpoint and static-site integrity tests, plus syntax checking scripts.

## Persistence behaviour

Signed-in users: settings, supported selections/map views and last-run summaries are stored in Supabase. Source files are copied to a private Storage bucket and restored into the corresponding file inputs. Raster calculations still run in the browser. Generated GeoTIFF/CSV exports are downloaded locally and are not automatically uploaded as project outputs.

Signed-out users: settings are saved in local browser storage. Source files are not cloud-backed until the user signs in and selects the file again.

## Verification performed

- JavaScript syntax check across the project source and test files.
- Automated Node.js unit tests for raster processing helpers and the Supabase configuration endpoint.
- Static HTML integrity tests for page workspace identifiers, shared stylesheet/client inclusion, duplicate IDs, local links and workspace navigation targets.

## Still required before production

- Configure the real Supabase project and Google OAuth credentials using `AUTH_SETUP.md`.
- Run the SQL in `vaanam-supabase.sql` in the target Supabase project.
- Replace bracketed operator/contact fields in `legal.html` with accurate details and have the notices reviewed for the operating jurisdiction.
- Perform live sign-in/sign-out, cross-device restore, Storage upload/download and representative GeoTIFF/browser tests in the deployment environment.
- Confirm the chosen Supabase plan's Storage size limits and project region.

This report does not claim live OAuth, cloud database or browser-map testing because those require the owner's deployed credentials and environment.
