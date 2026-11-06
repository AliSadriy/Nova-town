export declare const BUILDING_CONFIGS: {
    RESIDENTIAL_SMALL: {
        cost: number;
        income: number;
        maintenance: number;
    };
    RESIDENTIAL_MEDIUM: {
        cost: number;
        income: number;
        maintenance: number;
    };
    COMMERCIAL_SHOP: {
        cost: number;
        income: number;
        maintenance: number;
    };
    COMMERCIAL_TOWER: {
        cost: number;
        income: number;
        maintenance: number;
    };
    INDUSTRIAL_FACTORY: {
        cost: number;
        income: number;
        maintenance: number;
    };
    PARK_SMALL: {
        cost: number;
        income: number;
        maintenance: number;
    };
    ROAD: {
        cost: number;
        income: number;
        maintenance: number;
    };
};
import { z } from 'zod';
export declare const TaxRateSchema: z.ZodNumber;
export type TaxRate = z.infer<typeof TaxRateSchema>;
export declare const EconomyCalculator: {
    calculateTaxIncome: (city: any, buildings: any[]) => any;
    calculateMaintenanceCost: (buildings: any[]) => any;
};
export default EconomyCalculator;
