# NOVA TOWN — RELEASE CHECKLIST

## Overview
This release checklist establishes the readiness criteria, verified components, environment configurations, and deployment steps for Nova Town MVP release.

---

## 1. Verified Release Components
- [x] **Monorepo Structure & Build Pipeline:** Verified via `pnpm build:packages` (Exit code `0`).
- [x] **Game Core & Grid Math:** Verified via unit tests (`gridSystem.test.ts`, `buildingPlacement.test.ts`, `roadSystem.test.ts`).
- [x] **Camera & Interaction System:** Verified via unit tests (`camera.test.ts`) and shared `CameraController`.
- [x] **Economy & Calculations:** Verified via unit tests (`economy.test.ts`).
- [x] **Persistence & Offline Sync:** Verified via unit tests (`persistence.test.ts`).
- [x] **Web Application Client:** Verified via production Vite build (`@nova-town/web`, Exit code `0`).
- [x] **Telegram Mini App Client:** Verified via production Vite build (`@nova-town/telegram`, Exit code `0`).
- [x] **Backend API Server:** Verified via TypeScript build (`@nova-town/api`).

---

## 2. Environment Configuration & Variables
To run or deploy Nova Town services in production, configure the following environment variables:

- `PORT` (default: `4000` for API server)
- `DATABASE_URL` (PostgreSQL connection string for Prisma ORM)
- `JWT_SECRET` (Secret key for player session tokens)
- `TELEGRAM_BOT_TOKEN` (Bot token for verifying Telegram Mini App `initData`)

---

## 3. Execution & Deployment Commands

### Development Setup
```bash
pnpm install
```

### Running Automated Test Suites
```bash
# Run all package test suites
pnpm --filter @nova-town/shared test
pnpm --filter @nova-town/economy test
pnpm --filter @nova-town/game-core test
pnpm --filter @nova-town/game-engine test
```

### Building Packages & Applications
```bash
# Build workspace shared packages
pnpm build:packages

# Build Web application
pnpm --filter @nova-town/web build

# Build Telegram Mini App
pnpm --filter @nova-town/telegram build

# Build API Server
pnpm --filter @nova-town/api build
```

---

## 4. Release Blockers & External Requirements
1. **Live PostgreSQL Database:** Provision a managed PostgreSQL instance and run Prisma migrations (`npx prisma migrate deploy`).
2. **Android SDK Environment:** To generate native Android APKs (`expo run android`), run on a host machine equipped with Android Studio, Android SDK, and Java JDK.
3. **Telegram Bot Registration:** Configure the Mini App URL within the Telegram BotFather settings for live Telegram integration.
