import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { mockServices, mockIncidentTimeline, getServicesByOrg, getIncidentsByOrg } from "../lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Pencil, Clock, Eye, CheckCircle2, AlertTriangle, Wrench, Calendar } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from 'sonner';
import { OrgRoleBasedAccess } from "@/components/AccessWrapper";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile"
import { useOrganization, useAuth } from "@clerk/clerk-react";
import { useServiceCount } from "../App";
import { Calendar24 } from "@/components/Calendar24";
import { 
  createService, 
  createIncident, 
  addUpdate, 
  editUpdate, 
  scheduleMaintenance, 
  hasScheduledMaintenance, 
  getMaintenanceInfo,
  type Service,
  type Incident,
  type Update,
  type MaintenanceData,
  updateService,
  deleteService,
  deleteIncident,
  deleteIncidentUpdate,
  getServicesFromApi,
  getIncidentsFromApi,
  deleteServiceApi,
  updateServiceApi,
  deleteIncidentApi,
  updateIncidentApi,
  createServiceApi,
  createIncidentApi,
  addIncidentUpdateApi,
  scheduleMaintenanceApi
} from "../lib/requests";

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  partial_outage: "bg-yellow-500",
  degraded_performance: "bg-orange-500",
  major_outage: "bg-red-500",
  under_maintenance: "bg-blue-500"
};

