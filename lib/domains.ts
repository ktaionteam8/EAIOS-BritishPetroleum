export const DOMAINS = [
  {
    slug: "manufacturing",
    name: "Manufacturing",
    color: "#3b82f6",
    services: [
      { service: "predictive-maintenance", agent: "MaintenanceAgent", port: 8001 },
      { service: "refinery-yield-optimization", agent: "ProductionAgent", port: 8002 },
      { service: "quality-control-ai", agent: "QualityAgent", port: 8003 },
      { service: "downtime-prevention", agent: "DowntimeAgent", port: 8004 },
      { service: "energy-efficiency", agent: "EnergyAgent", port: 8005 },
      { service: "digital-twin", agent: "DigitalTwinAgent", port: 8006 },
    ],
  },
  {
    slug: "supply-chain",
    name: "Supply Chain",
    color: "#06b6d4",
    services: [
      { service: "demand-supply-matching", agent: "CrudeAgent+RefineryAgent", port: 8011 },
      { service: "castrol-distribution", agent: "LubricantAgent", port: 8012 },
      { service: "aviation-fuel-logistics", agent: "AviationAgent", port: 8013 },
      { service: "marine-bunkering", agent: "LogisticsAgent", port: 8014 },
      { service: "retail-fuel-optimization", agent: "RetailAgent", port: 8015 },
      { service: "inventory-management", agent: "InventoryAgent", port: 8016 },
    ],
  },
  {
    slug: "commercial-trading",
    name: "Commercial Trading",
    color: "#8b5cf6",
    services: [
      { service: "crude-trading-analytics", agent: "CrudeTradingAgent", port: 8021 },
      { service: "carbon-credit-trading", agent: "CarbonCreditAgent", port: 8022 },
      { service: "castrol-pricing-engine", agent: "CastrolPricingAgent", port: 8023 },
      { service: "aviation-fuel-forecasting", agent: "AviationForecastAgent", port: 8024 },
      { service: "lng-trading-platform", agent: "LNGTradingAgent", port: 8025 },
      { service: "cross-commodity-arbitrage", agent: "ArbitrageAgent", port: 8026 },
    ],
  },
  {
    slug: "hr-safety",
    name: "HR & Safety",
    color: "#f59e0b",
    services: [
      { service: "workforce-planning", agent: "WorkforceAgent", port: 8031 },
      { service: "skills-gap-analysis", agent: "SkillsGapAgent", port: 8032 },
      { service: "talent-analytics", agent: "TalentAnalyticsAgent", port: 8033 },
      { service: "safety-incident-prediction", agent: "SafetyAgent", port: 8034 },
      { service: "contractor-management", agent: "ContractorAgent", port: 8035 },
      { service: "energy-transition-reskilling", agent: "ReskillingAgent", port: 8036 },
    ],
  },
  {
    slug: "it-cybersecurity",
    name: "IT & Cybersecurity",
    color: "#ef4444",
    services: [
      { service: "it-service-desk-ai", agent: "ServiceDeskAgent", port: 8041 },
      { service: "threat-detection", agent: "ThreatDetectionAgent", port: 8042 },
      { service: "ot-security-monitoring", agent: "OTSecurityAgent", port: 8043 },
      { service: "shadow-it-rationalization", agent: "ShadowITAgent", port: 8044 },
      { service: "infrastructure-monitoring", agent: "InfraMonitoringAgent", port: 8045 },
      { service: "compliance-management", agent: "ComplianceAgent", port: 8046 },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    color: "#10b981",
    services: [
      { service: "financial-close-automation", agent: "FinancialCloseAgent", port: 8051 },
      { service: "jv-accounting", agent: "JVAccountingAgent", port: 8052 },
      { service: "cost-forecasting", agent: "CostForecastAgent", port: 8053 },
      { service: "tax-compliance", agent: "TaxComplianceAgent", port: 8054 },
      { service: "treasury-management", agent: "TreasuryAgent", port: 8055 },
      { service: "revenue-analytics", agent: "RevenueAnalyticsAgent", port: 8056 },
    ],
  },
] as const;

export type DomainSlug = (typeof DOMAINS)[number]["slug"];

export function getDomain(slug: string) {
  return DOMAINS.find((d) => d.slug === slug);
}
