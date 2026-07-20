import Link from "next/link";

const MODULES = [
  { href: "/sentinel", code: "SENTINEL", title: "Digital Arrest Scam Detection", desc: "Paste a call transcript or message — get an instant threat score and red-flag breakdown.", accent: "border-alert/40 hover:border-alert" },
  { href: "/netra", code: "NETRA", title: "Counterfeit Currency Check", desc: "Photograph a note — Claude vision inspects it against RBI security features.", accent: "border-safe/40 hover:border-safe" },
  { href: "/jaal", code: "JAAL", title: "Fraud Network Graph", desc: "Explore how scam numbers, mule accounts, and devices link into coordinated rings.", accent: "border-accent/40 hover:border-accent" },
  { href: "/drishti", code: "DRISHTI", title: "Geospatial Crime Intelligence", desc: "See where digital-arrest scams, UPI fraud, and counterfeit notes are clustering.", accent: "border-danger/40 hover:border-danger" },
  { href: "/kavach", code: "KAVACH", title: "Citizen Fraud Shield", desc: "Chat with an AI safety assistant — check a number, report a scam, get advice.", accent: "border-alert/40 hover:border-alert" },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="pt-6">
        <p className="font-mono text-xs text-alert tracking-widest mb-3">DIGITAL PUBLIC SAFETY INTELLIGENCE PLATFORM</p>
        <h1 className="font-display text-4xl md:text-5xl font-700 leading-tight max-w-3xl">
          RAKSHA AI protects citizens before the money moves —
          <span className="text-muted"> not after the complaint is filed.</span>
        </h1>
        <p className="text-muted max-w-2xl mt-4 leading-relaxed">
          Five connected intelligence modules — scam-call detection, counterfeit currency
          identification, fraud network mapping, geospatial crime intelligence, and a
          multilingual citizen assistant — working together to shift India from reactive
          investigation to predictive threat neutralisation.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`card p-5 flex flex-col gap-2 transition-colors border ${m.accent}`}
          >
            <span className="font-mono text-xs text-muted">{m.code}</span>
            <h3 className="font-display font-600 text-lg">{m.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{m.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