const statusLabels: Record<string, string> = {
  operational: "Operational",
  partial_outage: "Partial Outage",
  degraded_performance: "Degraded Performance",
  major_outage: "Major Outage",
  under_maintenance: "Under Maintenance"
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
  const { organization } = useOrganization();
  const { setServiceCount } = useServiceCount();
  const { orgId } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [servicesState, setServicesState] = useState<Service[]>([]);
  const [incidentsState, setIncidentsState] = useState<Incident[]>([]);
  
  // Update services and incidents when organization changes
  useEffect(() => {
    async function fetchData() {
      if (orgId) {
        try {
          const orgServices = await getServicesFromApi(orgId);
          const orgIncidents = await getIncidentsFromApi(orgId);
          setServicesState(orgServices);
          setIncidentsState(orgIncidents);
          setServiceCount(orgServices.length);
        } catch (err) {
          // handle error, e.g. toast.error
        }
      }
    }
    fetchData();
  }, [orgId, setServiceCount]);

  const serviceIdParam = Number(params["*"] || params.id || params.serviceId);

  useEffect(() => {
    if (servicesState.length === 0) return;
    const idx = servicesState.findIndex((s) => s.id === serviceIdParam);
    if (idx >= 0) {
      setSelectedIdx(idx);
    } else if (servicesState.length > 0) {
      setSelectedIdx(0);
      navigate(`/services/${servicesState[0].id}`, { replace: true });
    }
  }, [serviceIdParam, servicesState, navigate]);

  const initialIdx = React.useMemo(() => {
    const idx = servicesState.findIndex((s: Service) => s.id === serviceIdParam);
    return idx >= 0 ? idx : 0;
  }, [serviceIdParam, servicesState]);
  const [selectedIdx, setSelectedIdx] = React.useState(initialIdx);
  const emblaApiRef = React.useRef<any>(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = React.useState(false);
  const [newIncidentName, setNewIncidentName] = React.useState("");
  const [newIncidentDesc, setNewIncidentDesc] = React.useState("");
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
  const [scrolled, setScrolled] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'active'>('all');
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceDesc, setMaintenanceDesc] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState<Date | undefined>(undefined);
  const [maintenanceTime, setMaintenanceTime] = useState("");
  const [maintenanceDuration, setMaintenanceDuration] = useState("");
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editLink, setEditLink] = useState('');
  const [deleteIncidentDialogOpen, setDeleteIncidentDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [deleteUpdateIdx, setDeleteUpdateIdx] = useState<number | null>(null);
  const [deleteDrawerIncidentDialogOpen, setDeleteDrawerIncidentDialogOpen] = useState(false);
  const [confirmMaintenanceOpen, setConfirmMaintenanceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const service = servicesState[selectedIdx];
  const incidents = service
    ? incidentsState.filter((inc: Incident) => inc.serviceId === service.id)
    : [];

  // Before rendering the Incident Timeline
  const filteredIncidents = incidentFilter === 'active' ? incidents.filter((inc: Incident) => inc.status !== 'resolved') : incidents;

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

  useEffect(() => {
    // If there is no serviceId in the URL and no services, redirect to dashboard
    if (!params["*"] && !params.id && !params.serviceId) {
      navigate('/dashboard', { replace: true });
    }
  }, [params, navigate]);

  const handleCreateIncident = async () => {
    if (!orgId) return toast.error('No orgId');
    if (!service) return toast.error('No service selected');
    try {
      await createIncidentApi({
        title: newIncidentName,
        serviceId: service.id,
        status: 'investigating',
        updates: [{
          status: 'investigating',
          timestamp: new Date().toISOString(),
          message: newIncidentDesc || 'Incident created.'
        }],
        message: newIncidentDesc || 'Incident created.'
      }, orgId);
      toast.success('Incident created');
      setIncidentDialogOpen(false);
      setNewIncidentName("");
      setNewIncidentDesc("");
      // Refresh incidents
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
    } catch (err) {
      toast.error('Failed to create incident');
    }
  };

  // Edit/update logic
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

  const handleSaveEdit = async (idx: number) => {
    if (!selectedIncident || !orgId) return toast.error('No incident or orgId');
    try {
      const updates = [...localUpdates];
      updates[idx] = {
        ...updates[idx],
        message: editUpdateDesc,
        status: editUpdateStatus,
      };
      await updateIncidentApi(selectedIncident.id, { updates }, orgId);
      toast.success('Update edited');
      setEditingUpdateIdx(null);
      setEditUpdateDesc("");
      setEditUpdateStatus("");
      // Refresh incidents and update local updates
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
      const updatedIncident = orgIncidents.find((i: Incident) => i.id === selectedIncident.id);
      setSelectedIncident(updatedIncident);
      setLocalUpdates(updatedIncident ? updatedIncident.updates : []);
    } catch (err) {
      toast.error('Failed to edit update');
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedIncident || !orgId) return toast.error('No incident or orgId');
    try {
      await addIncidentUpdateApi(selectedIncident.id, {
        message: newUpdateDesc,
        status: newUpdateStatus,
        timestamp: new Date().toISOString(),
      }, orgId);
      toast.success('Update added');
      setNewUpdateDesc("");
      setNewUpdateStatus("");
      // Refresh incidents and update local updates
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
      const updatedIncident = orgIncidents.find((i: Incident) => i.id === selectedIncident.id);
      setSelectedIncident(updatedIncident);
      setLocalUpdates(updatedIncident ? updatedIncident.updates : []);
    } catch (err) {
      toast.error('Failed to add update');
    }
  };

  const isResolved = localUpdates.length > 0 && localUpdates[localUpdates.length - 1].status === 'resolved';

  const handleCreateService = async () => {
    if (!orgId) return toast.error('No orgId');
    try {
      await createServiceApi({
        name: newServiceName,
        description: newServiceDesc,
        status: newServiceStatus,
        link: newServiceLink
      }, orgId);
      toast.success('Service created');
      setServiceDialogOpen(false);
      setNewServiceName("");
      setNewServiceDesc("");
      setNewServiceStatus("");
      setNewServiceLink("");
      // Refresh services
      const orgServices = await getServicesFromApi(orgId);
      setServicesState(orgServices);
      setServiceCount(orgServices.length);
      setSelectedIdx(orgServices.length > 0 ? 0 : -1);
      if (orgServices.length > 0) {
        navigate(`/services/${orgServices[0].id}`, { replace: true });
      } else {
        navigate('/services', { replace: true });
      }
    } catch (err) {
      toast.error('Failed to create service');
    }
  };

  const handleScheduleMaintenance = async (maintenanceData: MaintenanceData) => {
    if (!orgId) return toast.error('No orgId');
    if (!maintenanceDate || !maintenanceTime || !maintenanceDuration) {
      toast.error('Please provide date, time, and duration for maintenance.');
      return;
    }
    const start = new Date(maintenanceDate.toDateString() + 'T' + maintenanceTime);
    if (isNaN(start.getTime())) {
      toast.error('Invalid start date/time.');
      return;
    }
    const durationMs = parseInt(maintenanceDuration, 10) * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);
    try {
      await scheduleMaintenanceApi({
        ...maintenanceData,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      }, orgId);
      toast.success('Maintenance scheduled');
      setMaintenanceDialogOpen(false);
      setMaintenanceTitle("");
      setMaintenanceDesc("");
      setMaintenanceDate(undefined);
      setMaintenanceTime("");
      setMaintenanceDuration("");
      // Refresh incidents and services
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
      const orgServices = await getServicesFromApi(orgId);
      setServicesState(orgServices);
      setServiceCount(orgServices.length);
    } catch (err) {
      toast.error('Failed to schedule maintenance');
    }
  };

  // Open edit dialog
  const handleEditService = (svc: Service) => {
    setServiceToEdit(svc);
    setEditName(svc.name);
    setEditDesc(svc.description || '');
    setEditStatus(svc.status);
    setEditLink(svc.link || '');
    setEditDialogOpen(true);
  };

  // Save edited service
  const handleSaveEditService = async () => {
    if (!serviceToEdit) return;
    if (!orgId) return toast.error('No orgId');
    try {
      await updateServiceApi(serviceToEdit.id, {
        ...serviceToEdit,
        name: editName,
        description: editDesc,
        status: editStatus,
        link: editLink,
      }, orgId);
      toast.success('Service updated');
      // Refresh services
      const orgServices = await getServicesFromApi(orgId);
      setServicesState(orgServices);
      setServiceCount(orgServices.length);
      setEditDialogOpen(false);
      setServiceToEdit(null);
    } catch (err) {
      toast.error('Failed to update service');
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId: number) => {
    if (!orgId) return toast.error('No orgId');
    try {
      await deleteServiceApi(serviceId, orgId);
      toast.success('Service deleted');
      // Refresh services
      const orgServices = await getServicesFromApi(orgId);
      setServicesState(orgServices);
      setServiceCount(orgServices.length);
      setEditDialogOpen(false);
      setServiceToEdit(null);
      const newIdx = orgServices.length > 0 ? 0 : -1;
      setSelectedIdx(newIdx);
      // Update URL param to match new selection
      if (orgServices.length > 0) {
        navigate(`/services/${orgServices[0].id}`, { replace: true });
      } else {
        navigate('/services', { replace: true });
      }
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  // Open delete incident dialog
  const handleDeleteIncidentClick = (incident: Incident) => {
    setIncidentToDelete(incident);
    setDeleteIncidentDialogOpen(true);
  };

  // Confirm delete incident
  const handleConfirmDeleteIncident = async () => {
    if (!incidentToDelete) return;
    await handleDeleteIncident(incidentToDelete.id);
    setDeleteIncidentDialogOpen(false);
    setIncidentToDelete(null);
  };

  // Delete update from incident
  const handleDeleteUpdate = (idx: number) => {
    setDeleteUpdateIdx(idx);
  };

  const handleConfirmDeleteUpdate = async () => {
    if (deleteUpdateIdx === null || !selectedIncident || !orgId) return;
    try {
      const updates = localUpdates.filter((_, idx) => idx !== deleteUpdateIdx);
      await updateIncidentApi(selectedIncident.id, { updates }, orgId);
      toast.success('Update deleted');
      setDeleteUpdateIdx(null);
      // Refresh incidents and update local updates
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
      const updatedIncident = orgIncidents.find((i: Incident) => i.id === selectedIncident.id);
      setSelectedIncident(updatedIncident);
      setLocalUpdates(updatedIncident ? updatedIncident.updates : []);
    } catch (err) {
      toast.error('Failed to delete update');
    }
  };

  // Open delete incident dialog (from drawer)
  const handleDeleteDrawerIncidentClick = () => {
    setIncidentToDelete(selectedIncident);
    setDeleteDrawerIncidentDialogOpen(true);
  };

  // Confirm delete incident (from drawer)
  const handleConfirmDeleteDrawerIncident = async () => {
    if (!incidentToDelete) return;
    await handleDeleteIncident(incidentToDelete.id);
    setDeleteDrawerIncidentDialogOpen(false);
    setIncidentToDelete(null);
    setDrawerOpen(false);
  };

  // Handler to update a service
  const handleUpdateService = async (serviceId: number, updateData: Partial<Service>) => {
    if (!orgId) return toast.error('No orgId');
    try {
      await updateServiceApi(serviceId, updateData, orgId);
      toast.success('Service updated');
      // Refresh services
      const orgServices = await getServicesFromApi(orgId);
      setServicesState(orgServices);
      setServiceCount(orgServices.length);
    } catch (err) {
      toast.error('Failed to update service');
    }
  };

  // Handler to delete an incident
  const handleDeleteIncident = async (incidentId: number) => {
    if (!orgId) return toast.error('No orgId');
    try {
      await deleteIncidentApi(incidentId, orgId);
      toast.success('Incident deleted');
      // Refresh incidents
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
      setDeleteIncidentDialogOpen(false);
      setIncidentToDelete(null);
      setDrawerOpen(false);
    } catch (err) {
      toast.error('Failed to delete incident');
    }
  };

  // Handler to update an incident
  const handleUpdateIncident = async (incidentId: number, updateData: Partial<Incident>) => {
    if (!orgId) return toast.error('No orgId');
    try {
      await updateIncidentApi(incidentId, updateData, orgId);
      toast.success('Incident updated');
      // Refresh incidents
      const orgIncidents = await getIncidentsFromApi(orgId);
      setIncidentsState(orgIncidents);
    } catch (err) {
      toast.error('Failed to update incident');
    }
  };

  if (!service) {
    return <div className="p-6">Service not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div
          className={`${!isMobile ? "sticky top-0 z-30" : ""} bg-white/80 dark:bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 transition-all duration-300 ${scrolled ? "shadow-md py-2" : "shadow-none py-6"}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  Service Dashboard
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Monitor and manage your services and incidents
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <OrgRoleBasedAccess allowedRoles={["admin"]}>
                <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-black dark:bg-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                      <Plus className="mr-2 h-4 w-4" /> Create Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
                            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
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
                    <Button className="bg-white text-black dark:bg-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                      <Plus className="mr-2 h-4 w-4" /> Add Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
                        <input
                          className="w-full border rounded-lg p-3 text-sm bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 cursor-not-allowed"
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
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Service Carousel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Services Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm dark:shadow-md border dark:border-zinc-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Services</h2>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">Browse through available services</p>
                </div>
              </div>
              
              <div className="w-full">
                <Carousel
                  opts={{ loop: false, startIndex: initialIdx }}
                  className="w-full overflow-visible"
                  setApi={api => { emblaApiRef.current = api; }}
                >
                  <CarouselContent>
                    {servicesState.map((svc, idx) => {
                      const maintenanceInfo = getMaintenanceInfo(svc.id, incidentsState);
                      const hasMaintenance = hasScheduledMaintenance(svc.id, incidentsState);
                      
                      return (
                        <CarouselItem key={svc.id} className="flex justify-center items-stretch overflow-visible">
                          <Card className={`w-full max-w-sm px-4 py-3 flex flex-col justify-center overflow-visible transition-all duration-300 hover:shadow-lg border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:border-blue-900 dark:hover:bg-blue-900 ${selectedIdx === idx ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-zinc-200 bg-white dark:bg-zinc-900'}`}>
                            <CardHeader className="pb-3 px-3 flex items-center justify-between">
                              <CardTitle className="flex items-center text-base mb-2">
                                <span className="truncate font-semibold group-hover:text-blue-600 transition-colors text-gray-900 dark:text-zinc-100">{svc.name}</span>
                                <span className={`w-4 h-4 rounded-full ${statusColors[svc.status]} shadow-lg ring-2 ring-white ml-2`} title={statusLabels[svc.status] || svc.status.replace("_", " ")}></span>
                              </CardTitle>
                              <Button size="icon" variant="ghost" onClick={() => handleEditService(svc)} className="ml-2">
                                <Pencil className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 py-0 overflow-visible">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`${statusColors[svc.status]} text-white font-medium text-xs shadow-sm`}>
                                  {statusLabels[svc.status] || svc.status.replace("_", " ")}
                                </Badge>
                                <Badge variant="outline" className="font-medium text-xs bg-gray-50 text-black dark:bg-zinc-700 dark:text-zinc-100">
                                  Uptime: {svc.uptime}
                                </Badge>
                                {hasMaintenance && maintenanceInfo && maintenanceInfo.scheduledStart && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium text-xs shadow-sm">
                                    <Wrench className="w-3 h-3 mr-1" />
                                    Maintenance: {new Date(maintenanceInfo.scheduledStart).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed text-gray-900 dark:text-zinc-100">{svc.description}</p>
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
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-white shadow-lg" />
                  <CarouselNext className="right-2 bg-white shadow-lg" />
                </Carousel>
              </div>
            </div>

            {/* Chart Section */}
            {incidents.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm dark:shadow-md border dark:border-zinc-700 p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Incident Duration Analysis</h3>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm">Duration comparison showing how long each incident was active (in days)</p>
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
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm dark:shadow-md border dark:border-zinc-700 p-6 sticky top-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Incident Timeline</h2>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">Track and manage incidents</p>
                </div>
              </div>
              <div className="mt-2 mb-4 w-full sm:w-[180px]">
                <Select value={incidentFilter} onValueChange={v => setIncidentFilter(v as 'all' | 'active')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter incidents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Incidents</SelectItem>
                    <SelectItem value="active">Active Incidents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="mb-4" />

              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {filteredIncidents.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <div className="text-gray-400 mb-2">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No incidents found</p>
                    <p className="text-sm text-muted-foreground mt-1">All systems are running smoothly</p>
                  </Card>
                ) : (
                  filteredIncidents.map((incident) => (
                    <Card key={incident.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight pr-2 font-semibold">{incident.title}</CardTitle>
                          <div className="flex gap-2">
                            <OrgRoleBasedAccess allowedRoles={["admin"]}>
                              <Button size="sm" variant="ghost" onClick={() => handleIncidentClick(incident)} className="shrink-0 hover:bg-blue-100 dark:hover:bg-zinc-700 cursor-pointer">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </OrgRoleBasedAccess>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-medium bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">
                            {incident.status.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <Separator />
                      
                        <div>
                          <div className="font-medium text-sm mb-3 text-gray-900 dark:text-zinc-100">Recent Updates</div>
                          <div className="space-y-3 max-h-32 overflow-y-auto">
                            {incident.updates && incident.updates.length > 0 ? (
                              [...incident.updates].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 2).map((update, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-lg p-3 text-xs border-l-4 transition-colors 
                                    ${update.status === 'resolved' 
                                      ? 'border-l-green-500 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200' 
                                      : 'border-l-gray-300 dark:border-l-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-200'}`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${updateStatusColors[update.status] || 'bg-gray-100 text-gray-800'}`}>
                                      {update.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-xs mb-2 leading-relaxed">{update.message}</p>
                                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                                    {new Date(update.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-500 italic p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">No updates available</div>
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
      </div>

      {/* Drawer for editing incidents */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh] bg-white dark:bg-zinc-900">
          <DrawerHeader className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
            <DrawerTitle className="text-xl font-bold text-gray-900 dark:text-zinc-100">
              Incident Management
            </DrawerTitle>
            <DrawerDescription>
              {selectedIncident && (
                <div className="space-y-3 mt-3">
                  <div className="font-semibold text-lg text-gray-800 dark:text-zinc-200">
                    {selectedIncident.title}
                  </div>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Created: {new Date(selectedIncident.created_at).toLocaleString()}
                    </span>
                    {localUpdates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">Current Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          localUpdates[localUpdates.length - 1].status === 'resolved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : localUpdates[localUpdates.length - 1].status === 'investigating'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : localUpdates[localUpdates.length - 1].status === 'identified'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {statusIcons[localUpdates[localUpdates.length - 1].status as keyof typeof statusIcons]}
                          <span className="ml-1 capitalize">{localUpdates[localUpdates.length - 1].status}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DrawerDescription>
          </DrawerHeader>
          
          {selectedIncident && (
            <div className="px-6 pb-6 overflow-y-auto bg-gray-50 dark:bg-zinc-900">
              <div className="space-y-6 py-6">
                {/* Updates Timeline */}
                <Card className="shadow-lg border-0 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 dark:border-zinc-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 py-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Updates Timeline
                      <span className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
                        ({localUpdates.length} update{localUpdates.length !== 1 ? 's' : ''})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 px-6 pb-6">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {[...localUpdates].slice().reverse().map((u, i, arr) => {
                        const realIdx = localUpdates.length - 1 - i;
                        const isEditing = editingUpdateIdx === realIdx;
                        const isFirst = i === 0;
                        return (
                          <div key={i} className={`relative border rounded-xl p-4 transition-all duration-300 ${
                            u.status === 'resolved' 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' 
                              : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 border-gray-200 dark:border-zinc-700'
                          } ${isFirst ? ' ' : ''}`}>
                            {/* Timeline connector */}
                            {i < arr.length - 1 && (
                              <div className="absolute -bottom-3 left-6 w-0.5 h-3 bg-gray-300 dark:bg-zinc-600"></div>
                            )}
                            {isEditing ? (
                              u.status === 'created' ? (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full border border-gray-300 dark:border-zinc-600 rounded-xl p-3 text-sm bg-gray-100 dark:bg-zinc-700 cursor-not-allowed"
                                    rows={2}
                                    value={editUpdateDesc}
                                    readOnly
                                  />
                                  <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus} disabled>
                                    <SelectTrigger className="w-full h-10 border border-gray-300 dark:border-zinc-600 rounded-xl bg-gray-100 dark:bg-zinc-700 cursor-not-allowed">
                                      <SelectValue placeholder="Created" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="created">Created</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex justify-end pt-1">
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="rounded-lg">
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full border border-gray-200 dark:border-zinc-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-zinc-700"
                                    rows={2}
                                    value={editUpdateDesc}
                                    onChange={e => setEditUpdateDesc(e.target.value)}
                                  />
                                  <Select value={editUpdateStatus} onValueChange={setEditUpdateStatus}>
                                    <SelectTrigger className="w-full h-10 border border-gray-200 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-zinc-700">
                                      <SelectValue placeholder="Select update status" />
                                    </SelectTrigger>
                                    <SelectContent className="border border-gray-200 dark:border-zinc-600 rounded-xl">
                                      <SelectItem value="investigating">
                                        <div className="flex items-center gap-2">
                                          {statusIcons.investigating}
                                          Investigating
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="identified">
                                        <div className="flex items-center gap-2">
                                          {statusIcons.identified}
                                          Identified
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="monitoring">
                                        <div className="flex items-center gap-2">
                                          {statusIcons.monitoring}
                                          Monitoring
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="resolved">
                                        <div className="flex items-center gap-2">
                                          {statusIcons.resolved}
                                          Resolved
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-2 justify-end pt-1">
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="rounded-lg">
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSaveEdit(realIdx)} 
                                      disabled={!editUpdateDesc || !editUpdateStatus}
                                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      Save
                                    </Button>
                                    <OrgRoleBasedAccess allowedRoles={["admin"]}>
                                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUpdate(realIdx)} className="rounded-lg ml-2">
                                        Delete
                                      </Button>
                                    </OrgRoleBasedAccess>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="flex-shrink-0 mt-0.5">
                                      {statusIcons[u.status as keyof typeof statusIcons]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium mb-2 text-gray-900 dark:text-zinc-100 leading-relaxed">
                                        {u.message}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">
                                          {new Date(u.timestamp).toLocaleString()}
                                        </span>
                                        {isFirst && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Latest
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleEditUpdate(realIdx, u)} 
                                    className="shrink-0 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg p-2"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
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

                {/* Add Update Form */}
                <Card className="shadow-lg border-0 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 dark:border-zinc-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 py-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Add Update
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 px-6 pb-6">
                    {isResolved ? (
                      <div className="text-sm bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-200 p-4 rounded-xl border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <div className="font-medium">Incident Resolved</div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                              This incident has been resolved. No further updates can be added.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">
                            Update Description
                          </label>
                          <textarea
                            className="w-full border border-gray-200 dark:border-zinc-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 transition-all duration-200"
                            rows={3}
                            placeholder="Describe the update in detail..."
                            value={newUpdateDesc}
                            onChange={e => setNewUpdateDesc(e.target.value)}
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">
                              Status
                            </label>
                            <Select value={newUpdateStatus} onValueChange={setNewUpdateStatus}>
                              <SelectTrigger className="w-full h-10 border border-gray-200 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-zinc-700">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="border border-gray-200 dark:border-zinc-600 rounded-xl">
                                <SelectItem value="investigating" className="py-2">
                                  <div className="flex items-center gap-2">
                                    {statusIcons.investigating}
                                    Investigating
                                  </div>
                                </SelectItem>
                                <SelectItem value="identified" className="py-2">
                                  <div className="flex items-center gap-2">
                                    {statusIcons.identified}
                                    Identified
                                  </div>
                                </SelectItem>
                                <SelectItem value="monitoring" className="py-2">
                                  <div className="flex items-center gap-2">
                                    {statusIcons.monitoring}
                                    Monitoring
                                  </div>
                                </SelectItem>
                                <SelectItem value="resolved" className="py-2">
                                  <div className="flex items-center gap-2">
                                    {statusIcons.resolved}
                                    Resolved
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={handleSaveUpdate} 
                            disabled={!newUpdateDesc || !newUpdateStatus}
                            className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Update
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <OrgRoleBasedAccess allowedRoles={["admin"]}>
                  <div className="flex justify-end mt-4">
                    <Button variant="destructive" onClick={handleDeleteDrawerIncidentClick}>
                      Delete Incident
                    </Button>
                  </div>
                </OrgRoleBasedAccess>
              </div>
            </div>
          )}
          
          <DrawerFooter className="border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
            {/* Footer content can be added here if needed */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit/Delete Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Edit or delete this service.</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-2">Service Name</label>
              <input
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Describe the service (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="partial_outage">Partial Outage</SelectItem>
                  <SelectItem value="degraded_performance">Degraded Performance</SelectItem>
                  <SelectItem value="major_outage">Major Outage</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Link</label>
              <input
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editLink}
                onChange={e => setEditLink(e.target.value)}
                placeholder="https://example.com (optional)"
                type="url"
              />
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleDeleteService(serviceToEdit?.id || 0)}>Delete</Button>
            <Button onClick={handleSaveEditService} disabled={!editName || !editStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Incident Confirmation Dialog (from drawer) */}
      <Dialog open={deleteDrawerIncidentDialogOpen} onOpenChange={setDeleteDrawerIncidentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>Are you sure you want to delete this incident?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDrawerIncidentDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteDrawerIncident}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Update Confirmation Dialog */}
      <Dialog open={deleteUpdateIdx !== null} onOpenChange={open => !open && setDeleteUpdateIdx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Update</DialogTitle>
            <DialogDescription>Are you sure you want to delete this update?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUpdateIdx(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteUpdate}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Set as Under Maintenance Dialog */}
      <Dialog open={confirmMaintenanceOpen} onOpenChange={setConfirmMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set as Under Maintenance</DialogTitle>
            <DialogDescription>
              Are you sure you want to set <b>{selectedService?.name}</b> as under maintenance?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                if (!selectedService) return;
                console.log('Calling updateServiceApi', selectedService.id, {
                  ...selectedService,
                  status: 'under_maintenance',
                }, orgId || '');
                await updateServiceApi(selectedService.id, {
                  ...selectedService,
                  status: 'under_maintenance',
                }, orgId || '');
                setConfirmMaintenanceOpen(false);
              }}
            >
              Yes, Set as Under Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesPage;