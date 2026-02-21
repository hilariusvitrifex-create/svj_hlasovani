
import { Unit } from './app-types';

const generateMockUnits = (): Unit[] => {
  const units: Unit[] = [];
  const blocks = ['2262', '2263', '2264'];
  
  // 60 units total, 20 per block as requested
  for (let b = 0; b < blocks.length; b++) {
    const blockLabel = blocks[b];
    for (let i = 0; i < 20; i++) {
      const globalId = (b * 20 + i) + 1; 
      const defaultName = `Vlastník ${globalId}`;
      units.push({
        id: globalId,
        unitNumber: `${i + 1}`,
        ownerName: defaultName,
        originalOwnerName: defaultName,
        share: 1.66, 
        block: blockLabel,
        isPresent: false,
        hasPowerOfAttorney: false
      });
    }
  }
  
  return units;
};

export const MOCK_UNITS = generateMockUnits();

export const BLOCKS = ['2262', '2263', '2264'];
