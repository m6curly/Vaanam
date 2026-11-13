# VAANAM — Spatial Intelligence Platform

VAANAM is a browser-based geospatial platform with a common navigation and visual system across its workspaces. The current release includes OSM data download, OSM History, raster Change Detection and Landsat Land Surface Temperature (LST).

## Workspaces

| Page | Main capability |
|---|---|
| `index.html` | Platform overview, OSM feature download by country or current map extent |
| `history.html` | OpenStreetMap node, way, relation and changeset history, geometry, version comparison and export |
| `change-detection.html` | Compare two aligned single-band GeoTIFFs and export pixel change outputs |
| `lst.html` | Convert Landsat 8/9 Collection 2 Level-2 ST_B10 to land surface temperature with optional QA controls |
| `legal.html` | Terms, privacy, attribution and service limitations |

`vaanam-theme.css` is loaded after each page's workspace stylesheet. It provides shared colour tokens, typography, header navigation, controls, responsive breakpoints and account dialog styles. `vaanam-cloud.js` provides the common Google sign-in and persistence layer.

## Supabase and Google login

The website uses Supabase Auth with Google OAuth. Any Google account permitted by the configured Google OAuth consent/provider settings can sign in; the application does not impose a Gmail-only restriction.

Run `vaanam-supabase.sql` in the Supabase SQL Editor, configure the Google provider, add the Supabase project URL and browser-safe publishable/anon key to the host environment, and deploy. See **[AUTH_SETUP.md](AUTH_SETUP.md)** for exact steps.

Environment variables:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

`SUPABASE_PUBLISHABLE_KEY` is also accepted as an alternative. Never expose a Supabase `service_role` or secret key. The API config route refuses known secret/service-role formats.

## Workspace saving

When a user is signed in, VAANAM stores workspace settings, current selections, supported map views and the most recent result summary in `public.vaanam_workspace_state`. Source files selected in OSM History, Change Detection and LST are uploaded to a private Storage bucket. Table and Storage RLS policies restrict records and files to their owner.

The raster tools continue to calculate in the browser. Saved source rasters and settings can be restored so an analysis can be run again; exported result GeoTIFF/CSV files are not automatically retained in the cloud. The Home OSM downloader saves its selection and last-run summary, not the exported files. Keep downloaded results separately.

When a user is not signed in, settings are kept in local browser storage. Source files are not backed up to Supabase until the user signs in and selects the file again.

## Run locally

For a static visual preview, serve the project folder with any local static server. For Google sign-in and cloud saving, use a Node.js environment and run the Vercel development server so the `/api/supabase-config` serverless route is available:

```bash
npx vercel dev
```

Keep an internet connection available for Supabase, Google OAuth, Leaflet, map tiles, geocoding, OpenStreetMap API/Overpass, raster libraries and fonts. A local static server or opening the HTML files directly will not provide the cloud config endpoint.

## Data and processing notes

### Home — OSM Data Download

Choose one or more countries or use the visible map extent. Select OSM feature types and export GeoJSON or CSV. Requests go to public Overpass instances, which can throttle, time out or return empty results. The downloader limits each run to 60 output files. It downloads OSM feature data, not map tiles. OSM attribution and ODbL licence metadata are retained in exports. Do not bulk-download or prefetch standard OSM tiles; follow the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

### OSM History

Load a Way, Node, Relation or Changeset by numeric ID, or import an OSM history XML file. Geometry reconstruction can require additional node and relation-member history requests. Deleted nodes and nodes without a current `name` tag are not discoverable through the live named-node lookup. A changeset is an edit batch, not a sequence of versions of one object.

### Change Detection

Upload two single-band GeoTIFFs representing the same variable and units, in chronological order. The app validates the grid before calculating `difference = after − before`. It exports a difference GeoTIFF, class GeoTIFF (1 = decrease, 2 = within threshold, 3 = increase) and summary CSV. It does not perform image registration, radiometric normalisation, cross-sensor harmonisation or automatic cloud masking.

### Land Surface Temperature

Use the native Landsat 8/9 Collection 2 Level-2 ST_B10 GeoTIFF. Matching QA_PIXEL and ST_QA layers are optional. The conversion is:

```text
LST (°C) = (ST_B10 DN × 0.00341802 + 149.0) − 273.15
```

LST is land surface temperature, not near-surface air temperature. Without QA_PIXEL, cloud/shadow/snow masking is not applied. Retain the scene-specific source citation and acknowledgement.

## Before public launch

`legal.html` still contains operator/contact placeholders because the real operator name, address, support email, privacy contact and grievance contact were not provided. Replace these with accurate, monitored details and obtain a jurisdiction-appropriate legal review. Confirm Supabase project region, hosting logs, retention, backups, billing and data-handling practices. These working notices are not legal advice or a compliance certification.

## Tests

Run the automated JavaScript, endpoint and HTML integrity tests:

```bash
npm test
npm run check
```

These tests validate source syntax, page structure, local links, duplicate IDs and Supabase config key handling. They do not replace live Google OAuth testing, live provider/API testing or representative real-world GeoTIFF browser testing.

---

© 2026 VAANAM. All rights reserved.
