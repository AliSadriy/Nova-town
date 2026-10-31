# NovaTown Development Guide

## Overview

This document provides comprehensive instructions for setting up, developing, and testing NovaTown across all platforms. It covers environment setup, development workflows, build processes, and troubleshooting.

## Prerequisites

### System Requirements

- **Operating System**: Windows 10 Pro or higher, macOS, or Linux
- **Node.js**: >= 20.0.0
- **pnpm**: >= 12.0.0
- **PostgreSQL**: 14+ (for production)

### Development Environment Setup

1. **Clone the repository**:
```bash
https://github.com/novatown/novatown.git
cd novatown
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:
Create `.env.local` in the project root:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/novatown?schema=public"
PORT=4000
NODE_ENV="development"
JWT_SECRET="super-secret-nova-town-jwt-key"
CORS_ORIGIN="*"
```

4. **Initialize database**:
```bash
pnpm db:migrate
pnpm db:generate
```

5. **Verify PostgreSQL connection**:
```bash
# Test database connection
psql -h localhost -U postgres -d novatown -c "SELECT 1"
```

## Development Workflows

### Core Development Commands

#### From Project Root

```bash
# Install all dependencies (one-time)
pnpm install

# Build all packages and applications
pnpm build

# Type check all projects
pnpm typecheck

# Lint all projects
pnpm lint

# Development servers
pnpm dev:web      # Web app (port 3000)
pnpm dev:telegram  # Telegram Mini App (port 3001)
pnpm dev:android   # Android (Expo CLI)
pnpm dev:api      # API server (port 4000)
```

#### Package-specific Development

```bash
# Web application development
pnpm --filter @nova-town/web dev
pnpm --filter @nova-town/web typecheck
pnpm --filter @nova-town/web lint

# Telegram application development
pnpm --filter @nova-town/telegram dev
pnpm --filter @nova-town/telegram typecheck
pnpm --filter @nova-town/telegram lint

# Android application development
pnpm --filter @nova-town/android android
pnpm --filter @nova-town/android typecheck
pnpm --filter @nova-town/android lint

# API server development
pnpm --filter @nova-town/api dev
pnpm --filter @nova-town/api typecheck
pnpm --filter @nova-town/api lint

# Package development
pnpm --filter @nova-town/shared build
pnpm --filter @nova-town/game-core build
pnpm --filter @nova-town/game-engine build
pnpm --filter @nova-town/economy build
pnpm --filter @nova-town/database build
```

### Build Process

#### Web Application Build
```bash
pnpm --filter @nova-town/web build
# Output: dist/ directory with optimized bundles
```

#### Telegram Application Build
```bash
pnpm --filter @nova-town/telegram build
# Output: dist/ directory with optimized bundles
```

#### Android Application Build
```bash
pnpm --filter @nova-town/android build
# Output: android/app/src/main/assets/bundle.js
```

#### API Server Build
```bash
pnpm --filter @nova-town/api build
# Output: dist/ directory with compiled TypeScript
```

### Testing Strategy

#### Type Checking
```bash
# Full monorepo type check
pnpm typecheck

# Individual package type check
pnpm --filter @nova-town/shared typecheck
pnpm --filter @nova-town/game-core typecheck
pnpm --filter @nova-town/api typecheck
```

#### Linting
```bash
# Full monorepo linting
pnpm lint

# Individual package linting
pnpm --filter @nova-town/shared lint
pnpm --filter @nova-town/game-core lint
pnpm --filter @nova-town/api lint
```

#### Database Tests
```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Test database connection
pnpm exec ts-node scripts/test-database.ts
```

#### Web Application Tests
```bash
# Start Web dev server
pnpm dev:web

# Open browser to http://localhost:3000
# Test 3D rendering and interactions manually
```

#### Android Tests
```bash
# Start Expo CLI
pnpm dev:android

# Scan QR code with Expo Go app
# Test touch interactions and 3D rendering
```

## Platform-Specific Development

### Web Application Development

#### Project Structure
```
apps/web/
├── src/
│   ├── components/        # React components
│   ├── scenes/            # 3D scene definitions
│   ├── stores/            # Zustand stores
│   ├── utils/             # Helper functions
│   └── hooks/             # Custom hooks
├── public/                 # Static assets
└── vite.config.js         # Vite configuration
```

#### Key Features
- Three.js + React Three Fiber integration
- WebGL renderer with antialiasing
- Orbit controls for camera
- Shadow mapping
- Environment mapping

#### Development Tips
- Use `clsx` for conditional class names
- Implement component props interfaces strictly
- Use TypeScript discriminated unions for complex state
- Follow atomic design principles for components

### Telegram Mini App Development

#### Integration Points
- `window.TelegramWebApp` object
- `Telegram.WebApp.BackButton`
- `Telegram.WebApp.MainButton`
- `Telegram.WebApp.HapticFeedback`

#### Development Workflow
1. Initialize Telegram WebApp
2. Implement Mini App UI
3. Add platform-specific components
4. Test in Telegram environment

### Android Application Development

#### Expo Configuration
```json
{
  "expo": {
    "name": "NovaTown",
    "slug": "novatown",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      ["expo-gl", {}]
    ]
  }
}
```

#### Native Development
- Use React Native components
- Implement Expo GL for 3D rendering
- Use SQLite for local persistence
- Integrate with native sensors and cameras

