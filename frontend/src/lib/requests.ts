import { toast } from 'sonner';
// Types
export interface MaintenanceData {
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface Service {
  id: number;
  orgId: string;
  name: string;
  description?: string;
  status: string;
  uptime: string;
  link?: string;
}

export interface Incident {
  id: number;
  orgId: string;
  title: string;
  serviceId: number;
  status: string;
  created_at: string;
  message?: string;
  isMaintenance?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  updates: Array<{
    status: string;
    timestamp: string;
    message: string;
  }>;
}

export interface Update {
  message: string;
  status: string;
  timestamp: string;
}

// Set your backend base URL here
const API_BASE_URL = 'http://localhost:8000';

// Service Management Functions
export const createService = (
  serviceData: {
    name: string;
    description?: string;
    status: string;
    link?: string;
  },
  organizationId: string,
  setServicesState: React.Dispatch<React.SetStateAction<Service[]>>,
  setServiceCount: (count: number) => void
) => {
  if (!serviceData.name || !serviceData.status || !organizationId) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  const newService: Service = {
    id: Date.now(),
    orgId: organizationId,
    name: serviceData.name,
    description: serviceData.description,
    status: serviceData.status,
    uptime: "100.00%",
    link: serviceData.link
  };

  setServicesState(prev => {
    const newServices = [newService, ...prev];
    setServiceCount(newServices.length);
    return newServices;
  });

  toast("Service created", {
    description: `Service '${serviceData.name}' has been created.`
  });

  return true;
};

// Incident Management Functions
export const createIncident = (
  incidentData: {
    name: string;
    description?: string;
    serviceId?: number;
    serviceName?: string;
  },
  organizationId: string,
  services: Service[],
  setIncidentsState: React.Dispatch<React.SetStateAction<Incident[]>>,
  serviceId?: number
) => {
  if (!incidentData.name || !organizationId) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  let targetServiceId = serviceId;
  if (!targetServiceId && incidentData.serviceName) {
    const serviceObj = services.find(s => s.name === incidentData.serviceName);
    if (!serviceObj) {
      toast.error("Service not found.");
      return false;
    }
    targetServiceId = serviceObj.id;
  }

  if (!targetServiceId) {
    toast.error("Service ID is required.");
    return false;
  }

  const newIncident: Incident = {
    id: Date.now(),
    orgId: organizationId,
    title: incidentData.name,
    serviceId: targetServiceId,
    status: "investigating",
    created_at: new Date().toISOString(),
    message: incidentData.description,
    updates: [
      {
        status: "investigating",
        timestamp: new Date().toISOString(),
        message: incidentData.description || "Incident created."
      }
    ]
  };

  setIncidentsState(prev => [newIncident, ...prev]);

  const serviceName = services.find(s => s.id === targetServiceId)?.name || 'Unknown Service';
  toast("Incident created", {
    description: `Incident '${incidentData.name}' for service '${serviceName}' has been created.`
  });

  return true;
};

// Update Management Functions
export const addUpdate = (
  updateData: {
    description: string;
    status: string;
  },
  setLocalUpdates: React.Dispatch<React.SetStateAction<Update[]>>,
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>,
  setNewUpdateDesc: React.Dispatch<React.SetStateAction<string>>,
  setNewUpdateStatus: React.Dispatch<React.SetStateAction<string>>
) => {
  if (!updateData.description || !updateData.status) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  const newUpdate: Update = {
    message: updateData.description,
    status: updateData.status,
    timestamp: new Date().toISOString()
  };

  setLocalUpdates(prev => {
    let updates = [...prev];
    if (updateData.status === 'resolved') {
      updates = updates.map(u => u.status === 'resolved' ? { ...u, status: 'monitoring' } : u);
    }
    return [...updates, newUpdate];
  });

  setSelectedIncident((prev: Incident | null) => prev ? { ...prev, status: updateData.status } : prev);
  setNewUpdateDesc("");
  setNewUpdateStatus("");
  toast.success('Update added!');

  return true;
};

export const editUpdate = (
  updateIndex: number,
  updateData: {
    description: string;
    status: string;
  },
  setLocalUpdates: React.Dispatch<React.SetStateAction<Update[]>>,
  setEditingUpdateIdx: React.Dispatch<React.SetStateAction<number | null>>,
  setEditUpdateDesc: React.Dispatch<React.SetStateAction<string>>,
  setEditUpdateStatus: React.Dispatch<React.SetStateAction<string>>
) => {
  if (!updateData.description || !updateData.status) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  setLocalUpdates(prev => {
    let updates = [...prev];
    if (updateData.status === 'resolved') {
      updates = updates.map((u, i) => i !== updateIndex && u.status === 'resolved' ? { ...u, status: 'monitoring' } : u);
    }
    updates[updateIndex] = { ...updates[updateIndex], message: updateData.description, status: updateData.status };
    return updates;
  });

  setEditingUpdateIdx(null);
  setEditUpdateDesc("");
  setEditUpdateStatus("");
  toast.success('Update edited!');

  return true;
};

// Maintenance Management Functions
export const scheduleMaintenance = (
  maintenanceData: MaintenanceData,
  organizationId: string,
  serviceId: number,
  services: Service[],
  setIncidentsState: React.Dispatch<React.SetStateAction<Incident[]>>,
  setServicesState: React.Dispatch<React.SetStateAction<Service[]>>
) => {
  if (!maintenanceData.title || !organizationId) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  const newIncident: Incident = {
    id: Date.now(),
    orgId: organizationId,
    title: maintenanceData.title,
    serviceId: serviceId,
    status: "monitoring",
    created_at: new Date().toISOString(),
    message: `Scheduled maintenance: ${maintenanceData.description || 'No description provided'}`,
    isMaintenance: true,
    scheduledStart: maintenanceData.scheduledStart,
    scheduledEnd: maintenanceData.scheduledEnd,
    updates: [
      {
        status: "monitoring",
        timestamp: new Date().toISOString(),
        message: `Maintenance scheduled from ${new Date(maintenanceData.scheduledStart).toLocaleString()} to ${new Date(maintenanceData.scheduledEnd).toLocaleString()}. ${maintenanceData.description || ''}`
      }
    ]
  };

  // Update incidents state
  setIncidentsState(prev => [newIncident, ...prev]);

  // Update service status to under_maintenance
  setServicesState(prev => prev.map(s => 
    s.id === serviceId ? { ...s, status: 'under_maintenance' } : s
  ));

  const serviceName = services.find(s => s.id === serviceId)?.name || 'Unknown Service';
  toast("Maintenance scheduled", {
    description: `Maintenance '${maintenanceData.title}' for service '${serviceName}' has been scheduled.`
  });

  return true;
};

// Alternative maintenance scheduling with service name
export const scheduleMaintenanceByServiceName = (
  maintenanceData: {
    serviceName: string;
    title: string;
    description?: string;
    date: Date;
    time: string;
    duration: string;
  },
  organizationId: string,
  services: Service[],
  setIncidentsState: React.Dispatch<React.SetStateAction<Incident[]>>,
  setServicesState: React.Dispatch<React.SetStateAction<Service[]>>
) => {
  if (!maintenanceData.serviceName || !maintenanceData.title || !maintenanceData.date || !maintenanceData.time || !maintenanceData.duration || !organizationId) {
    toast.error("Missing required information. Please try again.");
    return false;
  }

  const serviceObj = services.find(s => s.name === maintenanceData.serviceName);
  if (!serviceObj) {
    toast.error("Service not found.");
    return false;
  }

  const start = new Date(maintenanceData.date.toDateString() + 'T' + maintenanceData.time);
  const durationMs = parseInt(maintenanceData.duration, 10) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const newMaintenance: Incident = {
    id: Date.now(),
    orgId: organizationId,
    title: maintenanceData.title,
    status: 'monitoring',
    created_at: new Date().toISOString(),
    serviceId: serviceObj.id,
    isMaintenance: true,
    scheduledStart: start.toISOString(),
    scheduledEnd: end.toISOString(),
    updates: [
      {
        message: maintenanceData.description || "Scheduled maintenance window.",
        status: 'monitoring',
        timestamp: new Date().toISOString()
      }
    ]
  };

  setServicesState(prev => prev.map(s => 
    s.id === serviceObj.id ? { ...s, status: 'under_maintenance' } : s
  ));

  setIncidentsState(prev => [newMaintenance, ...prev]);

  toast("Maintenance scheduled", {
    description: `Maintenance for '${maintenanceData.serviceName}' has been scheduled.`
  });

  return true;
};

// Utility Functions
export const hasScheduledMaintenance = (serviceId: number, incidents: Incident[]): boolean => {
  return incidents.some(incident => 
    incident.serviceId === serviceId && 
    incident.isMaintenance && 
    incident.status !== 'resolved'
  );
};

export const getMaintenanceInfo = (serviceId: number, incidents: Incident[]) => {
  return incidents.find(incident => 
    incident.serviceId === serviceId && 
    incident.isMaintenance && 
    incident.status !== 'resolved'
  );
};

export const getServiceName = (serviceId: number, services: Service[]): string => {
  const service = services.find(s => s.id === serviceId);
  return service ? service.name : "Unknown Service";
};

// Delete a service by ID
export function deleteService(
  serviceId: number,
  setServicesState: React.Dispatch<React.SetStateAction<Service[]>>,
  setServiceCount: (count: number) => void
) {
  setServicesState(prev => {
    const newServices = prev.filter(s => s.id !== serviceId);
    setServiceCount(newServices.length);
    return newServices;
  });
  toast.success('Service deleted');
}

// Update a service by ID
export function updateService(
  updatedService: Service,
  setServicesState: React.Dispatch<React.SetStateAction<Service[]>>
) {
  setServicesState(prev => prev.map(s => s.id === updatedService.id ? { ...s, ...updatedService } : s));
  toast.success('Service updated');
}

// Delete an incident by ID
export function deleteIncident(
  incidentId: number,
  setIncidentsState: React.Dispatch<React.SetStateAction<Incident[]>>
) {
  setIncidentsState(prev => prev.filter(i => i.id !== incidentId));
  toast.success('Incident deleted');
}

// Delete an update from an incident by index
export function deleteIncidentUpdate(
  updateIndex: number,
  setLocalUpdates: React.Dispatch<React.SetStateAction<Update[]>>,
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>
) {
  setLocalUpdates(prev => {
    const newUpdates = prev.filter((_, idx) => idx !== updateIndex);
    setSelectedIncident(prevIncident => prevIncident ? { ...prevIncident, updates: newUpdates } : prevIncident);
    return newUpdates;
  });
  toast.success('Incident update deleted');
}

// Utility to make API requests with orgId header
export async function makerequest(url: string, options: RequestInit = {}, orgId: string) {
  if (!orgId) throw new Error('Organization ID not found');
  // Always use full backend URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const headers = {
    ...(options.headers || {}),
    'X-Org-ID': orgId,
    'Content-Type': 'application/json',
  };
  const method = (options.method || 'GET').toUpperCase();
  let endpoint = url;
  try {
    endpoint = new URL(fullUrl).pathname;
    console.log(`${method} - ${endpoint}`);
  } catch {
    console.log(`${method} - ${fullUrl}`);
  }
  const response = await fetch(fullUrl, { ...options, headers });
  const result = await response.json();
  console.log(`${method} - ${endpoint} RESULT:`, result);
  if (method === 'GET' && endpoint === '/services' && Array.isArray(result)) {
    console.log(`GET - /services COUNT:`, result.length);
    if (result.length > 0) {
      console.log(`GET - /services FIRST:`, result[0]);
    } else {
      console.log('GET - /services: No services found.');
    }
  }
  if (!response.ok) {
    const error = typeof result === 'string' ? result : JSON.stringify(result);
    throw new Error(error || 'Request failed');
  }
  return result;
}
// Usage in a component:
// const { orgId } = useAuth();
// const services = await makerequest('/services', { method: 'GET' }, orgId);

