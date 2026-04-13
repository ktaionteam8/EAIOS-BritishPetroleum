export default function AboutPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 space-y-8">
      <div>
        <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">About</div>
        <h1 className="text-4xl font-semibold text-slate-100">A 115-year story, rewritten for the energy transition.</h1>
      </div>
      <p className="text-slate-300 leading-relaxed">
        Founded in 1909 as the Anglo-Persian Oil Company, British Petroleum has evolved into
        a fully integrated energy company operating across 60+ countries. Today we produce
        2.3 million barrels of oil equivalent per day while investing aggressively in
        renewables, hydrogen, EV charging, and carbon capture — all coordinated by our
        Enterprise AI Operations System (EAIOS).
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6">
          <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Vision</div>
          <p className="text-slate-300">
            Reimagining energy for people and our planet — delivering net-zero emissions
            by 2050 while keeping the lights on, ships moving, and aircraft flying.
          </p>
        </div>
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6">
          <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Achievements</div>
          <ul className="text-slate-300 space-y-1.5 text-sm">
            <li>· $8B+ low-carbon investment commitments</li>
            <li>· 23 GW renewable pipeline by 2030</li>
            <li>· 6 digital twin-enabled refineries</li>
            <li>· 36-agent enterprise AI operating system</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
