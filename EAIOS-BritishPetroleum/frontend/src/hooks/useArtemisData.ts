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

    Promise.allSettled([
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
      r_agents, r_compliance,
      r_opportunities, r_arbMetrics,
      r_baseOil, r_pricingRecs,
      r_forecasts, r_contracts,
      r_carbonPositions, r_carbonRecs,
      r_models, r_auditLog,
    ]) => {
      const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback;
      if (!cancelled) {
        setData({
          loading: false,
          agents:          ok(r_agents, []),
          complianceEvents: ok(r_compliance, []),
          opportunities:   ok(r_opportunities, []),
          arbMetrics:      ok(r_arbMetrics, []),
          baseOil:         ok(r_baseOil, []),
          pricingRecs:     ok(r_pricingRecs, []),
          forecasts:       ok(r_forecasts, []),
          contracts:       ok(r_contracts, []),
          carbonPositions: ok(r_carbonPositions, []),
          carbonRecs:      ok(r_carbonRecs, []),
          models:          ok(r_models, []),
          auditLog:        ok(r_auditLog, []),
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}
