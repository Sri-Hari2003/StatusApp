import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockServices, mockIncidentTimeline } from "../lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Pencil, Clock, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from 'sonner';
import { OrgRoleBasedAccess } from "@/components/AccessWrapper";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const statusIcons = {
  resolved: <CheckCircle2 className="text-green-600 w-4 h-4 mr-1" />,
  monitoring: <Eye className="text-blue-600 w-4 h-4 mr-1" />,
  identified: <AlertTriangle className="text-yellow-500 w-4 h-4 mr-1" />,
  investigating: <Clock className="text-gray-500 w-4 h-4 mr-1" />
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [localUpdates, setLocalUpdates] = useState<any[]>([]);
  const [editingUpdateIdx, setEditingUpdateIdx] = useState<number | null>(null);
  const [editUpdateDesc, setEditUpdateDesc] = useState("");
  const [editUpdateStatus, setEditUpdateStatus] = useState<string>("");
  const [newUpdateDesc, setNewUpdateDesc] = useState("");
  const [newUpdateStatus, setNewUpdateStatus] = useState<string>("");
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number | undefined>(undefined);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceStatus, setNewServiceStatus] = useState("");
  const [newServiceLink, setNewServiceLink] = useState("");
  const [servicesState, setServicesState] = useState(mockServices);
  const [scrolled, setScrolled] = useState(false);

  const service = servicesState[selectedIdx];
  const incidents = incidentsState.filter((inc) => inc.serviceId === service.id);

  useLayoutEffect(() => {
    const measureHeight = () => {
      if (leftColRef.current) {
        setLeftColHeight(leftColRef.current.offsetHeight);
      }
    };
    measureHeight();
    window.addEventListener("resize", measureHeight);
    return () => window.removeEventListener("resize", measureHeight);
  }, [incidents.length, selectedIdx]);

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
    const service = servicesState[selectedIdx];
    if (service) {
      navigate(`/services/${service.id}`, { replace: true });
    }
  }, [selectedIdx, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Edit/update logic (copied from dashboard.tsx)
  const handleIncidentClick = (incident: any) => {
    setSelectedIncident(incident);
    setLocalUpdates(incident.updates);
    setDrawerOpen(true);
  };

  const handleEditUpdate = (idx: number, update: any) => {
    setEditingUpdateIdx(idx);
    setEditUpdateDesc(update.message);
    setEditUpdateStatus(update.status);
  };
  const handleCancelEdit = () => {
    setEditingUpdateIdx(null);
    setEditUpdateDesc("");
    setEditUpdateStatus("");
  };
  const handleSaveEdit = (idx: number) => {
    setLocalUpdates(prev => {
      let updates = [...prev];
      // Only one resolved allowed
      if (editUpdateStatus === 'resolved') {
        updates = updates.map((u, i) => i !== idx && u.status === 'resolved' ? { ...u, status: 'monitoring' } : u);
      }
      updates[idx] = { ...updates[idx], message: editUpdateDesc, status: editUpdateStatus };
      return updates;
    });
    setEditingUpdateIdx(null);
    setEditUpdateDesc("");
    setEditUpdateStatus("");
    toast.success('Update edited!');
  };
  const handleSaveUpdate = () => {
    if (!newUpdateDesc || !newUpdateStatus) return;
    const newUpdate = {
      message: newUpdateDesc,
      status: newUpdateStatus,
      timestamp: new Date().toISOString()
    };
    setLocalUpdates(prev => {
      let updates = [...prev];
      if (newUpdateStatus === 'resolved') {
        updates = updates.map(u => u.status === 'resolved' ? { ...u, status: 'monitoring' } : u);
      }
      return [...updates, newUpdate];
    });
    setSelectedIncident((prev: any) => prev ? { ...prev, status: newUpdateStatus } : prev);
    setNewUpdateDesc("");
    setNewUpdateStatus("");
    toast.success('Update added!');
  };
  const isResolved = localUpdates.length > 0 && localUpdates[localUpdates.length - 1].status === 'resolved';

  const handleCreateService = () => {
    if (!newServiceName || !newServiceStatus) return;
    const newService = {
      id: Date.now(),
      name: newServiceName,
      description: newServiceDesc,
      status: newServiceStatus,
      uptime: "100.00%",
      link: newServiceLink
    };
    setServicesState(prev => [newService, ...prev]);
    toast("Service created", {
      description: `Service '${newServiceName}' has been created.`
    });
    setServiceDialogOpen(false);
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServiceStatus("");
    setNewServiceLink("");
  };

  if (!service) {
    return <div className="p-6">Service not found.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
        <div
          className={`sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-all duration-300 ${scrolled ? "shadow-md py-2" : "shadow-none py-6"}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Service Details</h1>
              <p className="text-gray-600 text-sm sm:text-base">manage your services</p>
            </div>
            <OrgRoleBasedAccess allowedRoles={["admin"]}>
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogTrigger asChild>
                  
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Service</DialogTitle>
                    <DialogDescription>Fill in the details to create a new service.</DialogDescription>
                  </DialogHeader>
                  <Separator />
                  <div className="space-y-4 py-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Service Name</label>
                      <input
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newServiceName}
                        onChange={e => setNewServiceName(e.target.value)}
                        placeholder="Enter service name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={newServiceDesc}
                        onChange={e => setNewServiceDesc(e.target.value)}
                        placeholder="Describe the service (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <Select value={newServiceStatus} onValueChange={setNewServiceStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="partial_outage">Partial Outage</SelectItem>
                          <SelectItem value="degraded_performance">Degraded Performance</SelectItem>
                          <SelectItem value="major_outage">Major Outage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Link</label>
                      <input
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newServiceLink}
                        onChange={e => setNewServiceLink(e.target.value)}
                        placeholder="https://example.com (optional)"
                        type="url"
                      />
                    </div>
                  </div>
                  <Separator />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreateService} disabled={!newServiceName || !newServiceStatus}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </OrgRoleBasedAccess>
          </div>
        </div>

      {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Service Carousel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Services Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Services</h2>
                  <p className="text-gray-600 text-sm mt-1">Browse through available services</p>
                </div>
            <OrgRoleBasedAccess allowedRoles={["admin"]}>
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogTrigger asChild>
                      <Button onClick={() => setServiceDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Create Service
                  </Button>
                </DialogTrigger>
                    <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Service</DialogTitle>
                    <DialogDescription>Fill in the details to create a new service.</DialogDescription>
                  </DialogHeader>
                      <Separator />
                  <div className="space-y-4 py-2">
                    <div>
                          <label className="block text-sm font-medium mb-2">Service Name</label>
                      <input
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newServiceName}
                        onChange={e => setNewServiceName(e.target.value)}
                        placeholder="Enter service name"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={newServiceDesc}
                        onChange={e => setNewServiceDesc(e.target.value)}
                        placeholder="Describe the service (optional)"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium mb-2">Status</label>
                      <Select value={newServiceStatus} onValueChange={setNewServiceStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="partial_outage">Partial Outage</SelectItem>
                          <SelectItem value="degraded_performance">Degraded Performance</SelectItem>
                          <SelectItem value="major_outage">Major Outage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                          <label className="block text-sm font-medium mb-2">Link</label>
                      <input
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newServiceLink}
                        onChange={e => setNewServiceLink(e.target.value)}
                        placeholder="https://example.com (optional)"
                        type="url"
                      />
                    </div>
                  </div>
                      <Separator />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreateService} disabled={!newServiceName || !newServiceStatus}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </OrgRoleBasedAccess>
          </div>
              
          <div className="w-full">
            <Carousel
              opts={{ loop: false, startIndex: initialIdx }}
              className="w-full overflow-visible"
              setApi={api => { emblaApiRef.current = api; }}
            >
              <CarouselContent>
                {servicesState.map((svc, idx) => (
                  <CarouselItem key={svc.id} className="flex justify-center items-stretch overflow-visible">
                        <Card className={`w-full max-w-sm px-4 py-3 flex flex-col justify-center overflow-visible transition-all duration-300 hover:shadow-lg border-2 ${selectedIdx === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-3 px-3">
                            <CardTitle className="flex items-center justify-between text-base mb-2">
                              <span className="truncate font-semibold">{svc.name}</span>
                              <span className={`w-4 h-4 rounded-full ${statusColors[svc.status]} shadow-lg ring-2 ring-white`} title={statusLabels[svc.status] || svc.status.replace("_", " ")}></span>
                        </CardTitle>
                      </CardHeader>
                          <CardContent className="space-y-3 px-3 py-0 overflow-visible">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`${statusColors[svc.status]} text-white font-medium text-xs shadow-sm`}>
                                {statusLabels[svc.status] || svc.status.replace("_", " ")}
                              </Badge>
                              <Badge variant="outline" className="font-medium text-xs bg-gray-50">
                                Uptime: {svc.uptime}
                              </Badge>
                        </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{svc.description}</p>
                        {svc.link && (
                              <>
                                <Separator className="my-2" />
                                <div className="pt-1">
                            <a 
                              href={svc.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-800 underline text-xs font-medium transition-colors block truncate"
                            >
                              {svc.link}
                            </a>
                          </div>
                              </>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
                  <CarouselPrevious className="left-2 bg-white shadow-lg" />
                  <CarouselNext className="right-2 bg-white shadow-lg" />
            </Carousel>
              </div>
          </div>

          {/* Chart Section */}
          {incidents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Incident Duration Analysis</h3>
                  <p className="text-gray-600 text-sm">Duration comparison showing how long each incident was active (in days)</p>
                </div>
                <Separator className="mb-6" />
            <div className="w-full">
                  <ChartContainer config={{}}>
                    <BarChart
                      width={600}
                      height={Math.max(incidents.length * 50, 300)}
                      data={incidents.map((incident) => {
                        const start = new Date(incident.created_at);
                        let end = start;
                        if (incident.updates && incident.updates.length > 0) {
                          const resolvedUpdate = incident.updates.find(u => u.status === 'resolved');
                          end = resolvedUpdate ? new Date(resolvedUpdate.timestamp) : new Date();
                        }
                        const daysActive = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                        return {
                          name: incident.title,
                          days: daysActive,
                        };
                      })}
                      layout="vertical"
                      margin={{ right: 30, left: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} tickMargin={12} axisLine={false} width={200} />
                      <XAxis dataKey="days" type="number" label={{ value: 'Days Active', position: 'insideBottomRight', offset: 0 }} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                      <Bar dataKey="days" radius={4}>
                        {incidents.map((incident, index) => {
                          const start = new Date(incident.created_at);
                          let end = start;
                          if (incident.updates && incident.updates.length > 0) {
                            const resolvedUpdate = incident.updates.find(u => u.status === 'resolved');
                            end = resolvedUpdate ? new Date(resolvedUpdate.timestamp) : new Date();
                          }
                          const daysActive = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                          return (
                            <Cell key={`cell-${index}`} fill={daysActive < 2 ? "#10b981" : "#ef4444"} />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
                <Separator className="mt-6 mb-4" />
                <div className="text-sm text-muted-foreground">
                    Showing total days active for each incident
                  </div>
            </div>
          )}
        </div>

        {/* Right Column: Incident Timeline */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Incident Timeline</h2>
                  <p className="text-gray-600 text-sm mt-1">Track and manage incidents</p>
                </div>
              <OrgRoleBasedAccess allowedRoles={["admin"]}>
                <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="default" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add Incident
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Incident</DialogTitle>
                      <DialogDescription>Fill in the details to create a new incident for this service.</DialogDescription>
                    </DialogHeader>
                      <Separator />
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Incident Name</label>
                        <input
                          className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={newIncidentName}
                          onChange={e => setNewIncidentName(e.target.value)}
                          placeholder="Enter incident name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Service</label>
                        <input
                          className="w-full border rounded-lg p-3 text-sm bg-gray-50 cursor-not-allowed"
                          value={service.name}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                          className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          value={newIncidentDesc}
                          onChange={e => setNewIncidentDesc(e.target.value)}
                          placeholder="Describe the incident (optional)"
                        />
                      </div>
                    </div>
                      <Separator />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleCreateIncident} disabled={!newIncidentName}>
                        Create Incident
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </OrgRoleBasedAccess>
            </div>

              <Separator className="mb-4" />

              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {incidents.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <div className="text-gray-400 mb-2">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No incidents found</p>
                    <p className="text-sm text-muted-foreground mt-1">All systems are running smoothly</p>
                </Card>
              ) : (
                incidents.map((incident) => (
                    <Card key={incident.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight pr-2 font-semibold">{incident.title}</CardTitle>
                        <OrgRoleBasedAccess allowedRoles={["admin"]}>
                            <Button size="sm" variant="ghost" onClick={() => handleIncidentClick(incident)} className="shrink-0 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        </OrgRoleBasedAccess>
                      </div>
                    </CardHeader>
                      <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-medium bg-gray-50">
                          {incident.status.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </p>
                      </div>
                        
                        <Separator />
                      
                      <div>
                          <div className="font-medium text-sm mb-3 text-gray-900">Recent Updates</div>
                          <div className="space-y-3 max-h-32 overflow-y-auto">
                          {incident.updates && incident.updates.length > 0 ? (
                            [...incident.updates].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 2).map((update, idx) => (
                                <div key={idx} className={`rounded-lg p-3 text-xs border-l-4 transition-colors ${update.status === 'resolved' ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300 bg-gray-50'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${updateStatusColors[update.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {update.status.replace('_', ' ')}
                                  </span>
                                </div>
                                  <p className="text-xs text-gray-700 mb-2 leading-relaxed">{update.message}</p>
                                <span className="text-xs text-gray-500">
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                              <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg">No updates available</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer for editing incidents */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="border-b">
            <DrawerTitle>Incident Management</DrawerTitle>
            <DrawerDescription>
              {selectedIncident && (
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{selectedIncident.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(selectedIncident.created_at).toLocaleString()}
                  </div>
                </div>
              )}
            </DrawerDescription>
          </DrawerHeader>
          {selectedIncident && (
            <div className="px-4 pb-4 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
                {/* Add Update Form */}
                  <Card className="h-fit shadow-sm">
                    <CardHeader className="border-b">
                    <CardTitle className="text-lg">Add Update</CardTitle>
                  </CardHeader>
                    <CardContent className="pt-6">
                    {isResolved ? (
                        <div className="text-sm text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">
                          <CheckCircle2 className="w-5 h-5 inline mr-2" />
                          This incident has been resolved. No further updates can be added.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Update Description</label>
                          <textarea
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Describe the update..."
                            value={newUpdateDesc}
                            onChange={e => setNewUpdateDesc(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Status</label>
                          <Select value={newUpdateStatus} onValueChange={setNewUpdateStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="identified">Identified</SelectItem>
                              <SelectItem value="monitoring">Monitoring</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleSaveUpdate} 
                          disabled={!newUpdateDesc || !newUpdateStatus}
                          className="w-full"
                        >
                          Add Update
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Updates Timeline */}
                  <Card className="shadow-sm">
                    <CardHeader className="border-b">
                    <CardTitle className="text-lg">Updates Timeline</CardTitle>
                  </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                      {[...localUpdates].slice().reverse().map((u, i, arr) => {
                        const realIdx = localUpdates.length - 1 - i;
                        const isEditing = editingUpdateIdx === realIdx;
                        return (
                            <div key={i} className={`border rounded-lg p-4 transition-all duration-200 ${u.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            {isEditing ? (
                              u.status === 'created' ? (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full border rounded-lg p-3 text-sm bg-gray-100 cursor-not-allowed"
                                    rows={2}
                                    value={editUpdateDesc}
                                    readOnly
                                  />
                                  <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus} disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Created" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="created">Created</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex justify-end">
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    value={editUpdateDesc}
                                    onChange={e => setEditUpdateDesc(e.target.value)}
                                  />
                                  <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select update status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="investigating">Investigating</SelectItem>
                                      <SelectItem value="identified">Identified</SelectItem>
                                      <SelectItem value="monitoring">Monitoring</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSaveEdit(realIdx)} 
                                      disabled={!editUpdateDesc || !editUpdateStatus}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              )
                            ) : (
                                <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                    <span className="mt-1">{statusIcons[u.status as keyof typeof statusIcons]}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium mb-2 text-gray-900 leading-relaxed">{u.message}</p>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(u.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                    <Button size="sm" variant="ghost" onClick={() => handleEditUpdate(realIdx, u)} className="shrink-0 hover:bg-gray-100">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
            <DrawerFooter className="border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      </div>
    </div>
  );
};

export default ServicesPage;