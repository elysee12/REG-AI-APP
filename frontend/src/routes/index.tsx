import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RegLogo } from "@/components/RegLogo";
import {
  Camera,
  MapPin,
  Radio,
  Siren,
  ShieldCheck,
  Activity,
  Bell,
  Send,
  ArrowRight,
} from "lucide-react";
import heroImg from "@/assets/hero-grid.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "REG Infrastructure Protection System" },
      {
        name: "description",
        content:
          "AI-powered real-time monitoring and response platform protecting Rwanda's power infrastructure from vandalism and theft.",
      },
    ],
  }),
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between">
          <RegLogo className="h-9" showText />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#home" className="hover:text-foreground">Home</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it Works</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Power infrastructure at dusk"
            width={1536}
            height={1024}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/85 to-foreground/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-background">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-semibold mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary blink" />
              LIVE OPERATIONS PLATFORM
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              AI-Based Power Infrastructure{" "}
              <span className="text-primary">Incident Monitoring</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-background/75 max-w-xl">
              Detect vandalism, theft and intrusions on transmission towers, substations and cable
              routes in real time. Locate, verify and dispatch response — all from one operator
              console.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link to="/login">
                  Operator Login <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base bg-transparent border-background/40 text-background hover:bg-background hover:text-foreground"
              >
                <a href="#features">Learn More</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-background/70">
              <Stat label="Sites monitored" value="1,240+" />
              <Stat label="Avg. response" value="< 4 min" />
              <Stat label="Uptime" value="99.98%" />
            </div>
          </div>

          {/* Right: capability cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              { icon: Camera, label: "Camera surveillance", tone: "bg-primary/10 text-primary" },
              { icon: Radio, label: "Sensor alerts", tone: "bg-warning/10 text-warning" },
              { icon: MapPin, label: "GPS tracking", tone: "bg-success/10 text-success" },
              { icon: Send, label: "Rapid response", tone: "bg-background/15 text-background" },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-background/95 backdrop-blur rounded-xl p-5 shadow-elevated border border-background/10"
              >
                <div className={`inline-flex p-2.5 rounded-lg ${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-semibold text-foreground">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1">Always on, always alert.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider">Capabilities</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              Built for control room operators
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every screen is engineered for speed, clarity and decisive action under pressure.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Siren,
                title: "Real-Time Alarm Detection",
                desc: "AI flags intrusion, vibration and tampering events in seconds.",
              },
              {
                icon: MapPin,
                title: "GPS Incident Mapping",
                desc: "Pinpoint affected towers and substations on a live map.",
              },
              {
                icon: Camera,
                title: "Camera & Sensor Monitoring",
                desc: "Visual evidence and sensor data side by side.",
              },
              {
                icon: ShieldCheck,
                title: "Incident Management",
                desc: "Verify, escalate and dispatch with a full audit trail.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-elevated transition-all"
              >
                <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-24 bg-secondary border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider">Workflow</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
          </div>
          <ol className="mt-12 grid md:grid-cols-4 gap-6 relative">
            {[
              { icon: Activity, title: "Detection", desc: "Sensors and AI vision continuously analyse infrastructure." },
              { icon: Bell, title: "Alarm Trigger", desc: "Anomaly raises a critical alert with location and evidence." },
              { icon: ShieldCheck, title: "Operator Review", desc: "Operator verifies via live camera and sensor stream." },
              { icon: Send, title: "Response Dispatch", desc: "Field team is dispatched and tracked to resolution." },
            ].map((s, i) => (
              <li key={s.title} className="relative bg-card p-6 rounded-xl border border-border">
                <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-elevated">
                  {i + 1}
                </div>
                <s.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-sidebar text-sidebar-foreground mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <RegLogo className="h-10" showText variant="dark" />
            <p className="mt-4 text-sm text-sidebar-foreground/70 max-w-md">
              Rwanda Energy Group — Infrastructure Protection System. Securing the national grid
              through intelligent monitoring.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              Support
            </div>
            <ul className="mt-3 space-y-2 text-sm text-sidebar-foreground/80">
              <li>support@reg.rw</li>
              <li>+250 788 000 000</li>
              <li>24/7 Control Center</li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              System
            </div>
            <ul className="mt-3 space-y-2 text-sm text-sidebar-foreground/80">
              <li>Version 2.4.1</li>
              <li>API Status: Operational</li>
              <li>© {new Date().getFullYear()} REG</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-background">{value}</div>
      <div className="text-xs uppercase tracking-wider text-background/60">{label}</div>
    </div>
  );
}
