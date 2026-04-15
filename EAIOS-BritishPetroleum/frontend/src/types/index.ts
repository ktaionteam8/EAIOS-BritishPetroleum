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

export type AppCategory = 'Transactional' | 'Analytical' | 'AI-Powered';

export interface Application {
  id: string;
  name: string;
  description: string;
  domainId: string;
  status: 'active' | 'inactive' | 'maintenance';
  version?: string;
  url?: string;
  category: AppCategory;
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

  // 01 — Finance & Accounting
  { id: 'create-journal-entry',         name: 'Create Journal Entry',           description: 'Post financial journal entries and period-end adjustments across ledgers.',                                     domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'post-customer-invoice',        name: 'Post Customer Invoice',          description: 'Create and post outgoing invoices to customers in accounts receivable.',                                        domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'post-vendor-invoice',          name: 'Post Vendor Invoice',            description: 'Capture and verify supplier invoices for accounts payable processing.',                                         domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'profitability-analysis',       name: 'Profitability Analysis',         description: 'Analyse revenue and cost by product, customer, and segment in real-time.',                                     domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'bank-statement-processing',    name: 'Bank Statement Processing',      description: 'Import and reconcile electronic bank statements with internal records.',                                        domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'treasury-management',          name: 'Treasury Management',            description: 'Manage liquidity, investments, and financial risk across treasury operations.',                                 domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'budget-planning',              name: 'Budget Planning',                description: 'Plan and distribute cost centre budgets across organisational units.',                                          domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'asset-accounting',             name: 'Asset Accounting',               description: 'Manage the full lifecycle of fixed assets including depreciation runs.',                                        domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'tax-declaration',              name: 'Tax Declaration',                description: 'Prepare and submit tax filings for multiple jurisdictions and tax types.',                                      domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'aging-analysis',               name: 'Aging Analysis',                 description: 'Monitor overdue receivables and payables to identify collection risks.',                                       domainId: '01-finance-accounting', status: 'active', version: '1.0.0', category: 'Analytical'    },

  // 02 — Human Resources & Safety
  { id: 'hire-employee',                    name: 'Hire Employee',                    description: 'Initiate and complete the end-to-end hiring process for new employees.',                                     domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'manage-employee-data',             name: 'Manage Employee Data',             description: 'Maintain core HR master data including personal, organisational, and pay data.',                             domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'time-recording',                   name: 'Time Recording',                   description: 'Capture employee time entries against projects, cost centres, and activities.',                              domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'leave-request',                    name: 'Leave Request',                    description: 'Submit, approve, and track employee leave requests and balances.',                                           domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'payroll-processing',               name: 'Payroll Processing',               description: 'Run payroll calculations, deductions, and disbursements for pay periods.',                                  domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'learning-management',              name: 'Learning Management',              description: 'Assign, track, and complete training courses and certifications.',                                           domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'performance-management',           name: 'Performance Management',           description: 'Set goals, conduct reviews, and track employee performance ratings.',                                        domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'workforce-analytics',              name: 'Workforce Analytics',              description: 'Analyse headcount, turnover, diversity, and workforce composition trends.',                                  domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'incident-management',              name: 'Incident Management',              description: 'Report, investigate, and resolve workplace safety incidents and near-misses.',                               domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'risk-assessment',                  name: 'Risk Assessment',                  description: 'Identify, evaluate, and control workplace hazards and environmental risks.',                                 domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'hazardous-substance-management',   name: 'Hazardous Substance Management',   description: 'Track and manage dangerous goods, SDS records, and chemical inventories.',                                  domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'safety-observation',               name: 'Safety Observation',               description: 'Record and analyse field safety observations, audits, and corrective actions.',                             domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'environmental-reporting',          name: 'Environmental Reporting',          description: 'Capture emissions, waste, and energy data for regulatory compliance reporting.',                            domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'ehs-dashboard',                    name: 'EHS Dashboard',                    description: 'Real-time KPIs across safety incidents, near misses, and compliance status.',                               domainId: '02-human-resources-safety', status: 'active', version: '1.0.0', category: 'Analytical'    },

