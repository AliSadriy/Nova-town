import { City, Building, PlayerId, GameTransaction } from '@nova-town/shared';
import { BUILDING_CONFIGS } from '@nova-town/economy';
export declare const GameLogic: {
    createCity: (name: string, ownerId: PlayerId, initialBalance?: number) => City;
    placeBuilding: (city: City, buildingType: keyof typeof BUILDING_CONFIGS, x: number, y: number) => Building;
    collectTax: (city: City, buildings: Building[]) => {
        city: City;
        transaction: GameTransaction;
    };
};
export default GameLogic;
