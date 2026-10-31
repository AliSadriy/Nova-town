# NovaTown Skill README

## Overview

This skill provides programmatic control over the NovaTown city-building game across three platforms: Web, Telegram Mini App, and Android. It includes a comprehensive interaction harness for development, testing, and verification.

## Key Features

- **Multi-platform support**: Web, Telegram, and Android applications
- **Full interaction harness**: Build placement, city management, screenshots
- **Health monitoring**: Automatic service status checks
- **Database integration**: Server-side validation and synchronization
- **TypeScript support**: Strict type checking and compilation
- **Docker readiness**: Built for containerized deployment

## Installation

The skill is pre-installed in the project. To use it:

```bash
# The skill is auto-loaded by Claude Code
cd path/to/novatown
claude /nova-town
```

## Usage

### Basic Commands

- `/nova-town` - Launch the interactive driver and start all platform variants
- `/nova-town screenshot` - Take a screenshot of the running application

### Agent Path (Recommended)

The driver provides programmatic access for automated testing and development:

```bash
# Start all services
cd /path/to/novatown
cd .claude/skills/run-nova-town
node driver.mjs
```

### Interactive Methods

The `NovaTownDriver` class provides these key methods:

- `startAll()` - Start all platform variants
- `buildAndSync()` - Build all packages and sync dependencies
- `takeScreenshot(platform)` - Capture screenshots
- `buildStructure(type, x, y, cityId)` - Place buildings
- `getCityData(cityId)` - Fetch city information
- `runSimulation(cityId)` - Run game simulation
- `stopAll()` - Stop all services
- `getStatus()` - Get current system status

### Example Usage

```javascript
const { NovaTownDriver } = require('./driver.mjs');

const driver = new NovaTownDriver();

async function main() {
  // Start all services
  await driver.startAll();

  // Build a residential structure
  await driver.buildStructure('RESIDENTIAL_SMALL', 20, 20);

  // Get city data
  const cityData = await driver.getCityData();

  // Run simulation
  await driver.runSimulation();

  // Take screenshot
  await driver.takeScreenshot('web');

  // Stop services
  await driver.stopAll();
}

main().catch(console.error);
```

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 12.16.1
- PostgreSQL (for database operations)
- Docker (optional, for containerized deployment)

### Building and Testing

```bash
# Build all packages
cd path/to/novatown
pnpm run build

# Type check all packages
pnpm run typecheck

# Run tests
pnpm run test
```

### Backend Development

The backend API (`apps/api`) uses Fastify with:
- Prisma ORM for database operations
- Zod for validation
- PostgreSQL with connection pooling

### Frontend Development

The web application (`apps/web`) uses:
- React 18 with TypeScript
- Vite for bundling
- Three.js for 3D rendering
- Tailwind CSS for styling

### Android Development

The Android application (`apps/android`) uses:
- Expo with React Native
- Three.js with Expo GL
- Native building placement system

## Architecture

### Directory Structure

```
nova-town/
├── apps/
│   ├── web/                 # Web application
│   ├── telegram/            # Telegram Mini App
│   ├── android/             # Android application
│   └── api/                 # Backend API
│
├── packages/
│   ├── game-core/           # Game logic
│   ├── game-engine/         # 3D rendering
│   ├── shared/              # Shared types
│   ├── economy/             # Economic logic
│   ├── database/            # Database schemas
│   └── config/              # Configuration
│
├── .claude/
│   └── skills/
│       └── run-nova-town/   # This skill directory
└── docs/                    # Documentation
```

### Platform Integration

- **Web & Telegram**: Share the same React codebase
- **Android**: Native React Native with Expo
- **API**: Central backend serving all platforms
- **Database**: PostgreSQL with Prisma ORM
- **Game Engine**: Three.js-based 3D rendering

## Features

### Game Mechanics

- **Building Types**: Residential, Commercial, Industrial, Parks, Roads
- **Economy**: Gold management, taxes, upgrades
- **City Management**: Population, infrastructure, zoning
- **Progress**: Levels, XP, achievements
- **Offline Mode**: Local operation queuing

### Technical Features

- **Real-time 3D Rendering**: Three.js with isometric projections
- **Responsive Design**: Mobile-first approach
- **Offline Support**: IndexedDB and SQLite persistence
- **Synchronization**: UUID-based operation queuing
- **Validation**: Server-side transaction validation
- **Atomic Operations**: Database transactions with rollback

### Security

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Validation**: Zod schema validation
- **Encryption**: TLS for all network communications
- **Audit Logging**: Comprehensive operation logs

## Testing

### Automated Testing

The skill includes comprehensive testing capabilities:

```bash
# Run all tests
pnpm run test:all

# Run specific test suites
pnpm run test:api
pnpm run test:web
pnpm run test:e2e
```

### Manual Testing

Use the driver for interactive testing:

```bash
# Start services and test interactively
node driver.mjs
```

## Production Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --only=production
COPY . .
RUN pnpm run build
EXPOSE 3000 4000
CMD ["pnpm", "--filter", "@nova-town/api", "start"]
```

### Environment Variables

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/novatown
PORT=4000
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://novatown.com
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check PostgreSQL service
   systemctl status postgresql
   # or
   service postgresql status
   ```

2. **Build Script Conflicts**
   ```bash
   # Clean lockfile
   rm pnpm-lock.yaml
   pnpm install --unsafe-perm
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :4000
   ```

4. **Three.js Rendering Issues**
   ```bash
   # Check WebGL support
   # Ensure browser has WebGL enabled
   ```

### Getting Help

- **Documentation**: See `docs/` for detailed guides
- **Support**: Check `README.md` for development setup
- **Issues**: Report bugs in the issue tracker

## License

This skill is part of the NovaTown project. See `LICENSE.md` for details.

## Version

Current version: 1.0.0
Last updated: 2026-10-31

---

*This skill was generated as part of the NovaTown city-building game project.*