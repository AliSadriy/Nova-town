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
export declare const GameTransactionSchema: {};
export type BuildingType = 'RESIDENTIAL_SMALL' | 'RESIDENTIAL_MEDIUM' | 'COMMERCIAL_SHOP' | 'COMMERCIAL_TOWER' | 'INDUSTRIAL_FACTORY' | 'PARK_SMALL' | 'ROAD';
export type Building = {
    id: string;
    cityId: string;
    type: BuildingType;
    level: number;
    x: number;
    y: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
};
export type City = {
    id: string;
    name: string;
    userId: string;
    level: number;
    population: number;
    gold: number;
    energyCapacity: number;
    energyUsed: number;
    waterCapacity: number;
    waterUsed: number;
    createdAt?: string;
    updatedAt?: string;
};
