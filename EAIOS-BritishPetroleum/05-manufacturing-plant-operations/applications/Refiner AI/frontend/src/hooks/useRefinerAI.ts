// ─────────────────────────────────────────────────────────────────────────────
// Refiner AI — Custom React Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { refinerAIApi } from '../api/refinerAI';
import {
  DashboardKPIs,
  Refinery,
  Alert,
  Equipment,
  DigitalTwin,
  MLModel,
  SparePart,
  WorkOrder,
  ROIMetrics,
} from '../types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

export const useDashboardKPIs  = () => useAsync<DashboardKPIs>(() => refinerAIApi.getDashboardKPIs());
export const useRefineries     = () => useAsync<Refinery[]>(() => refinerAIApi.getRefineries());
export const useAlerts         = () => useAsync<Alert[]>(() => refinerAIApi.getAlerts());
export const useEquipment      = () => useAsync<Equipment[]>(() => refinerAIApi.getEquipment());
export const useMLModels       = () => useAsync<MLModel[]>(() => refinerAIApi.getMLModels());
export const useSpareParts     = () => useAsync<SparePart[]>(() => refinerAIApi.getSpareParts());
export const useWorkOrders     = () => useAsync<WorkOrder[]>(() => refinerAIApi.getWorkOrders());
export const useROIMetrics     = () => useAsync<ROIMetrics>(() => refinerAIApi.getROIMetrics());

export const useDigitalTwin = (equipmentId: string) =>
  useAsync<DigitalTwin>(() => refinerAIApi.getDigitalTwin(equipmentId), [equipmentId]);
