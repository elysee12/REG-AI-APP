import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Phone, Bell, AlertCircle, Mail, MapPin, Camera, ShieldCheck, ExternalLink, Info, Loader2, MessageCircle, Activity, Video, Image as ImageIcon, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/config";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ResponsePage() {
  const { incidentId } = useSearch({ from: "/dashboard/response" });
  const { fetchIncidentById, broadcastIncidentAlert, broadcastWhatsappAlert } = useDataStore();
  const user = useAuthStore((state) => state.user);
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    if (incidentId) {
      setLoading(true);
      fetchIncidentById(incidentId).then((data) => {
        if (data) {
          // Role-based data privacy filtering
          if (user?.role === 'BRANCH_USER' && user.branchId && String(data.device?.branchId || data.branchId) !== String(user.branchId)) {
            setIsUnauthorized(true);
            setIncident(null);
          } else {
            setIncident(data);
            setIsUnauthorized(false);
            const professionalMessage = 
`🚨 *URGENT SECURITY NOTIFICATION*

The Control Room has *VERIFIED* a *${data.aiClass || 'CRITICAL'}* activity in progress.

*Incident Details:*
*Ticket ID:* ${data.ticketId}
*Classification:* ${data.aiClass || 'AI Detection'}
*Confidence:* ${data.aiConfidence ? Math.round(data.aiConfidence * 100) : '95'}%
*Unit ID:* ${data.device?.id || 'Unknown'}
*Site:* ${data.device?.district || 'Unknown'} Station Area

📍 *Location:*
*Address:* ${data.device?.address || 'Unknown'}
*GPS:* ${data.device?.lat || '0'}, ${data.device?.lng || '0'}

⚠️ *INSTRUCTION:*
Respond immediately to the site. This is a verified priority alert.

🗺️ *Google Maps:*
https://www.google.com/maps?q=${data.device?.lat || '0'},${data.device?.lng || '0'}

*Dashboard:* ${window.location.origin}/dashboard/response?incidentId=${data.id}`;
          
            setBroadcastMessage(professionalMessage);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [incidentId, fetchIncidentById, user]);

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  const handleWhatsAppBroadcast = async () => {
    if (!incidentId || !broadcastMessage) return;
    
    setIsWhatsappLoading(true);
    const success = await broadcastWhatsappAlert(incidentId, broadcastMessage);
    if (success) {
      toast.success("Automated WhatsApp alerts sent to all security personnel");
    } else {
      toast.error("Failed to send automated WhatsApp alerts. Please check API configuration.");
    }
    setIsWhatsappLoading(false);
  };

  const handleBroadcast = async () => {
    if (!incidentId || !broadcastMessage) return;
    
    setIsBroadcasting(true);
    const success = await broadcastIncidentAlert(incidentId, broadcastMessage);
    if (success) {
      toast.success("Broadcast alert sent to all security personnel via Email");
    } else {
      toast.error("Failed to send broadcast alert");
    }
    setIsBroadcasting(false);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px]">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This incident belongs to another branch. You are only authorized to view and respond to incidents within your assigned branch.
        </p>
      </div>
    );
  }

  if (!incident && incidentId) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Incident Not Found</h2>
        <p className="text-muted-foreground">The incident ID provided does not exist.</p>
      </div>
    );
  }

  if (!incidentId) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Bell className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-xl font-semibold">No Incident Selected</h2>
        <p className="text-muted-foreground">Please select an incident from the incidents page to view response details.</p>
      </div>
    );
  }

  const mapUrl = `https://www.google.com/maps?q=${incident.device.lat},${incident.device.lng}`;

  return (
    <div className="p-2 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4">
      {/* Device Details */}
      <div className="bg-card border border-border rounded-xl shadow-card p-4 md:p-5 xl:col-span-1">
        <h2 className="font-bold flex items-center gap-2 mb-4 text-foreground"><Camera className="h-4 w-4 text-primary" />Device & Location Details</h2>
        
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-primary">
              <Info className="h-3.5 w-3.5" /> Unit Information
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Ticket ID:</span>
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{incident.ticketId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Unit Serial:</span>
                <span className="font-mono font-bold uppercase text-primary text-xs">{incident.device.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Status:</span>
                <span className={`font-bold text-[10px] flex items-center gap-1.5 ${incident.device.status === 'online' ? 'text-success' : 'text-destructive'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${incident.device.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                  {incident.device.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Branch:</span>
                <span className="font-bold text-xs">{incident.device.branch.name}</span>
              </div>
            </div>
          </div>

          <div className="p-3 md:p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-primary">
              <MapPin className="h-3.5 w-3.5" /> Geographical Location
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Province:</span>
                <span className="font-bold text-xs">{incident.device.province}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">District:</span>
                <span className="font-bold text-xs">{incident.device.district}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Sector/Cell/Village:</span>
                <span className="font-bold text-xs">{incident.device.sector}, {incident.device.cell}, {incident.device.village || '---'}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2 p-2 bg-background/50 rounded border border-border/50">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Full Address:</span>
                <span className="font-medium text-[11px] leading-relaxed italic">{incident.device.address}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-2 mt-2 border-t border-border/50">
                <div className="text-[11px] font-mono font-bold text-primary">
                  GPS: {incident.device.lat.toFixed(6)}, {incident.device.lng.toFixed(6)}
                </div>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="w-full h-8 text-[11px] font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5">
                    <ExternalLink className="h-3 w-3" /> Navigate to Site
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Personnel */}
      <div className="bg-card border border-border rounded-xl shadow-card p-4 md:p-5 xl:col-span-1">
        <h2 className="font-bold flex items-center gap-2 mb-1 text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Security Personnel</h2>
        <p className="text-[11px] font-bold text-muted-foreground mb-4 uppercase tracking-tighter">Responders: {incident.device.sector} Area</p>
        
        <div className="space-y-3">
          {incident.device.securityContacts.length > 0 ? (
            incident.device.securityContacts.map((contact: any) => (
              <div key={contact.id} className="p-4 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/20 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-base font-black text-foreground tracking-tight">{contact.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-bold">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest">
                    Responder
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <a href={`tel:${contact.phone}`} className="flex-1">
                    <Button variant="default" className="w-full h-11 md:h-10 gap-2 font-black shadow-md bg-primary hover:bg-primary/90">
                      <Phone className="h-4 w-4" /> {contact.phone}
                    </Button>
                  </a>
                  <a href={`https://wa.me/${formatPhoneForWhatsApp(contact.phone)}?text=${encodeURIComponent(broadcastMessage)}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="h-11 w-11 md:h-10 md:w-10 text-success hover:text-success hover:bg-success/10 border-success/30">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm font-bold text-muted-foreground">No personnel assigned.</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Emergency Broadcast Message</Label>
          <textarea 
            className="mt-2 w-full min-h-[140px] rounded-xl border border-border bg-secondary/10 p-4 text-[13px] font-medium leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner" 
            placeholder="Type emergency alert message…" 
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <div className="mt-4 flex flex-col gap-2">
            <Button 
              size="lg" 
              className="w-full font-black bg-success hover:bg-success/90 text-white gap-2 h-12 shadow-lg uppercase tracking-wider text-xs" 
              onClick={handleWhatsAppBroadcast}
              disabled={isBroadcasting || isWhatsappLoading}
            >
              {isWhatsappLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Broadcasting WhatsApp...
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" /> Broadcast WhatsApp Alert
                </>
              )}
            </Button>
            <Button 
              size="lg" 
              className="w-full font-black bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 shadow-lg uppercase tracking-wider text-xs" 
              onClick={handleBroadcast}
              disabled={isBroadcasting || isWhatsappLoading}
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Broadcasting Email...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" /> Broadcast Email Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Action history & AI Detection */}
      <div className="bg-card border border-border rounded-xl shadow-card p-4 md:p-5 xl:col-span-1">
        <h2 className="font-bold flex items-center gap-2 mb-4 text-foreground tracking-tight"><Bell className="h-4 w-4 text-primary" />Incident Timeline</h2>
        <div className="relative border-l-2 border-primary/20 ml-2 space-y-6 pl-6 pb-2">
          {[
            { t: new Date(incident.time).toLocaleTimeString(), title: `Detection: ${incident.ticketId}`, who: "AI Unit", desc: `AI Unit ${incident.device.id} classified as ${incident.aiClass || incident.type} (${incident.aiConfidence ? Math.round(incident.aiConfidence * 100) : '95'}% confidence).` },
            { t: new Date(incident.time).toLocaleTimeString(), title: "Dispatch triggered", who: "System", desc: `Automated protocols engaged. Alerts dispatched to ${incident.device.district} responders.` },
          ].map((e, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[31px] top-0 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <div className="text-[10px] text-muted-foreground tabular-nums font-bold uppercase tracking-tighter mb-1">
                {e.t} — {e.who}
              </div>
              <div className="text-sm font-black text-foreground mb-0.5 tracking-tight">{e.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed font-medium">{e.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4" /> AI Intelligence Report
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contextual Summary</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {incident.aiSummary || `AI Unit identified ${incident.aiClass || 'suspicious'} behavior with ${incident.aiConfidence ? Math.round(incident.aiConfidence * 100) : '95'}% confidence at ${incident.device.district} Station.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">AI Classification</span>
                <span className={`text-xs font-bold ${incident.alertStatus ? 'text-primary' : 'text-warning'}`}>
                  {incident.aiClass || 'AI Detection'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Confidence Score</span>
                <span className="text-xs font-bold text-primary">
                  {incident.aiConfidence ? `${(incident.aiConfidence * 100).toFixed(1)}%` : '95%'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">PIR Sensor</span>
                <span className="text-xs font-bold text-foreground">{incident.pirSensor ? `Zone ${incident.pirSensor}` : "No Activity"}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Servo Pos</span>
                <span className="text-xs font-bold text-foreground">{incident.servoPosition !== undefined ? `${incident.servoPosition}°` : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" /> Evidence Media
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {incident.videoPath ? (
              <div className="relative group rounded-lg overflow-hidden border border-border">
                <video
                  src={`${BASE_URL}${incident.videoPath}`}
                  className="w-full h-40 object-cover"
                  controls
                  autoPlay
                  muted
                />
              </div>
            ) : (
              <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                <span className="text-muted-foreground text-[10px]">No video evidence available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


