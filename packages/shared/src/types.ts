import { z } from 'zod';

export const BuildingTypeSchema = z.enum([
  'RESIDENTIAL_SMALL',
  'RESIDENTIAL_MEDIUM',
  'COMMERCIAL_SHOP',
  'COMMERCIAL_TOWER',
  'INDUSTRIAL_FACTORY',
  'PARK_SMALL',
  'ROAD'
]);

export type BuildingType = z.infer<typeof BuildingTypeSchema>;

export const BuildingSchema = z.object({
  id: z.string().optional(),
  cityId: z.string().optional(),
  type: BuildingTypeSchema,
  level: z.number().int().positive().default(1),
  x: z.number(),
  y: z.number(),
  status: z.enum(['CONSTRUCTING', 'ACTIVE', 'UPGRADING', 'ABANDONED']).default('ACTIVE'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Building = z.infer<typeof BuildingSchema>;

export const CitySchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  level: z.number().int().positive().default(1),
  population: z.number().nonnegative().default(0),
  gold: z.number().nonnegative().default(1000),
  energyCapacity: z.number().nonnegative().default(100),
  energyUsed: z.number().nonnegative().default(0),
  waterCapacity: z.number().nonnegative().default(100),
  waterUsed: z.number().nonnegative().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type City = z.infer<typeof CitySchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.string().optional()
});

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
export const GameTransactionSchema = z.object({
  id: z.string().optional(),
  cityId: z.string(),
  type: z.string(),
  amount: z.number(),
  timestamp: z.string(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK']).default('COMPLETED')
});
