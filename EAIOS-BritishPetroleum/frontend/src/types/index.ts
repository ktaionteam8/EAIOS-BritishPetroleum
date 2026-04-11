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
    id: 'refine-ai',
    name: 'Refine AI',
    description: '',
    domainId: '05-manufacturing-plant-operations',
    status: 'active',
    version: '1.0.0',
  },
];
