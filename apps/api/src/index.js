import Fastify from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { TelegramAuthSchema, SyncRequestSchema, } from '@nova-town/shared';
import { BUILDING_CONFIGS } from '@nova-town/economy';
const env = process.env;
// Decimal is Prisma's decimal type: safe monetary arithmetic without
// JavaScript floating-point conversion.
const Decimal = Prisma.Decimal;
// Telegram initData signatures are valid for 24h per Telegram docs; enforce it.
const INIT_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// ---------------------------------------------------------------------------
// Session TTL validation
// ---------------------------------------------------------------------------
/** Hard maximum session lifetime: 30 days. Tokens longer than this are rejected. */
export const MAX_SESSION_TTL_DAYS = 30;
const MAX_SESSION_TTL_MS = MAX_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
/** Documented clock-skew tolerance applied to iat/exp window checks. */
export const CLOCK_SKEW_MS = 60 * 1000;
/**
 * Resolves and validates SESSION_TTL_DAYS from the environment.
 * Must be a finite positive number of days, not exceeding MAX_SESSION_TTL_DAYS.
 * Throws on any invalid value so that application startup fails closed.
 */
export function resolveSessionTtlMs(envVar) {
    const raw = (envVar ?? env.SESSION_TTL_DAYS ?? '7').trim();
    const days = Number(raw);
    if (!Number.isFinite(days)) {
        throw new Error(`SESSION_TTL_DAYS must be a finite number of days (got ${JSON.stringify(raw)})`);
    }
    if (days <= 0) {
        throw new Error(`SESSION_TTL_DAYS must be a positive number (got ${raw})`);
    }
    if (days > MAX_SESSION_TTL_DAYS) {
        throw new Error(`SESSION_TTL_DAYS must not exceed ${MAX_SESSION_TTL_DAYS} days (got ${raw})`);
    }
    const ms = days * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_SESSION_TTL_MS) {
        throw new Error(`Invalid resolved session TTL (${raw} days)`);
    }
    return ms;
}
// ---------------------------------------------------------------------------
// Strict CORS origin configuration
// ---------------------------------------------------------------------------
/**
 * Parses a comma-separated CORS_ORIGIN allow-list.
 * - Rejects empty entries (e.g. "a,,b" or a trailing comma).
 * - Every entry must be a valid absolute http(s) origin: no paths, no query,
 *   no fragment, no credentials (user:pass@).
 * - In production, rejects "*" anywhere in the list (exact or mixed).
 * - In development, "*" is tolerated as a no-op entry (it never matches a
 *   concrete origin; there is no unrestricted origin reflection).
 * Throws a descriptive error on any invalid entry.
 */
