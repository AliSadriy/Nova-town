export * from './types';
import { z } from 'zod';
export declare const SyncOperationSchema: z.ZodObject<{
    type: z.ZodEnum<["BUILD", "UPGRADE", "DEMOLISH", "COLLECT_TAX"]>;
    operationId: z.ZodOptional<z.ZodString>;
    buildingId: z.ZodOptional<z.ZodString>;
    buildingType: z.ZodOptional<z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
    x?: number;
    y?: number;
    timestamp?: string;
    operationId?: string;
    buildingId?: string;
    buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
}, {
    type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
    x?: number;
    y?: number;
    timestamp?: string;
    operationId?: string;
    buildingId?: string;
    buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
}>;
export declare const SyncRequestSchema: z.ZodObject<{
    cityId: z.ZodString;
    operations: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["BUILD", "UPGRADE", "DEMOLISH", "COLLECT_TAX"]>;
        operationId: z.ZodOptional<z.ZodString>;
        buildingId: z.ZodOptional<z.ZodString>;
        buildingType: z.ZodOptional<z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        x?: number;
        y?: number;
        timestamp?: string;
        operationId?: string;
        buildingId?: string;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    }, {
        type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        x?: number;
        y?: number;
        timestamp?: string;
        operationId?: string;
        buildingId?: string;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    cityId?: string;
    operations?: {
        type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        x?: number;
        y?: number;
        timestamp?: string;
        operationId?: string;
        buildingId?: string;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    }[];
}, {
    cityId?: string;
    operations?: {
        type?: "BUILD" | "UPGRADE" | "DEMOLISH" | "COLLECT_TAX";
        x?: number;
        y?: number;
        timestamp?: string;
        operationId?: string;
        buildingId?: string;
        buildingType?: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    }[];
}>;
export declare const TelegramAuthSchema: z.ZodObject<{
    initData: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    username?: string;
    initData?: string;
}, {
    userId?: string;
    username?: string;
    initData?: string;
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
    type?: string;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
    id?: string;
    cityId?: string;
    amount?: number;
    timestamp?: string;
}, {
    type?: string;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
    id?: string;
    cityId?: string;
    amount?: number;
    timestamp?: string;
}>;
export type GameTransactionPayload = z.infer<typeof GameTransactionPayloadSchema>;
