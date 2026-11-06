import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  TelegramAuthSchema,
  SyncRequestSchema,
} from '@nova-town/shared';
import { BUILDING_CONFIGS } from '@nova-town/economy';

const env = process.env;
const SESSION_TTL_MS = Number(env.SESSION_TTL_DAYS || '7') * 24 * 60 * 60 * 1000;
// Telegram initData signatures are valid for 24h per Telegram docs; enforce it.
const INIT_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface AppDeps {
  /** Injectable PrismaClient (mock in tests). */
  prisma?: PrismaClient;
}

// ---------------------------------------------------------------------------
// Telegram WebApp initData HMAC verification
// ---------------------------------------------------------------------------

/**
 * Verifies the `hash` parameter of Telegram WebApp `initData` using
 * HMAC-SHA256, per https://core.telegram.org/bots/webapps#validating-received-data
 *
 * secretKey  = HMAC-SHA256("WebAppData", botToken)
 * expected   = HMAC-SHA256(secretKey, dataCheckString)
 * dataCheckString = all key=value pairs of initData (except hash),
 *                   sorted by key, joined by "\n".
 */
export function verifyTelegramInitData(initData: string, botToken: string): { valid: boolean; reason?: string } {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return { valid: false, reason: 'missing hash parameter' };

  urlParams.delete('hash');
  const dataCheckString = [...urlParams.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(calculated, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return { valid: false, reason: 'hash format mismatch' };
  if (!crypto.timingSafeEqual(a, b)) return { valid: false, reason: 'hash mismatch' };

  const authDate = Number(urlParams.get('auth_date') || 0);
  if (!authDate) return { valid: false, reason: 'missing auth_date' };
  if (Date.now() - authDate * 1000 > INIT_DATA_MAX_AGE_MS) {
    return { valid: false, reason: 'auth_date expired (>24h)' };
  }
  return { valid: true };
}

/** Parses the trusted user identity from verified initData. */
export function extractTelegramUser(initData: string): { id: string; username?: string } | null {
  try {
    const userStr = new URLSearchParams(initData).get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as { id?: number | string; username?: string };
    // Telegram user ids are positive integers (or numeric strings). Reject
    // anything malformed — identity must come only from trusted data.
    const id = typeof user.id === 'number' ? user.id : user.id != null ? Number(user.id) : NaN;
    if (!Number.isInteger(id) || id <= 0) return null;
    const out: { id: string; username?: string } = { id: String(id) };
    if (typeof user.username === 'string' && user.username.length > 0) out.username = user.username;
    return out;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session tokens (HMAC-signed, stateless, with expiry)
// ---------------------------------------------------------------------------

function signToken(payload: Record<string, unknown>, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function createSessionToken(userId: string, secret: string, now = Date.now()): string {
  return signToken({ userId, iat: now, exp: now + SESSION_TTL_MS }, secret);
}

export function verifySessionToken(token: string, secret: string, now = Date.now()): { valid: boolean; userId?: string; reason?: string } {
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return { valid: false, reason: 'malformed token' };
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig, 'base64url');
  const b = Buffer.from(expected, 'base64url');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad signature' };
  }
  let payload: { userId?: string; exp?: number };
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'bad payload' };
  }
  if (!payload.userId) return { valid: false, reason: 'missing userId' };
  if (typeof payload.exp === 'number' && now > payload.exp) return { valid: false, reason: 'token expired' };
  return { valid: true, userId: payload.userId };
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function getSecrets() {
  return {
    botToken: env.TELEGRAM_BOT_TOKEN,
    sessionSecret: env.JWT_SECRET,
  };
}

export function createApp(deps: AppDeps = {}): FastifyInstance {
  const prisma = deps.prisma ?? new PrismaClient();
  const fastify = Fastify({ logger: false });

  // CORS: an explicit origin allow-list when CORS_ORIGIN is set (comma-separated);
  // otherwise origin reflection is enabled for local development. Production
  // deployments must set CORS_ORIGIN to their concrete origins (never "*").
  const corsOrigin = (env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  fastify.register(cors, { origin: corsOrigin.length > 0 ? corsOrigin : true });

  // Authentication is enforced inside the endpoint handlers (authenticate()),
  // which read the Authorization header, so behavior is directly testable.

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // POST /api/v1/auth/telegram — identity comes ONLY from verified initData.
  fastify.post('/api/v1/auth/telegram', async (request, reply) => {
    const parse = TelegramAuthSchema.safeParse(request.body ?? {});
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: parse.error.flatten() });
    }
    const { initData } = parse.data;
    const { botToken, sessionSecret } = getSecrets();

    // Fail closed: real verification requires the bot token.
    if (!botToken) {
      return reply.status(503).send({ error: 'Telegram auth unavailable: TELEGRAM_BOT_TOKEN not configured' });
    }

    const check = verifyTelegramInitData(initData, botToken);
    if (!check.valid) {
      return reply.status(403).send({ error: 'initData verification failed', reason: check.reason });
    }
    const telegramUser = extractTelegramUser(initData);
    if (!telegramUser) {
      return reply.status(400).send({ error: 'initData does not contain a user' });
    }

    // A session token can only be issued when a session secret is configured.
    // Fail closed — never return an empty or unsigned token.
    if (!sessionSecret) {
      return reply.status(503).send({ error: 'Session issuance unavailable: JWT_SECRET not configured' });
    }

    let result: { user: any; city: any };
    try {
      result = await upsertTelegramUser(prisma, telegramUser);
    } catch (err: any) {
      // DB down => fail closed, never fabricate a user.
      request.log?.error?.(err);
      return reply.status(503).send({ error: 'Database unavailable' });
    }

    const token = createSessionToken(result.user.id, sessionSecret);
    return {
      success: true,
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
      },
      city: result.city
        ? {
            id: result.city.id,
            name: result.city.name,
            balance: Number(result.city.balance),
            level: result.city.level,
          }
        : null,
    };
  });

  // GET /api/v1/city/:cityId — owner-only read of persisted state.
  // (Authentication is enforced inside the handlers via authenticate(), which
  // reads the Authorization header, so it is testable without a guard chain.)
  fastify.get('/api/v1/city/:cityId', async (request, reply) => {
    return handleCityRead(request, reply, prisma);
  });

  // POST /api/v1/city/sync — idempotent, transactional operation processing.
  fastify.post('/api/v1/city/sync', async (request, reply) => {
    return handleCitySync(request, reply, prisma);
  });

  return fastify;
}

