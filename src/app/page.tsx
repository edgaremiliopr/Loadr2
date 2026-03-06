import { Nav } from "@/components/nav";
import { HeroMap } from "@/components/hero-map";
import { MarketTicker } from "@/components/market-ticker";
import { SpotChart } from "@/components/spot-chart";
import { DieselChart } from "@/components/diesel-chart";
import { LoadCalculator } from "@/components/load-calculator";
import { FreightHeadlines } from "@/components/freight-headlines";

/* ─── Small reusable primitives ──────────────────────────────── */

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1.5 mb-8">
      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full block" />
      <span className="text-[0.6875rem] font-bold text-blue-700 tracking-[0.08em] uppercase">
        {children}
      </span>
    </div>
  );
}

function DarkTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 mb-8">
      <span className="text-[0.6875rem] font-bold text-white/60 tracking-[0.08em] uppercase">
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100" />;
}

/* ─── Section: Hero + Calculator ─────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-24 md:pb-16 overflow-hidden min-h-[85svh] md:min-h-[680px]">

      {/* ── Background map — behind everything ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Faded map occupies left ~65% on desktop, full width on mobile */}
        <div className="absolute top-0 bottom-0 left-0 w-full lg:w-[65%] opacity-[0.65] md:opacity-[0.80]">
          <HeroMap />
        </div>
        {/* White gradient: just enough to keep text legible on desktop */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.40) 30%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Mobile overlay: lighter than before */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.50) 50%, rgba(255,255,255,0.75) 100%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
        {/* ── Left: copy only ── */}
        <div className="animate-fade-up">
          <Tag>Florida&apos;s Jobsite Freight Specialist</Tag>

          <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-bold text-gray-900 leading-[1.04] tracking-[-0.03em] mb-5">
            Freight that<br />
            <span className="text-gray-300">moves your</span><br />
            project forward.
          </h1>

          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-8 max-w-[420px]">
            Specialized in construction deliveries that need a forklift on-site.
            Tampa&nbsp;·&nbsp;Orlando&nbsp;·&nbsp;Miami.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-[0.875rem] font-semibold px-7 py-3.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              Get a Quote
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#services"
              className="inline-flex items-center text-[0.875rem] font-semibold text-gray-600 border border-gray-200 px-7 py-3.5 rounded-full hover:border-gray-400 hover:text-gray-900 transition-all"
            >
              How it works
            </a>
          </div>
        </div>

        {/* ── Right: Load Calculator (sticky on desktop) ── */}
        <div className="animate-fade-up-d1 lg:sticky lg:top-24">
          <LoadCalculator />
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Market Insights ──────────────────────────────── */

function MarketInsightsSection() {
  return (
    <section className="py-16 border-b border-gray-100 bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-8">
          <div>
            <div className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1">
              Market Intelligence
            </div>
            <h2 className="text-[1.5rem] font-bold text-gray-900 tracking-tight">
              Real-time freight conditions
            </h2>
          </div>
          <p className="text-[0.8125rem] text-gray-400 max-w-xs">
            We monitor live market data so you always know if it&apos;s a good time to ship.
          </p>
        </div>

        {/* Charts side by side */}
        <div className="grid md:grid-cols-2 gap-5 items-start mb-6">
          <SpotChart />
          <DieselChart />
        </div>

        {/* Industry Headlines */}
        <FreightHeadlines />
      </div>
    </section>
  );
}

/* ─── Section: Services ──────────────────────────────────────── */

