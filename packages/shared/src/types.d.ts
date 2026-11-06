import { z } from 'zod';
export declare const BuildingTypeSchema: z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>;
export type BuildingType = z.infer<typeof BuildingTypeSchema>;
export declare const BuildingSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    cityId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["RESIDENTIAL_SMALL", "RESIDENTIAL_MEDIUM", "COMMERCIAL_SHOP", "COMMERCIAL_TOWER", "INDUSTRIAL_FACTORY", "PARK_SMALL", "ROAD"]>;
    level: z.ZodDefault<z.ZodNumber>;
    x: z.ZodNumber;
    y: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["CONSTRUCTING", "ACTIVE", "UPGRADING", "ABANDONED"]>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    status: "CONSTRUCTING" | "ACTIVE" | "UPGRADING" | "ABANDONED";
    level: number;
    x: number;
    y: number;
    id?: string | undefined;
    cityId?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    type: "RESIDENTIAL_SMALL" | "RESIDENTIAL_MEDIUM" | "COMMERCIAL_SHOP" | "COMMERCIAL_TOWER" | "INDUSTRIAL_FACTORY" | "PARK_SMALL" | "ROAD";
    x: number;
    y: number;
    status?: "CONSTRUCTING" | "ACTIVE" | "UPGRADING" | "ABANDONED" | undefined;
    id?: string | undefined;
    cityId?: string | undefined;
    level?: number | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type Building = z.infer<typeof BuildingSchema>;
export declare const CitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    userId: z.ZodString;
    level: z.ZodDefault<z.ZodNumber>;
    population: z.ZodDefault<z.ZodNumber>;
    gold: z.ZodDefault<z.ZodNumber>;
    energyCapacity: z.ZodDefault<z.ZodNumber>;
    energyUsed: z.ZodDefault<z.ZodNumber>;
    waterCapacity: z.ZodDefault<z.ZodNumber>;
    waterUsed: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    level: number;
    name: string;
    userId: string;
    population: number;
    gold: number;
    energyCapacity: number;
    energyUsed: number;
    waterCapacity: number;
    waterUsed: number;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    id: string;
    name: string;
    userId: string;
    level?: number | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    population?: number | undefined;
    gold?: number | undefined;
    energyCapacity?: number | undefined;
    energyUsed?: number | undefined;
    waterCapacity?: number | undefined;
    waterUsed?: number | undefined;
}>;
export type City = z.infer<typeof CitySchema>;
export declare const PlayerSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    username: string;
    email: string;
    createdAt?: string | undefined;
}, {
    id: string;
    username: string;
    email: string;
    createdAt?: string | undefined;
}>;
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerId = string;
export type CityId = string;
export type BuildingId = string;
export type GameTransaction = {
    id: string;
    cityId: string;
    type: string;
    amount: number;
    timestamp: Date;
    status: string;
};
export declare const GameTransactionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    cityId: z.ZodString;
    type: z.ZodString;
    amount: z.ZodNumber;
    timestamp: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["PENDING", "COMPLETED", "FAILED", "ROLLED_BACK"]>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
    cityId: string;
    amount: number;
    timestamp: string;
    id?: string | undefined;
}, {
    type: string;
    cityId: string;
    amount: number;
    timestamp: string;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK" | undefined;
    id?: string | undefined;
}>;
//# sourceMappingURL=types.d.ts.map