#### Development Commands
```bash
# Start Expo CLI in development mode
pnpm dev:android

# Build for production
pnpm --filter @nova-town/android build

# Run on physical Android device
pnpm --filter @nova-town/android android

# Run on Android emulator
pnpm --filter @nova-town/android android --device-id <emulator-id>
```

## Offline Development

### Local Operation Queue Testing

#### Web (IndexedDB)
```typescript
import { openDB } from 'idb';

const db = await openDB('novatown-db', 1, {
  upgrade(db) {
    db.createObjectStore('operations', { keyPath: 'id' });
    db.createObjectStore('cities', { keyPath: 'id' });
  }
});
```

#### Android (SQLite)
```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('novatown.db');

// Create operations table
db.execAsync(`
  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    city_id TEXT,
    type TEXT,
    payload TEXT,
    timestamp INTEGER,
    status TEXT
  )
`);
```

### Sync Testing
```bash
# Test API sync endpoint
curl -X POST http://localhost:4000/api/v1/operations/sync \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "test-city-id",
    "operations": [
      {
        "id": "test-operation-id",
        "type": "tax_collection",
        "cityId": "test-city-id",
        "payload": {"amount": 100},
        "timestamp": "2026-10-31T00:00:00.000Z"
      }
    ]
  }'
```

## Debugging and Troubleshooting

### Common Issues and Solutions

#### Web Application Issues

**Issue**: 3D rendering not working
**Solution**:
```bash
# Check browser console for WebGL errors
# Ensure WebGL is supported
# Try different browser (Chrome, Firefox, Edge)
# Check for extension conflicts (uBlock Origin, etc.)
```

**Issue**: React Three Fiber not mounting
**Solution**:
```typescript
// Ensure canvas ref is properly set
<Canvas ref={canvasRef} ...>
  <mesh>...</mesh>
</Canvas>
```

#### Android Application Issues

**Issue**: React Three Fiber Native not working
**Solution**:
```bash
# Ensure Expo GL is properly installed
# Check device compatibility
# Try different device
# Restart Expo CLI
```

**Issue**: SQLite not working
**Solution**:
```typescript
// Check database permissions
// Ensure database is created before use
// Handle database upgrades properly
```

#### Database Issues

**Issue**: Connection fails
**Solution**:
```bash
# Check PostgreSQL service is running
# Verify connection string in .env.local
# Check firewall settings
# Test with psql command line
```

**Issue**: Migration fails
**Solution**:
```bash
# Check Prisma schema syntax
# Verify database permissions
# Run migrations manually
# Check for conflicting connections
```

### Debugging Tools

#### Browser Tools
- Chrome DevTools for React and network
- Three.js Inspector for 3D scene
- Lighthouse for performance auditing

#### Android Tools
- Expo Go app for testing on devices
- React Native Debugger for state management
- Metro bundler for bundle analysis

#### API Debugging
- Fastify built-in error handling
- Pino structured logging
- Swagger documentation

## Performance Optimization

### Web Performance
- Use Code Splitting with React.lazy()
- Implement lazy loading for 3D models
- Optimize Three.js materials and geometries
- Use requestAnimationFrame for smooth animations

### Android Performance
- Optimize for mobile processors
- Use appropriate texture sizes
- Implement memory management
- Use Expo GL efficiently

### Database Performance
- Create indexes on frequently queried fields
- Use Prisma query optimization
- Implement connection pooling
- Use selective data loading

## Deployment

### Web Deployment
```bash
# Build for production
pnpm build

# Deploy to hosting service (Vercel, Netlify, etc.)
# Configure environment variables
# Set up custom domain
```

### Telegram Mini App Deployment
```bash
# Build for production
pnpm --filter @nova-town/telegram build

# Upload to Telegram App Store
# Configure bot settings
# Set up development bot
```

### Android Deployment
```bash
# Build for production
pnpm --filter @nova-town/android build

# Upload to Google Play Console
# Configure app details
# Set up internal testing
```

### API Deployment
```bash
# Build for production
pnpm --filter @nova-town/api build

# Deploy to hosting service (AWS, DigitalOcean, etc.)
# Configure environment variables
# Set up monitoring and logging
```

## Version Control

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Commit with descriptive message
# Push to remote branch
# Create pull request

# Commit message format
"feat: add new game feature

- Implement building upgrade system
- Add economy calculations
- Update API endpoints

Co-authored-by: Claude Code <noreply@anthropic.com>"
```

### Branch Strategy
- `main`: Production-ready code
- `develop`: Latest development version
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency fixes

## Monitoring and Maintenance

### Health Checks
```bash
# Database health
curl -s http://localhost:4000/health

# API health
curl -s http://localhost:4000/api/v1/cities

# Web application health
curl -s http://localhost:3000
```

### Logging
- Pino structured logging in API
- Console logging in Web
- Log level management

### Backups
- Daily PostgreSQL backups
- Local storage backups
- Sync queue backups

## Conclusion

This development guide provides comprehensive instructions for working with NovaTown across all platforms. By following these guidelines, developers can:

1. Set up development environments efficiently
2. Maintain code quality with consistent workflows
3. Debug issues effectively
4. Optimize performance for production
5. Deploy applications successfully

The modular architecture and clear separation of concerns make NovaTown maintainable and extensible for future development.