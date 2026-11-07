export * from './types';
import { z } from 'zod';
import { BuildingTypeSchema } from './types';
/**
 * Client-generated idempotency key. REQUIRED for every mutating operation.
 * - non-empty (trim().min(1) also rejects whitespace-only values)
 * - at most 128 characters
 * The API reserves this key in the database (OperationLog, composite unique
 * [cityId, operationId]) BEFORE applying the mutation; a replayed or
 * concurrently-racing request with the same key is deduplicated and its
 * mutation is never applied twice.
 */
export const OperationIdSchema = z.string().trim().min(1).max(128);
export const SyncOperationSchema = z.object({
    type: z.enum(['BUILD', 'UPGRADE', 'DEMOLISH', 'COLLECT_TAX']),
    // Mandatory for every mutating operation (BUILD/UPGRADE/DEMOLISH/COLLECT_TAX).
    // Missing, empty or whitespace-only ids are rejected by the API with 400.
    operationId: OperationIdSchema,
    buildingId: z.string().min(1).max(128).optional(),
    buildingType: BuildingTypeSchema.optional(),
    x: z.number().int().nonnegative().optional(),
    y: z.number().int().nonnegative().optional(),
    timestamp: z.string().optional()
});
export const SyncRequestSchema = z.object({
    cityId: z.string().min(1).max(128),
    // Cap the number of operations per request to bound payload size.
    operations: z.array(SyncOperationSchema).max(50)
});
export const TelegramAuthSchema = z.object({
    initData: z.string().min(1),
    // NOTE: the authoritative identity is the verified initData payload ONLY.
    // These optional fields are never trusted as an identity source.
    userId: z.string().optional(),
    username: z.string().optional()
});
/** Concrete runtime schema for game transaction payloads (was z.any()). */
export const GameTransactionPayloadSchema = z.object({
    id: z.string().min(1).max(128).optional(),
    cityId: z.string().min(1).max(128),
    type: z.string().min(1).max(64),
    // Monetary values must not be negative (the API treats balance changes as
    // nonnegative amounts; a negative would be a fabricated credit/loss).
    amount: z.number().nonnegative(),
    timestamp: z.string().min(1),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'])
});