// Fetch all services from backend API using makerequest
export async function getServicesFromApi(orgId: string) {
  return makerequest('/services', { method: 'GET' }, orgId);
}
// Usage: const services = await getServicesFromApi(orgId);

// Fetch all incidents from backend API using makerequest
export async function getIncidentsFromApi(orgId: string) {
  return makerequest('/incidents', { method: 'GET' }, orgId);
}
// Usage: const incidents = await getIncidentsFromApi(orgId);

// --- Service CRUD API Calls ---

// Create a new service
export async function createServiceApi(serviceData: Omit<Service, 'id' | 'orgId' | 'uptime'>, orgId: string) {
  return makerequest('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  }, orgId);
}

// Update a service by ID
export async function updateServiceApi(serviceId: number, serviceData: Partial<Service>, orgId: string) {
  return makerequest(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  }, orgId);
}

// Delete a service by ID
export async function deleteServiceApi(serviceId: number, orgId: string) {
  return makerequest(`/services/${serviceId}`, {
    method: 'DELETE',
  }, orgId);
}

// --- Incident CRUD API Calls ---

// Create a new incident
export async function createIncidentApi(incidentData: Omit<Incident, 'id' | 'orgId' | 'created_at'>, orgId: string) {
  return makerequest('/incidents', {
    method: 'POST',
    body: JSON.stringify(incidentData),
  }, orgId);
}

