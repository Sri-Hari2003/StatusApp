// File: src/pages/Dashboard.tsx (React + Vite)

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Clock, Eye, CheckCircle2, AlertTriangle, Pencil, Search, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, addDays, subDays } from "date-fns";
import AreaChartIncidents from "@/components/area-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { mockServices, mockIncidentTimeline } from "../lib/mockData";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { OrgRoleBasedAccess } from "@/components/AccessWrapper";

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  partial_outage: "bg-yellow-500",
  degraded_performance: "bg-orange-500",
  major_outage: "bg-red-500"
};

const statusIcons = {
  resolved: <CheckCircle2 className="text-green-600 w-4 h-4 mr-1" />,
  monitoring: <Eye className="text-blue-600 w-4 h-4 mr-1" />,
  identified: <AlertTriangle className="text-yellow-500 w-4 h-4 mr-1" />,
  investigating: <Clock className="text-gray-500 w-4 h-4 mr-1" />
};

const DashboardPage: React.FC = () => {
  const [services, setServices] = useState<typeof mockServices | null>(null);
  const [timeline, setTimeline] = useState<typeof mockIncidentTimeline | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [incidentPage, setIncidentPage] = useState(1);
  const INCIDENTS_PER_PAGE = 3;
  const [chartRange, setChartRange] = useState("7d");
  const [activeServiceFilter, setActiveServiceFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [newUpdateDesc, setNewUpdateDesc] = useState("");
  const [newUpdateStatus, setNewUpdateStatus] = useState<string>("");
  const [localUpdates, setLocalUpdates] = useState<any[]>([]);
  const [editingUpdateIdx, setEditingUpdateIdx] = useState<number | null>(null);
  const [editUpdateDesc, setEditUpdateDesc] = useState("");
  const [editUpdateStatus, setEditUpdateStatus] = useState<string>("");
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [newIncidentName, setNewIncidentName] = useState("");
  const [newIncidentService, setNewIncidentService] = useState("");
  const [newIncidentDesc, setNewIncidentDesc] = useState("");
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceStatus, setNewServiceStatus] = useState("");
  const [newServiceLink, setNewServiceLink] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const getServiceName = (id: number) => {
    const source = services ?? mockServices;
    const service = source.find(s => s.id === id);
    return service ? service.name : "Unknown Service";
  };

  useEffect(() => {
    setTimeout(() => {
      setServices(mockServices);
      setTimeline(mockIncidentTimeline);
    }, 500);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedTimeline = timeline
    ? [...timeline].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const paginatedTimeline = sortedTimeline
    ? sortedTimeline.slice((incidentPage - 1) * INCIDENTS_PER_PAGE, incidentPage * INCIDENTS_PER_PAGE)
    : [];

  const activeIncidents = sortedTimeline.filter(inc => inc.status !== 'resolved');

  const filteredActiveIncidents = activeServiceFilter === "all"
    ? activeIncidents
    : activeIncidents.filter(inc => getServiceName(inc.serviceId) === activeServiceFilter);

  const groupedTimeline = paginatedTimeline.reduce((acc, incident) => {
    const dateKey = format(parseISO(incident.created_at), "dd MMMM yyyy");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(incident);
    return acc;
  }, {} as Record<string, typeof mockIncidentTimeline>);

  const totalIncidentPages = timeline ? Math.ceil(timeline.length / INCIDENTS_PER_PAGE) : 1;

  const allServices = services ?? mockServices;
  const allIncidents = timeline ?? mockIncidentTimeline;

  const today = new Date();
  let days = 90;
  if (chartRange === "30d") days = 30;
  if (chartRange === "7d") days = 7;
  const startDate = subDays(today, days - 1);

  const dateList: string[] = [];
  for (let d = new Date(startDate); d <= today; d = addDays(d, 1)) {
    dateList.push(d.toISOString().slice(0, 10));
  }

  const chartData = dateList.map(date => {
    const entry: Record<string, any> = { date };
    allServices.forEach(service => {
      entry[service.name] = allIncidents.filter(
        inc => inc.serviceId === service.id && inc.created_at.slice(0, 10) === date
      ).length;
    });
    return entry;
  });

  const chartConfig = Object.fromEntries(
    allServices.map((service, idx) => [
      service.name,
      { label: service.name, color: `var(--chart-${idx + 1})` }
    ])
  );

  const handleIncidentClick = (incident: any) => {
    setSelectedIncident(incident);
    setLocalUpdates(incident.updates);
    setDrawerOpen(true);
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

  const handleCreateIncident = () => {
    if (!newIncidentName || !newIncidentService) return;
    const serviceObj = allServices.find(s => s.name === newIncidentService);
    if (!serviceObj) return;
    const newIncident = {
      id: Date.now(),
      title: newIncidentName,
      status: 'investigating',
      created_at: new Date().toISOString(),
      serviceId: serviceObj.id,
      updates: [
        {
          message: newIncidentDesc,
          status: 'investigating',
          timestamp: new Date().toISOString()
        }
      ]
    };
    setTimeline(prev => prev ? [newIncident, ...prev] : [newIncident]);
    toast("Incident created", {
      description: `Incident '${newIncidentName}' for service '${newIncidentService}' has been created.`
    });
    setIncidentDialogOpen(false);
    setNewIncidentName("");
    setNewIncidentService("");
    setNewIncidentDesc("");
  };

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
    setServices(prev => prev ? [newService, ...prev] : [newService]);
    toast("Service created", {
      description: `Service '${newServiceName}' has been created.`
    });
    setServiceDialogOpen(false);
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServiceStatus("");
    setNewServiceLink("");
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Toaster />
        
        {/* Header Section */}
        <div
          className={`sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-all duration-300 ${scrolled ? "shadow-md py-2" : "shadow-none py-6"}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overview Dashboard</h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">Monitor and manage your services and incidents</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <OrgRoleBasedAccess allowedRoles={["admin"]}>
                <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
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
                          rows={3}
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
                <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" /> Add Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Incident</DialogTitle>
                      <DialogDescription>Fill in the details to create a new incident.</DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <div className="space-y-4 py-2">
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
                        <Select value={newIncidentService} onValueChange={setNewIncidentService}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {allServices.map(service => (
                              <SelectItem key={service.id} value={service.name}>{service.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <Button onClick={handleCreateIncident} disabled={!newIncidentName || !newIncidentService}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </OrgRoleBasedAccess>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-8">
          <div className={`rounded-lg px-6 py-4 shadow-sm border-l-4 flex items-center justify-between transition-all duration-300 ${
            activeIncidents.length === 0 
              ? 'bg-green-50 border-l-green-500 text-green-800' 
              : 'bg-red-50 border-l-red-500 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeIncidents.length === 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {activeIncidents.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="font-semibold">
                  {activeIncidents.length === 0 ? 'All Systems Operational' : `${activeIncidents.length} Active Incident${activeIncidents.length > 1 ? 's' : ''}`}
                </div>
                <div className="text-sm opacity-75">
                  {activeIncidents.length === 0 
                    ? 'All services are running smoothly' 
                    : 'Some services may be experiencing issues'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Services</h2>
                <p className="text-gray-600 text-sm mt-1">Browse through available services</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  className="pl-10 w-full sm:w-80 focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {services ? (
              filteredServices && filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map(service => (
                    <Card
                      key={service.id}
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 hover:bg-blue-50"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base mb-2">
                          <span className="truncate font-semibold group-hover:text-blue-600 transition-colors">{service.name}</span>
                          <span className={`w-4 h-4 rounded-full ${statusColors[service.status]} shadow-lg ring-2 ring-white`} title={service.status.replace("_", " ")}></span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${statusColors[service.status]} text-white font-medium text-xs shadow-sm`}>
                            {service.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className="font-medium text-xs bg-gray-50">
                            Uptime: {service.uptime}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No services found matching your search.</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Active Incidents Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Incidents</h2>
                <p className="text-gray-600 text-sm mt-1">Quick overview of ongoing incidents</p>
              </div>
              <Select value={activeServiceFilter} onValueChange={setActiveServiceFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {allServices.map(service => (
                    <SelectItem key={service.id} value={service.name}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredActiveIncidents.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4 min-w-max">
                  {filteredActiveIncidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500 bg-orange-50 min-w-[280px] max-w-[320px] flex-shrink-0"
                      onClick={() => handleIncidentClick(incident)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base leading-tight pr-2 font-semibold group-hover:text-orange-700 transition-colors line-clamp-2">
                            {incident.title}
                          </CardTitle>
                         
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-medium bg-gray-50">
                            {getServiceName(incident.serviceId)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {incident.updates && incident.updates.length > 0 && (
                          <div className="flex items-center gap-2">
                            {statusIcons[incident.updates[incident.updates.length - 1].status as keyof typeof statusIcons]}
                            <span className="text-xs text-muted-foreground">
                              {incident.updates[incident.updates.length - 1].status.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-500">No active incidents at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Area Chart Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Incident Trends</h2>
                <p className="text-gray-600 text-sm mt-1">Track incident patterns over time</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={chartRange} onValueChange={setChartRange}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px]">
                <AreaChartIncidents 
                  chartData={chartData} 
                  chartConfig={chartConfig} 
                  chartRange={chartRange}
                  setChartRange={setChartRange}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Incident Timeline */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Incident Timeline</h2>
                  <p className="text-gray-600 text-sm mt-1">View all incidents chronologically</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Page {incidentPage} of {totalIncidentPages}</span>
                </div>
              </div>

              {groupedTimeline && Object.keys(groupedTimeline).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedTimeline).map(([date, incidents]) => (
                    <div key={date} className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                      <div className="border-l-2 pl-6 space-y-6">
                        {incidents.map((incident) => (
                          <div key={incident.id} className="relative">
                            <div className="absolute -left-[35px] top-0 w-6 h-6 bg-white flex items-center justify-center">
                              {statusIcons[incident.status as keyof typeof statusIcons]}
                            </div>
                            <div className="bg-muted p-4 rounded-md">
                              <h3 className="font-semibold text-base">{incident.title}</h3>
                              <p className="text-xs text-muted-foreground mb-1">Service: {getServiceName(incident.serviceId)}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {new Date(incident.created_at).toLocaleTimeString()}
                              </p>
                              <div className="space-y-2">
                                {[...incident.updates].slice().reverse().map((u, i) => (
                                  <div key={i} className={`border rounded-md p-3 flex items-start justify-between ${u.status === 'resolved' ? 'bg-green-100' : ''}`}>
                                    <div className="flex items-start">
                                      <div className="mt-0.5">{statusIcons[u.status as keyof typeof statusIcons]}</div>
                                      <p className="text-sm ml-2 max-w-xl">{u.message}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                      {new Date(u.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No incidents found in this page.</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalIncidentPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((incidentPage - 1) * INCIDENTS_PER_PAGE) + 1} to {Math.min(incidentPage * INCIDENTS_PER_PAGE, timeline?.length || 0)} of {timeline?.length || 0} incidents
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIncidentPage(prev => Math.max(1, prev - 1))}
                      disabled={incidentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalIncidentPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={incidentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIncidentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalIncidentPages > 5 && (
                        <>
                          {incidentPage > 3 && <span className="text-muted-foreground">...</span>}
                          {incidentPage > 3 && incidentPage < totalIncidentPages - 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0"
                              disabled
                            >
                              {incidentPage}
                            </Button>
                          )}
                          {incidentPage < totalIncidentPages - 2 && <span className="text-muted-foreground">...</span>}
                          {incidentPage < totalIncidentPages - 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIncidentPage(totalIncidentPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalIncidentPages}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIncidentPage(prev => Math.min(totalIncidentPages, prev + 1))}
                      disabled={incidentPage === totalIncidentPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Incident Management Drawer */}
        <OrgRoleBasedAccess allowedRoles={["admin"]}>
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
        </OrgRoleBasedAccess>
      </div>
    </div>
  );
};

export default DashboardPage;