// --- endpoint handlers (kept separate so the guard can be injected in tests)

async function handleCityRead(request: any, reply: any, prisma: PrismaClient) {
  const auth = authenticate(request, reply);
  if (!auth) return;
  const cityId = request.params.cityId as string;

  let city: any;
  try {
    city = await prisma.city.findUnique({
      where: { id: cityId },
      include: { buildings: true },
    });
  } catch (err: any) {
    request.log?.error?.(err);
    return reply.status(503).send({ error: 'Database unavailable' });
  }

  if (!city || city.ownerId !== auth.userId) {
    // 404 for foreign cities to avoid leaking existence.
    return reply.status(404).send({ error: 'City not found' });
  }

  return {
    city: {
      id: city.id,
      name: city.name,
      balance: Number(city.balance),
      level: city.level,
    },
    buildings: city.buildings.map((b: any) => ({
      id: b.id,
      type: b.type,
      level: b.level,
      x: b.x,
      y: b.y,
      maintenanceCost: Number(b.maintenanceCost),
      income: b.income === null || b.income === undefined ? null : Number(b.income),
    })),
  };
}

async function handleCitySync(request: any, reply: any, prisma: PrismaClient) {
  const auth = authenticate(request, reply);
  if (!auth) return;

  const parse = SyncRequestSchema.safeParse(request.body ?? {});
  if (!parse.success) {
    return reply.status(400).send({ error: 'Invalid sync payload', details: parse.error.flatten() });
  }
  const { cityId, operations } = parse.data;

  let response: Record<string, unknown>;
  try {
    response = await prisma.$transaction(async (tx: any) => {
      const city = await tx.city.findUnique({ where: { id: cityId } });
      if (!city || city.ownerId !== auth.userId) {
        throw Object.assign(new Error('not-found'), { code: 404 });
      }

      const processed: Array<{ type: string; operationId?: string; status: string }> = [];
      for (const op of operations) {
        // Idempotency: already-applied operations are skipped, never re-applied.
        if (op.operationId) {
          const existing = await tx.operationLog.findUnique({
            where: { cityId_operationId: { cityId, operationId: op.operationId } },
          });
          if (existing) {
            processed.push({ type: op.type, operationId: op.operationId, status: 'DUPLICATE' });
            continue;
          }
        }

        switch (op.type) {
          case 'BUILD': {
            const bType = op.buildingType ?? '';
            const cfg = (BUILDING_CONFIGS as Record<string, { cost: number; income: number; maintenance: number }>)[bType];
            if (!cfg) throw Object.assign(new Error(`unknown building type`), { code: 400 });
            const balance = Number(city.balance);
            if (balance < cfg.cost) {
              throw Object.assign(new Error('insufficient balance'), { code: 400 });
            }
            city.balance = (city.balance as any) - cfg.cost;
            const building = await tx.building.create({
              data: {
                cityId,
                ownerId: city.ownerId,
                type: bType,
                x: op.x ?? 0,
                y: op.y ?? 0,
                maintenanceCost: cfg.maintenance,
                income: cfg.income,
              },
            });
            if (op.operationId) {
              await tx.operationLog.create({
                data: {
                  cityId,
                  operationId: op.operationId,
                  type: op.type,
                  payload: { buildingId: building.id },
                  status: 'COMPLETED',
                  timestamp: new Date(),
                },
              });
            }
            processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
            break;
          }
          case 'UPGRADE': {
            const building = op.buildingId
              ? await tx.building.findUnique({ where: { id: op.buildingId } })
              : null;
            if (!building || building.cityId !== cityId) {
              processed.push({ type: op.type, operationId: op.operationId, status: 'FAILED' });
              continue;
            }
            const cfg = (BUILDING_CONFIGS as Record<string, { cost: number; income: number; maintenance: number }>)[building.type];
            const upgradeCost = cfg ? cfg.cost * building.level : 0;
            if (Number(city.balance) < upgradeCost) {
              throw Object.assign(new Error('insufficient balance for upgrade'), { code: 400 });
            }
            city.balance = (city.balance as any) - upgradeCost;
            await tx.building.update({
              where: { id: building.id },
              data: { level: building.level + 1, upgradedAt: new Date() },
            });
            if (op.operationId) {
              await tx.operationLog.create({
                data: {
                  cityId,
                  operationId: op.operationId,
                  type: op.type,
                  payload: { buildingId: building.id },
                  status: 'COMPLETED',
                  timestamp: new Date(),
                },
              });
            }
            processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
            break;
          }
          case 'DEMOLISH': {
            const building = op.buildingId
              ? await tx.building.findUnique({ where: { id: op.buildingId } })
              : null;
            if (!building || building.cityId !== cityId) {
              processed.push({ type: op.type, operationId: op.operationId, status: 'FAILED' });
              continue;
            }
            await tx.building.delete({ where: { id: building.id } });
            if (op.operationId) {
              await tx.operationLog.create({
                data: {
                  cityId,
                  operationId: op.operationId,
                  type: op.type,
                  payload: { buildingId: building.id },
                  status: 'COMPLETED',
                  timestamp: new Date(),
                },
              });
            }
            processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
            break;
          }
          case 'COLLECT_TAX': {
            const totalIncome = await tx.building
              .aggregate({
                where: { cityId },
                _sum: { income: true },
              });
            const amount = totalIncome._sum.income === null ? 0 : Number(totalIncome._sum.income);
            city.balance = (city.balance as any) + amount;
            await tx.gameTransaction.create({
              data: {
                cityId,
                type: 'COLLECT_TAX',
                amount,
                timestamp: new Date(),
                status: 'COMPLETED',
                metadata: { operationId: op.operationId ?? null },
              },
            });
            // Record in the operation log in the SAME transaction so a replayed
            // COLLECT_TAX with the same operationId is deduplicated (cannot be
            // credited twice).
            if (op.operationId) {
              await tx.operationLog.create({
                data: {
                  cityId,
                  operationId: op.operationId,
                  type: op.type,
                  payload: { amount },
                  status: 'COMPLETED',
                  timestamp: new Date(),
                },
              });
            }
            processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
            break;
          }
        }
      }

      const updated = await tx.city.update({
        where: { id: cityId },
        data: { balance: city.balance },
      });

      return {
        success: true,
        cityId,
        city: {
          id: updated.id,
          name: updated.name,
          balance: Number(updated.balance),
          level: updated.level,
        },
        processedOperations: processed,
        timestamp: new Date().toISOString(),
      };
    });
  } catch (err: any) {
    if (err?.code === 404) {
      return reply.status(404).send({ error: 'City not found' });
    }
    if (err?.code === 400) {
      return reply.status(400).send({ error: err.message });
    }
    request.log?.error?.(err);
    // Any unexpected error rolls back the whole transaction; fail closed.
    return reply.status(503).send({ error: 'Database unavailable or transaction failed' });
  }
  return response;
}

