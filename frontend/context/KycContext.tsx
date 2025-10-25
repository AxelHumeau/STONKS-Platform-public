import React from 'react';

export type KycContextType = {
  openKyc: () => void;
  closeKyc: () => void;
  refreshKey: number;
  bumpRefreshKey: () => void;
};

export const KycContext = React.createContext<KycContextType | null>(null);

export function useKyc() {
  const ctx = React.useContext(KycContext);
  if (!ctx) throw new Error('useKyc must be used within KycProvider');
  return ctx;
}
