
export interface Unit {
  id: number | string;
  unitNumber: string;
  ownerName: string;
  originalOwnerName: string;
  share: number;
  block: string;
  isPresent: boolean;
  hasPowerOfAttorney: boolean;
  lastSyncedIsPresent?: boolean;
  lastSyncedHasPowerOfAttorney?: boolean;
  vote?: 'PRO' | 'PROTI' | 'ZDRŽEL' | null;
}
