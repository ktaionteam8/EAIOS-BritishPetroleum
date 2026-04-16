export type AssetType = 'refinery' | 'tank' | 'sea_terminal' | 'land_terminal' | 'pipeline' | 'rack_sales';
export type AssetStatus = 'active' | 'divested' | 'closed' | 'converted' | 'jv';

export interface BPAsset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lon: number;
  country: string;
  region: string;
  status: AssetStatus;
  detail: string;
}

export const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; color: string; icon: string }> = {
  refinery:      { label: 'Refineries',      color: '#f59e0b', icon: '🏭' },
  tank:          { label: 'Tanks',            color: '#60a5fa', icon: '⬤'  },
  sea_terminal:  { label: 'Sea Terminals',    color: '#22d3ee', icon: '⚓'  },
  land_terminal: { label: 'Land Terminals',   color: '#a78bfa', icon: '📦'  },
  pipeline:      { label: 'Pipelines',        color: '#4ade80', icon: '━'  },
  rack_sales:    { label: 'Rack Sales',       color: '#fb923c', icon: '⛽'  },
};

export const BP_ASSETS: BPAsset[] = [
  // Refineries
  { id:'r1',  name:'Whiting Refinery',          type:'refinery', lat:41.68, lon:-87.49, country:'USA',               region:'North America', status:'active',    detail:'440,000 bbl/d · Indiana Harbor · Largest BP US refinery' },
  { id:'r2',  name:'Cherry Point Refinery',     type:'refinery', lat:48.86, lon:-122.68,country:'USA',               region:'North America', status:'active',    detail:'250,000 bbl/d · Ferndale, Washington · Pacific NW hub' },
  { id:'r3',  name:'Rotterdam Refinery',        type:'refinery', lat:51.90, lon:4.15,   country:'Netherlands',       region:'Europe',        status:'active',    detail:'~377,000 bbl/d · Europoort · BP\'s largest European refinery' },
  { id:'r4',  name:'Gelsenkirchen Refinery',    type:'refinery', lat:51.52, lon:7.08,   country:'Germany',           region:'Europe',        status:'active',    detail:'~246,000 bbl/d · NRW · Sale announced 2025' },
  { id:'r5',  name:'Lingen Refinery',           type:'refinery', lat:52.52, lon:7.32,   country:'Germany',           region:'Europe',        status:'active',    detail:'~80,000 bbl/d · Lower Saxony · Mid-size refinery' },
  { id:'r6',  name:'Castellon Refinery',        type:'refinery', lat:39.99, lon:-0.03,  country:'Spain',             region:'Europe',        status:'active',    detail:'~110,000 bbl/d · Mediterranean coast · Fuels + petrochems' },
  { id:'r7',  name:'Kwinana Terminal',          type:'refinery', lat:-32.23,lon:115.77, country:'Australia',         region:'Asia-Pacific',  status:'converted', detail:'Converted to import terminal 2021 · Cockburn Sound' },
  { id:'r8',  name:'Bulwer Island Terminal',    type:'refinery', lat:-27.44,lon:153.03, country:'Australia',         region:'Asia-Pacific',  status:'converted', detail:'Converted to terminal 2015 · Brisbane River · Bitumen hub' },
  { id:'r9',  name:'MiRo Refinery (JV)',        type:'refinery', lat:49.01, lon:8.40,   country:'Germany',           region:'Europe',        status:'jv',        detail:'~310,000 bbl/d · Karlsruhe · BP ~12% stake' },
  { id:'r10', name:'Bayernoil Refinery (JV)',   type:'refinery', lat:48.76, lon:11.43,  country:'Germany',           region:'Europe',        status:'jv',        detail:'~100,000 bbl/d · Ingolstadt · BP ~25% stake' },
  { id:'r11', name:'Schwedt Refinery (JV)',     type:'refinery', lat:53.06, lon:14.27,  country:'Germany',           region:'Europe',        status:'jv',        detail:'~120,000 bbl/d · Brandenburg · Minority stake' },
  { id:'r12', name:'Grangemouth Refinery',      type:'refinery', lat:56.02, lon:-3.72,  country:'UK',                region:'Europe',        status:'divested',  detail:'~200,000 bbl/d · Divested to INEOS · Scotland' },
  { id:'r13', name:'Sapref Refinery (JV)',      type:'refinery', lat:-29.87,lon:30.97,  country:'South Africa',      region:'Africa',        status:'closed',    detail:'~180,000 bbl/d · Durban · Closed 2023 (former 50% JV)' },
  // Sea Terminals
  { id:'st1', name:'Europoort Marine Terminal', type:'sea_terminal', lat:51.95, lon:4.07,   country:'Netherlands',  region:'Europe',        status:'active',    detail:'Crude import + product export · Rotterdam Port' },
  { id:'st2', name:'Whiting Marine Jetty',      type:'sea_terminal', lat:41.70, lon:-87.47, country:'USA',          region:'North America', status:'active',    detail:'Crude receipt via Indiana Harbor Canal · Great Lakes' },
  { id:'st3', name:'Cherry Point Marine',       type:'sea_terminal', lat:48.88, lon:-122.70,country:'USA',          region:'North America', status:'active',    detail:'Crude tanker receipt · Strait of Georgia · 300,000 DWT max' },
  { id:'st4', name:'Kwinana Marine Terminal',   type:'sea_terminal', lat:-32.15,lon:115.72,  country:'Australia',   region:'Asia-Pacific',  status:'active',    detail:'Product import terminal · Cockburn Sound · Post-refinery' },
  { id:'st5', name:'Bulwer Island Wharf',       type:'sea_terminal', lat:-27.48,lon:153.05,  country:'Australia',   region:'Asia-Pacific',  status:'active',    detail:'Product import + bitumen · Brisbane River mouth' },
  { id:'st6', name:'Castellon Marine Terminal', type:'sea_terminal', lat:39.97, lon:0.02,    country:'Spain',       region:'Europe',        status:'active',    detail:'Crude import + product export · Mediterranean' },
  { id:'st7', name:'Sangachal Marine Terminal', type:'sea_terminal', lat:40.19, lon:50.00,   country:'Azerbaijan',  region:'Caspian',       status:'active',    detail:'Crude export hub · BTC pipeline terminus · Caspian Sea' },
  { id:'st8', name:'Rhine Barge Terminal',      type:'sea_terminal', lat:51.45, lon:6.72,    country:'Germany',     region:'Europe',        status:'active',    detail:'Crude receipt by barge · Rhine waterway · Gelsenkirchen supply' },
  { id:'st9', name:'Point Fortin LNG Terminal', type:'sea_terminal', lat:10.17, lon:-61.68,  country:'Trinidad',    region:'Caribbean',     status:'active',    detail:'LNG export terminal · Atlantic Basin · Train 1-4' },
  { id:'st10',name:'Mombasa Terminal',          type:'sea_terminal', lat:-4.05, lon:39.67,   country:'Kenya',       region:'Africa',        status:'divested',  detail:'Product import terminal · Mombasa Port · Divested' },
  // Land Terminals
  { id:'lt1', name:'US Gulf Coast Terminals',   type:'land_terminal', lat:29.95, lon:-90.07, country:'USA',         region:'North America', status:'active',    detail:'~8 terminals · Rack sales · Gulf region distribution' },
  { id:'lt2', name:'US Midwest Terminals',      type:'land_terminal', lat:41.50, lon:-86.50, country:'USA',         region:'North America', status:'active',    detail:'~12 terminals · Amoco brand · Road tanker loading' },
  { id:'lt3', name:'UK Distribution Depots',    type:'land_terminal', lat:51.70, lon:-1.50,  country:'UK',          region:'Europe',        status:'active',    detail:'~10 terminals · BP brand · Road distribution' },
  { id:'lt4', name:'German Aral Terminals',     type:'land_terminal', lat:51.20, lon:10.00,  country:'Germany',     region:'Europe',        status:'active',    detail:'~20 terminals · Aral brand · Nationwide distribution' },
  { id:'lt5', name:'Benelux Terminals',         type:'land_terminal', lat:51.80, lon:4.90,   country:'Netherlands', region:'Europe',        status:'active',    detail:'~8 terminals · NL + BE · BP brand distribution' },
  { id:'lt6', name:'Spain Terminals',           type:'land_terminal', lat:40.30, lon:-3.70,  country:'Spain',       region:'Europe',        status:'active',    detail:'~5 terminals · BP Castellon supply chain' },
  { id:'lt7', name:'Australia Road Terminals',  type:'land_terminal', lat:-33.80,lon:151.00, country:'Australia',   region:'Asia-Pacific',  status:'active',    detail:'~10 terminals · BP Australia · Road distribution' },
  { id:'lt8', name:'Azerbaijan Pipeline Depot', type:'land_terminal', lat:40.40, lon:49.85,  country:'Azerbaijan',  region:'Caspian',       status:'active',    detail:'BTC-linked land terminal · Sangachal complex' },
  // Pipelines (represented by midpoints)
  { id:'p1',  name:'BTC Pipeline',              type:'pipeline', lat:39.50, lon:45.00, country:'Azerbaijan/Georgia/Turkey', region:'Caspian-Med',   status:'active',    detail:'1,768 km · Baku-Tbilisi-Ceyhan · BP major shareholder/operator' },
  { id:'p2',  name:'South Caucasus Pipeline',   type:'pipeline', lat:41.00, lon:44.50, country:'Azerbaijan/Georgia/Turkey', region:'Caspian',       status:'active',    detail:'692 km · Gas export · BP operator' },
  { id:'p3',  name:'Baku-Supsa Pipeline',       type:'pipeline', lat:40.60, lon:42.50, country:'Azerbaijan/Georgia',        region:'Black Sea',     status:'active',    detail:'833 km · Crude to Black Sea · BP operator' },
  { id:'p4',  name:'Trans Adriatic Pipeline',   type:'pipeline', lat:41.20, lon:20.00, country:'Greece/Albania/Italy',       region:'Europe',        status:'active',    detail:'878 km · Gas to Europe · BP sold 20% stake 2024' },
  { id:'p5',  name:'Forties Pipeline (FPS)',    type:'pipeline', lat:57.50, lon:1.00,  country:'UK',                        region:'North Sea',     status:'divested',  detail:'~1,100 km · Sold to INEOS 2017 · North Sea crude' },
  { id:'p6',  name:'Cherry Point Pipeline',     type:'pipeline', lat:48.70, lon:-122.00,country:'USA',                     region:'North America', status:'active',    detail:'~180 km · Crude from terminal to refinery · Washington' },
  { id:'p7',  name:'Whiting Crude Lines',       type:'pipeline', lat:41.60, lon:-87.60, country:'USA',                     region:'North America', status:'active',    detail:'~50 km · Crude receipt links · Indiana' },
  { id:'p8',  name:'Nam Con Son Pipeline',      type:'pipeline', lat:10.00, lon:108.50, country:'Vietnam',                 region:'Asia-Pacific',  status:'divested',  detail:'399 km · Offshore gas · BP divested' },
  // Rack Sales
  { id:'rs1', name:'US Amoco Rack Locations',   type:'rack_sales', lat:38.00, lon:-95.00, country:'USA',          region:'North America', status:'active',    detail:'~15 rack locations · BP + Amoco brand · Midwest/South' },
  { id:'rs2', name:'UK BP Rack Points',         type:'rack_sales', lat:52.00, lon:-1.50,  country:'UK',           region:'Europe',        status:'active',    detail:'~10 rack locations · BP brand · Nationwide coverage' },
  { id:'rs3', name:'Germany Aral Rack',         type:'rack_sales', lat:51.50, lon:9.50,   country:'Germany',      region:'Europe',        status:'active',    detail:'~20 rack locations · Aral brand · Largest EU network' },
  { id:'rs4', name:'Netherlands Rack',          type:'rack_sales', lat:52.30, lon:4.90,   country:'Netherlands',  region:'Europe',        status:'active',    detail:'~8 rack locations · BP brand' },
  { id:'rs5', name:'DACH Rack Points',          type:'rack_sales', lat:47.50, lon:12.50,  country:'Austria/CH',   region:'Europe',        status:'active',    detail:'~5 rack locations · Austria + Switzerland · BP brand' },
  { id:'rs6', name:'Australia Rack',            type:'rack_sales', lat:-27.50,lon:153.00, country:'Australia',    region:'Asia-Pacific',  status:'active',    detail:'~10 rack locations · BP Australia · East coast' },
  // Tank Farms (at key refinery/terminal sites)
  { id:'tk1', name:'Whiting Tank Farm',         type:'tank', lat:41.65, lon:-87.52, country:'USA',          region:'North America', status:'active',    detail:'~120 tanks · Crude, gasoline, diesel, jet fuel, asphalt' },
  { id:'tk2', name:'Rotterdam Tank Farm',       type:'tank', lat:51.88, lon:4.12,   country:'Netherlands',  region:'Europe',        status:'active',    detail:'~200+ tanks · Crude, naphtha, fuel oil, refined products' },
  { id:'tk3', name:'Gelsenkirchen Tank Farm',   type:'tank', lat:51.55, lon:7.05,   country:'Germany',      region:'Europe',        status:'active',    detail:'~100 tanks · Crude + petrochemicals storage' },
  { id:'tk4', name:'Cherry Point Tank Farm',    type:'tank', lat:48.83, lon:-122.65,country:'USA',          region:'North America', status:'active',    detail:'~80 tanks · Crude, gasoline, diesel, jet fuel' },
  { id:'tk5', name:'Kwinana Storage',           type:'tank', lat:-32.25,lon:115.80, country:'Australia',    region:'Asia-Pacific',  status:'active',    detail:'~60 tanks · Refined product imports' },
  { id:'tk6', name:'Castellon Tank Farm',       type:'tank', lat:40.00, lon:-0.05,  country:'Spain',        region:'Europe',        status:'active',    detail:'~80 tanks · Crude, gasoline, diesel storage' },
];
