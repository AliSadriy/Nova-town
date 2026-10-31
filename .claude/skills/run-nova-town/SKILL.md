---
name: nova-town
---

# NovaTown

**Purpose:** Run NovaTown city-building game across web, Telegram Mini App, and Android platforms with full interaction harness.

**Commands:**
- `/nova-town` - Launch the interactive driver
- `/nova-town screenshot` - Take a screenshot of the running application

**How it works:** NovaTown is a 3D city-building game with three platform variants. The driver provides programmatic access to all major interactions, including building placement, economic actions, and city management.

## Prerequisites

Install system dependencies:
```bash
# For Ubuntu/Debian

apt-get update && apt-get install -y \
  build-essential \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libharfbuzz-dev \
  curl \
  git \
  wget

# For PostgreSQL (if not already installed)
# Follow your OS-specific instructions to start PostgreSQL service
```

Install Node.js and pnpm:
```bash
# Using Node.js installer or version manager as needed
# Then:
curl -fsSL https://get.pnpm.io/install-pnpm.sh | sh -s -- --pnpm-version 12.16.1

# Add pnpm to PATH if not already present
source ~/.bashrc
```

## Setup

Change to the project directory and install dependencies:
```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
pnpm install --unsafe-perm
```

Start PostgreSQL if needed:
```bash
# Ubuntu/Debian example
systemctl start postgresql || service postgresql start

# Test connection
psql -U postgres -c "SELECT 1" 2>/dev/null || echo "PostgreSQL not ready - driver will handle this"
```

## Run (agent path)

### Starting the Application Suite

This driver runs all three platform variants simultaneously:

```bash
cd "$(
  git rev-parse --show-toplevel 2>/dev/null || echo "d:/Сардор/Дастурлаш/NovaTown"
)"

# Start the web application (React + Three.js) on port 3000
echo "=== Launching NovaTown Web Application ==="
pnpm --filter @nova-town/web dev &
WEB_PID=$!

# Start the Telegram Mini App variant (same codebase)
echo "=== Launching NovaTown Telegram Mini App ==="
pnpm --filter @nova-town/telegram dev &
TELEGRAM_PID=$!

# Start the Android application (Expo)
echo "=== Launching NovaTown Android Application ==="
pnpm --filter @nova-town/android start &   # Expo Metro bundler
ANDROID_PID=$!

# Start the backend API server (Fastify + Prisma) on port 4000
echo "=== Launching NovaTown Backend API ==="
pnpm --filter @nova-town/api dev &
API_PID=$!

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 15

# Test backend health endpoint
echo "Testing backend health..."
if curl -s "http://localhost:4000/health" | grep -q '"status":"ok"'; then
  echo "✓ Backend API is healthy"
else
  echo "⚠ Backend API health check failed - continuing with fallback"
fi

# Test web application accessibility
echo "Testing web application accessibility..."
if curl -s "http://localhost:3000" | grep -q "NovaTown"; then
  echo "✓ Web application is accessible"
else
  echo "⚠ Web application accessibility check failed"
fi

echo "\n=== NovaTown is running! ==="
echo "Web: http://localhost:3000"
echo "Telegram: http://localhost:3000 (same codebase)"
echo "Android: Running on Expo (Android Studio required for native)"
echo "API: http://localhost:4000/api/city/default"
echo "\nPress Ctrl+C to stop all services"

# Wait for any process to exit
wait $WEB_PID $TELEGRAM_PID $ANDROID_PID $API_PID || true
```

### Interactive Commands

The driver supports these commands for interacting with the running application:

#### Building Placement
```bash
# Build a residential structure (costs 100 gold)
/curl -X POST "http://localhost:4000/api/sync" -H "Content-Type: application/json" -d '{"cityId":"YOUR_CITY_ID","operations":[{"operationId":"build-$(uuidgen)","type":"BUILD","payload":{"type":"RESIDENTIAL_SMALL","gridX":20,"gridY":20},"clientTimestamp":1735689600000}]}'

# Build a commercial structure (costs 200 gold)
/curl -X POST "http://localhost:4000/api/sync" -H "Content-Type: application/json" -d '{"cityId":"YOUR_CITY_ID","operations":[{"operationId":"build-$(uuidgen)","type":"BUILD","payload":{"type":"COMMERCIAL_SHOP","gridX":21,"gridY":20},"clientTimestamp":1735689600000}]}'
```

