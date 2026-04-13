import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 space-y-8">
      <div>
        <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Contact</div>
        <h1 className="text-4xl font-semibold text-slate-100">We'd love to hear from you.</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6">
          <MapPin className="h-5 w-5 text-emerald-400 mb-3" />
          <div className="text-sm font-semibold text-slate-100">Headquarters</div>
          <div className="text-xs text-slate-400 mt-1 leading-relaxed">1 St James's Square<br />London SW1Y 4PD<br />United Kingdom</div>
        </div>
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6">
          <Mail className="h-5 w-5 text-emerald-400 mb-3" />
          <div className="text-sm font-semibold text-slate-100">Email</div>
          <div className="text-xs text-slate-400 mt-1">info@bp.example<br />careers@bp.example<br />press@bp.example</div>
        </div>
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6">
          <Phone className="h-5 w-5 text-emerald-400 mb-3" />
          <div className="text-sm font-semibold text-slate-100">Phone</div>
          <div className="text-xs text-slate-400 mt-1">+44 20 7496 4000</div>
        </div>
      </div>
    </section>
  );
}