// Update an incident by ID
export async function updateIncidentApi(incidentId: number, incidentData: Partial<Incident>, orgId: string) {
  return makerequest(`/incidents/${incidentId}`, {
    method: 'PUT',
    body: JSON.stringify(incidentData),
  }, orgId);
}

// Delete an incident by ID
export async function deleteIncidentApi(incidentId: number, orgId: string) {
  return makerequest(`/incidents/${incidentId}`, {
    method: 'DELETE',
  }, orgId);
}

// --- Incident Update API Calls ---

// Add an update to an incident
export async function addIncidentUpdateApi(incidentId: number, updateData: Update, orgId: string) {
  return makerequest(`/incidents/${incidentId}/updates`, {
    method: 'POST',
    body: JSON.stringify(updateData),
  }, orgId);
}

// --- Maintenance Scheduling API Calls ---

// Schedule maintenance (as an incident)
export async function scheduleMaintenanceApi(maintenanceData: MaintenanceData, orgId: string) {
  // maintenanceData should match backend IncidentCreate
  return makerequest('/incidents', {
    method: 'POST',
    body: JSON.stringify(maintenanceData),
  }, orgId);
}

// Remove scheduledStart, scheduledEnd, isMaintenance from types
// Only allow status: 'under_maintenance' for maintenance
export type ServiceUpdate = {
  name: string;
  description: string;
  status: string;
  uptime?: string;
  link?: string;
}; 