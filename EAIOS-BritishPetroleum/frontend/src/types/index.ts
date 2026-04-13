export interface User {
  email: string;
  loginTime: string;
}

export interface Domain {
  id: string;
  name: string;
  shortName: string;
  description: string;
  agentCount: number;
  icon: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  domainId: string;
  status: 'active' | 'inactive' | 'maintenance';
  version?: string;
  url?: string;
}

export const DOMAINS: Domain[] = [
  {
    id: '01-finance-accounting',
    name: 'Finance & Accounting',
    shortName: 'Finance',
    description:
      'AI agents automating financial close, joint venture accounting, cost forecasting, tax compliance, treasury management, and revenue analytics across BP\'s global finance function.',
    agentCount: 6,
    icon: 'finance',
  },
  {
    id: '02-human-resources-safety',
    name: 'Human Resources & Safety',
    shortName: 'HR & Safety',
    description:
      'AI agents for workforce planning, skills gap analysis, talent analytics, HSE incident prediction, contractor management, and energy transition reskilling programmes.',
    agentCount: 6,
    icon: 'hr',
  },
  {
    id: '03-it-operations-cybersecurity',
    name: 'IT Operations & Cybersecurity',
    shortName: 'IT & Cyber',
    description:
      'AI agents for IT service desk automation, threat detection, OT/ICS security monitoring, shadow IT rationalization, infrastructure observability, and compliance management.',
    agentCount: 6,
    icon: 'it',
  },
  {
    id: '04-commercial-trading',
    name: 'Commercial & Trading',
    shortName: 'Trading',
    description:
      'AI agents for crude oil trading analytics, carbon credit markets, Castrol pricing optimisation, aviation fuel forecasting, LNG trading, and cross-commodity arbitrage.',
    agentCount: 6,
    icon: 'trading',
  },
  {
    id: '05-manufacturing-plant-operations',
    name: 'Manufacturing & Plant Operations',
    shortName: 'Manufacturing',
    description:
      'AI agents for predictive maintenance, refinery yield optimisation, quality control, downtime prevention, energy efficiency, and digital twin simulation across BP\'s plant network.',
    agentCount: 6,
    icon: 'manufacturing',
  },
  {
    id: '06-supply-chain-logistics',
    name: 'Supply Chain & Logistics',
    shortName: 'Supply Chain',
    description:
      'AI agents for demand-supply matching, Castrol distribution optimisation, aviation fuel logistics, marine bunkering, retail fuel optimisation, and inventory management.',
    agentCount: 6,
    icon: 'logistics',
  },
];

export const APPLICATIONS: Application[] = [
  {
    id: 'refiner-ai',
    name: 'Refiner AI',
    description: 'Predictive Maintenance Intelligence Platform monitoring 6,842 assets across 40 global refineries.',
    domainId: '05-manufacturing-plant-operations',
    status: 'active',
    version: '1.0.0',
    url: '/apps/refiner-ai',
  },
];

export interface Agent {
  id: string;
  name: string;
  domainId: string;
  description: string;
  status: 'active' | 'idle' | 'training' | 'error';
  tasksProcessed: number;
  accuracy: number;
  uptime: number;
  lastRun: string;
}

