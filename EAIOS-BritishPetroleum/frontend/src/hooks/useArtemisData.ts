/**
 * useArtemisData — single hook that loads all ARTEMIS API data in parallel.
 * Returns typed data arrays plus a global loading flag.
 */
import { useState, useEffect } from 'react';
import {
  fetchArtemisAgents, fetchArtemisCompliance,
  fetchArbitrageOpportunities, fetchArbitrageMetrics,
  fetchBaseOilPrices, fetchCastrolPricingRecs,
  fetchAviationForecasts, fetchAviationContracts,
  fetchCarbonPositions, fetchCarbonRecommendations,
  fetchArtemisModels, fetchArtemisAuditLog,
  ArtemisAgentStatus, ArtemisComplianceEvent,
  ArbitrageOpportunity, ArbitrageMetric,
  BaseOilPrice, CastrolPricingRec,
  AviationForecast, AviationContract,
  CarbonPosition, CarbonRecommendation,
  ArtemisModelRegistry, ArtemisAuditLog,
} from '../api/client';

export interface ArtemisData {
  loading: boolean;
  agents: ArtemisAgentStatus[];
  complianceEvents: ArtemisComplianceEvent[];
  opportunities: ArbitrageOpportunity[];
  arbMetrics: ArbitrageMetric[];
  baseOil: BaseOilPrice[];
  pricingRecs: CastrolPricingRec[];
  forecasts: AviationForecast[];
  contracts: AviationContract[];
  carbonPositions: CarbonPosition[];
  carbonRecs: CarbonRecommendation[];
  models: ArtemisModelRegistry[];
  auditLog: ArtemisAuditLog[];
}

const EMPTY: ArtemisData = {
  loading: true,
  agents: [], complianceEvents: [],
  opportunities: [], arbMetrics: [],
  baseOil: [], pricingRecs: [],
  forecasts: [], contracts: [],
  carbonPositions: [], carbonRecs: [],
  models: [], auditLog: [],
};

export function useArtemisData(): ArtemisData {
  const [data, setData] = useState<ArtemisData>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchArtemisAgents(),
      fetchArtemisCompliance(),
      fetchArbitrageOpportunities('open'),
      fetchArbitrageMetrics(7),
      fetchBaseOilPrices(),
      fetchCastrolPricingRecs(),
      fetchAviationForecasts(5),
      fetchAviationContracts(),
      fetchCarbonPositions(),
      fetchCarbonRecommendations(),
      fetchArtemisModels(),
      fetchArtemisAuditLog(20),
    ]).then(([
      agents, complianceEvents,
      opportunities, arbMetrics,
      baseOil, pricingRecs,
      forecasts, contracts,
      carbonPositions, carbonRecs,
      models, auditLog,
    ]) => {
      if (!cancelled) {
        setData({
          loading: false,
          agents, complianceEvents,
          opportunities, arbMetrics,
          baseOil, pricingRecs,
          forecasts, contracts,
          carbonPositions, carbonRecs,
          models, auditLog,
        });
      }
    }).catch(() => {
      if (!cancelled) setData(prev => ({ ...prev, loading: false }));
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}
