import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockServices, mockIncidentTimeline } from "../lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  partial_outage: "bg-yellow-500",
  degraded_performance: "bg-orange-500",
  major_outage: "bg-red-500"
};

const statusLabels: Record<string, string> = {
  operational: "Operational",
  partial_outage: "Partial Outage",
  degraded_performance: "Degraded Performance",
  major_outage: "Major Outage"
};

// Helper to get status color for update
const updateStatusColors: Record<string, string> = {
  resolved: 'bg-green-100 text-green-800',
  monitoring: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-red-100 text-red-800',
  identified: 'bg-orange-100 text-orange-800',
  // Add more as needed
};

const ServicesPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const initialServiceId = Number(params["*"] || params.id || params.serviceId) || mockServices[0]?.id;
  const initialIdx = React.useMemo(() => {
    const idx = mockServices.findIndex((s) => s.id === initialServiceId);
    return idx >= 0 ? idx : 0;
  }, [initialServiceId]);
  const [selectedIdx, setSelectedIdx] = React.useState(initialIdx);
  const emblaApiRef = React.useRef<any>(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = React.useState(false);
  const [newIncidentName, setNewIncidentName] = React.useState("");
  const [newIncidentDesc, setNewIncidentDesc] = React.useState("");
  const [incidentsState, setIncidentsState] = React.useState(mockIncidentTimeline);

  // Listen for carousel slide changes and update selectedIdx
  React.useEffect(() => {
    const api = emblaApiRef.current;
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setSelectedIdx(idx);
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [emblaApiRef.current]);

  // Update URL when selectedIdx changes
  React.useEffect(() => {
    const service = mockServices[selectedIdx];
    if (service) {
      navigate(`/services/${service.id}`, { replace: true });
    }
  }, [selectedIdx, navigate]);

  const service = mockServices[selectedIdx];
  const incidents = incidentsState.filter((inc) => inc.serviceId === service.id);

  const handleCreateIncident = () => {
    if (!newIncidentName) return;
    const newIncident = {
      id: Date.now(),
      title: newIncidentName,
      serviceId: service.id,
      status: "investigating",
      created_at: new Date().toISOString(),
      message: newIncidentDesc,
      updates: [
        {
          status: "investigating",
          timestamp: new Date().toISOString(),
          message: newIncidentDesc || "Incident created."
        }
      ]
    };
    setIncidentsState(prev => [newIncident, ...prev]);
    toast("Incident created", {
      description: `Incident '${newIncidentName}' for service '${service.name}' has been created.`
    });
    setIncidentDialogOpen(false);
    setNewIncidentName("");
    setNewIncidentDesc("");
  };

  if (!service) {
    return <div className="p-6">Service not found.</div>;
  }

  return (
    <div className="p-6 w-full mx-auto">
    
      <h1 className="text-2xl font-bold mb-2">Service Details</h1>
      <Separator className="mb-6" />
      <div className="flex flex-col md:flex-row gap-6">
        {/* Service Carousel */}
        <div className="w-full md:w-3/4 flex flex-col items-center justify-center">
          <Carousel
            opts={{ loop: false, startIndex: initialIdx }}
            className="w-full max-w-xl"
            setApi={api => { emblaApiRef.current = api; }}
          >
            <CarouselContent>
              {mockServices.map((svc, idx) => (
                <CarouselItem key={svc.id} className="w-full max-w-xl min-h-[220px] flex justify-center items-stretch">
                  <Card className={idx === selectedIdx ? "border-2 border-blue-500 w-full max-w-xl min-h-[220px]" : "w-full max-w-xl min-h-[220px]"}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {svc.name}
                        <span className={`w-3 h-3 rounded-full ${statusColors[svc.status]}`} title={statusLabels[svc.status] || svc.status.replace("_", " ")}></span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[svc.status]}>{statusLabels[svc.status] || svc.status.replace("_", " ")}</Badge>
                        <Badge variant="outline">Uptime: {svc.uptime}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{svc.description}</p>
                      {svc.link && (
                        <div className="mt-2">
                          <a href={svc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{svc.link}</a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          {/* Horizontal Bar Chart for Incidents */}
          {incidents.length > 0 && (
            <Card className="w-full max-w-2xl my-6">
              <CardHeader>
                <CardTitle>Incident Duration Comparison</CardTitle>
                <CardDescription>Shows how long each incident was or is active (in days)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <BarChart
                    width={600}
                    height={Math.max(incidents.length * 40, 200)}
                    data={incidents.map((incident) => {
                      // Calculate days active: from created_at to last update (or now if unresolved)
                      const start = new Date(incident.created_at);
                      let end = start;
                      if (incident.updates && incident.updates.length > 0) {
                        // If resolved, use last resolved update; else, use now
                        const resolvedUpdate = incident.updates.find(u => u.status === 'resolved');
                        if (resolvedUpdate) {
                          end = new Date(resolvedUpdate.timestamp);
                        } else {
                          end = new Date();
                        }
                      }
                      const daysActive = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                      return {
                        name: incident.title,
                        days: daysActive,
                      };
                    })}
                    layout="vertical"
                    margin={{ right: 16, left: 16, top: 16, bottom: 16 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      width={180}
                    />
                    <XAxis dataKey="days" type="number" label={{ value: 'Days Active', position: 'insideBottomRight', offset: 0 }} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Bar
                      dataKey="days"
                      fill="var(--chart-2)"
                      radius={4}
                    >
                      <LabelList
                        dataKey="name"
                        position="insideLeft"
                        offset={8}
                        className="fill-(--color-label)"
                        fontSize={12}
                      />
                      <LabelList
                        dataKey="days"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  Incident durations compared <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                  Showing total days active for each incident
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
        {/* Incidents Timeline */}
        <div className="w-full md:w-2/5 flex flex-col max-h-[calc(154vh-8rem)]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold flex-shrink-0">Incidents for this Service</h1>
            <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => setIncidentDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Incident</DialogTitle>
                  <DialogDescription>Fill in the details to create a new incident.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Incident Name</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      value={newIncidentName}
                      onChange={e => setNewIncidentName(e.target.value)}
                      placeholder="Enter incident name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service</label>
                    <input
                      className="w-full border rounded p-2 text-sm bg-gray-100"
                      value={service.name}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full border rounded p-2 text-sm"
                      rows={2}
                      value={newIncidentDesc}
                      onChange={e => setNewIncidentDesc(e.target.value)}
                      placeholder="Describe the incident (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateIncident} disabled={!newIncidentName}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="text-muted-foreground">No incidents found for this service.</p>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="hover:shadow-md transition">
                    <CardHeader>
                      <CardTitle>{incident.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">Created: {new Date(incident.created_at).toLocaleString()}</p>
                      <Badge variant="outline">Status: {incident.status.replace("_", " ")}</Badge>
                      {/* Timeline */}
                      <div className="mt-4">
                        <div className="font-semibold text-sm mb-1">Updates</div>
                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                          {incident.updates && incident.updates.length > 0 ? (
                            [...incident.updates].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((update, idx) => (
                              <div key={idx} className={`rounded p-2 text-xs border ${update.status === 'resolved' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}> 
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded ${updateStatusColors[update.status] || 'bg-gray-100 text-gray-800'}`}>{update.status.replace('_', ' ')}</span>
                                  <span className="text-gray-400">{new Date(update.timestamp).toLocaleString()}</span>
                                </div>
                                <div>{update.message}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400 italic">No updates</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage; 