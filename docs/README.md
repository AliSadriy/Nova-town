# NovaTown Project Structure

This repository contains the zero-to-one foundation for NovaTown, a professional 3D city-building simulation game with Web, Telegram Mini App, and Android platforms.

## Project Overview

NovaTown is a SimCity-inspired city-building game where players:

- Start with an empty city
- Build residential, commercial, and industrial buildings
- Expand territory
- Generate passive virtual income
- Upgrade buildings
- Complete missions
- Unlock new content
- Develop cities over time

## Technology Stack

- **Frontend (Web & Telegram)**: React, TypeScript, Vite, Three.js, React Three Fiber, Tailwind CSS
- **Android**: React Native, Expo, React Three Fiber Native, Expo GL
- **Backend**: Fastify, TypeScript, PostgreSQL, Prisma ORM
- **Shared**: Zustand, Zod, TypeScript
- **Monorepo**: pnpm workspaces

## Architecture

### Apps

- `apps/web` - Web application
- `apps/telegram` - Telegram Mini App
- `apps/android` - Android application
- `apps/api` - Backend API server

### Packages

- `packages/game-core` - Platform-independent game logic
- `packages/game-engine` - 3D rendering abstractions
- `packages/shared` - Shared types and schemas
- `packages/economy` - Game economy calculations
- `packages/database` - Prisma schema and database configuration
- `packages/config` - Shared ESLint, TypeScript, and Tailwind configurations

## Phase 1 Status

This repository contains the complete Phase 1 foundation with:

- Modular monorepo structure
- Web application with 3D rendering
- Backend API with health checks
- Shared TypeScript types and schemas
- Database schema with PostgreSQL support
- Economy calculations
- Game logic core
- Rendering engine abstractions

## Development Commands

From the root directory:

```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm build

# Run type checks across all projects
pnpm typecheck

# Run linting across all projects
pnpm lint

# Start the Web application (port 3000)
pnpm dev:web

# Start the Telegram application (port 3001)
pnpm dev:telegram

# Start the Android application (Expo CLI)
pnpm dev:android

# Start the API server (port 4000)
pnpm dev:api

# Database operations
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Documentation

- `ARCHITECTURE.md` - Detailed architecture documentation
- `DEVELOPMENT.md` - Development setup and guide
- `PHASE_1_REPORT.md` - Phase 1 implementation report

## Offline Synchronization

NovaTown supports offline gameplay with:

- Local operation queues (IndexedDB for Web/Telegram, SQLite for Android)
- Server-side validation and conflict resolution
- Automatic synchronization when connectivity is restored
- UUID-based operation IDs to prevent duplicates

## Security

- All API endpoints require authentication via JWT
- Server-side validation for all economy-related operations
- No client-side trust for currency balances or transactions
- Atomic database transactions for critical operations

## Next Steps

After Phase 1 approval, future phases will include:

- Full gameplay implementation (building placement, economy, taxation)
- Advanced 3D city visualization and terrain generation
- Real-time multiplayer support
- Mobile-specific features (camera controls, touch interactions)
- Performance optimization and cross-platform consistency
- CI/CD pipeline and automated testing

## Known Issues

- Android 3D rendering compatibility with React Three Fiber Native and Expo GL requires further testing and optimization
- Android build process needs to be verified with Expo EAS
- Some platform-specific optimizations may be required for production performance

## Project Structure

```
nova-town/
├── apps/
│   ├── web/                 # Web application
│   ├── telegram/            # Telegram Mini App
│   ├── android/             # Android application
│   └── api/                 # Backend API
│
├── packages/
│   ├── game-core/           # Game logic core
│   ├── game-engine/         # 3D rendering engine
│   ├── shared/              # Shared types and schemas
│   ├── economy/             # Economy calculations
│   ├── database/            # Database configuration
│   └── config/              # Shared configurations
│
├── docs/                    # Documentation
├── package.json
├── pnpm-workspace.yaml
└── README.md
```