export function parseCorsOriginConfig(raw, isProduction) {
    const trimmed = (raw ?? '').trim();
    if (trimmed === '')
        return []; // no allow-list configured
    const entries = trimmed.split(',').map((s) => s.trim());
    for (const entry of entries) {
        if (entry === '') {
            throw new Error(`CORS_ORIGIN contains an empty entry: ${JSON.stringify(raw)}`);
        }
        if (entry === '*') {
            if (isProduction) {
                throw new Error('CORS_ORIGIN may not contain "*" in production');
            }
            continue; // dev: tolerated, matches nothing
        }
        let u;
        try {
            u = new URL(entry);
        }
        catch {
            throw new Error(`CORS_ORIGIN contains an invalid URL: ${JSON.stringify(entry)}`);
        }
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            throw new Error(`CORS_ORIGIN origin must use http/https: ${JSON.stringify(entry)}`);
        }
        if (u.username !== '' || u.password !== '') {
            throw new Error(`CORS_ORIGIN origin must not contain credentials: ${JSON.stringify(entry)}`);
        }
        if (u.pathname !== '/' || u.search !== '' || u.hash !== '') {
            throw new Error(`CORS_ORIGIN origin must not contain a path, query or fragment: ${JSON.stringify(entry)}`);
        }
    }
    return entries;
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
export function verifyTelegramInitData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash)
        return { valid: false, reason: 'missing hash parameter' };
    urlParams.delete('hash');
    const dataCheckString = [...urlParams.entries()]
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    const a = Buffer.from(calculated, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length)
        return { valid: false, reason: 'hash format mismatch' };
    if (!crypto.timingSafeEqual(a, b))
        return { valid: false, reason: 'hash mismatch' };
    const authDate = Number(urlParams.get('auth_date') || 0);
    if (!authDate)
        return { valid: false, reason: 'missing auth_date' };
    if (Date.now() - authDate * 1000 > INIT_DATA_MAX_AGE_MS) {
        return { valid: false, reason: 'auth_date expired (>24h)' };
    }
    return { valid: true };
}
/** Parses the trusted user identity from verified initData. */
export function extractTelegramUser(initData) {
    try {
        const userStr = new URLSearchParams(initData).get('user');
        if (!userStr)
            return null;
        const user = JSON.parse(userStr);
        // Telegram user ids are positive integers (or numeric strings). Reject
        // anything malformed — identity must come only from trusted data.
        const id = typeof user.id === 'number' ? user.id : user.id != null ? Number(user.id) : NaN;
        if (!Number.isInteger(id) || id <= 0)
            return null;
        const out = { id: String(id) };
        if (typeof user.username === 'string' && user.username.length > 0)
            out.username = user.username;
        return out;
    }
    catch {
        return null;
    }
}
// ---------------------------------------------------------------------------
// Session tokens (HMAC-signed, stateless, with expiry)
// ---------------------------------------------------------------------------
function signToken(payload, secret) {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
}
export function createSessionToken(userId, secret, now = Date.now()) {
    const ttlMs = resolveSessionTtlMs();
    // exp is strictly greater than iat by construction (ttlMs > 0), and the
    // token lifetime equals the validated, bounded SESSION_TTL_DAYS.
    const iat = now;
    const exp = now + ttlMs;
    if (exp <= iat) {
        throw new Error('SESSION_TTL_DAYS is too small to produce a valid token (exp must exceed iat)');
    }
    return signToken({ userId, iat, exp }, secret);
}
export function verifySessionToken(token, secret, now = Date.now()) {
    if (typeof token !== 'string' || typeof secret !== 'string' || !secret) {
        return { valid: false, reason: 'invalid arguments' };
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
        return { valid: false, reason: 'malformed token (must have exactly two segments)' };
    }
    const [body, sig] = parts;
    if (!body || !sig) {
        return { valid: false, reason: 'malformed token segments' };
    }
    // Validate base64url encoding for body and sig
    const base64UrlRegex = /^[A-Za-z0-9\-_]+$/;
    if (!base64UrlRegex.test(body) || !base64UrlRegex.test(sig)) {
        return { valid: false, reason: 'malformed base64url encoding' };
    }
    let expectedSig;
    try {
        expectedSig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    }
    catch {
        return { valid: false, reason: 'signature computation failed' };
    }
    const a = Buffer.from(sig, 'base64url');
    const b = Buffer.from(expectedSig, 'base64url');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { valid: false, reason: 'bad signature' };
    }
    let payload;
    try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    }
    catch {
        return { valid: false, reason: 'bad payload JSON' };
    }
    if (!payload || typeof payload !== 'object') {
        return { valid: false, reason: 'invalid payload structure' };
    }
    if (typeof payload.userId !== 'string' || payload.userId.trim() === '') {
        return { valid: false, reason: 'missing or invalid userId' };
    }
    if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat)) {
        return { valid: false, reason: 'missing or invalid iat' };
    }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
        return { valid: false, reason: 'missing or invalid exp' };
    }
    if (payload.exp <= payload.iat) {
        return { valid: false, reason: 'token lifetime invalid (exp must exceed iat)' };
    }
    // Token lifetime must not exceed the configured maximum (30 days), with a
    // small clock-skew tolerance on both ends.
    const MAX_LIFETIME_MS = MAX_SESSION_TTL_MS + CLOCK_SKEW_MS;
    if (payload.exp - payload.iat > MAX_LIFETIME_MS) {
        return { valid: false, reason: 'token lifetime exceeds configured maximum' };
    }
    // Clock skew allowance: iat may be up to CLOCK_SKEW_MS in the future.
    if (payload.iat > now + CLOCK_SKEW_MS) {
        return { valid: false, reason: 'token issued in the future' };
    }
    if (now > payload.exp) {
        return { valid: false, reason: 'token expired' };
    }
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
export function createApp(deps = {}) {
    const prisma = deps.prisma ?? new PrismaClient();
    const fastify = Fastify({ logger: false });
    // Fail closed: SESSION_TTL_DAYS must be a valid finite positive number of
    // days (capped at MAX_SESSION_TTL_DAYS). Invalid values abort startup.
    resolveSessionTtlMs();
    // CORS Configuration & Enforcement:
    // - Parse CORS_ORIGIN as a comma-separated allow-list (strictly validated).
    // - In production (NODE_ENV=production), fail startup if the allow-list is
    //   empty or contains "*" (exact or mixed) or any malformed origin.
    // - Development without a configured allow-list permits only explicit
    //   localhost / 127.0.0.1 origins. There is NO unrestricted origin
    //   reflection anywhere.
    const isProduction = env.NODE_ENV === 'production';
    const allowedOrigins = parseCorsOriginConfig(env.CORS_ORIGIN, isProduction);
    if (isProduction && allowedOrigins.length === 0) {
        throw new Error('SECURITY ERROR: CORS_ORIGIN must be explicitly configured in production.');
    }
    const isAllowedOrigin = (origin) => {
        if (!origin)
            return true; // no Origin header (non-browser clients)
        if (allowedOrigins.length > 0) {
            // "*" entries (dev only) match no concrete origin by design.
            return allowedOrigins.includes(origin);
        }
        // Development default: only explicitly supported localhost origins.
        return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    };
    fastify.register(cors, {
        origin: (origin, cb) => {
            if (isAllowedOrigin(origin)) {
                cb(null, true);
            }
            else {
                cb(new Error('CORS blocked: origin not allowed'), false);
            }
        },
    });
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
        let result;
        try {
            result = await upsertTelegramUser(prisma, telegramUser);
        }
        catch (err) {
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
async function handleCityRead(request, reply, prisma) {
    const auth = authenticate(request, reply);
    if (!auth)
        return;
    const cityId = request.params.cityId;
    let city;
    try {
        city = await prisma.city.findUnique({
            where: { id: cityId },
            include: { buildings: true },
        });
    }
    catch (err) {
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
            balance: new Decimal(city.balance).toNumber(),
            level: city.level,
        },
        buildings: city.buildings.map((b) => ({
            id: b.id,
            type: b.type,
            level: b.level,
            x: b.x,
            y: b.y,
            maintenanceCost: new Decimal(b.maintenanceCost).toNumber(),
            income: b.income === null || b.income === undefined ? null : new Decimal(b.income).toNumber(),
        })),
    };
}
/**
 * Reserve the idempotency key by inserting the OperationLog row BEFORE applying
 * the mutation. The composite unique index [cityId, operationId] is what makes
 * this concurrency-safe: if two concurrent requests race on the same key, the
 * second insert fails with a Prisma P2002 unique-constraint violation, which we
 * catch and treat as DUPLICATE (its mutation is never applied).
 *
 * Because the reservation and the mutation share the same transaction, a
 * committed log row always implies the mutation was applied, and a failed
 * mutation rolls the reservation back (so it can be retried).
 * Returns true if the key was already taken (duplicate); throws otherwise.
 */
async function reserveOperation(tx, cityId, op, payload) {
    try {
        await tx.operationLog.create({
            data: {
                cityId,
                operationId: op.operationId,
                type: op.type,
                payload,
                status: 'COMPLETED',
                timestamp: new Date(),
            },
        });
        return false;
    }
    catch (err) {
        if (err?.code === 'P2002')
            return true; // concurrent / replayed duplicate
        throw err;
    }
}
/** Validate that a building config's monetary fields are finite. */
function assertFiniteCfg(cfg) {
    for (const [k, v] of Object.entries(cfg)) {
        if (!Number.isFinite(v)) {
            throw Object.assign(new Error(`non-finite building config: ${k}`), { code: 400 });
        }
    }
}
async function handleCitySync(request, reply, prisma) {
    const auth = authenticate(request, reply);
    if (!auth)
        return;
    const parse = SyncRequestSchema.safeParse(request.body ?? {});
    if (!parse.success) {
        return reply.status(400).send({ error: 'Invalid sync payload', details: parse.error.flatten() });
    }
    const { cityId, operations } = parse.data;
    let response;
    try {
        response = await prisma.$transaction(async (tx) => {
            const city = await tx.city.findUnique({ where: { id: cityId } });
            if (!city || city.ownerId !== auth.userId) {
                throw Object.assign(new Error('not-found'), { code: 404 });
            }
            // Balance is a Prisma Decimal. All monetary math is done with Decimal
            // (never JS floating-point) to avoid precision loss.
            const applyBalance = (delta) => {
                city.balance = new Decimal(city.balance).plus(delta);
                if (!new Decimal(city.balance).isFinite()) {
                    throw Object.assign(new Error('invalid resulting balance'), { code: 400 });
                }
            };
            const processed = [];
            for (const op of operations) {
                // operationId is mandatory (enforced by SyncRequestSchema). Guard just in case.
                if (!op.operationId) {
                    processed.push({ type: op.type, operationId: '', status: 'FAILED' });
                    continue;
                }
                switch (op.type) {
                    case 'BUILD': {
                        const bType = op.buildingType ?? '';
                        const cfg = BUILDING_CONFIGS[bType];
                        if (!cfg)
                            throw Object.assign(new Error(`unknown building type`), { code: 400 });
                        assertFiniteCfg(cfg);
                        // Insufficient-balance check happens BEFORE reserving the key, so a
                        // rejected BUILD does not consume its idempotency id (retryable).
                        if (new Decimal(city.balance).lessThan(cfg.cost)) {
                            throw Object.assign(new Error('insufficient balance'), { code: 400 });
                        }
                        const dup = await reserveOperation(tx, cityId, op, op);
                        if (dup) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'DUPLICATE' });
                            break;
                        }
                        applyBalance(new Decimal(-cfg.cost));
                        await tx.building.create({
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
                        processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
                        break;
                    }
                    case 'UPGRADE': {
                        const building = op.buildingId
                            ? await tx.building.findUnique({ where: { id: op.buildingId } })
                            : null;
                        // No valid target => op is a no-op; do NOT consume the key (retryable).
                        if (!building || building.cityId !== cityId) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'FAILED' });
                            continue;
                        }
                        const cfg = BUILDING_CONFIGS[building.type];
                        if (!cfg) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'FAILED' });
                            continue;
                        }
                        assertFiniteCfg(cfg);
                        const upgradeCost = cfg.cost * building.level;
                        if (!Number.isFinite(upgradeCost)) {
                            throw Object.assign(new Error('invalid upgrade cost'), { code: 400 });
                        }
                        if (new Decimal(city.balance).lessThan(upgradeCost)) {
                            throw Object.assign(new Error('insufficient balance for upgrade'), { code: 400 });
                        }
                        const dup = await reserveOperation(tx, cityId, op, op);
                        if (dup) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'DUPLICATE' });
                            break;
                        }
                        applyBalance(new Decimal(-upgradeCost));
                        await tx.building.update({
                            where: { id: building.id },
                            data: { level: building.level + 1, upgradedAt: new Date() },
                        });
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
                        const dup = await reserveOperation(tx, cityId, op, op);
                        if (dup) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'DUPLICATE' });
                            break;
                        }
                        await tx.building.delete({ where: { id: building.id } });
                        processed.push({ type: op.type, operationId: op.operationId, status: 'COMPLETED' });
                        break;
                    }
                    case 'COLLECT_TAX': {
                        const totalIncome = await tx.building.aggregate({
                            where: { cityId },
                            _sum: { income: true },
                        });
                        const amount = new Decimal(totalIncome._sum.income ?? 0);
                        if (!amount.isFinite()) {
                            throw Object.assign(new Error('invalid tax income sum'), { code: 400 });
                        }
                        const dup = await reserveOperation(tx, cityId, op, op);
                        if (dup) {
                            processed.push({ type: op.type, operationId: op.operationId, status: 'DUPLICATE' });
                            break;
                        }
                        applyBalance(amount);
                        await tx.gameTransaction.create({
                            data: {
                                cityId,
                                type: 'COLLECT_TAX',
                                amount,
                                timestamp: new Date(),
                                status: 'COMPLETED',
                                metadata: { operationId: op.operationId },
                            },
                        });
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
                    balance: new Decimal(updated.balance).toNumber(),
                    level: updated.level,
                },
                processedOperations: processed,
                timestamp: new Date().toISOString(),
            };
        });
    }
    catch (err) {
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
async function upsertTelegramUser(prisma, telegramUser) {
    let user = await prisma.user.findUnique({ where: { telegramId: telegramUser.id } });
    if (!user) {
        const username = telegramUser.username || `Player${telegramUser.id}`;
        const created = await prisma.$transaction(async (tx) => {
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
function authenticate(request, reply) {
    const { sessionSecret } = getSecrets();
    if (!sessionSecret) {
        reply.status(503).send({ error: 'Service misconfigured: JWT_SECRET missing' });
        return null;
    }
    const header = request.headers.authorization;
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
    return { userId: result.userId };
}
// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
const start = async () => {
    const app = createApp();
    try {
        await app.listen({ port: Number(env.PORT) || 4000, host: '0.0.0.0' });
        console.log('Fastify API server started');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
// Only auto-start when this file is the process entrypoint — never when the
// module is imported (e.g. by the test runner or by a framework).
import { pathToFileURL } from 'url';
const isEntrypoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint && process.env.NODE_ENV !== 'test') {
    start();
}
export default createApp;
