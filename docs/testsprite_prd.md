# Product Requirements Document: URL Shortener Service

## Overview
A high-performance, secure URL shortener with real-time analytics, malware scanning, and QR code generation.

## Core Features

### 1. URL Creation & Management
- **Shorten URL**: Users can submit long URLs to receive a shortened version.
- **Custom Aliases**: Users can request specific back-halves (e.g., `short.ly/my-brand`).
- **Expiry Dates**: URLs can have optional expiration timestamps.
- **Sequential Pipeline**:
  - **Phase 1: Scan (Mandatory)**: Every URL is scanned via VirusTotal/Google Safe Browsing before creation. Malicious links MUST be blocked.
  - **Phase 2: Create**: Safe URLs are stored in PostgreSQL.
  - **Phase 3: Fan-out**: Background tasks are triggered asynchronously for QR generation and analytics.

### 2. Redirection & Analytics
- **Fast Redirects**: Redis-backed caching for ultra-fast redirection.
- **Click Tracking**: Capture IP, User-Agent, Device Type (Mobile/Desktop), and Country.
- **Geo-Analytics**: Aggregated clicks by location and time.

### 3. Background Processing (BullMQ)
- **scan.worker.ts**: Focuses on malware scanning.
- **linkCreation.worker.ts**: Handles DB insertion.
- **qr.worker.ts**: Generates QR code assets.
- **analytics.worker.ts**: Real-time click logging and periodic (30 min) batch synchronization.
- **deadLink.worker.ts**: Periodic hourly scans for 404s.
- **expiry.worker.ts**: Periodic 10-minute cleanup of expired links.

## API Specification (Endpoints for Testing)

### URL Management
- `POST /api/urls`: Create a short URL.
  - Body: `{ "longUrl": string, "customAlias?": string, "expiryDate?": string }`
  - Returns: `{ "id": number, "shortCode": string, "longUrl": string ... }`
- `GET /api/urls`: List user URLs.
- `DELETE /api/urls/:id`: Soft delete a URL.

### Analytics
- `GET /api/analytics/:shortCode`: Get click stats for a specific URL.
- `GET /api/analytics/system`: Overall system metrics (Admin only).

### System & Workers
- `GET /api/workers/queues`: Monitor the status of the 6 background queues.
- `POST /api/workers/sync-clicks`: Manually trigger a click sync (Admin only).

## Security & Reliability
- **Rate-Limiting**: 50 URL creations/day and 20 redirects/min per user.
- **Audit Logging**: Every creation and blocking event is logged.

## Test Scenarios for TestSprite
1. **Happy Path**: Shorten a valid URL -> Get short code -> Test redirect.
2. **Custom Alias**: Create a URL with a custom back-half -> Verify redirect.
3. **Malware Block**: Submit a known malicious URL (e.g., `http://testsafebrowsing.appspot.com/s/malware.html`) -> Verify it is blocked and NOT created.
4. **Link Expiry**: Create a URL with an immediate expiry -> Wait 10 mins -> Verify redirect fails/redirects to "Expired" page.
5. **Analytics Validation**: Perform 5 clicks from different browsers -> Verify click count increments by 5.
6. **Concurrent Requests**: Rapidly shorten the same URL 5 times -> Verify rate-limiter prevents excessive creations.
