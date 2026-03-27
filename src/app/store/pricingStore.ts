import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServiceData } from '../types/pricing';

interface PricingStore {
  data: ServiceData[] | null;
  setData: (data: ServiceData[]) => void;
  clearData: () => void;
}

export const usePricingStore = create<PricingStore>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'pricing-storage',
    }
  )
);