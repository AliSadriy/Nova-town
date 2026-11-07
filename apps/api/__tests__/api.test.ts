import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import createApp, {
  verifyTelegramInitData,
  extractTelegramUser,
  createSessionToken,
  verifySessionToken,
} from '../src/index.ts';

const BOT_TOKEN = '123456:ABC-DEF1234bIqza-IK1SyhTmpeZiVW-WqE';
const JWT_SECRET = 'test-jwt-secret';

function makeInitData(opts: {
  botToken?: string;
  userId?: number;
  username?: string;
  authDate?: number;
  tamper?: boolean;
}) {
  const botToken = opts.botToken ?? BOT_TOKEN;
  const authDate = opts.authDate ?? Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.set('auth_date', String(authDate));
  params.set('query_id', 'AAHdF6MUAAAAAN0XoxzWWDWh');
  params.set('user', JSON.stringify({ id: opts.userId ?? 99887766, first_name: 'Test', username: opts.username ?? 'testuser' }));

  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', opts.tamper ? '0'.repeat(64) : hash);
  return params.toString();
}

// ---------------------------------------------------------------------------
// In-memory Prisma mock
// ---------------------------------------------------------------------------

interface MockState {
  users: any[];
  cities: any[];
  buildings: any[];
  operationLogs: any[];
  transactions: any[];
  failCityFindUnique?: boolean;
}

