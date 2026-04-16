import React, { useState, useCallback } from 'react';
import { BPAsset, AssetType, ASSET_TYPE_CONFIG, BP_ASSETS } from '../data/bpAssets';

const toXY = (lat: number, lon: number) => ({
  x: (lon + 180) / 360 * 100,
  y: (90 - lat) / 180 * 100,
});

const STATUS_OPACITY: Record<string, number> = { active: 1, jv: 0.85, converted: 0.7, divested: 0.4, closed: 0.3 };

const WorldBackground: React.FC = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="400" fill="#060f1e"/>
    {/* Graticule */}
    {[-60,-30,0,30,60].map(lat => { const y = (90-lat)/180*400; return <line key={lat} x1="0" y1={y} x2="800" y2={y} stroke="#0f2236" strokeWidth="0.5"/>; })}
    {[-120,-60,0,60,120].map(lon => { const x = (lon+180)/360*800; return <line key={lon} x1={x} y1="0" x2={x} y2="400" stroke="#0f2236" strokeWidth="0.5"/>; })}
    {/* Continents (simplified) */}
    <ellipse cx="170" cy="115" rx="82" ry="75" fill="#1a2f4a"/>
    <ellipse cx="298" cy="50"  rx="35" ry="28" fill="#1a2f4a"/>  {/* Greenland */}
    <ellipse cx="258" cy="268" rx="55" ry="88" fill="#1a2f4a"/>  {/* South America */}
    <ellipse cx="412" cy="84"  rx="48" ry="36" fill="#1a2f4a"/>  {/* Europe */}
    <ellipse cx="438" cy="212" rx="68" ry="90" fill="#1a2f4a"/>  {/* Africa */}
    <ellipse cx="496" cy="148" rx="42" ry="38" fill="#1a2f4a"/>  {/* Middle East */}
    <ellipse cx="598" cy="95"  rx="148" ry="80" fill="#1a2f4a"/> {/* Asia */}
    <ellipse cx="572" cy="178" rx="34" ry="40" fill="#1a2f4a"/>  {/* Indian subcontinent */}
    <ellipse cx="660" cy="192" rx="38" ry="28" fill="#1a2f4a"/>  {/* SE Asia */}
    <ellipse cx="696" cy="268" rx="54" ry="42" fill="#1a2f4a"/>  {/* Australia */}
    <ellipse cx="400" cy="388" rx="400" ry="22" fill="#1a2f4a"/>  {/* Antarctica hint */}
  </svg>
);

export const BPAssetMap: React.FC = () => {
  const [activeTypes, setActiveTypes] = useState<Set<AssetType>>(
    () => new Set(Object.keys(ASSET_TYPE_CONFIG) as AssetType[])
  );
  const [selected, setSelected] = useState<BPAsset | null>(null);
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());

  const toggleType = useCallback((t: AssetType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const handleDotClick = useCallback((asset: BPAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setMultiSel(prev => { const n = new Set(prev); n.has(asset.id) ? n.delete(asset.id) : n.add(asset.id); return n; });
    } else {
      setSelected(prev => prev?.id === asset.id ? null : asset);
      setMultiSel(new Set());
    }
  }, []);

  const clearSelection = useCallback(() => { setSelected(null); setMultiSel(new Set()); }, []);

  const visible = BP_ASSETS.filter(a => activeTypes.has(a.type));
  const multiAssets = BP_ASSETS.filter(a => multiSel.has(a.id));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-sm">BP Global Asset Map</h3>
          <p className="text-gray-500 text-xs">Downstream register · {BP_ASSETS.length} assets · Click to inspect · Shift+click to multi-select</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block opacity-40"/>Divested/Closed</span>
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.entries(ASSET_TYPE_CONFIG) as [AssetType, typeof ASSET_TYPE_CONFIG[AssetType]][]).map(([type, cfg]) => {
          const on = activeTypes.has(type);
          return (
            <button key={type} onClick={() => toggleType(type)}
              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all"
              style={on ? { background: cfg.color, color: '#111', borderColor: cfg.color, fontWeight: 600 }
                       : { background: 'transparent', color: '#6b7280', borderColor: '#374151' }}
            >
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Map canvas */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: 360 }} onClick={clearSelection}>
        <WorldBackground />

        {/* Asset markers */}
        {visible.map(asset => {
          const { x, y } = toXY(asset.lat, asset.lon);
          const cfg = ASSET_TYPE_CONFIG[asset.type];
          const isSel = selected?.id === asset.id || multiSel.has(asset.id);
          const opacity = STATUS_OPACITY[asset.status] ?? 0.5;
          return (
            <div key={asset.id} onClick={e => handleDotClick(asset, e)}
              style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', zIndex: isSel ? 20 : 10 }}
              title={asset.name}
            >
              <div style={{
                width: isSel ? 14 : 9, height: isSel ? 14 : 9, borderRadius: '50%',
                background: cfg.color, opacity,
                border: `2px solid ${isSel ? '#ffffff' : cfg.color}`,
                boxShadow: isSel ? `0 0 10px ${cfg.color}` : `0 0 4px ${cfg.color}60`,
                transition: 'all 0.15s',
              }}/>
            </div>
          );
        })}

        {/* Popup */}
        {selected && (() => {
          const { x, y } = toXY(selected.lat, selected.lon);
          const cfg = ASSET_TYPE_CONFIG[selected.type];
          const px = Math.min(x, 72); const py = Math.min(y + 4, 65);
          return (
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, zIndex: 40, minWidth: 220, maxWidth: 280 }}
              className="bg-gray-900/95 border border-gray-600 rounded-xl p-4 shadow-2xl backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{selected.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{selected.country}</p>
                </div>
                <button onClick={clearSelection} className="text-gray-600 hover:text-gray-300 text-sm leading-none mt-0.5">✕</button>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-2">{selected.detail}</p>
              <div className="flex items-center gap-2">
                <span style={{ color: cfg.color }} className="text-xs font-medium">{cfg.icon} {cfg.label.replace(/s$/,'')}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  selected.status === 'active' ? 'bg-green-900/40 text-green-400' :
                  selected.status === 'jv' ? 'bg-blue-900/40 text-blue-400' :
                  selected.status === 'converted' ? 'bg-cyan-900/40 text-cyan-400' :
                  'bg-gray-800 text-gray-500'
                }`}>{selected.status}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Multi-select summary */}
      {multiAssets.length > 0 && (
        <div className="mt-3 p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
          <p className="text-white text-xs font-semibold mb-1">{multiAssets.length} assets selected (Shift+click to add/remove)</p>
          <div className="flex flex-wrap gap-1">
            {multiAssets.map(a => (
              <span key={a.id} style={{ borderColor: ASSET_TYPE_CONFIG[a.type].color, color: ASSET_TYPE_CONFIG[a.type].color }}
                className="text-xs border rounded px-2 py-0.5"
              >{a.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