  // 03 — IT Operations & Cybersecurity
  { id: 'system-monitoring',             name: 'System Monitoring',             description: 'Monitor system health, resource utilisation, and application performance metrics.',                              domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'user-access-management',        name: 'User Access Management',        description: 'Manage user roles, authorisations, and access control across SAP systems.',                                     domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'integration-monitoring',        name: 'Integration Monitoring',        description: 'Track and troubleshoot data flows and interface errors across connected systems.',                               domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'change-request-management',     name: 'Change Request Management',     description: 'Submit, approve, and deploy system changes through a controlled release process.',                              domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'license-usage-analytics',       name: 'License & Usage Analytics',     description: 'Analyse SAP licence consumption and optimise user assignments to reduce cost.',                                 domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'security-threat-monitoring',    name: 'Security Threat Monitoring',    description: 'Detect and respond to cybersecurity threats, anomalies, and access violations.',                               domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'identity-access-governance',    name: 'Identity & Access Governance',  description: 'Enforce role-based access policies and audit compliance across enterprise systems.',                           domainId: '03-it-operations-cybersecurity', status: 'active', version: '1.0.0', category: 'Transactional' },

  // 04 — Commercial & Trading
  { id: 'manage-sales-orders',           name: 'Manage Sales Orders',           description: 'Create, modify, and track customer sales orders through fulfilment.',                                           domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'account-overview',              name: 'Account Overview',              description: 'View 360-degree customer account data including contacts, orders, and opportunities.',                          domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'sales-performance-dashboard',   name: 'Sales Performance Dashboard',   description: 'Track revenue, pipeline, win rates, and quota attainment by rep and region.',                                 domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'contract-management',           name: 'Contract Management',           description: 'Create and manage customer contracts, pricing agreements, and renewal schedules.',                              domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'pricing-conditions',            name: 'Pricing & Conditions',          description: 'Define and maintain pricing rules, discounts, and condition records for customers.',                            domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'delivery-management',           name: 'Delivery Management',           description: 'Plan, execute, and confirm outbound deliveries and shipping documents.',                                        domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'trading-analytics',             name: 'Trading Analytics',             description: 'Analyse commodity trading positions, volumes, and P&L across portfolios.',                                     domainId: '04-commercial-trading', status: 'active', version: '1.0.0', category: 'Analytical'    },

  // 05 — Manufacturing & Plant Operations
  { id: 'production-order-management',     name: 'Production Order Management',     description: 'Create, release, and monitor production orders against planned schedules.',                               domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'material-requirements-planning',  name: 'Material Requirements Planning',  description: 'Run MRP to calculate and trigger procurement and production proposals.',                                  domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'work-centre-management',          name: 'Work Centre Management',          description: 'Define and manage manufacturing work centres, capacities, and shift schedules.',                           domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'production-performance',          name: 'Production Performance',          description: 'Monitor OEE, throughput, scrap rates, and production KPIs in real-time.',                                 domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'quality-inspection',              name: 'Quality Inspection',              description: 'Record and evaluate inspection results for incoming and in-process goods.',                                domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'quality-notifications',           name: 'Quality Notifications',           description: 'Capture and manage defect reports, customer complaints, and corrective actions.',                         domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'maintenance-order-management',    name: 'Maintenance Order Management',    description: 'Create, plan, and execute corrective and preventive maintenance work orders.',                            domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'maintenance-planning',            name: 'Maintenance Planning',            description: 'Schedule and optimise planned maintenance tasks across equipment fleets.',                                 domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'equipment-master-data',           name: 'Equipment Master Data',           description: 'Maintain technical objects, equipment hierarchy, and measurement points.',                                 domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'asset-performance-dashboard',     name: 'Asset Performance Dashboard',     description: 'Monitor equipment reliability, MTBF, failure rates, and maintenance costs.',                             domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'breakdown-notification',          name: 'Breakdown Notification',          description: 'Report equipment breakdowns and trigger emergency maintenance workflows.',                                 domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'spare-parts-catalogue',           name: 'Spare Parts Catalogue',           description: 'Browse and requisition spare parts linked to equipment and BOMs.',                                        domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'maintenance-cost-analysis',       name: 'Maintenance Cost Analysis',       description: 'Analyse and benchmark maintenance spend against budget by equipment class.',                              domainId: '05-manufacturing-plant-operations', status: 'active', version: '1.0.0', category: 'Analytical'    },