export const AGENTS: Agent[] = [
  // 01 — Finance & Accounting
  { id: 'financial-close-automation-agent',  name: 'Financial Close Automation',  domainId: '01-finance-accounting', description: 'Automates period-end close: reconciliations, accruals, intercompany eliminations.',      status: 'active',   tasksProcessed: 14820,  accuracy: 96.4, uptime: 99.1, lastRun: '2m ago'  },
  { id: 'jv-accounting-agent',               name: 'JV Accounting',               domainId: '01-finance-accounting', description: 'Joint venture accounting, billing statements, cash calls, partner reporting.',           status: 'active',   tasksProcessed: 8340,   accuracy: 94.2, uptime: 98.7, lastRun: '5m ago'  },
  { id: 'cost-forecasting-agent',            name: 'Cost Forecasting',            domainId: '01-finance-accounting', description: 'Predicts cost variances vs budget; early-warning for overruns.',                        status: 'active',   tasksProcessed: 22100,  accuracy: 91.8, uptime: 99.3, lastRun: '1m ago'  },
  { id: 'tax-compliance-agent',              name: 'Tax Compliance',              domainId: '01-finance-accounting', description: 'Global tax compliance, filing reminders, transfer pricing validation.',                  status: 'idle',     tasksProcessed: 4210,   accuracy: 97.6, uptime: 97.2, lastRun: '3h ago'  },
  { id: 'treasury-management-agent',         name: 'Treasury Management',         domainId: '01-finance-accounting', description: 'Cash/liquidity optimisation, FX exposure management, intercompany loans.',              status: 'active',   tasksProcessed: 11650,  accuracy: 93.1, uptime: 98.9, lastRun: '8m ago'  },
  { id: 'revenue-analytics-agent',           name: 'Revenue Analytics',           domainId: '01-finance-accounting', description: 'Revenue performance analytics across BUs, products, and geographies.',                  status: 'training', tasksProcessed: 6780,   accuracy: 88.4, uptime: 96.5, lastRun: '12m ago' },

  // 02 — Human Resources & Safety
  { id: 'workforce-planning-agent',          name: 'Workforce Planning',          domainId: '02-human-resources-safety', description: 'Forecasts headcount needs using project pipelines and attrition data.',             status: 'active',   tasksProcessed: 9430,   accuracy: 89.3, uptime: 98.4, lastRun: '4m ago'  },
  { id: 'skills-gap-analysis-agent',         name: 'Skills Gap Analysis',         domainId: '02-human-resources-safety', description: 'Identifies capability gaps; recommends training and hiring interventions.',         status: 'active',   tasksProcessed: 7620,   accuracy: 87.9, uptime: 97.8, lastRun: '11m ago' },
  { id: 'talent-analytics-agent',            name: 'Talent Analytics',            domainId: '02-human-resources-safety', description: 'Talent pipeline health, flight risk scoring, succession planning.',                 status: 'idle',     tasksProcessed: 5140,   accuracy: 91.2, uptime: 98.1, lastRun: '2h ago'  },
  { id: 'safety-incident-prediction-agent',  name: 'Safety Incident Prediction',  domainId: '02-human-resources-safety', description: 'Predicts HSE incidents using leading indicators and near-miss data.',               status: 'active',   tasksProcessed: 18920,  accuracy: 93.7, uptime: 99.5, lastRun: '30s ago' },
  { id: 'contractor-management-agent',       name: 'Contractor Management',       domainId: '02-human-resources-safety', description: 'Full contractor lifecycle: onboarding, competency, PTW compliance, offboarding.',  status: 'active',   tasksProcessed: 12380,  accuracy: 95.1, uptime: 99.0, lastRun: '3m ago'  },
  { id: 'energy-transition-reskilling-agent',name: 'Energy Transition Reskilling',domainId: '02-human-resources-safety', description: 'Maps oil & gas skills to renewable roles; personalised learning pathways.',         status: 'training', tasksProcessed: 3870,   accuracy: 84.6, uptime: 95.3, lastRun: '45m ago' },

  // 03 — IT Operations & Cybersecurity
  { id: 'it-service-desk-agent',             name: 'IT Service Desk',             domainId: '03-it-operations-cybersecurity', description: 'Automates IT ticket triage, classification, routing, and resolution.',       status: 'active',   tasksProcessed: 48300,  accuracy: 92.4, uptime: 99.7, lastRun: '10s ago' },
  { id: 'threat-detection-agent',            name: 'Threat Detection',            domainId: '03-it-operations-cybersecurity', description: 'Detects cyber threats across IT/OT networks using behavioural analytics.',   status: 'active',   tasksProcessed: 312000, accuracy: 96.8, uptime: 99.9, lastRun: '1s ago'  },
  { id: 'ot-security-monitoring-agent',      name: 'OT Security Monitoring',      domainId: '03-it-operations-cybersecurity', description: 'Monitors ICS/SCADA/DCS environments for security anomalies.',               status: 'active',   tasksProcessed: 186400, accuracy: 97.2, uptime: 99.8, lastRun: '2s ago'  },
  { id: 'shadow-it-rationalization-agent',   name: 'Shadow IT Rationalization',   domainId: '03-it-operations-cybersecurity', description: 'Discovers unsanctioned cloud services; assesses risk and governance.',       status: 'idle',     tasksProcessed: 2840,   accuracy: 88.9, uptime: 97.4, lastRun: '4h ago'  },
  { id: 'infrastructure-monitoring-agent',   name: 'Infrastructure Monitoring',   domainId: '03-it-operations-cybersecurity', description: 'Infrastructure health, capacity, and predictive auto-remediation.',          status: 'active',   tasksProcessed: 94200,  accuracy: 94.5, uptime: 99.6, lastRun: '5s ago'  },
  { id: 'compliance-management-agent',       name: 'Compliance Management',       domainId: '03-it-operations-cybersecurity', description: 'ISO 27001/NIST/SOC2 compliance tracking and evidence collection.',           status: 'idle',     tasksProcessed: 1620,   accuracy: 98.3, uptime: 98.2, lastRun: '1h ago'  },

  // 04 — Commercial & Trading
  { id: 'crude-trading-analytics-agent',     name: 'Crude Trading Analytics',     domainId: '04-commercial-trading', description: 'Crude oil market dynamics, fundamentals, and trading opportunity analysis.',          status: 'active',   tasksProcessed: 67400,  accuracy: 87.3, uptime: 99.2, lastRun: '15s ago' },
  { id: 'carbon-credit-trading-agent',       name: 'Carbon Credit Trading',       domainId: '04-commercial-trading', description: 'Carbon credit portfolio management, ETS compliance, voluntary market trading.',       status: 'active',   tasksProcessed: 28900,  accuracy: 90.1, uptime: 98.8, lastRun: '2m ago'  },
  { id: 'castrol-pricing-engine-agent',      name: 'Castrol Pricing Engine',      domainId: '04-commercial-trading', description: 'Castrol lubricant pricing optimisation across 120+ global markets.',                 status: 'active',   tasksProcessed: 43700,  accuracy: 92.6, uptime: 99.1, lastRun: '8m ago'  },
  { id: 'aviation-fuel-forecasting-agent',   name: 'Aviation Fuel Forecasting',   domainId: '04-commercial-trading', description: 'Jet A-1 demand forecasting using flight schedules and airline capacity plans.',       status: 'training', tasksProcessed: 15200,  accuracy: 85.7, uptime: 96.4, lastRun: '1h ago'  },
  { id: 'lng-trading-platform-agent',        name: 'LNG Trading Platform',        domainId: '04-commercial-trading', description: 'LNG cargo trading: spot/term markets, shipping schedules, pricing differentials.',    status: 'active',   tasksProcessed: 34100,  accuracy: 89.4, uptime: 98.6, lastRun: '6m ago'  },
  { id: 'cross-commodity-arbitrage-agent',   name: 'Cross-Commodity Arbitrage',   domainId: '04-commercial-trading', description: 'Identifies arbitrage opportunities across crude, gas, power, and carbon.',            status: 'active',   tasksProcessed: 52800,  accuracy: 86.9, uptime: 99.0, lastRun: '30s ago' },

  // 05 — Manufacturing & Plant Operations
  { id: 'predictive-maintenance-agent',      name: 'Predictive Maintenance',      domainId: '05-manufacturing-plant-operations', description: 'Predicts equipment failures using IoT sensors and vibration analysis.',  status: 'active',   tasksProcessed: 128400, accuracy: 94.8, uptime: 99.4, lastRun: '3s ago'  },
  { id: 'refinery-yield-optimization-agent', name: 'Refinery Yield Optimisation', domainId: '05-manufacturing-plant-operations', description: 'Maximises refinery throughput via crude blend and unit conditions.',      status: 'active',   tasksProcessed: 41200,  accuracy: 91.3, uptime: 98.9, lastRun: '1m ago'  },
  { id: 'quality-control-agent',             name: 'Quality Control',             domainId: '05-manufacturing-plant-operations', description: 'Real-time product quality monitoring; deviation detection and RCA.',       status: 'active',   tasksProcessed: 76800,  accuracy: 95.2, uptime: 99.6, lastRun: '8s ago'  },
  { id: 'downtime-prevention-agent',         name: 'Downtime Prevention',         domainId: '05-manufacturing-plant-operations', description: 'Early-warning for unplanned shutdowns; triggers proactive interventions.', status: 'active',   tasksProcessed: 23400,  accuracy: 92.7, uptime: 99.3, lastRun: '45s ago' },
  { id: 'energy-efficiency-agent',           name: 'Energy Efficiency',           domainId: '05-manufacturing-plant-operations', description: 'Optimises steam, power, fuel gas, and cooling water across the plant.',    status: 'idle',     tasksProcessed: 18700,  accuracy: 90.4, uptime: 97.9, lastRun: '30m ago' },
  { id: 'digital-twin-agent',                name: 'Digital Twin',                domainId: '05-manufacturing-plant-operations', description: 'High-fidelity plant simulation for scenario testing and optimisation.',    status: 'active',   tasksProcessed: 9840,   accuracy: 97.1, uptime: 98.7, lastRun: '4m ago'  },

  // 06 — Supply Chain & Logistics
  { id: 'demand-supply-matching-agent',      name: 'Demand Supply Matching',      domainId: '06-supply-chain-logistics', description: 'Balances product supply with downstream demand; optimises movements.',             status: 'active',   tasksProcessed: 37600,  accuracy: 91.8, uptime: 99.2, lastRun: '2m ago'  },
  { id: 'castrol-distribution-agent',        name: 'Castrol Distribution',        domainId: '06-supply-chain-logistics', description: 'Optimises Castrol global distribution: blending, warehousing, last-mile.',        status: 'active',   tasksProcessed: 24800,  accuracy: 93.4, uptime: 98.8, lastRun: '7m ago'  },
  { id: 'aviation-fuel-logistics-agent',     name: 'Aviation Fuel Logistics',     domainId: '06-supply-chain-logistics', description: 'End-to-end aviation fuel supply chain from refinery to airport hydrant.',         status: 'active',   tasksProcessed: 18900,  accuracy: 94.7, uptime: 99.1, lastRun: '3m ago'  },
  { id: 'marine-bunkering-agent',            name: 'Marine Bunkering',            domainId: '06-supply-chain-logistics', description: 'Marine fuel supply and bunkering operations across global ports.',                 status: 'idle',     tasksProcessed: 11200,  accuracy: 92.1, uptime: 97.6, lastRun: '1h ago'  },
  { id: 'retail-fuel-optimization-agent',    name: 'Retail Fuel Optimisation',    domainId: '06-supply-chain-logistics', description: 'Retail station supply, pricing, and delivery optimisation.',                       status: 'active',   tasksProcessed: 45300,  accuracy: 90.6, uptime: 98.5, lastRun: '5m ago'  },
  { id: 'inventory-management-agent',        name: 'Inventory Management',        domainId: '06-supply-chain-logistics', description: 'Inventory level optimisation: safety stock, reorder points, tank utilisation.',   status: 'training', tasksProcessed: 8900,   accuracy: 86.3, uptime: 96.1, lastRun: '2h ago'  },
];