function makeMockPrisma() {
  const state: MockState = { users: [], cities: [], buildings: [], operationLogs: [], transactions: [] };
  let idCounter = 0;
  const uuid = () => `id-${++idCounter}`;

  const tx: any = {
    user: {
      findUnique: async ({ where }: any) => state.users.find((u) => u.telegramId === where.telegramId) ?? null,
      create: async ({ data }: any) => {
        const user = { id: uuid(), createdAt: new Date(), updatedAt: new Date(), ...data };
        state.users.push(user);
        return user;
      },
    },
    city: {
      findFirst: async ({ where }: any) => state.cities.find((c) => c.ownerId === where.ownerId) ?? null,
      findUnique: async ({ where, include }: any) => {
        if (state.failCityFindUnique) throw new Error('DB_DOWN');
        const c = state.cities.find((x) => x.id === where.id) ?? null;
        if (!c) return null;
        return include?.buildings ? { ...c, buildings: state.buildings.filter((b) => b.cityId === c.id) } : { ...c };
      },
      create: async ({ data }: any) => {
        const city = {
          id: uuid(),
          ownerId: data.ownerId,
          x: 0,
          y: 0,
          level: 1,
          balance: 0,
          zoneRadius: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.cities.push(city);
        return city;
      },
      update: async ({ where, data, include }: any) => {
        const c = state.cities.find((x) => x.id === where.id)!;
        Object.assign(c, data);
        return include?.buildings ? { ...c, buildings: state.buildings.filter((b) => b.cityId === c.id) } : { ...c };
      },
    },
    building: {
      create: async ({ data }: any) => {
        const b = {
          id: uuid(),
          level: 1,
          builtAt: new Date(),
          upgradedAt: null,
          maintenanceCost: 0,
          income: null,
          ...data,
        };
        state.buildings.push(b);
        return b;
      },
      findUnique: async ({ where }: any) => state.buildings.find((b) => b.id === where.id) ?? null,
      update: async ({ where, data }: any) => {
        const b = state.buildings.find((x) => x.id === where.id)!;
        Object.assign(b, data);
        return b;
      },
      delete: async ({ where }: any) => {
        state.buildings = state.buildings.filter((b) => b.id !== where.id);
        return {};
      },
      aggregate: async ({ where }: any) => {
        const incomes = state.buildings.filter((b) => b.cityId === where.cityId && b.income != null);
        return { _sum: { income: incomes.reduce((s, b) => s + Number(b.income), 0) } };
      },
    },
    operationLog: {
      findUnique: async ({ where }: any) => {
        // Prisma composite-unique where clauses arrive as { cityId_operationId: { cityId, operationId } }.
        const key = where.cityId_operationId ?? where;
        return state.operationLogs.find((o) => o.cityId === key.cityId && o.operationId === key.operationId) ?? null;
      },
      create: async ({ data }: any) => {
        // Enforce P2002 unique constraint on [cityId, operationId] if already logged
        const existing = state.operationLogs.find((o) => o.cityId === data.cityId && o.operationId === data.operationId);
        if (existing) {
          const err: any = new Error('Unique constraint failed on the fields: (`cityId`,`operationId`)');
          err.code = 'P2002';
          throw err;
        }
        const op = { id: uuid(), timestamp: data.timestamp, ...data };
        state.operationLogs.push(op);
        return op;
      },
    },
    gameTransaction: {
      create: async ({ data }: any) => {
        const t = { id: uuid(), ...data };
        state.transactions.push(t);
        return t;
      },
    },
  };

  // Simulated transaction: snapshot state, restore on failure (rollback).
  const snapshot = () => JSON.stringify({ ...state });
  const restore = (snap: string) => Object.assign(state, JSON.parse(snap));

  tx.$transaction = async (fn: any) => {
    const snap = snapshot();
    try {
      return await fn(tx);
    } catch (e) {
      restore(snap);
      throw e;
    }
  };

  return { client: tx as any, state };
}

function envSetup() {
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';
}

async function injectApp(prisma: any, fn: any) {
  const app = createApp({ prisma });
  // Bypass TCP: invoke route handler directly.
  const handler = app.routeSchema?.('/api/v1/auth/telegram')?.handler;
  return { app, handler };
}

// ---------------------------------------------------------------------------
// Unit tests: Telegram HMAC verification
// ---------------------------------------------------------------------------

test('verifyTelegramInitData: valid initData passes', () => {
  const r = verifyTelegramInitData(makeInitData({}), BOT_TOKEN);
  assert.strictEqual(r.valid, true);
});

test('verifyTelegramInitData: tampered hash rejected', () => {
  const r = verifyTelegramInitData(makeInitData({ tamper: true }), BOT_TOKEN);
  assert.strictEqual(r.valid, false);
});

test('verifyTelegramInitData: wrong bot token rejected', () => {
  const initData = makeInitData({ botToken: 'EVIL_TOKEN' });
  const r = verifyTelegramInitData(initData, BOT_TOKEN);
  assert.strictEqual(r.valid, false);
});

test('verifyTelegramInitData: expired auth_date (>24h) rejected', () => {
  const initData = makeInitData({ authDate: Math.floor(Date.now() / 1000) - 25 * 3600 });
  const r = verifyTelegramInitData(initData, BOT_TOKEN);
  assert.strictEqual(r.valid, false);
  assert.match(r.reason ?? '', /auth_date expired/);
});

test('verifyTelegramInitData: missing hash rejected', () => {
  const r = verifyTelegramInitData('user=%7B%22id%22%3A1%7D', BOT_TOKEN);
  assert.strictEqual(r.valid, false);
});

test('extractTelegramUser: parses user and returns null on malformed input', () => {
  const u = extractTelegramUser(makeInitData({ userId: 42, username: 'zoe' }));
  assert.deepStrictEqual(u, { id: '42', username: 'zoe' });
  assert.strictEqual(extractTelegramUser('garbage=%zz'), null);
});

// ---------------------------------------------------------------------------
// Unit tests: session tokens
// ---------------------------------------------------------------------------

test('session token rigorous validation: missing exp, missing iat, invalid types, malformed payload, extra segments, expired, future iat', () => {
  const t = createSessionToken('u-1', JWT_SECRET, 1000);

  // Valid token
  assert.strictEqual(verifySessionToken(t, JWT_SECRET, 1500).valid, true);

  // Extra segments (>2 parts)
  assert.strictEqual(verifySessionToken(t + '.extraseg', JWT_SECRET, 1500).valid, false);

  // Malformed base64url encoding
  assert.strictEqual(verifySessionToken('badbase64!.sig', JWT_SECRET, 1500).valid, false);

  // Custom crafted tokens for payload edge cases
  const makeTokenWithPayload = (payload: any) => {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
    return `${body}.${sig}`;
  };

  // Missing userId
  const tNoUser = makeTokenWithPayload({ iat: 1000, exp: 2000 });
  assert.strictEqual(verifySessionToken(tNoUser, JWT_SECRET, 1500).valid, false);

  // Missing exp
  const tNoExp = makeTokenWithPayload({ userId: 'u-1', iat: 1000 });
  assert.strictEqual(verifySessionToken(tNoExp, JWT_SECRET, 1500).valid, false);

  // Missing iat
  const tNoIat = makeTokenWithPayload({ userId: 'u-1', exp: 2000 });
  assert.strictEqual(verifySessionToken(tNoIat, JWT_SECRET, 1500).valid, false);

  // Future iat beyond skew (>60s) with now = 150000: iat = 300000 -> 300000 > 150000 + 60000 (210000) => rejected
  const tFutureIat = makeTokenWithPayload({ userId: 'u-1', iat: 300000, exp: 400000 });
  assert.strictEqual(verifySessionToken(tFutureIat, JWT_SECRET, 150000).valid, false);

  // Expired token
  const tExpired = makeTokenWithPayload({ userId: 'u-1', iat: 1000, exp: 2000 });
  assert.strictEqual(verifySessionToken(tExpired, JWT_SECRET, 2500).valid, false);
});

test('CORS allow-list test: approved origin accepted, unapproved origin rejected', async () => {
  envSetup();
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = 'https://app.novatown.example.com';
  const { client } = makeMockPrisma();
  const app = createApp({ prisma: client });

  const resOk = await app.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'https://app.novatown.example.com' },
  });
  assert.strictEqual(resOk.statusCode, 200);
  assert.strictEqual(resOk.headers['access-control-allow-origin'], 'https://app.novatown.example.com');

  const resBad = await app.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'https://evil.example.com' },
  });
  // Fastify cors plugin returns error or drops headers on rejection; test inject returns error or 500/forbidden
  assert.ok(resBad.statusCode >= 400 || !resBad.headers['access-control-allow-origin']);

  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = '*';
  await app.close();
});

