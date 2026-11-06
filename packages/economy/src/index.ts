export const BUILDING_CONFIGS = {
  RESIDENTIAL_SMALL: { cost: 100, income: 10, maintenance: 2 },
  RESIDENTIAL_MEDIUM: { cost: 300, income: 35, maintenance: 7 },
  COMMERCIAL_SHOP: { cost: 200, income: 25, maintenance: 5 },
  COMMERCIAL_TOWER: { cost: 800, income: 110, maintenance: 20 },
  INDUSTRIAL_FACTORY: { cost: 500, income: 80, maintenance: 15 },
  PARK_SMALL: { cost: 50, income: 0, maintenance: 1 },
  ROAD: { cost: 10, income: 0, maintenance: 0 }
};

import { z } from 'zod';

// Fraction of gross building income collected as city tax, e.g. 0.2 = 20%.
export const TaxRateSchema = z.number().min(0).max(1);
export type TaxRate = z.infer<typeof TaxRateSchema>;
export const EconomyCalculator = {
  calculateTaxIncome: (city: any, buildings: any[]) => {
    return buildings.reduce((sum, b) => {
      const cfg = (BUILDING_CONFIGS as any)[b.type];
      return sum + (cfg ? cfg.income : 0);
    }, 0);
  },
  calculateMaintenanceCost: (buildings: any[]) => {
    return buildings.reduce((sum, b) => {
      const cfg = (BUILDING_CONFIGS as any)[b.type];
      return sum + (cfg ? cfg.maintenance : 0);
    }, 0);
  }
};

export default EconomyCalculator;
