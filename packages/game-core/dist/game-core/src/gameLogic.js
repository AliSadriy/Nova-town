import { EconomyCalculator } from '@nova-town/economy';
import { v4 as uuidv4 } from 'uuid';
export const GameLogic = {
    createCity: (name, ownerId, initialBalance = 1000) => {
        return {
            id: uuidv4(),
            name,
            userId: ownerId,
            level: 1,
            population: 0,
            gold: initialBalance,
            energyCapacity: 100,
            energyUsed: 0,
            waterCapacity: 100,
            waterUsed: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },
    placeBuilding: (city, buildingType, x, y) => {
        return {
            id: uuidv4(),
            cityId: city.id,
            type: buildingType,
            level: 1,
            x: x,
            y: y,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },
    collectTax: (city, buildings) => {
        const taxIncome = EconomyCalculator.calculateTaxIncome(city, buildings);
        const updatedCity = {
            ...city,
            gold: city.gold + taxIncome,
            updatedAt: new Date().toISOString()
        };
        const transaction = {
            id: uuidv4(),
            cityId: city.id,
            type: 'tax_collection',
            amount: taxIncome,
            timestamp: new Date(),
            status: 'completed'
        };
        return { city: updatedCity, transaction };
    }
};
export default GameLogic;
//# sourceMappingURL=gameLogic.js.map