  // 06 — Supply Chain & Logistics
  { id: 'manage-purchase-requisitions',  name: 'Manage Purchase Requisitions',  description: 'Create, view, and manage internal purchase requests for goods and services.',                                 domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'manage-purchase-orders',        name: 'Manage Purchase Orders',        description: 'Create and track purchase orders ensuring timely delivery of requested items.',                               domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'manage-rfqs',                   name: 'Manage RFQs',                   description: 'Create requests for quotation, manage supplier bids, and award contracts.',                                   domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'manage-purchase-contracts',     name: 'Manage Purchase Contracts',     description: 'Create and maintain outline agreements and long-term procurement contracts.',                                 domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'procurement-overview',          name: 'Procurement Overview',          description: 'View urgent contracts, requisitions, and spending KPIs in a single dashboard.',                              domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'goods-receipt',                 name: 'Goods Receipt',                 description: 'Post and confirm receipt of purchased goods against purchase orders.',                                        domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Transactional' },
  { id: 'material-price-variance',       name: 'Material Price Variance',       description: 'Monitor deviations between actual purchase prices and standard cost data.',                                  domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'inventory-overview',            name: 'Inventory Overview',            description: 'View real-time stock levels, reorder points, and inventory movements by plant.',                             domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'supplier-evaluation',           name: 'Supplier Evaluation',           description: 'Score and monitor supplier performance on delivery, quality, and pricing.',                                  domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Analytical'    },
  { id: 'spend-analysis',                name: 'Spend Analysis',                description: 'Analyse purchasing spend by category, supplier, and organisational unit.',                                   domainId: '06-supply-chain-logistics', status: 'active', version: '1.0.0', category: 'Analytical'    },

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
  { id: 'financial-close-automation-agent',  name: 'Financial Close Agent',       domainId: '01-finance-accounting', description: 'Automates period-end close: reconciliations, accruals, intercompany eliminations.',      status: 'active',   tasksProcessed: 14820,  accuracy: 96.4, uptime: 99.1, lastRun: '2m ago'  },
  { id: 'jv-accounting-agent',               name: 'JV Accounting Agent',         domainId: '01-finance-accounting', description: 'Joint venture accounting, billing statements, cash calls, partner reporting.',           status: 'active',   tasksProcessed: 8340,   accuracy: 94.2, uptime: 98.7, lastRun: '5m ago'  },
  { id: 'cost-forecasting-agent',            name: 'Cost Forecasting Agent',      domainId: '01-finance-accounting', description: 'Predicts cost variances vs budget; early-warning for overruns.',                        status: 'active',   tasksProcessed: 22100,  accuracy: 91.8, uptime: 99.3, lastRun: '1m ago'  },
  { id: 'tax-compliance-agent',              name: 'Tax Compliance Agent',        domainId: '01-finance-accounting', description: 'Global tax compliance, filing reminders, transfer pricing validation.',                  status: 'idle',     tasksProcessed: 4210,   accuracy: 97.6, uptime: 97.2, lastRun: '3h ago'  },
  { id: 'treasury-management-agent',         name: 'Treasury Management Agent',  domainId: '01-finance-accounting', description: 'Cash/liquidity optimisation, FX exposure management, intercompany loans.',              status: 'active',   tasksProcessed: 11650,  accuracy: 93.1, uptime: 98.9, lastRun: '8m ago'  },
  { id: 'revenue-analytics-agent',           name: 'Revenue Analytics Agent',    domainId: '01-finance-accounting', description: 'Revenue performance analytics across BUs, products, and geographies.',                  status: 'training', tasksProcessed: 6780,   accuracy: 88.4, uptime: 96.5, lastRun: '12m ago' },

  // 02 — Human Resources & Safety
  { id: 'workforce-planning-agent',          name: 'Workforce Planning Agent',   domainId: '02-human-resources-safety', description: 'Forecasts headcount needs using project pipelines and attrition data.',             status: 'active',   tasksProcessed: 9430,   accuracy: 89.3, uptime: 98.4, lastRun: '4m ago'  },
  { id: 'skills-gap-analysis-agent',         name: 'Skills Gap Analysis Agent',  domainId: '02-human-resources-safety', description: 'Identifies capability gaps; recommends training and hiring interventions.',         status: 'active',   tasksProcessed: 7620,   accuracy: 87.9, uptime: 97.8, lastRun: '11m ago' },
  { id: 'talent-analytics-agent',            name: 'Talent Analytics Agent',     domainId: '02-human-resources-safety', description: 'Talent pipeline health, flight risk scoring, succession planning.',                 status: 'idle',     tasksProcessed: 5140,   accuracy: 91.2, uptime: 98.1, lastRun: '2h ago'  },
  { id: 'safety-incident-prediction-agent',  name: 'Safety Incident Agent',      domainId: '02-human-resources-safety', description: 'Predicts HSE incidents using leading indicators and near-miss data.',               status: 'active',   tasksProcessed: 18920,  accuracy: 93.7, uptime: 99.5, lastRun: '30s ago' },
  { id: 'contractor-management-agent',       name: 'Contractor Management Agent',domainId: '02-human-resources-safety', description: 'Full contractor lifecycle: onboarding, competency, PTW compliance, offboarding.',  status: 'active',   tasksProcessed: 12380,  accuracy: 95.1, uptime: 99.0, lastRun: '3m ago'  },
  { id: 'energy-transition-reskilling-agent',name: 'Energy Transition Agent',    domainId: '02-human-resources-safety', description: 'Maps oil & gas skills to renewable roles; personalised learning pathways.',         status: 'training', tasksProcessed: 3870,   accuracy: 84.6, uptime: 95.3, lastRun: '45m ago' },

  // 03 — IT Operations & Cybersecurity
  { id: 'it-service-desk-agent',             name: 'IT Service Desk Agent',      domainId: '03-it-operations-cybersecurity', description: 'Automates IT ticket triage, classification, routing, and resolution.',       status: 'active',   tasksProcessed: 48300,  accuracy: 92.4, uptime: 99.7, lastRun: '10s ago' },
  { id: 'threat-detection-agent',            name: 'Threat Detection Agent',     domainId: '03-it-operations-cybersecurity', description: 'Detects cyber threats across IT/OT networks using behavioural analytics.',   status: 'active',   tasksProcessed: 312000, accuracy: 96.8, uptime: 99.9, lastRun: '1s ago'  },
  { id: 'ot-security-monitoring-agent',      name: 'OT Security Agent',          domainId: '03-it-operations-cybersecurity', description: 'Monitors ICS/SCADA/DCS environments for security anomalies.',               status: 'active',   tasksProcessed: 186400, accuracy: 97.2, uptime: 99.8, lastRun: '2s ago'  },
  { id: 'shadow-it-rationalization-agent',   name: 'Shadow IT Agent',            domainId: '03-it-operations-cybersecurity', description: 'Discovers unsanctioned cloud services; assesses risk and governance.',       status: 'idle',     tasksProcessed: 2840,   accuracy: 88.9, uptime: 97.4, lastRun: '4h ago'  },
  { id: 'infrastructure-monitoring-agent',   name: 'Infrastructure Agent',       domainId: '03-it-operations-cybersecurity', description: 'Infrastructure health, capacity, and predictive auto-remediation.',          status: 'active',   tasksProcessed: 94200,  accuracy: 94.5, uptime: 99.6, lastRun: '5s ago'  },
  { id: 'compliance-management-agent',       name: 'Compliance Management Agent',domainId: '03-it-operations-cybersecurity', description: 'ISO 27001/NIST/SOC2 compliance tracking and evidence collection.',           status: 'idle',     tasksProcessed: 1620,   accuracy: 98.3, uptime: 98.2, lastRun: '1h ago'  },

  // 04 — Commercial & Trading
  { id: 'crude-trading-analytics-agent',     name: 'Crude Trading Agent',        domainId: '04-commercial-trading', description: 'Crude oil market dynamics, fundamentals, and trading opportunity analysis.',          status: 'active',   tasksProcessed: 67400,  accuracy: 87.3, uptime: 99.2, lastRun: '15s ago' },
  { id: 'carbon-credit-trading-agent',       name: 'Carbon Credit Agent',        domainId: '04-commercial-trading', description: 'Carbon credit portfolio management, ETS compliance, voluntary market trading.',       status: 'active',   tasksProcessed: 28900,  accuracy: 90.1, uptime: 98.8, lastRun: '2m ago'  },
  { id: 'castrol-pricing-engine-agent',      name: 'Castrol Pricing Agent',      domainId: '04-commercial-trading', description: 'Castrol lubricant pricing optimisation across 120+ global markets.',                 status: 'active',   tasksProcessed: 43700,  accuracy: 92.6, uptime: 99.1, lastRun: '8m ago'  },
  { id: 'aviation-fuel-forecasting-agent',   name: 'Aviation Fuel Agent',        domainId: '04-commercial-trading', description: 'Jet A-1 demand forecasting using flight schedules and airline capacity plans.',       status: 'training', tasksProcessed: 15200,  accuracy: 85.7, uptime: 96.4, lastRun: '1h ago'  },
  { id: 'lng-trading-platform-agent',        name: 'LNG Trading Agent',          domainId: '04-commercial-trading', description: 'LNG cargo trading: spot/term markets, shipping schedules, pricing differentials.',    status: 'active',   tasksProcessed: 34100,  accuracy: 89.4, uptime: 98.6, lastRun: '6m ago'  },
  { id: 'cross-commodity-arbitrage-agent',   name: 'Cross-Commodity Agent',      domainId: '04-commercial-trading', description: 'Identifies arbitrage opportunities across crude, gas, power, and carbon.',            status: 'active',   tasksProcessed: 52800,  accuracy: 86.9, uptime: 99.0, lastRun: '30s ago' },

  // 05 — Manufacturing & Plant Operations
  { id: 'predictive-maintenance-agent',      name: 'Predictive Maintenance Agent',domainId: '05-manufacturing-plant-operations', description: 'Predicts equipment failures using IoT sensors and vibration analysis.',  status: 'active',   tasksProcessed: 128400, accuracy: 94.8, uptime: 99.4, lastRun: '3s ago'  },
  { id: 'refinery-yield-optimization-agent', name: 'Refinery Yield Agent',       domainId: '05-manufacturing-plant-operations', description: 'Maximises refinery throughput via crude blend and unit conditions.',      status: 'active',   tasksProcessed: 41200,  accuracy: 91.3, uptime: 98.9, lastRun: '1m ago'  },
  { id: 'quality-control-agent',             name: 'Quality Control Agent',      domainId: '05-manufacturing-plant-operations', description: 'Real-time product quality monitoring; deviation detection and RCA.',       status: 'active',   tasksProcessed: 76800,  accuracy: 95.2, uptime: 99.6, lastRun: '8s ago'  },
  { id: 'downtime-prevention-agent',         name: 'Downtime Prevention Agent',  domainId: '05-manufacturing-plant-operations', description: 'Early-warning for unplanned shutdowns; triggers proactive interventions.', status: 'active',   tasksProcessed: 23400,  accuracy: 92.7, uptime: 99.3, lastRun: '45s ago' },
  { id: 'energy-efficiency-agent',           name: 'Energy Efficiency Agent',    domainId: '05-manufacturing-plant-operations', description: 'Optimises steam, power, fuel gas, and cooling water across the plant.',    status: 'idle',     tasksProcessed: 18700,  accuracy: 90.4, uptime: 97.9, lastRun: '30m ago' },
  { id: 'digital-twin-agent',                name: 'Digital Twin Agent',         domainId: '05-manufacturing-plant-operations', description: 'High-fidelity plant simulation for scenario testing and optimisation.',    status: 'active',   tasksProcessed: 9840,   accuracy: 97.1, uptime: 98.7, lastRun: '4m ago'  },

  // 06 — Supply Chain & Logistics
  { id: 'demand-supply-matching-agent',      name: 'Demand Supply Agent',        domainId: '06-supply-chain-logistics', description: 'Balances product supply with downstream demand; optimises movements.',             status: 'active',   tasksProcessed: 37600,  accuracy: 91.8, uptime: 99.2, lastRun: '2m ago'  },
  { id: 'castrol-distribution-agent',        name: 'Castrol Distribution Agent', domainId: '06-supply-chain-logistics', description: 'Optimises Castrol global distribution: blending, warehousing, last-mile.',        status: 'active',   tasksProcessed: 24800,  accuracy: 93.4, uptime: 98.8, lastRun: '7m ago'  },
  { id: 'aviation-fuel-logistics-agent',     name: 'Aviation Fuel Logistics Agent',domainId: '06-supply-chain-logistics', description: 'End-to-end aviation fuel supply chain from refinery to airport hydrant.',      status: 'active',   tasksProcessed: 18900,  accuracy: 94.7, uptime: 99.1, lastRun: '3m ago'  },
  { id: 'marine-bunkering-agent',            name: 'Marine Bunkering Agent',     domainId: '06-supply-chain-logistics', description: 'Marine fuel supply and bunkering operations across global ports.',                 status: 'idle',     tasksProcessed: 11200,  accuracy: 92.1, uptime: 97.6, lastRun: '1h ago'  },
  { id: 'retail-fuel-optimization-agent',    name: 'Retail Fuel Agent',          domainId: '06-supply-chain-logistics', description: 'Retail station supply, pricing, and delivery optimisation.',                       status: 'active',   tasksProcessed: 45300,  accuracy: 90.6, uptime: 98.5, lastRun: '5m ago'  },
  { id: 'inventory-management-agent',        name: 'Inventory Management Agent', domainId: '06-supply-chain-logistics', description: 'Inventory level optimisation: safety stock, reorder points, tank utilisation.',   status: 'training', tasksProcessed: 8900,   accuracy: 86.3, uptime: 96.1, lastRun: '2h ago'  },
];