// --- helpers

async function upsertTelegramUser(
  prisma: PrismaClient,
  telegramUser: { id: string; username?: string },
) {
  let user = await prisma.user.findUnique({ where: { telegramId: telegramUser.id } });
  if (!user) {
    const username = telegramUser.username || `Player${telegramUser.id}`;
    const created = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          telegramId: telegramUser.id,
          username,
          email: `telegram+${telegramUser.id}@novatown.local`,
          password: crypto.randomBytes(32).toString('hex'), // unusable; Telegram-only login
        },
      });
      await tx.city.create({
        data: {
          name: `${username}'s City`,
          ownerId: u.id,
          level: 1,
        },
      });
      return u;
    });
    user = created;
  }
  if (!user) {
    throw new Error('Failed to create user after transaction');
  }
  const city = await prisma.city.findFirst({ where: { ownerId: user.id } });
  return { user, city };
}

function authenticate(request: any, reply: any): { userId: string } | null {
  const { sessionSecret } = getSecrets();
  if (!sessionSecret) {
    reply.status(503).send({ error: 'Service misconfigured: JWT_SECRET missing' });
    return null;
  }
  const header: string | undefined = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    reply.status(401).send({ error: 'Missing bearer token' });
    return null;
  }
  const result = verifySessionToken(token, sessionSecret);
  if (!result.valid) {
    reply.status(401).send({ error: `Invalid token: ${result.reason}` });
    return null;
  }
  return { userId: result.userId! };
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

const start = async () => {
  const app = createApp();
  try {
    await app.listen({ port: Number(env.PORT) || 4000, host: '0.0.0.0' });
    console.log('Fastify API server started');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Only auto-start when this file is the process entrypoint — never when the
// module is imported (e.g. by the test runner or by a framework).
import { pathToFileURL } from 'url';
const isEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint && process.env.NODE_ENV !== 'test') {
  start();
}

export default createApp;
