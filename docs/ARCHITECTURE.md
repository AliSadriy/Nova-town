# NovaTown Architecture Documentation

## Overview

NovaTown is a professional 3D city-building simulation game built as a modular monorepo with separate frontend, backend, and shared packages. The architecture supports Web browsers, Telegram Mini Apps, and Android devices while maintaining a single source of truth for game logic and data.

## Design Principles

1. **Platform Separation**: Rendering is handled per-platform while game logic remains shared
2. **Server Authority**: All economy-related operations are validated and processed server-side
3. **Offline-First**: Local operation queues enable gameplay without internet connectivity
4. **Atomic Operations**: All critical operations use database transactions
5. **Type Safety**: Strict TypeScript with Zod validation throughout
6. **Scalability**: Modular architecture allows incremental development and platform-specific optimizations

## Technology Stack

### Frontend (Web & Telegram)
- React 18+ with TypeScript
- Vite for development and bundling
- Three.js with React Three Fiber for 3D rendering
- Zustand for state management
- Zod for runtime type validation
- Tailwind CSS for styling

### Android (React Native)
- React Native with Expo
- Expo GL for WebGL rendering
- React Three Fiber Native for 3D
- Expo SQLite for local persistence
- Expo Secure Store for authentication

### Backend (Fastify)
- Fastify with TypeScript
- PostgreSQL with Prisma ORM
- Pino for structured logging
- JWT authentication
- Swagger documentation

### Shared Packages
- `@nova-town/shared`: Common types and schemas
- `@nova-town/game-core`: Core game logic
- `@nova-town/game-engine`: Rendering abstractions
- `@nova-town/economy`: Economy calculations and validation
- `@nova-town/database`: Database configuration

## Architecture Components

### 1. Game Core (`packages/game-core`)
**Purpose**: Platform-independent game logic
**Key Features**:
- City creation and management
- Building placement and upgrades
- Tax collection and economy integration
- Server-side validation rules
- Operation queuing for offline play

**Files**:
- `src/gameLogic.ts` - Core game mechanics
- `src/validators.ts` - Validation rules

### 2. Game Engine (`packages/game-engine`)
**Purpose**: Platform-agnostic 3D rendering abstractions
**Key Features**:
- Scene management and camera controls
- Building visualization system
- Lighting and shadows
- Platform-specific rendering adapters

**Files**:
- `src/renderingEngine.ts` - Core renderer
- `src/scene.ts` - Scene management

### 3. Economy Package (`packages/economy`)
**Purpose**: Game economy calculations and validation
**Key Features**:
- Tax rate configuration
- Income and expense calculations
- Server-side economy validation
- Currency balance tracking

**Files**:
- `src/calculator.ts` - Economy calculations
- `src/validator.ts` - Validation rules

### 4. Database Package (`packages/database`)
**Purpose**: Database schema and configuration
**Key Features**:
- Prisma schema with relations
- Migration support
- Connection pooling
- Indexing for performance

**Files**:
- `prisma/schema.prisma` - Database model definitions
- `src/index.ts` - Database configuration

### 5. Shared Package (`packages/shared`)
**Purpose**: Common types and validation schemas
**Key Features**:
- TypeScript type definitions
- Zod validation schemas
- Cross-platform data models

**Files**:
- `src/types.ts` - Core data types
- `src/schemas.ts` - Validation schemas

## Platform-Specific Implementations

### Web Application (`apps/web`)
**Features**:
- React + Vite + TypeScript
- Three.js with React Three Fiber
- WebGL renderer
- IndexedDB for offline storage
- Responsive design

**Rendering Pipeline**:
1. React components render Three.js scenes
2. R3F handles scene graph
3. Three.js manages 3D objects
4. WebGL renders to canvas

### Telegram Mini App (`apps/telegram`)
**Features**:
- Telegram WebApp SDK integration
- Same rendering stack as Web
- Mini App-specific UI components
- Haptic feedback support

**Key Differences**:
- Back button integration
- Main button for actions
- Bottom navigation bar

### Android Application (`apps/android`)
**Features**:
- React Native with Expo
- Expo GL for WebGL context
- React Three Fiber Native
- Native modules for camera and sensors
- SQLite for local persistence

