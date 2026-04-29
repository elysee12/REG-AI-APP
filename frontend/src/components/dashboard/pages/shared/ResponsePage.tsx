import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Phone, Bell, AlertCircle, Mail, MapPin, Camera, ShieldCheck, ExternalLink, Info, Loader2, MessageCircle, Activity, Video, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { useDataStore } from "@/lib/data";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ResponsePage() {
  const { incidentId } = useSearch({ from: "/dashboard/response" });
  const { fetchIncidentById, broadcastIncidentAlert, broadcastWhatsappAlert } = useDataStore();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  useEffect(() => {
    if (incidentId) {
      setLoading(true);
      fetchIncidentById(incidentId).then((data) => {
        setIncident(data);
        if (data) {
          const professionalMessage = 
`🚨 *CRITICAL SECURITY ALERT*

*Incident Type:* ${data.type}
*Unit ID:* ${data.device.id}
*Severity:* ${data.severity.toUpperCase()}

📍 *Location Details:*
*Address:* ${data.device.address}
*GPS:* ${data.device.lat}, ${data.device.lng}

🗺️ *View on Map:*
https://www.google.com/maps?q=${data.device.lat},${data.device.lng}

⚠️ *Action Required:*
Please respond immediately. Access the dashboard for live updates:
${window.location.origin}/dashboard/response?incidentId=${data.id}`;
          
          setBroadcastMessage(professionalMessage);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [incidentId, fetchIncidentById]);

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
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Device Details */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Camera className="h-4 w-4 text-primary" />Device & Location Details</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
              <Info className="h-3.5 w-3.5" /> Unit Information
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serial Number:</span>
                <span className="font-mono font-bold uppercase">{incident.device.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device Name:</span>
                <span className="font-medium">{incident.device.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Live Status:</span>
                <span className={`font-medium flex items-center gap-1.5 ${incident.device.status === 'online' ? 'text-success' : 'text-destructive'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${incident.device.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                  {incident.device.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-medium">{incident.device.branch.name}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
              <MapPin className="h-3.5 w-3.5" /> Geographical Location
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Province:</span>
                <span className="font-medium">{incident.device.province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">District:</span>
                <span className="font-medium">{incident.device.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sector/Cell:</span>
                <span className="font-medium">{incident.device.sector}, {incident.device.cell}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-muted-foreground">Full Address:</span>
                <span className="font-medium text-xs leading-relaxed">{incident.device.address}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
                <div className="text-[11px] font-mono text-muted-foreground">
                  GPS: {incident.device.lat.toFixed(6)}, {incident.device.lng.toFixed(6)}
                </div>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5">
                    <ExternalLink className="h-3 w-3" /> View on Map
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Personnel */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-primary" />Security Personnel</h2>
        <p className="text-[11px] text-muted-foreground mb-4">Assigned responders for area: {incident.device.sector}</p>
        
        <div className="space-y-3">
          {incident.device.securityContacts.length > 0 ? (
            incident.device.securityContacts.map((contact: any) => (
              <div key={contact.id} className="p-4 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-bold text-primary">{contact.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    Responder
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <a href={`tel:${contact.phone}`} className="flex-1">
                    <Button variant="default" className="w-full h-10 gap-2 font-bold shadow-md">
                      <Phone className="h-4 w-4" /> {contact.phone}
                    </Button>
                  </a>
                  <a href={`https://wa.me/${formatPhoneForWhatsApp(contact.phone)}?text=${encodeURIComponent(broadcastMessage)}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="h-10 w-10 text-success hover:text-success hover:bg-success/10 border-success/20">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </a>
                  <a href={`mailto:${contact.email}`}>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/30">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No security personnel linked to this device area.</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Broadcast Alert Message</Label>
          <textarea 
            className="mt-2 w-full min-h-[120px] rounded-md border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner" 
            placeholder="Type message…" 
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
          />
          <div className="mt-3 flex flex-col gap-2">
            <Button 
              size="sm" 
              className="w-full font-bold bg-success hover:bg-success/90 text-white gap-2 h-10 shadow-sm" 
              onClick={handleWhatsAppBroadcast}
              disabled={isBroadcasting || isWhatsappLoading}
            >
              {isWhatsappLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending WhatsApp...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" /> Send WhatsApp Alert
                </>
              )}
            </Button>
            <Button 
              size="sm" 
              className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 shadow-sm" 
              onClick={handleBroadcast}
              disabled={isBroadcasting || isWhatsappLoading}
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Send Email Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Action history & AI Detection */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-primary" />Incident Timeline</h2>
        <div className="relative border-l border-primary/30 ml-2 space-y-6 pl-6 pb-2">
          {[
            { t: new Date(incident.time).toLocaleTimeString(), title: `Incident detected: ${incident.type}`, who: "System", desc: `AI model triggered ${incident.severity} severity event.` },
            { t: new Date(incident.time).toLocaleTimeString(), title: "Automated alert dispatched", who: "System", desc: "Notification sent to linked security personnel." },
          ].map((e, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[31px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
              <div className="text-[10px] text-muted-foreground tabular-nums font-mono uppercase tracking-tighter mb-1">
                {e.t} — {e.who}
              </div>
              <div className="text-sm font-bold text-primary mb-0.5">{e.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{e.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4" /> AI Detection Data
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Class:</span>
              <span className={`font-bold ${
                incident.aiClass === 'THIEF' ? 'text-primary' :
                incident.aiClass === 'SUSPICIOUS' ? 'text-warning' : 'text-success'
              }`}>
                {incident.aiClass || 'NORMAL'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence:</span>
              <span className={`font-bold ${
                (incident.aiConfidence || 0) >= 0.8 ? 'text-primary' :
                (incident.aiConfidence || 0) >= 0.5 ? 'text-warning' : 'text-muted-foreground'
              }`}>
                {incident.aiConfidence ? `${(incident.aiConfidence * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motion:</span>
              <span className="font-medium">{incident.motionStatus || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vibration:</span>
              <span className="font-medium">{incident.vibrationStatus || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accel Status:</span>
              <span className="font-medium">{incident.accelStatus || 'N/A'}</span>
            </div>
            {incident.accelX != null && (
              <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Accelerometer:</span>
                <span className="font-mono">X:{incident.accelX.toFixed(2)} Y:{incident.accelY?.toFixed(2)} Z:{incident.accelZ?.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" /> Evidence Media
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {incident.imagePath ? (
              <div className="relative group rounded-lg overflow-hidden border border-border">
                <img
                  src={`http://localhost:3000/${incident.imagePath}`}
                  alt="Snapshot"
                  className="w-full h-20 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> SNAP
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                <span className="text-muted-foreground text-[10px]">No img</span>
              </div>
            )}

            {incident.videoPath ? (
              <div className="relative group rounded-lg overflow-hidden border border-border">
                <video
                  src={`http://localhost:3000/${incident.videoPath}`}
                  className="w-full h-20 object-cover"
                  muted
                  onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseOut={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold flex items-center gap-1">
                    <Video className="h-3 w-3" /> PLAY
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                <span className="text-muted-foreground text-[10px]">No vid</span>
              </div>
            )}
          </div>
          {incident.sourceNote && (
            <p className="text-[10px] text-muted-foreground italic mt-2">Source: {incident.sourceNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}