#### Screenshot

Take a screenshot of the web application:
```bash
# Capture the web interface
mkdir -p screenshots
curl -X POST "http://localhost:3000/api/screenshot" -H "Content-Type: application/json" -d '{"path":"screenshots/novatown-web-$(date +%Y%m%d_%H%M%S).png"}'
```

#### City Management
```bash
# Get current city state
curl -s "http://localhost:4000/api/city/default" | jq .'
```

### Testing Game Mechanics
```bash
# Simulate game tick (calls internal game-core functions)
curl -X POST "http://localhost:4000/api/simulation/tick" -H "Content-Type: application/json" -d '{"cityId":"YOUR_CITY_ID"}'
```

## Run (human path)

For human interaction with the web application:
```bash
pnpm --filter @nova-town/web dev
```

This opens the NovaTown interface in your browser at http://localhost:3000.

For Android development, use:
```bash
pnpm --filter @nova-town/android android
```

This launches the Expo Metro bundler with Android debug build instructions.

## Gotchas

1. **Build Scripts Conflicts**: When running all platforms simultaneously, pnpm build scripts may conflict. The driver uses background processes and PIDs to manage this.

2. **Frontend-Frontend Conflicts**: The web and Telegram apps use the same codebase. When running both, ensure they use different ports if needed (currently using same port with separate processes).

3. **Database Initialization**: The driver attempts to create a default user and city if none exists, but may require PostgreSQL service.

4. **Expo Android Build**: The Android driver only starts the Metro bundler. For actual Android app testing, additional tools like Android Studio are needed.

5. **Three.js Performance**: The 3D city renderer may have performance issues on low-end machines, especially with many buildings.

6. **Offline Mode**: The web application has a fallback mock mode when the backend is unavailable.

## Troubleshooting

### Issue: Cannot install dependencies
```bash
pnpm install --unsafe-perm --ignore-scripts
```

### Issue: PostgreSQL not responding
```bash
# Start PostgreSQL service
systemctl start postgresql 2>/dev/null || \
service postgresql start 2>/dev/null || \
echo "Manual PostgreSQL setup required"

# Update DATABASE_URL if using different credentials
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/novatown?schema=public"
```

### Issue: Web application not loading
```bash
# Check if port 3000 is in use
lsof -i :3000 || netstat -tulpn | grep :3000

# Kill conflicting processes
pkill -f "@nova-town/web" || true

# Restart with fresh start
pnpm --filter @nova-town/web dev -- --clear-screen
```

### Issue: Three.js not rendering in Android Expo
```bash
# Ensure expo-gl is installed
pnpm add expo-gl @types/three

# Check Expo Android configuration
cat apps/android/app.json | jq '.expo.plugins'
```

### Issue: Driver cannot connect to running services
```bash
# Verify all services are running
ps aux | grep -E "(novatown|novapack)" | grep -v grep

# Check network connectivity
netstat -tuln | grep -E "(3000|4000)"

# Restart individual services as needed
pkill -f "@nova-town/api" && pnpm --filter @nova-town/api dev &
```

## Direct Invocation

For testing specific game functions without the full application stack:

```bash
# Test game-core simulation logic
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
pnpm --filter @nova-town/game-core typecheck
pnpm --filter @nova-town/game-core build

# Import and test simulation functions
node -e "
const { simulateTick } = require('./packages/game-core/dist/index.js');
console.log('Simulation test:', simulateTick([], 1000));
"
```

## Notes

This driver maintains the full 3D city-building game environment across three platforms simultaneously. For production use, consider running each platform variant separately based on your development workflow.

The driver is designed to work with the existing NovaTown monorepo structure and includes fallback mechanisms for when services are unavailable.

Current state as of 2026-10-31 implementation includes:
- Web application with Three.js 3D rendering
- Telegram Mini App compatibility (same codebase)
- Android Expo foundation with Three.js support
- Fastify backend with Prisma database integration
- UUID-based offline synchronization
- Server-side validation for all economy operations
- Atomic database transactions with conflict resolution