const SERVICES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="1" y="14" width="20" height="7" rx="1.5" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M5 14V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 8V1M8 4l3-3 3 3" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Scaffolding & Staging",
    desc: "Heavy scaffold systems, swing stage equipment, and modular staging — palletized and delivered ready to unload.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2v18M4 9l7-7 7 7" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="16" width="16" height="4" rx="1" stroke="#0066CC" strokeWidth="1.5" />
      </svg>
    ),
    title: "Mast Climbers & Hoists",
    desc: "Oversized and heavy. We coordinate lift equipment so the jobsite is never waiting.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="6" width="18" height="13" rx="1.5" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M6 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M2 11h18" stroke="#0066CC" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    ),
    title: "Shoring & Concrete Forms",
    desc: "Shoring towers, column forms, and bracing — the kind of freight most pass on. We handle it.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="10" width="14" height="9" rx="1" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M16 12h2a2 2 0 0 1 2 2v5h-4" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="20" r="1.5" stroke="#0066CC" strokeWidth="1.5" />
        <circle cx="13" cy="20" r="1.5" stroke="#0066CC" strokeWidth="1.5" />
        <circle cx="19" cy="20" r="1.5" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M2 10V7a1 1 0 0 1 1-1h8l3 4" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Forklift-Required Loads",
    desc: "No forklift, no delivery. Our network is built from the ground up for on-site lift operations.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 17V9l7-6 7 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" stroke="#0066CC" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 17v-5h4v5" stroke="#0066CC" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Construction Materials",
    desc: "Steel, lumber, panels, and building supplies delivered to site — scheduled around your pour and framing dates.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#0066CC" strokeWidth="1.5" />
        <path d="M11 6v5l3 3" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Time-Sensitive Freight",
    desc: "When the job can&apos;t stop, we move fast. Expedited options available for critical deliveries across Florida.",
  },
];

