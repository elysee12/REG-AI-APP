import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/auth";

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  
  const sections = [
    { id: "profile", title: "User Profile" },
    { id: "notifications", title: "Notification Preferences" },
    { id: "alarm", title: "Alarm Sound Settings" },
    { id: "devices", title: "Device Integration" },
    { id: "access", title: "Access Control" },
    { id: "theme", title: "Theme / Display" },
    { id: "audit", title: "Audit Logs" },
  ];

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
      <aside className="bg-card border border-border rounded-xl shadow-card p-3 lg:col-span-1 h-fit">
        {sections.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={`block px-3 py-2 rounded-md text-sm ${i === 0 ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"}`}>
            {s.title}
          </a>
        ))}
      </aside>

      <div className="lg:col-span-3 space-y-4">
        <Card title="User Profile" desc="Operator account details">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" defaultValue={user?.fullName || "J. Mugisha"} />
            <Field label="Email" defaultValue={user?.email || "j.mugisha@reg.rw"} />
            <Field label="Phone" defaultValue="+250 788 123 456" />
            <Field label="Operator ID" defaultValue={user?.id ? `OP-${String(user.id).padStart(4, '0')}` : "OP-0421"} />
          </div>
        </Card>

        <Card title="Notification Preferences" desc="Choose how you receive alerts">
          {["Critical alerts (Buzzer)", "High severity alerts", "Daily summary email", "SMS for dispatched incidents"].map((l, i) => (
            <Toggle key={l} label={l} defaultChecked={i < 2} />
          ))}
        </Card>

        <Card title="Alarm Sound" desc="Buzzer behaviour for the control room">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Volume (%)" defaultValue="80" />
            <div>
              <Label>Tone</Label>
              <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Continuous siren</option>
                <option>Pulsed alarm</option>
                <option>Beep</option>
              </select>
            </div>
            <Toggle label="Auto-silence after ack" defaultChecked />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl shadow-card p-5">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Button size="sm" variant="outline">Save</Button>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" defaultValue={defaultValue} />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border border-border bg-secondary/40">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