// ---------------------------------------------------------------------------
// Integration tests via route handlers (mock Prisma)
// ---------------------------------------------------------------------------

async function call(app: any, method: string, url: string, body?: unknown, headers?: Record<string, string>) {
  const res = await app.inject({ method, url, payload: body, headers });
  let data: any = {};
  try {
    data = res.payload ? JSON.parse(res.payload) : {};
  } catch {
    /* non-JSON */
  }
  return { status: res.statusCode, data };
}

test('POST /auth/telegram: verified initData creates user + city', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const app = createApp({ prisma: client });

  const res = await call(app, 'POST', '/api/v1/auth/telegram', {
    initData: makeInitData({ userId: 777, username: 'tester' }),
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.user.username, 'tester');
  assert.strictEqual(res.data.city.name, "tester's City");
  assert.ok(typeof res.data.token === 'string' && res.data.token.length > 0);
  assert.strictEqual(state.users.length, 1);
  assert.strictEqual(state.users[0].telegramId, '777');
  assert.strictEqual(state.cities.length, 1);
  assert.strictEqual(state.cities[0].ownerId, state.users[0].id);
});

test('POST /auth/telegram: tampered initData rejected with 403', async () => {
  envSetup();
  const { client } = makeMockPrisma();
  const app = createApp({ prisma: client });

  const res = await call(app, 'POST', '/api/v1/auth/telegram', {
    initData: makeInitData({ tamper: true }),
  });

  assert.strictEqual(res.status, 403);
});

test('POST /auth/telegram: missing TELEGRAM_BOT_TOKEN fails closed (503)', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  const { client, state } = makeMockPrisma();
  const app = createApp({ prisma: client });

  const res = await call(app, 'POST', '/api/v1/auth/telegram', {
    initData: makeInitData({}),
  });

  assert.strictEqual(res.status, 503);
  assert.strictEqual(state.users.length, 0);
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
});

test('GET /city/:id: owner reads city; foreign city or missing token => 4xx', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-1', telegramId: '9', username: 'own', email: 'e@e', password: 'x', createdAt: new Date(), updatedAt: new Date() };
  state.users.push(user);
  state.cities.push({ id: 'city-1', name: 'C1', ownerId: user.id, balance: 100, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const ok = await call(app, 'GET', '/api/v1/city/city-1', undefined, { authorization: `Bearer ${token}` });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.data.city.balance, 100);

  const noToken = await call(app, 'GET', '/api/v1/city/city-1');
  assert.strictEqual(noToken.status, 401);

  const outsider = createSessionToken('someone-else', JWT_SECRET);
  const foreign = await call(app, 'GET', '/api/v1/city/city-1', undefined, { authorization: `Bearer ${outsider}` });
  assert.strictEqual(foreign.status, 404);

  const notFound = await call(app, 'GET', '/api/v1/city/no-such-city', undefined, { authorization: `Bearer ${token}` });
  assert.strictEqual(notFound.status, 404);

  await app.close();
});

