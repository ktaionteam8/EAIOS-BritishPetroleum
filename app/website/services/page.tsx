const SERVICES = [
  { t: "Upstream Oil & Gas", d: "Exploration, drilling, and production across North Sea, Gulf of Mexico, Azerbaijan, and Indonesia." },
  { t: "Refining & Petrochemicals", d: "12 refineries producing gasoline, jet fuel, diesel, and feedstocks for 60+ markets." },
  { t: "Castrol Lubricants", d: "Synthetic and mineral lubricants for automotive, marine, and industrial applications." },
  { t: "Commercial Trading", d: "Crude, refined products, LNG, and carbon credit trading across global benchmarks." },
  { t: "Renewables & Hydrogen", d: "Offshore wind, solar, green hydrogen electrolysis, and biofuels at commercial scale." },
  { t: "Retail & Mobility", d: "18,000+ retail sites and EV charging network delivering energy to end consumers." },
];

export default function ServicesPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="max-w-2xl mb-10">
        <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Services</div>
        <h1 className="text-4xl font-semibold text-slate-100">A fully integrated energy portfolio.</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {SERVICES.map((s) => (
          <div key={s.t} className="rounded-2xl bg-bg-800 border border-bg-700 p-6 hover:border-emerald-500/30 transition-colors">
            <h3 className="text-lg font-semibold text-slate-100">{s.t}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
