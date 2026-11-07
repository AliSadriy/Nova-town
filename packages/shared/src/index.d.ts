export * from './types';
import { z } from 'zod';
/**
 * Client-generated idempotency key. REQUIRED for every mutating operation.
 * - non-empty (trim().min(1) also rejects whitespace-only values)
 * - at most 128 characters
 * The API reserves this key in the database (OperationLog, composite unique
 * [cityId, operationId]) BEFORE applying the mutation; a replayed or
 * concurrently-racing request with the same key is deduplicated and its
 * mutation is never applied twice.
 */
export declare const OperationIdSchema: z.ZodString;
export declare const SyncOperationSchema: z.ZodObject<{
    type: z.ZodEnum<["BUILD", "UPGRADE", "DEMOLISH", "COLLECT_TAX"]>;
    operationId: z.ZodString;
    buildingId: z.ZodOptional<z.ZodString>;
    buildingType: z.ZodOptional<z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
    operationId: string;
    x?: number | undefined;
    y?: number | undefined;
    timestamp?: string | undefined;
    buildingId?: string | undefined;
    buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
}, {
    type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
    operationId: string;
    x?: number | undefined;
    y?: number | undefined;
    timestamp?: string | undefined;
    buildingId?: string | undefined;
    buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
}>;
export declare const SyncRequestSchema: z.ZodObject<{
    cityId: z.ZodString;
    operations: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["BUILD", "UPGRADE", "DEMOLISH", "COLLECT_TAX"]>;
        operationId: z.ZodString;
        buildingId: z.ZodOptional<z.ZodString>;
        buildingType: z.ZodOptional<z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        operationId: string;
        x?: number | undefined;
        y?: number | undefined;
        timestamp?: string | undefined;
        buildingId?: string | undefined;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
    }, {
        type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        operationId: string;
        x?: number | undefined;
        y?: number | undefined;
        timestamp?: string | undefined;
        buildingId?: string | undefined;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cityId: string;
    operations: {
        type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        operationId: string;
        x?: number | undefined;
        y?: number | undefined;
        timestamp?: string | undefined;
        buildingId?: string | undefined;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
    }[];
}, {
    cityId: string;
    operations: {
        type: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        operationId: string;
        x?: number | undefined;
        y?: number | undefined;
        timestamp?: string | undefined;
        buildingId?: string | undefined;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD" | undefined;
    }[];
}>;
export declare const TelegramAuthSchema: z.ZodObject<{
    initData: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    initData: string;
    userId?: string | undefined;
    username?: string | undefined;
}, {
    initData: string;
    userId?: string | undefined;
    username?: string | undefined;
}>;
export type SyncOperation = z.infer<typeof SyncOperationSchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type TelegramAuthRequest = z.infer<typeof TelegramAuthSchema>;
/** Concrete runtime schema for game transaction payloads (was z.any()). */
export declare const GameTransactionPayloadSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    cityId: z.ZodString;
    type: z.ZodString;
    amount: z.ZodNumber;
    timestamp: z.ZodString;
    status: z.ZodEnum<["PENDING", "COMPLETED", "FAILED", "ROLLED_BACK"]>;
}, "strip", z.ZodTypeAny, {
    type: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
    cityId: string;
    amount: number;
    timestamp: string;
    id?: string | undefined;
}, {
    type: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
    cityId: string;
    amount: number;
    timestamp: string;
    id?: string | undefined;
}>;
export type GameTransactionPayload = z.infer<typeof GameTransactionPayloadSchema>;
//# sourceMappingURL=index.d.ts.map