function ServicesSection() {
  return (
    <section id="services" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <Tag>What We Move</Tag>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold text-gray-900 leading-tight tracking-tight mb-4">
            Built for the loads<br />
            <span className="text-gray-300">others won&apos;t touch.</span>
          </h2>
          <p className="text-lg text-gray-500">
            We live in the niche where construction freight gets complicated —
            and that&apos;s exactly where we thrive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200 bg-white group"
            >
              <div className="mb-4 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                {s.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-[0.9375rem]">{s.title}</h3>
              <p className="text-[0.8125rem] text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section: How It Works ──────────────────────────────────── */

const STEPS = [
  {
    step: "01",
    title: "Tell us about your load",
    desc: "Origin, destination, equipment type, and any jobsite requirements. Two minutes, no fluff.",
  },
  {
    step: "02",
    title: "We secure the right truck for you",
    desc: "From our vetted network of forklift-equipped trucks that know how to operate on active construction sites.",
  },
  {
    step: "03",
    title: "Delivered on-site, done right",
    desc: "Your freight arrives on schedule with the right equipment to unload. You stay focused on the project.",
  },
];

function HowItWorksSection() {
  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-lg mx-auto mb-16">
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold text-gray-900 tracking-tight mb-3">
            How it works.
          </h2>
          <p className="text-lg text-gray-500">Three steps. Zero drama.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="relative">
              <div className="text-[4rem] font-black text-gray-100 leading-none mb-4 tracking-tighter">
                {step}
              </div>
              <h3 className="text-[1.125rem] font-semibold text-gray-900 mb-3 leading-snug">{title}</h3>
              <p className="text-[0.875rem] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Real Cost ─────────────────────────────────────── */

function RealCostSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <Tag>What You&apos;re Really Paying For</Tag>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold text-gray-900 leading-tight tracking-tight mb-6">
            You&apos;re not paying<br />
            <span className="text-gray-300">for a truck.</span>
          </h2>
          <p className="text-[1.0625rem] text-gray-500 leading-relaxed mb-5">
            When freight doesn&apos;t show — or shows up without a forklift — the hit isn&apos;t the freight rate.
            It&apos;s a full crew standing idle on an active jobsite. Five hours. Hundreds of dollars an hour.
            A project behind schedule and a client call you don&apos;t want to make.
          </p>
          <p className="text-[1.0625rem] text-gray-500 leading-relaxed">
            Loadr handles the entire operation: securing the carrier, confirming equipment, tracking the load,
            managing the paperwork, invoicing the shipper, and paying the carrier.
            One call. Everything else is on us — so your company keeps moving and your clients never feel the friction.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Coverage ──────────────────────────────────────── */

const MARKETS = [
  {
    city: "Tampa",
    desc: "Industrial corridor, scaffold yards, Selmon Expressway access, and the West Florida construction belt.",
  },
  {
    city: "Orlando",
    desc: "Theme park build-outs, resort construction, I-4 corridor, and Central Florida&apos;s rapid commercial growth.",
  },
  {
    city: "Miami",
    desc: "High-rise construction, port access, Brickell corridor, and South Florida&apos;s dense jobsite market.",
  },
];

function CoverageSection() {
  return (
    <section id="coverage" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Tag>Coverage Area</Tag>
            <h2 className="text-[2.5rem] md:text-[3rem] font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Florida&apos;s construction<br />
              <span className="text-gray-300">corridor, covered.</span>
            </h2>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Deep roots in Tampa, Orlando, and Miami — Florida&apos;s three largest
              construction markets. We know the roads, the yards, and the jobsites.
            </p>
            <div className="space-y-3">
              {MARKETS.map(({ city, desc }) => (
                <div
                  key={city}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
                >
                  <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-[0.9375rem] mb-0.5">{city}</div>
                    <div
                      className="text-[0.8125rem] text-gray-500"
                      dangerouslySetInnerHTML={{ __html: desc }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[380px] md:h-[440px]">
            <HeroMap />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: About ─────────────────────────────────────────── */

const ABOUT_STATS = [
  { value: "5,000+",  label: "Loads completed" },
  { value: "$1.5M+",  label: "Freight moved" },
  { value: "S&P 500", label: "Operations background" },
  { value: "FL Native", label: "Market knowledge" },
];

function AboutSection() {
  return (
    <section id="about" className="py-24 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <DarkTag>About Loadr</DarkTag>
            <h2 className="text-[2.5rem] md:text-[3rem] font-bold leading-tight tracking-tight mb-6">
              We&apos;ve been on<br />
              <span className="text-gray-500">the jobsite.</span>
            </h2>
            <p className="text-[1.0625rem] text-gray-300 leading-relaxed mb-5">
              Loadr was founded by an ex-operations manager from one of the top markets of
              an S&amp;P 500 company — someone who understands exactly what happens when a
              load doesn&apos;t show up, or shows up without the right equipment.
            </p>
            <p className="text-[1.0625rem] text-gray-400 leading-relaxed">
              Over 5,000 loads moved. More than $1.5M in freight across Florida&apos;s
              scaffolding, shoring, swing stage, and mast climber sectors.
              Built from real experience, not theory.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {ABOUT_STATS.map(({ value, label }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <div className="text-[1.875rem] font-bold text-white mb-1 tracking-tight">{value}</div>
                <div className="text-[0.8125rem] text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: CTA ───────────────────────────────────────────── */

const TRUST_SIGNALS = [
  "Forklift-ready trucks",
  "Jobsite delivery specialists",
  "Florida construction experts",
];

function CTASection() {
  return (
    <section id="contact" className="py-28">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-[2.75rem] md:text-[3.75rem] lg:text-[4.5rem] font-bold text-gray-900 tracking-[-0.03em] leading-[1.04] mb-6">
          Ready to move<br />
          <span className="text-gray-300">your next load?</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
          Tell us about your freight. We&apos;ll take care of the rest.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:loads@getloadr.com"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-8 py-4 rounded-full hover:bg-gray-700 transition-colors text-[0.9375rem]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Email your load details
          </a>
          <a
            href="tel:+18005551234"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-full hover:border-gray-400 hover:text-gray-900 transition-all text-[0.9375rem]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h3l1.5 3.5L6 7a9 9 0 0 0 3 3l1.5-1.5L14 10v3a1 1 0 0 1-1 1C6.373 14 2 9.627 2 3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            Call us directly
          </a>
        </div>

        <div className="mt-16 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {TRUST_SIGNALS.map((t) => (
            <div key={t} className="flex items-center gap-2 text-[0.8125rem] text-gray-400 font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="font-bold text-gray-900 text-[1.0625rem] tracking-tight">Loadr</span>
        <span className="text-[0.8125rem] text-gray-400 text-center">
          Tampa&nbsp;·&nbsp;Orlando&nbsp;·&nbsp;Miami&nbsp;·&nbsp;Florida&apos;s Jobsite Freight Specialist
        </span>
        <span className="text-[0.8125rem] text-gray-400">© 2025 Loadr</span>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <MarketTicker />
        <MarketInsightsSection />
        <Divider />
        <ServicesSection />
        <Divider />
        <RealCostSection />
        <Divider />
        <HowItWorksSection />
        <Divider />
        <CoverageSection />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