test('GET /city/:id: database down => 503 (no fake data returned)', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  (state as any).failCityFindUnique = true;
  const user = { id: 'user-1', telegramId: '9' };
  const token = createSessionToken(user.id, JWT_SECRET);
  const app = createApp({ prisma: client });

  const res = await call(app, 'GET', '/api/v1/city/city-1', undefined, { authorization: `Bearer ${token}` });
  assert.strictEqual(res.status, 503);

  await app.close();
});

test('POST /city/sync: BUILD deducts balance and persists building', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-2', telegramId: '8' };
  state.users.push(user);
  state.cities.push({ id: 'city-2', name: 'C2', ownerId: user.id, balance: 1000, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const res = await call(app, 'POST', '/api/v1/city/sync', {
    cityId: 'city-2',
    operations: [{ type: 'BUILD', buildingType: 'RESIDENTIAL_SMALL', x: 3, y: 4, operationId: 'op-build-1' }],
  }, { authorization: `Bearer ${token}` });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.city.balance, 900); // 1000 - 100 (RESIDENTIAL_SMALL cost)
  assert.strictEqual(res.data.processedOperations[0].status, 'COMPLETED');
  assert.strictEqual(state.buildings.length, 1);
  assert.strictEqual(state.operationLogs.length, 1);

  await app.close();
});

test('POST /city/sync: idempotent replay of same operationId does not double-apply', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-3', telegramId: '7' };
  state.users.push(user);
  state.cities.push({ id: 'city-3', name: 'C3', ownerId: user.id, balance: 1000, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const payload = {
    cityId: 'city-3',
    operations: [{ type: 'BUILD', buildingType: 'ROAD', x: 1, y: 1, operationId: 'road-op-1' }],
  };
  const first = await call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` });
  const replay = await call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` });

  assert.strictEqual(first.status, 200);
  assert.strictEqual(replay.status, 200);
  assert.strictEqual(first.data.city.balance, 990);
  assert.strictEqual(replay.data.city.balance, 990); // NOT 980
  assert.strictEqual(replay.data.processedOperations[0].status, 'DUPLICATE');
  assert.strictEqual(state.buildings.length, 1); // only one road

  await app.close();
});

test('POST /city/sync: insufficient balance => 400 and transaction rolls back', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-4', telegramId: '6' };
  state.users.push(user);
  state.cities.push({ id: 'city-4', name: 'C4', ownerId: user.id, balance: 10, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const res = await call(app, 'POST', '/api/v1/city/sync', {
    cityId: 'city-4',
    operations: [{ type: 'BUILD', buildingType: 'COMMERCIAL_TOWER' }],
  }, { authorization: `Bearer ${token}` });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(Number((state.cities.find((c: any) => c.id === 'city-4') as any).balance), 10); // unchanged
  assert.strictEqual(state.buildings.length, 0); // rolled back

  await app.close();
});

test('POST /city/sync: COLLECT_TAX adds building income to balance', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-5', telegramId: '5' };
  state.users.push(user);
  state.cities.push({ id: 'city-5', name: 'C5', ownerId: user.id, balance: 0, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });
  state.buildings.push({ id: 'b-1', cityId: 'city-5', ownerId: user.id, type: 'RESIDENTIAL_SMALL', level: 1, x: 0, y: 0, maintenanceCost: 2, income: 10 });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const res = await call(app, 'POST', '/api/v1/city/sync', {
    cityId: 'city-5',
    operations: [{ type: 'COLLECT_TAX', operationId: 'tax-1' }],
  }, { authorization: `Bearer ${token}` });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.city.balance, 10);
  assert.strictEqual(state.transactions.length, 1);

  await app.close();
});

