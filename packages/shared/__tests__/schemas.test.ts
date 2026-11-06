import test from 'node:test';
import assert from 'node:assert';
import {
  SyncOperationSchema,
  SyncRequestSchema,
  TelegramAuthSchema,
  GameTransactionPayloadSchema,
} from '../src/index.ts';

test('SyncRequestSchema accepts valid payload with operations', () => {
  const r = SyncRequestSchema.safeParse({
    cityId: 'city-1',
    operations: [
      { type: 'BUILD', buildingType: 'RESIDENTIAL_SMALL', x: 3, y: 4, operationId: 'op-1' },
      { type: 'COLLECT_TAX', operationId: 'op-2' },
    ],
  });
  assert.ok(r.success, r.error?.message);
});

test('SyncOperationSchema rejects unsupported operation type', () => {
  const r = SyncOperationSchema.safeParse({ type: 'EXPLODE', buildingType: 'ROAD' });
  assert.strictEqual(r.success, false);
});

test('SyncOperationSchema rejects invalid coordinates (negative / non-integer)', () => {
  assert.strictEqual(SyncOperationSchema.safeParse({ type: 'BUILD', x: -1 }).success, false);
  assert.strictEqual(SyncOperationSchema.safeParse({ type: 'BUILD', y: 1.5 }).success, false);
});

test('SyncOperationSchema rejects malformed operationId (empty / oversized)', () => {
  assert.strictEqual(SyncOperationSchema.safeParse({ type: 'BUILD', operationId: '' }).success, false);
  assert.strictEqual(
    SyncOperationSchema.safeParse({ type: 'BUILD', operationId: 'x'.repeat(129) }).success,
    false,
  );
});

test('SyncRequestSchema rejects empty cityId and oversized operation arrays', () => {
  assert.strictEqual(SyncRequestSchema.safeParse({ cityId: '', operations: [] }).success, false);
  const ops = Array.from({ length: 51 }, (_, i) => ({ type: 'COLLECT_TAX', operationId: `op-${i}` }));
  assert.strictEqual(SyncRequestSchema.safeParse({ cityId: 'c', operations: ops }).success, false);
});

test('TelegramAuthSchema requires initData; empty string rejected', () => {
  assert.strictEqual(TelegramAuthSchema.safeParse({ initData: '' }).success, false);
  assert.ok(TelegramAuthSchema.safeParse({ initData: 'user=%7B%22id%22%3A1%7D&hash=abc' }).success);
});

test('GameTransactionPayloadSchema validates concrete fields and rejects negative amounts', () => {
  assert.strictEqual(
    GameTransactionPayloadSchema.safeParse({
      cityId: 'c1',
      type: 'COLLECT_TAX',
      amount: -5,
      timestamp: '2026-01-01T00:00:00Z',
      status: 'COMPLETED',
    }).success,
    false,
  );
  const r = GameTransactionPayloadSchema.safeParse({
    cityId: 'c1',
    type: 'COLLECT_TAX',
    amount: 10,
    timestamp: '2026-01-01T00:00:00Z',
    status: 'COMPLETED',
  });
  assert.ok(r.success, r.error?.message);
});

test('GameTransactionPayloadSchema rejects unknown status and empty cityId', () => {
  assert.strictEqual(
    GameTransactionPayloadSchema.safeParse({
      cityId: 'c1',
      type: 'X',
      amount: 1,
      timestamp: 't',
      status: 'WEIRD',
    }).success,
    false,
  );
  assert.strictEqual(
    GameTransactionPayloadSchema.safeParse({
      cityId: '',
      type: 'X',
      amount: 1,
      timestamp: 't',
      status: 'COMPLETED',
    }).success,
    false,
  );
});
