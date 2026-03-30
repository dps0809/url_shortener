# Scalable URL Shortener

A production-grade, highly scalable URL Shortener built with **Next.js**, **PostgreSQL**, **Redis**, and **BullMQ**. It features robust URL creation, hyper-fast redirects via Redis caching, background analytics processing, malware scanning, QR code generation, and rate-limiting.

---

## 🏗 Architecture Overview

The system strictly follows a layered architecture to ensure clean separation of concerns:

```text
Routes / Controllers 
       ↓
Service Layer (Business Logic + Redis + Queues)
       ↓
Data Access Layer (DAL / Models)
       ↓
PostgreSQL & Redis (Infrastructure)
```

### 1. Data Access Layer (DAL / Models)
Located in `backend/src/models/`, the DAL maps specific SQL queries and Redis commands into type-safe TypeScript functions. It acts as the exclusive bridge to the databases.
- `url.model.ts`: Core URL CRUD, soft deletes, expiration, and click increments.
- `click.model.ts`: Analytics queries (device, country, daily clicks).
- `safetyScan.model.ts`: Malware scanning history and status updates.
- `linkHealth.model.ts`: Dead-link detection and health history.
- `cache.model.ts`: Redis caching, counter increments, and rate-limiting storage.
- `qr.model.ts` & `metrics.model.ts` & `user.model.ts`: Auxiliary data access for QRs, system-wide metrics, and user management.

### 2. Service Layer
Located in `backend/src/services/`, the Service Layer contains the core async business logic. It orchestrates the DAL, Redis, and Background Workers.
- **Create URL Service (`createUrl.service.ts`)**: Enforces rate limits (e.g., 50/day), assigns unique short codes (via `nanoid`), caches the new URL, saves to PostgreSQL, and dispatches an initialization job to the BullMQ Queue.
- **Redirect Service (`redirect.service.ts`)**: Ultra-fast resolution. It first checks Redis cache. If missed, falls back to Postgres. Enforces redirect rate limits (e.g., 20/min/user), checks expiry dates, and lazily queues an background job to log the click analytics without blocking the user response.
- **Analytics Service (`analytics.service.ts`)**: Aggregates total clicks, device, and country data using concurrent promise resolutions.
- **Scan & QR Services**: Triggered primarily by background workers to interact with 3rd-party APIs (e.g., ImageKit, VirusTotal) and save the results back via the DAL.

### 3. Background Workers (BullMQ)
Heavy operations are offloaded to background workers using Redis-backed queues (`backend/src/queues/` & `backend/src/workers/`):
- **Click Analytics**: Processes raw click logs (IP, Device, Country) asynchronously to ensure redirects are instantaneous.
- **Malware Scanning**: Automatically flags malicious URLs upon creation.
- **QR Code Generation**: Generates and uploads QR assets to CDNs (e.g., ImageKit).
- **Link Health**: Periodically probes active links to detect dead pages (404s).

---

## 🚀 Key Features

* **Hyper-Fast Redirects**: Pre-warmed and lazily-loaded Redis caching prevents database bottlenecking during viral traffic spikes.
* **Strict Rate Limiting**: Redis-backed limits prevent abuse both for creating short codes and redirect spamming.
* **Asynchronous Analytics**: Click tracking never blocks the 301/302 HTTP redirect.
* **Safe Browsing**: Automatic background scanning flags and disables malicious links.
* **Extensive Dashboards**: Built-in support for daily, geographic, and device analytics.

---

## 🛠 Tech Stack

* **Framework**: Next.js (App Router) / Node.js
* **Language**: TypeScript
* **Database**: PostgreSQL (pg)
* **In-Memory Store**: Redis (ioredis)
* **Job Queues**: BullMQ
* **Unique IDs**: nanoid

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally/Docker
- Redis installed and running locally/Docker

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file at the root:
```env
DATABASE_URL=postgres://user:password@localhost:5432/url_shortener
REDIS_URL=redis://localhost:6379
```

### 3. Start Development Servers
Start the Next.js app / Backend Server:
```bash
npm run dev
```

### 4. Running the Workers
Ensure your BullMQ worker processes are running (usually alongside the main backend process or in a separate container depending on your deployment model).

## 🏗 Background Processing: 5-Worker 5-Queue Architecture

The system features a robust, sequential, and periodic processing pipeline implemented using BullMQ and Redis.

### 1. Sequential Creation Pipeline
The URL creation process is split into two distinct, awaited steps to ensure maximum security and data integrity:
1.  **Scan Step**: `url.service` enqueues a job to the `scanQueue` and waits for completion.
2.  **Creation Step**: Only if the scan is safe, `url.service` enqueues a job to the `linkCreationQueue` and waits for the database record to be created.
3.  **Fan-out Step**: `linkCreation.worker` stores the URL and then triggers the non-blocking asynchronous tasks (`qrQueue`, `analyticsQueue`, `loggingQueue`).

### 2. Specialized Personnel (Workers)
Each background task has its own dedicated worker file:
-   **scan.worker.ts**: Pure malware scanning (VirusTotal + Google Safe Browsing).
-   **linkCreation.worker.ts**: Database insertion and fan-out trigger.
-   **qr.worker.ts**: QR code generation.
-   **analytics.worker.ts**: Real-time click logging and periodic batch synchronization.
-   **deadLink.worker.ts**: Periodic health checks.
-   **expiry.worker.ts**: Periodic link expiry cleanup.

### 3. Dedicated Queues
Queues are defined in individual files for better modularity:
-   `backend/src/queues/scan.queue.ts`
-   `backend/src/queues/linkCreation.queue.ts`
-   `backend/src/queues/qr.queue.ts`
-   `backend/src/queues/analytics.queue.ts`
-   `backend/src/queues/maintenance.queue.ts`
-   `backend/src/queues/logging.queue.ts`

### 4. Periodic Maintenance Scheduling
The `worker.service.ts` automatically schedules the following tasks:
-   **Analytics Sync**: Every 30 minutes.
-   **Dead Link Detection**: Every 1 hour.
-   **Expiry Cleanup**: Every 10 minutes.

### 5. Execution Pipeline (Workflow)

```mermaid
sequenceDiagram
    participant API as URL Service
    participant SW as Scan Worker
    participant LW as Link Worker
    participant QRW as QR Worker

    API->>SW: Enqueue Scan (Await)
    SW-->>API: Safe!
    API->>LW: Enqueue Creation (Await)
    LW->>DB: INSERT URL
    LW-->>API: Record Created!
    par Asynchronous Fan-out
        LW->>QRW: Enqueue QR
        LW->>AW: Enqueue Analytics Setup
        LW->>LOG: Enqueue Log
    end
    API-->>User: Short Code Response
```

> [!TIP]
> Use the `/workers/queues` API route to monitor the status of all 6 queues simultaneously.
