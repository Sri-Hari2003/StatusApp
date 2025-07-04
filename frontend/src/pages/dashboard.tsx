// File: src/pages/Dashboard.tsx (React + Vite)

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Clock, Eye, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
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

    // Move getServiceName here so it is defined before any usage
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

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

    // Sort incidents by created_at descending (most recent first)
    const sortedTimeline = timeline
        ? [...timeline].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

    const paginatedTimeline = sortedTimeline
        ? sortedTimeline.slice((incidentPage - 1) * INCIDENTS_PER_PAGE, incidentPage * INCIDENTS_PER_PAGE)
        : [];

    // Active/unresolved incidents (status !== 'resolved')
    const activeIncidents = sortedTimeline.filter(inc => inc.status !== 'resolved');

    // Filter unresolved incidents by selected service
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

    // Prepare area chart data
    const allServices = services ?? mockServices;
    const allIncidents = timeline ?? mockIncidentTimeline;

    // Get all dates in the range
    const today = new Date();
    let days = 90;
    if (chartRange === "30d") days = 30;
    if (chartRange === "7d") days = 7;
    const startDate = subDays(today, days - 1);

    // Build a list of date strings for the x-axis
    const dateList: string[] = [];
    for (let d = new Date(startDate); d <= today; d = addDays(d, 1)) {
        dateList.push(d.toISOString().slice(0, 10));
    }

    // Build chart data: { date, [serviceName]: count, ... }
    const chartData = dateList.map(date => {
        const entry: Record<string, any> = { date };
        allServices.forEach(service => {
            entry[service.name] = allIncidents.filter(
                inc => inc.serviceId === service.id && inc.created_at.slice(0, 10) === date
            ).length;
        });
        return entry;
    });

    // Chart config for dynamic services
    const chartConfig = Object.fromEntries(
        allServices.map((service, idx) => [
            service.name,
            { label: service.name, color: `var(--chart-${idx + 1})` }
        ])
    );

    // When an incident is clicked, open the drawer and set the selected incident
    const handleIncidentClick = (incident: any) => {
        setSelectedIncident(incident);
        setLocalUpdates(incident.updates);
        setDrawerOpen(true);
    };

    // Add new update to local updates
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

    // Check if the latest update is resolved
    const isResolved = localUpdates.length > 0 && localUpdates[localUpdates.length - 1].status === 'resolved';

    // Edit update handlers
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

    // Add Incident Dialog save handler
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

    // Add Service Dialog save handler
    const handleCreateService = () => {
        if (!newServiceName || !newServiceStatus) return;
        // Add a new service to the list (local only)
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
    
    <div className="p-6 space-y-6">
            <Toaster />
            <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Service Dashboard</h1>
                <div className="flex gap-2">
                <SignedIn>
                    <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setServiceDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Service
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Service</DialogTitle>
                                <DialogDescription>Fill in the details to create a new service.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Service Name</label>
                                    <input
                                        className="w-full border rounded p-2 text-sm"
                                        value={newServiceName}
                                        onChange={e => setNewServiceName(e.target.value)}
                                        placeholder="Enter service name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        className="w-full border rounded p-2 text-sm"
                                        rows={2}
                                        value={newServiceDesc}
                                        onChange={e => setNewServiceDesc(e.target.value)}
                                        placeholder="Describe the service (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
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
                                    <label className="block text-sm font-medium mb-1">Link</label>
                                    <input
                                        className="w-full border rounded p-2 text-sm"
                                        value={newServiceLink}
                                        onChange={e => setNewServiceLink(e.target.value)}
                                        placeholder="https://example.com (optional)"
                                        type="url"
                                    />
                                </div>
                            </div>
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
                                <Button onClick={handleCreateIncident} disabled={!newIncidentName || !newIncidentService}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    </SignedIn>
                </div>
      </div>
      <Separator />
            {/* Banner for active incidents */}
            <div
                className={`mb-4 rounded-lg px-4 py-3 font-medium flex items-center justify-between
                    ${activeIncidents.length === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
                {activeIncidents.length === 0 ? (
                    <span>All services are operational.</span>
                ) : (
                    <span>
                        <span className="font-bold">{activeIncidents.length}</span> active incident{activeIncidents.length > 1 ? 's' : ''} ongoing
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-medium">Services</h2>
      <Input
        placeholder="Search services..."
                    className="max-w-sm ml-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
            </div>

      {services ? (
        filteredServices && filteredServices.length > 0 ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(service => (
              <Card
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                className="hover:shadow-md transition cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {service.name}
                    <span
                      className={`w-3 h-3 rounded-full ${statusColors[service.status]}`}
                      title={service.status.replace("_", " ")}
                    ></span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {service.description}
                  </p>
                  <Badge variant="outline">Uptime: {service.uptime}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No services found.</p>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}
            <Separator />
            
            {/* Active/Unresolved Incidents Section */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">Active Incidents</h2>
                <Select value={activeServiceFilter} onValueChange={setActiveServiceFilter}>
                    <SelectTrigger className="w-[180px]">
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
            {filteredActiveIncidents.length > 0 && (
                <div>
                    <div className="flex overflow-x-auto space-x-4 pb-2">
                        {filteredActiveIncidents.map((incident) => (
                            <div
                                key={incident.id}
                                className="min-w-[300px] max-w-xs bg-muted p-4 rounded-md shadow flex-shrink-0 border relative cursor-pointer"
                                onClick={() => handleIncidentClick(incident)}
                            >
                                <h3 className="font-semibold text-base pl-4">{incident.title}</h3>
                                <p className="text-xs text-muted-foreground pl-4 mb-1">Service: {getServiceName(incident.serviceId)}</p>
                                <p className="text-xs text-muted-foreground mb-2 pl-4">
                                    {new Date(incident.created_at).toLocaleString()}
                                </p>
                                {/* Show latest update if available */}
                                {incident.updates && incident.updates.length > 0 && (
                                    <div className="pl-4 mt-2">
                                        <div className="flex items-center text-sm">
                                            <div className="mr-1">{statusIcons[incident.updates[incident.updates.length - 1].status as keyof typeof statusIcons]}</div>
                                            <span className="font-medium">Latest:</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {incident.updates[incident.updates.length - 1].message}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(incident.updates[incident.updates.length - 1].timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Incident Drawer */}
            <SignedIn>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Incident Details</DrawerTitle>
                        <DrawerDescription>
                            {selectedIncident && (
                                <>
                                    <div className="font-semibold text-lg mb-1">{selectedIncident.title}</div>
                                    <div className="text-sm mb-1">Service: {getServiceName(selectedIncident.serviceId)}</div>
                                    <div className="text-xs text-muted-foreground mb-2">Created: {new Date(selectedIncident.created_at).toLocaleString()}</div>
                                </>
                            )}
                        </DrawerDescription>
                    </DrawerHeader>
                    {selectedIncident && (
                        <div className="px-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Add Update Form (disabled if resolved) */}
                                <div className="border rounded-lg p-4 w-full md:w-1/2">
                                    <div className="font-semibold mb-2">Add Update</div>
                                    {isResolved ? (
                                        <div className="text-sm text-muted-foreground">No further updates can be added after resolution.</div>
                                    ) : (
                                        <>
                                            <textarea
                                                className="w-full border rounded p-2 mb-2 text-sm"
                                                rows={2}
                                                placeholder="Update description..."
                                                value={newUpdateDesc}
                                                onChange={e => setNewUpdateDesc(e.target.value)}
                                            />
                                            <Select value={newUpdateStatus} onValueChange={setNewUpdateStatus}>
                                                <SelectTrigger className="w-full mb-2">
                                                    <SelectValue placeholder="Select update status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="investigating">Investigating</SelectItem>
                                                    <SelectItem value="identified">Identified</SelectItem>
                                                    <SelectItem value="monitoring">Monitoring</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="flex justify-end">
                                                <Button size="sm" onClick={handleSaveUpdate} disabled={!newUpdateDesc || !newUpdateStatus}>Save</Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {/* Updates Timeline */}
                                <div className="border rounded-lg p-4 w-full md:w-1/2">
                                    <div className="font-semibold mb-2">Updates Timeline</div>
                                    <div className="space-y-2 h-40 overflow-y-auto">
                                        {[...localUpdates].slice().reverse().map((u, i, arr) => {
                                            // Find the real index in localUpdates
                                            const realIdx = localUpdates.length - 1 - i;
                                            const isEditing = editingUpdateIdx === realIdx;
                                            return (
                                                <div key={i} className={`border rounded-md p-3 flex flex-col gap-2 ${u.status === 'resolved' ? 'bg-green-100' : ''}`}>
                                                    {isEditing ? (
                                                        u.status === 'created' ? (
                                                            <>
                                                                <textarea
                                                                    className="w-full border rounded p-2 mb-2 text-sm bg-gray-100 cursor-not-allowed"
                                                                    rows={2}
                                                                    value={editUpdateDesc}
                                                                    readOnly
                                                                />
                                                                <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus} disabled>
                                                                    <SelectTrigger className="w-full mb-2">
                                                                        <SelectValue placeholder="Created" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="created">Created</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <textarea
                                                                    className="w-full border rounded p-2 mb-2 text-sm"
                                                                    rows={2}
                                                                    value={editUpdateDesc}
                                                                    onChange={e => setEditUpdateDesc(e.target.value)}
                                                                />
                                                                <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus}>
                                                                    <SelectTrigger className="w-full mb-2">
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
                                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                                                    <Button size="sm" onClick={() => handleSaveEdit(realIdx)} disabled={!editUpdateDesc || !editUpdateStatus}>Save</Button>
                                                                </div>
                                                            </>
                                                        )
                                                    ) : (
                                                        <>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start">
                                                                    <div className="mt-0.5">{statusIcons[u.status as keyof typeof statusIcons]}</div>
                                                                    <p className="text-sm ml-2 max-w-xl">{u.message}</p>
                                                                </div>
                                                                <Button size="icon" variant="ghost" onClick={() => handleEditUpdate(realIdx, u)}>
                                                                    <span className="sr-only">Edit</span>
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                                {new Date(u.timestamp).toLocaleString()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                        {/* You can add a Save/Update button here to persist status changes */}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
            </SignedIn>
            <Separator />
            {/* Area Chart Section */}
            <AreaChartIncidents
                chartData={chartData}
                chartConfig={chartConfig}
                chartRange={chartRange}
                setChartRange={setChartRange}
            />
            <Separator />
      <div className="space-y-6">
        <h2 className="text-xl font-medium">Incident Timeline</h2>

                {/* Pagination Controls */}
                {timeline && (
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIncidentPage((p) => Math.max(1, p - 1))}
                            disabled={incidentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {incidentPage} of {totalIncidentPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIncidentPage((p) => Math.min(totalIncidentPages, p + 1))}
                            disabled={incidentPage === totalIncidentPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
                {/* Incident Timeline */}
        {groupedTimeline &&
          Object.entries(groupedTimeline).map(([date, incidents]) => (
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
    </div>
  );
};

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  partial_outage: "bg-yellow-500",
  degraded_performance: "bg-orange-500",
  major_outage: "bg-red-500"
};

export default DashboardPage;