test('POST /city/sync: COLLECT_TAX idempotent replay does not double-credit balance', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-tax', telegramId: '55' };
  state.users.push(user);
  state.cities.push({ id: 'city-tax', name: 'CTax', ownerId: user.id, balance: 0, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });
  state.buildings.push({ id: 'b-tax', cityId: 'city-tax', ownerId: user.id, type: 'RESIDENTIAL_SMALL', level: 1, x: 0, y: 0, maintenanceCost: 2, income: 25 });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const payload = {
    cityId: 'city-tax',
    operations: [{ type: 'COLLECT_TAX', operationId: 'tax-op-1' }],
  };
  const first = await call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` });
  const replay = await call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` });

  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.data.city.balance, 25);
  assert.strictEqual(replay.status, 200);
  assert.strictEqual(replay.data.city.balance, 25); // NOT 50
  assert.strictEqual(replay.data.processedOperations[0].status, 'DUPLICATE');

  await app.close();
});

test('POST /auth/telegram: missing JWT_SECRET fails closed with 503 and does not issue empty token', async () => {
  envSetup();
  delete process.env.JWT_SECRET;
  const { client } = makeMockPrisma();
  const app = createApp({ prisma: client });

  const res = await call(app, 'POST', '/api/v1/auth/telegram', {
    initData: makeInitData({ userId: 999, username: 'secureuser' }),
  });

  assert.strictEqual(res.status, 503);
  assert.strictEqual(res.data.token, undefined);

  process.env.JWT_SECRET = JWT_SECRET;
  await app.close();
});

test('missing JWT_SECRET fails closed: protected endpoints return 503', async () => {
  delete process.env.JWT_SECRET;
  const { client, state } = makeMockPrisma();
  state.cities.push({ id: 'city-x', name: 'CX', ownerId: 'u', balance: 1, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });
  const app = createApp({ prisma: client });

  const res = await call(app, 'GET', '/api/v1/city/city-x', undefined, { authorization: 'Bearer anything' });
  assert.strictEqual(res.status, 503);
  process.env.JWT_SECRET = JWT_SECRET;

  await app.close();
});

test('POST /city/sync: concurrent duplicate operationId (P2002 conflict) correctly catches and deduplicates', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-race', telegramId: '99' };
  state.users.push(user);
  state.cities.push({ id: 'city-race', name: 'CRace', ownerId: user.id, balance: 1000, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const payload = {
    cityId: 'city-race',
    operations: [{ type: 'BUILD', buildingType: 'RESIDENTIAL_SMALL', operationId: 'race-op-1' }],
  };

  // Simulate concurrent requests arriving with the same operationId
  const [res1, res2] = await Promise.all([
    call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` }),
    call(app, 'POST', '/api/v1/city/sync', payload, { authorization: `Bearer ${token}` }),
  ]);

  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res2.status, 200);

  // One succeeded as COMPLETED, one as DUPLICATE (via P2002 catch)
  const statuses = [res1.data.processedOperations[0].status, res2.data.processedOperations[0].status].sort();
  assert.deepStrictEqual(statuses, ['COMPLETED', 'DUPLICATE']);

  // Balance deducted exactly once (1000 - 100 = 900)
  assert.strictEqual(res1.data.city.balance === 900 || res2.data.city.balance === 900, true);
  assert.strictEqual(state.buildings.length, 1);

  await app.close();
});

test('POST /city/sync: rejects missing or empty operationId with 400', async () => {
  envSetup();
  const { client, state } = makeMockPrisma();
  const user = { id: 'user-op', telegramId: '77' };
  state.users.push(user);
  state.cities.push({ id: 'city-op', name: 'COp', ownerId: user.id, balance: 1000, level: 1, x: 0, y: 0, zoneRadius: 50, createdAt: new Date(), updatedAt: new Date() });

  const app = createApp({ prisma: client });
  const token = createSessionToken(user.id, JWT_SECRET);

  const res = await call(app, 'POST', '/api/v1/city/sync', {
    cityId: 'city-op',
    operations: [{ type: 'BUILD', buildingType: 'RESIDENTIAL_SMALL', operationId: '' }],
  }, { authorization: `Bearer ${token}` });

  assert.strictEqual(res.status, 400);

  await app.close();
});