**Rendering Pipeline**:
1. Expo GL provides WebGL context
2. Three.js renders to GL context
3. React Native bridges visual results
4. Native components overlay UI

## Offline Synchronization

### Operation Queue Architecture

1. **Local Operations**: Actions performed offline are queued with unique IDs
2. **Operation Types**: `tax_collection`, `building_upgrade`, `city_update`, `transfer`
3. **Validation**: Server validates all operations before processing
4. **Conflict Resolution**: Server-side deduplication and replay protection

### Sync Protocol

**Client → Server**:
```json
{
  "cityId": "uuid",
  "operations": [
    {
      "id": "uuid",
      "type": "building_upgrade",
      "cityId": "uuid",
      "payload": {"buildingId": "uuid", "newLevel": 2},
      "timestamp": "2026-10-31T00:00:00.000Z"
    }
  ]
}
```

**Server Response**:
```json
{
  "transaction": {
    "processed": [...],
    "errors": [...] 
  }
}
```

### Conflict Resolution Rules

1. **Duplicate IDs**: Skip with "duplicate" status
2. **Invalid Operations**: Reject with error details
3. **Balance Constraints**: Reject operations that would cause negative balance
4. **Order Validation**: Process operations in chronological order

## Security Architecture

### Authentication
- JWT tokens with short expiration
- Token validation on all sensitive endpoints
- Refresh tokens for long-lived sessions

### Authorization
- City ownership verification
- Permission checks for building operations
- Role-based access control

### Data Validation
- Zod schemas for all API inputs
- Server-side validation for all economy operations
- Integrity checks for city state

### Security Controls
- Rate limiting on authentication endpoints
- Input sanitization
- HTTPS enforcement
- CORS restrictions

## Performance Considerations

### Rendering Performance
- Object pooling for frequently created/destroyed objects
- Level-of-detail (LOD) systems
- Frustum culling
- Shadow map optimization

### Database Performance
- Indexes on frequently queried fields
- Connection pooling
- Query optimization
- Caching strategies

### Memory Management
- Disposing of Three.js objects when no longer needed
- Memory monitoring and cleanup
- Efficient data structures

## Development Workflow

### Monorepo Development
```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm build

# Type check all projects
pnpm typecheck

# Lint all projects
pnpm lint

# Start development servers
pnpm dev:web      # Port 3000
pnpm dev:telegram  # Port 3001
pnpm dev:android   # Expo CLI
pnpm dev:api      # Port 4000
```

### Testing Strategy
- Unit tests for shared packages
- Integration tests for API endpoints
- Manual testing for 3D rendering
- Platform-specific testing for Android

## Cross-Platform Consistency

### Shared Code
- All platforms use the same game-core and economy packages
- Common data formats and protocols
- Unified authentication system
- Consistent API responses

### Platform Differences
- Rendering implementation varies
- Input handling differs (mouse/touch/keyboard)
- UI components are platform-specific
- Storage mechanisms differ (WebSQL vs IndexedDB)

## Future Extensibility

### Architecture for Growth
- Plugin system for new building types
- Modular rendering pipeline
- Extensible economy calculator
- Database migration system

### Platform Expansion
- WebXR for VR support
- Progressive Web App features
- Cross-platform save states
- Cloud synchronization

## Known Limitations

### Android Rendering
- React Three Fiber Native integration with Expo GL requires careful version management
- Android device compatibility varies
- Performance may differ from Web implementation

### Offline Limitations
- Large operation queues may impact performance
- Sync conflicts require server intervention
- Limited undo functionality

### Database Constraints
- PostgreSQL connection pool sizing
- Transaction isolation levels
- Migration management

## Monitoring and Observability

### Logging
- Pino structured logging
- Performance metrics
- Error tracking
- Analytics integration

### Health Checks
- Database connectivity
- API endpoint availability
- Rendering performance
- Memory usage

## Conclusion

NovaTown's architecture prioritizes:

1. **Separation of Concerns**: Clear boundaries between rendering, logic, and data
2. **Platform Independence**: Shared logic with platform-specific rendering
3. **Offline Capability**: Seamless offline experience with reliable sync
4. **Scalability**: Modular design allows for incremental development
5. **Maintainability**: Strict typing and comprehensive documentation

This foundation provides a solid base for building a professional 3D city-building game across Web, Telegram, and Android platforms.