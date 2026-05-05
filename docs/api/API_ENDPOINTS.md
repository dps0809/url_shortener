# 🔗 URL Shortener — Complete API Reference

> **Base URL:** `http://localhost:3000`  
> **Auth:** JWT Bearer token in `Authorization: Bearer <token>` header  
> **Redis:** `redis://localhost:6379` (Redis Stack)  
> **Database:** PostgreSQL

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [URL Management (Core CRUD)](#2-url-management-core-crud)
3. [Redirect Engine](#3-redirect-engine)
4. [Analytics & Stats](#4-analytics--stats)
5. [Lifecycle Management](#5-lifecycle-management)
6. [QR Code](#6-qr-code)
7. [System & Monitoring](#7-system--monitoring)
8. [Admin Panel](#8-admin-panel)
9. [Internal / Worker Triggers](#9-internal--worker-triggers)
10. [Background Workers & Queues](#10-background-workers--queues)
11. [Redis Connection & Usage](#11-redis-connection--usage)
12. [How to Create a Short Link (Full Flow)](#12-how-to-create-a-short-link-full-flow)
13. [How Workers Process Jobs](#13-how-workers-process-jobs)
14. [Known Issues Fixed](#14-known-issues-fixed)

---

## 1. Authentication

All protected routes require `Authorization: Bearer <JWT_TOKEN>`.

### `POST /api/auth/register`

Register a new user account.

| Field      | Type   | Required | Description            |
|------------|--------|----------|------------------------|
| `email`    | string | ✅       | Valid email address     |
| `password` | string | ✅       | Min 8 characters        |

**Response (201):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### `POST /api/auth/login`

Authenticate and receive JWT token.

| Field      | Type   | Required | Description       |
|------------|--------|----------|-------------------|
| `email`    | string | ✅       | Registered email   |
| `password` | string | ✅       | Account password   |

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### `GET /api/auth/me`

Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### `POST /api/auth/logout`

Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

## 2. URL Management (Core CRUD)

### `POST /api/urls` 🔒

Create a new short URL. This triggers the **scan-first fan-out pipeline**.

| Field         | Type   | Required | Description                        |
|---------------|--------|----------|------------------------------------|
| `longUrl`     | string | ✅       | The original URL to shorten        |
| `customAlias` | string | ❌       | Custom short code (e.g., "my-link")|
| `expiryDate`  | string | ❌       | ISO date for auto-expiration       |

**Pipeline Flow:**
1. Rate limit check (50 URLs/day)
2. URL validation
3. **Scan Queue** → VirusTotal + Google Safe Browsing
4. **Link Creation Queue** → DB insert
5. **Fan-out** → QR generation, analytics setup, audit logging

**Response (201):**
```json
{
  "message": "Short URL created",
  "url": {
    "urlId": 42,
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123",
    "longUrl": "https://example.com/very-long-url",
    "createdAt": "2025-01-01T00:00:00Z",
    "expiryDate": null,
    "status": "active",
    "safetyStatus": "safe"
  },
  "rateLimit": {
    "remaining": 49
  }
}
```

---

### `GET /api/urls` 🔒

List all URLs for authenticated user (paginated).

| Query Param | Type   | Default | Description          |
|-------------|--------|---------|----------------------|
| `page`      | number | 1       | Page number          |
| `limit`     | number | 20      | Results per page (max 50) |

**Response (200):**
```json
{
  "urls": [
    {
      "urlId": 42,
      "shortCode": "abc123",
      "shortUrl": "http://localhost:3000/abc123",
      "longUrl": "https://example.com/page",
      "createdAt": "2025-01-01T00:00:00Z",
      "expiryDate": null,
      "maxClicks": null,
      "clickCount": 150,
      "status": "active",
      "qrCodeUrl": "https://ik.imagekit.io/dummy/qr_42.png",
      "stats": {
        "dailyClicks": 12,
        "weeklyClicks": 55,
        "monthlyClicks": 150
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### `DELETE /api/urls/[id]` 🔒

Soft delete a URL (user must own it). Invalidates Redis cache.

**Response (200):**
```json
{ "message": "URL deleted successfully" }
```

---

## 3. Redirect Engine

### `GET /[code]`

Redirects the user to the original long URL. This is the **public-facing** endpoint.

**Flow:**
1. Check Redis cache for `short:{code}` → instant redirect
2. Cache miss → query PostgreSQL
3. Validate: not deleted, status is active, not expired, max clicks not reached
4. Cache the long URL in Redis
5. Log click asynchronously (IP, device, referrer, country)
6. Increment click count
7. `302 Redirect` to original URL

**Error Responses:**
- `302 → /not-found` if short code doesn't exist
- `302 → /link-expired` if expired, disabled, or max clicks reached

---

## 4. Analytics & Stats

### `GET /api/stats/[code]` 🔒

Get comprehensive analytics for a specific URL (user must own it).

**Response (200):**
```json
{
  "url": {
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123",
    "longUrl": "https://example.com",
    "createdAt": "2025-01-01T00:00:00Z",
    "clickCount": 1234,
    "status": "active",
    "expiryDate": null,
    "maxClicks": null,
    "qrCodeUrl": "https://ik.imagekit.io/..."
  },
  "stats": {
    "dailyClicks": 50,
    "weeklyClicks": 300,
    "monthlyClicks": 1234,
    "lastUpdated": "2025-01-15T12:00:00Z"
  },
  "health": {
    "lastStatusCode": 200,
    "isDead": false,
    "lastCheckedAt": "2025-01-15T06:00:00Z",
    "failureCount": 0
  },
  "charts": {
    "last7Days": [
      { "date": "2025-01-09", "clicks": 45 },
      { "date": "2025-01-10", "clicks": 60 }
    ],
    "devices": [
      { "device": "desktop", "count": 800 },
      { "device": "mobile", "count": 434 }
    ],
    "countries": [
      { "country": "US", "count": 500 },
      { "country": "IN", "count": 300 }
    ],
    "referrers": [
      { "referrer": "https://twitter.com", "count": 200 }
    ]
  }
}
```

---

## 5. Lifecycle Management

### `GET /api/urls/[id]/status` *(backend route)*

Check the current state of a link.

**Response (200):**
```json
{
  "status": "active",
  "expires_at": "2025-06-01T00:00:00Z"
}
```

---

### `PATCH /api/urls/[id]/disable` *(backend route)*

Temporarily disable a link. Invalidates Redis cache.

**Response (200):**
```json
{ "message": "URL disabled" }
```

---

### `PATCH /api/urls/[id]/enable` *(backend route)*

Re-enable a previously disabled link.

**Response (200):**
```json
{ "message": "URL enabled" }
```

---

### `PATCH /api/urls/[id]/extend` *(backend route)*

Extend the expiration date of a link.

| Field         | Type   | Required | Description             |
|---------------|--------|----------|-------------------------|
| `expiry_date` | string | ✅       | New expiration (ISO 8601) |

**Response (200):**
```json
{ "message": "URL expiration extended" }
```

---

## 6. QR Code

### `GET /api/urls/[id]/qrcode` *(backend route)*

Get the QR code image URL for a short link.

**Response (200):**
```json
{
  "qr_code": "https://ik.imagekit.io/dummy/qr_42.png"
}
```

**Response (404):** If QR is still being generated asynchronously.

---

## 7. System & Monitoring

### `GET /api/health/check`

Background worker endpoint for checking health of all active URLs. Designed for cron jobs (e.g., Vercel Cron every 6 hours).

Checks up to 500 active URLs via HTTP HEAD requests, records failures, and marks URLs as `dead` after 3 consecutive failures.

**Response (200):**
```json
{
  "message": "Health check completed",
  "checked": 150,
  "dead": 2,
  "total": 150
}
```

---

### `GET /system/health` *(backend route)*

Check system component health (DB, Redis, workers).

**Response (200):**
```json
{
  "database": "healthy",
  "redis": "healthy",
  "workers": "running"
}
```

---

### `GET /system/metrics` *(backend route)*

Expose system-wide metrics.

**Response (200):**
```json
{
  "total_urls": 5000,
  "total_clicks": 150000,
  "redis_memory": "2.5M"
}
```

---

### `GET /system/rate-limit` *(backend route)*

Show remaining rate limit quota for current user.

**Response (200):**
```json
{
  "creations_remaining": 45,
  "redirects_remaining": 100
}
```

---

## 8. Admin Panel

### `GET /api/admin/urls` 🔒 (admin only)

List all URLs in the system (paginated, with health & safety data).

| Query Param | Type   | Default | Description            |
|-------------|--------|---------|------------------------|
| `page`      | number | 1       | Page number            |
| `limit`     | number | 20      | Results per page       |
| `status`    | string | null    | Filter by status       |

**Response (200):**
```json
{
  "urls": [
    {
      "urlId": 42,
      "shortCode": "abc123",
      "longUrl": "https://example.com",
      "createdAt": "2025-01-01T00:00:00Z",
      "clickCount": 150,
      "status": "active",
      "isDeleted": false,
      "expiryDate": null,
      "maxClicks": null,
      "userEmail": "user@example.com",
      "health": {
        "isDead": false,
        "lastStatusCode": 200
      },
      "safetyResult": "safe"
    }
  ],
  "pagination": { ... }
}
```

---

### `PATCH /api/admin/urls/[id]` 🔒 (admin only)

Admin: update URL status or soft delete.

| Field    | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `status` | string | ❌       | One of: active, disabled, malicious, expired, dead |
| `action` | string | ❌       | Set to `"delete"` for soft delete                 |

**Response (200):**
```json
{
  "message": "URL updated successfully",
  "url": {
    "urlId": 42,
    "shortCode": "abc123",
    "previousStatus": "active",
    "newStatus": "disabled"
  }
}
```

---

## 9. Internal / Worker Triggers

> These endpoints require `x-internal-secret` header or `NODE_ENV=development`

### `POST /internal/workers/deadlink-scan` *(backend route)*

Trigger dead link detection across all active URLs.

**Response (200):**
```json
{ "message": "Dead link scan job enqueued" }
```

---

### `POST /internal/workers/sync-clicks` *(backend route)*

Flush Redis click counters to PostgreSQL.

**Response (200):**
```json
{ "message": "Click sync job enqueued" }
```

---

### `POST /internal/workers/scan-malware` *(backend route)*

Manually trigger malware scan for a specific URL.

| Field      | Type   | Required | Description         |
|------------|--------|----------|---------------------|
| `url_id`   | number | ✅       | URL database ID     |
| `long_url` | string | ✅       | Original URL to scan |

**Response (200):**
```json
{ "message": "Malware scan job enqueued" }
```

---

### `GET /internal/queues` *(backend route)*

Check all job queue status (waiting counts).

**Response (200):**
```json
{
  "queues": {
    "scan": 0,
    "creation": 2,
    "qr": 1,
    "analytics": 5,
    "maintenance": 0,
    "logging": 3
  },
  "active_workers": 6
}
```

---

## 10. Background Workers & Queues

The system uses **BullMQ** with **6 queues** and **7 workers**.

### Architecture: Scan-First Fan-Out Pipeline

```
User Request (POST /api/urls)
       │
       ▼
┌──────────────────┐
│  1. scanQueue     │  ← VirusTotal + Google Safe Browsing
│  (scanWorker)     │     Blocks if URL is malicious
└────────┬─────────┘
         │ safe ✓
         ▼
┌────────────────────────┐
│  2. linkCreationQueue   │  ← Insert into PostgreSQL
│  (linkCreationWorker)   │     Generates short code
└────────┬───────────────┘
         │ created ✓
         ├──────────────────┬─────────────────┐
         ▼                  ▼                 ▼
┌─────────────┐   ┌─────────────────┐  ┌─────────────┐
│  3. qrQueue  │   │ 4. analyticsQueue│  │ 5. loggingQ  │
│  (qrWorker)  │   │ (analyticsWorker)│  │ (loggingW)   │
│  Gen QR code │   │ Init url_stats   │  │ Audit log    │
└──────────────┘   └──────────────────┘  └──────────────┘
```

### Maintenance Workers (scheduled via `maintenanceQueue`)

| Worker            | Schedule     | Task                                      |
|-------------------|-------------|-------------------------------------------|
| `clickSyncWorker` | Every 30 min | Flush Redis `clicks:*` counters to DB     |
| `deadLinkWorker`  | Every 1 hour | HTTP HEAD check on all active URLs         |
| `expiryWorker`    | Every 10 min | Mark expired URLs, clear Redis cache       |
| `malwareScanWorker`| On demand   | Re-scan a specific URL for malware        |

### Queue Details

| Queue               | Worker(s)             | Concurrency | Retry | Purpose                           |
|---------------------|-----------------------|-------------|-------|-----------------------------------|
| `scanQueue`         | `scanWorker`          | 10          | 2     | Malware scan before creation      |
| `linkCreationQueue` | `linkCreationWorker`  | 10          | 3     | DB insert + fan-out               |
| `qrQueue`           | `qrWorker`            | 5           | 3     | QR code generation                |
| `analyticsQueue`    | `analyticsWorker`     | 10          | 5     | Click logging + stats init        |
| `loggingQueue`      | `loggingWorker`       | 10          | 5     | Audit log entries                 |
| `maintenanceQueue`  | 3 workers             | 1-5         | 2     | Scheduled maintenance tasks       |

---

## 11. Redis Connection & Usage

### Connection Details

```
Host:     localhost
Port:     6379
URL:      redis://localhost:6379
```

The `.env.local` file contains:
```env
REDIS_URL=redis://localhost:6379
```

### Redis is Used For:

| Key Pattern                     | Purpose                              | TTL           |
|---------------------------------|--------------------------------------|---------------|
| `short:{shortCode}`             | Cached redirect URL                  | 1 hour (3600s)|
| `clicks:{shortCode}`            | Real-time click counter              | Permanent     |
| `ratelimit:redirect:{ip}`       | Redirect rate limit (20/min)         | 60s           |
| `ratelimit:create:{userId}`     | URL creation rate limit (50/day)     | 86400s        |
| `rate:{type}:user:{userId}`     | Middleware rate limiter              | Varies        |
| `lock:worker:{jobId}`           | Distributed worker lock              | 60s           |
| BullMQ internal keys            | Job queues, events, metadata         | Managed       |

### How Redis Connects

The singleton Redis client is in `backend/src/utils/redis.ts`:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,  // Required by BullMQ
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});
```

**All BullMQ queues and workers** share this same Redis instance.

### Verifying Redis Connection

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# See all cached URLs
redis-cli KEYS "short:*"

# Check click counters
redis-cli KEYS "clicks:*"
redis-cli GET "clicks:abc123"

# View rate limits
redis-cli KEYS "ratelimit:*"

# View BullMQ queues
redis-cli KEYS "bull:*"
```

---

## 12. How to Create a Short Link (Full Flow)

### Step 1: Register / Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "securepassword123"}'

# Login (if already registered)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "securepassword123"}'
```

Save the `token` from the response.

### Step 2: Create a Short URL

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "longUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "customAlias": "rick",
    "expiryDate": "2026-12-31T23:59:59Z"
  }'
```

### What Happens Behind the Scenes:

1. **Auth check** — JWT token is verified, session checked in DB
2. **Rate limit** — Checks Redis `ratelimit:create:{userId}` (max 50/day)
3. **URL validation** — Ensures valid URL format
4. **Scan Queue (scanWorker)** — URL sent to VirusTotal + Google Safe Browsing
   - If **malicious** → request **rejected** with error
   - If **safe** → proceeds to step 5
5. **Link Creation Queue (linkCreationWorker)** — Inserts into `urls` table
6. **Fan-out** (async, non-blocking):
   - **QR Queue (qrWorker)** → generates QR code, stores in `qr_codes` table
   - **Analytics Queue (analyticsWorker)** → initializes `url_stats` row
   - **Logging Queue (loggingWorker)** → creates audit log entry
7. **Response returned** with short URL

### Step 3: Use the Short Link

```bash
# This will 302 redirect to the original URL
curl -L http://localhost:3000/rick
```

### Step 4: View Analytics

```bash
curl http://localhost:3000/api/stats/rick \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 13. How Workers Process Jobs

### Starting Workers

Workers auto-start when the application imports the worker files. The `worker.service.ts` initializes all workers and schedules repeating maintenance jobs:

```typescript
import { startAllWorkers } from './backend/src/services/worker.service';
await startAllWorkers();
```

This:
- Initializes all 7 worker instances (they start listening to their queues)
- Schedules 3 repeating maintenance jobs:
  - Click sync → every 30 minutes
  - Dead link scan → every 1 hour
  - Expiry cleanup → every 10 minutes

### Worker Processing Flow

```
Job enters Queue → BullMQ dispatches to available Worker
                     ↓
               Worker processes job
                     ↓
              ┌──────┴──────┐
              │             │
          Success        Failure
              │             │
      Removed from     Retry (exponential backoff)
        queue              │
                    ┌──────┴──────┐
                    │             │
               Retry OK     Max retries
                    │        exceeded
               Re-process       │
                          Moved to
                          Failed set
```

### BullMQ + Redis Connection

BullMQ uses Redis for:
- **Job storage** — Jobs are stored as Redis hashes
- **Queue ordering** — Redis sorted sets for priority
- **Events** — Pub/sub for job completion notifications
- **Locking** — Distributed locks for concurrent worker safety

All queues connect to the same Redis instance at `redis://localhost:6379`.

---

## 14. Known Issues Fixed

| # | File | Issue | Fix Applied |
|---|------|-------|-------------|
| 1 | `.env.local` | `VIRUS_TOTAL_API` env var name didn't match `VIRUSTOTAL_API_KEY` used in `safety.ts` | Renamed to `VIRUSTOTAL_API_KEY` |
| 2 | `url.model.ts` | All SQL queries used `WHERE id =` but migration defines `url_id` as PK | Changed all to `WHERE url_id =` |
| 3 | `safetyScan.model.ts` | `markUrlAsMalicious` used `WHERE id =` | Changed to `WHERE url_id =` |
| 4 | `linkHealth.model.ts` | `markUrlDead` used `WHERE id =` | Changed to `WHERE url_id =` |
| 5 | `click.model.ts` | `getTotalClicks` used `WHERE id =` | Changed to `WHERE url_id =` |
| 6 | `user.model.ts` | Queries used `WHERE id =` but migration defines `user_id` as PK | Changed to `WHERE user_id =` |
| 7 | `user.model.ts` | Column `password_hash` doesn't exist; migration uses `password_h` | Fixed column name |
| 8 | `analytics.service.ts` | Queried non-existent `analytics` table | Changed to `click_logs` table |
| 9 | `linkHealth.service.ts` | `markDeadLink` used `WHERE id =` | Changed to `WHERE url_id =` |
| 10 | `expiry.service.ts` | Query used `WHERE id =` | Changed to `WHERE url_id =` |
| 11 | `redis.config.ts` | Empty file | Populated with Redis config, key prefixes, and TTL constants |
| 12 | `db.config.ts` | Empty file | Populated with database config constants |
| 13 | Empty files | `auth.middleware.ts`, `error.middleware.ts`, `hash.ts`, `logger.ts`, `auth.validator.ts`, `url.validator.ts`, `messages.ts`, `statusCodes.ts`, `analytics.model.ts` are empty stubs | Noted as placeholders (no runtime impact) |

---

## File Structure Reference

```
app/
├── [code]/route.ts                  → GET /[code] (Redirect)
├── api/
│   ├── auth/
│   │   ├── register/route.ts        → POST /api/auth/register
│   │   ├── login/route.ts           → POST /api/auth/login
│   │   ├── me/route.ts              → GET  /api/auth/me
│   │   └── logout/route.ts          → POST /api/auth/logout
│   ├── urls/
│   │   ├── route.ts                 → POST & GET /api/urls
│   │   └── [id]/route.ts            → DELETE /api/urls/[id]
│   ├── stats/[code]/route.ts        → GET  /api/stats/[code]
│   ├── health/check/route.ts        → GET  /api/health/check
│   └── admin/
│       └── urls/
│           ├── route.ts             → GET  /api/admin/urls
│           └── [id]/route.ts        → PATCH /api/admin/urls/[id]

backend/src/
├── app/api/                         → Legacy route handlers (delegating to routes/*.ts)
│   ├── urls/[id]/
│   │   ├── analytics/route.ts       → GET analytics
│   │   ├── status/route.ts          → GET status
│   │   ├── disable/route.ts         → PATCH disable
│   │   ├── enable/route.ts          → PATCH enable
│   │   ├── extend/route.ts          → PATCH extend
│   │   └── qrcode/route.ts          → GET QR code
│   ├── system/
│   │   ├── health/route.ts          → GET system health
│   │   ├── metrics/route.ts         → GET system metrics
│   │   └── rate-limit/route.ts      → GET rate limit
│   └── internal/
│       ├── queues/route.ts          → GET queue status
│       └── workers/
│           ├── deadlink-scan/route.ts  → POST trigger
│           ├── sync-clicks/route.ts    → POST trigger
│           └── scan-malware/route.ts   → POST trigger
├── config/
│   ├── redis.config.ts              → Redis connection config
│   ├── db.config.ts                 → Database config
│   └── env.ts                       → Environment variables
├── models/                          → Data Access Layer (SQL queries)
├── services/                        → Business Logic Layer
├── queues/                          → BullMQ Queue definitions
├── workers/                         → BullMQ Worker processors
├── routes/                          → Route handler functions
├── middleware/                      → Auth, rate limiting
├── utils/                           → Redis, DB, auth, safety, QR
├── validators/                      → Input validation (stubs)
└── constants/                       → Messages, status codes (stubs)
```
