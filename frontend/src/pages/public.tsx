import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Zap, TrendingUp, Activity, Shield, Globe, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
interface Incident {
  id: number;
  title: string;
  status: string;
  created_at: string;
  updates: any[];
}

interface Service {
  id: number;
  name: string;
  status: string;
  description: string;
  uptime: string;
  link: string;
  incidents: Incident[];
}

interface OrgsServices {
  [orgId: string]: Service[];
}

interface WebSocketMessage {
  type: string;
  orgId: string;
  data: any;
  timestamp: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'active':
        return { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle };
      case 'degraded':
      case 'partial':
        return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: AlertCircle };
      case 'outage':
      case 'down':
        return { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: AlertCircle };
      default:
        return { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: Clock };
    }
  };

  const { color, icon: Icon } = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border backdrop-blur-sm ${color}`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {status}
    </span>
  );
};

const UptimeBadge = ({ uptime }: { uptime: string }) => {
  const uptimeValue = parseFloat(uptime.replace('%', ''));
  const getUptimeColor = (value: number) => {
    if (value >= 99.5) return 'text-emerald-400';
    if (value >= 95) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <span className={`font-semibold ${getUptimeColor(uptimeValue)}`}>
      {uptime}
    </span>
  );
};

const MetricCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ComponentType<any>; color: string }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  </div>
);

const IncidentsChart = ({ services }: { services: Service[] }) => {
  const chartData = services.map(service => ({
    name: service.name.length > 12 ? service.name.substring(0, 12) + '...' : service.name,
    fullName: service.name,
    incidents: (service.incidents || []).length,
    status: service.status.toLowerCase()
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-slate-300">
            <span className="font-medium">{data.incidents}</span> incident{data.incidents !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-slate-400 capitalize">Status: {data.status}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-blue-400" />
        Incidents by Service
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="incidents" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              stroke="#1d4ed8"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ConnectionStatus = ({ connected }: { connected: boolean }) => (
  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${
    connected 
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
      : 'bg-red-500/20 text-red-300 border border-red-500/30'
  }`}>
    {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
    <span>{connected ? 'Live' : 'Disconnected'}</span>
  </div>
);

const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnected(false);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  return { socket, connected, lastMessage };

};

export default function PublicStatusPage() {
  const [data, setData] = useState<OrgsServices>({});
  const [selectedOrg, setSelectedOrg] = useState<string | null>(() => localStorage.getItem('selectedOrg'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgNames, setOrgNames] = useState<{ [orgId: string]: string }>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [incidentPages, setIncidentPages] = useState<{ [serviceId: number]: number }>({});
  const INCIDENTS_PER_PAGE = 3;

  // WebSocket connection
  const { connected, lastMessage } = useWebSocket(selectedOrg ? `${WS_BASE_URL}/ws/${selectedOrg}` : '');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/orgs_services`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      const orgIds = Object.keys(json);
      if (orgIds.length > 0 && !selectedOrg) {
        setSelectedOrg(orgIds[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not load data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);
  // Enhanced WebSocket message handler with organization name and detailed updates
useEffect(() => {
    if (lastMessage) {
      console.log('Received WebSocket message:', lastMessage);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Get the organization name for the toast (use current state, not dependency)
      const currentOrgName = orgNames[lastMessage.orgId] || lastMessage.orgId;
      
      // Create detailed toast messages based on message type
      const getToastMessage = (message: WebSocketMessage) => {
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';
        
        switch (message.type) {
          case 'service_created':
            return {
              title: `New Service Added - ${currentOrgName}`,
              description: `${message.data?.name || 'Service'} has been created`,
              type: 'success'
            };
          
          case 'service_updated':
            return {
              title: `Service Updated - ${currentOrgName}`,
              description: `${message.data?.name || 'Service'} was updated`,
              type: 'info'
            };
          
          case 'service_deleted':
            return {
              title: `Service Removed - ${currentOrgName}`,
              description: `${message.data?.name || 'Service'} has been deleted`,
              type: 'warning'
            };
          
          case 'incident_created':
            return {
              title: `New Incident - ${currentOrgName}`,
              description: `${message.data?.title || 'Incident'} reported for ${message.data?.service_name || 'service'}`,
              type: 'error'
            };
          
          case 'incident_updated':
            return {
              title: `Incident Updated - ${currentOrgName}`,
              description: `${message.data?.title || 'Incident'} status: ${message.data?.status || 'updated'}`,
              type: 'info'
            };
          
          case 'incident_deleted':
            return {
              title: `Incident Resolved - ${currentOrgName}`,
              description: `${message.data?.title || 'Incident'} has been resolved`,
              type: 'success'
            };
          
          case 'incident_update_added':
            return {
              title: `Incident Update - ${currentOrgName}`,
              description: `New update added to ${message.data?.incident_title || 'incident'}`,
              type: 'info'
            };
          
          default:
            return {
              title: `Update - ${currentOrgName}`,
              description: `${message.type} event received${timestamp ? ` at ${timestamp}` : ''}`,
              type: 'info'
            };
        }
      };
      
      const toastConfig = getToastMessage(lastMessage);
      
      // Show appropriate toast based on message type
      switch (toastConfig.type) {
        case 'success':
          toast.success(toastConfig.title, {
            description: toastConfig.description,
            duration: 4000,
          });
          break;
        case 'error':
          toast.error(toastConfig.title, {
            description: toastConfig.description,
            duration: 6000,
          });
          break;
        case 'warning':
          toast.warning(toastConfig.title, {
            description: toastConfig.description,
            duration: 5000,
          });
          break;
        default:
          toast.info(toastConfig.title, {
            description: toastConfig.description,
            duration: 3000,
          });
      }
      
      // Handle different message types for data refresh
      switch (lastMessage.type) {
        case 'service_created':
        case 'service_updated':
        case 'service_deleted':
        case 'incident_created':
        case 'incident_updated':
        case 'incident_deleted':
        case 'incident_update_added':
          // Refresh data when any change occurs
          fetchData();
          break;
        default:
          console.log('Unknown message type:', lastMessage.type);
      }
    }
  }, [lastMessage]); 

  useEffect(() => {
    if (selectedOrg) {
      setOrgName(null);
      fetch(`${API_BASE_URL}/public/org_name/${selectedOrg}`)
        .then(res => res.json())
        .then(data => {
          setOrgName(data.name);
        })
        .catch(() => setOrgName(null));
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const fetchNames = async () => {
        const names: { [orgId: string]: string } = {};
        await Promise.all(
          Object.keys(data).map(async (orgId) => {
            try {
              const res = await fetch(`${API_BASE_URL}/public/org_name/${orgId}`);
              const orgData = await res.json();
              names[orgId] = orgData.name;
            } catch {
              names[orgId] = orgId;
            }
          })
        );
        setOrgNames(names);
      };
      fetchNames();
    }
  }, [data]);

  // Persist selectedOrg to localStorage on change
  useEffect(() => {
    if (selectedOrg) {
      localStorage.setItem('selectedOrg', selectedOrg);
    }
  }, [selectedOrg]);

  const handleGetStarted = () => {
    window.location.href = '/';
  };

  const getMetrics = (services: Service[]) => {
    const totalServices = services.length;
    const operationalServices = services.filter(s => 
      s.status.toLowerCase().includes('operational') || s.status.toLowerCase().includes('active')
    ).length;
    const totalIncidents = services.reduce((sum, service) => sum + (service.incidents || []).length, 0);
    const avgUptime = services.length > 0 
      ? (services.reduce((sum, service) => sum + parseFloat(service.uptime.replace('%', '')), 0) / services.length).toFixed(1)
      : '0';

    return { totalServices, operationalServices, totalIncidents, avgUptime };
  };

  const getOverallStatus = (services: Service[]) => {
    if (services.length === 0) return 'No Services';
    
    const hasOutage = services.some(s => s.status.toLowerCase().includes('outage') || s.status.toLowerCase().includes('down'));
    const hasDegraded = services.some(s => s.status.toLowerCase().includes('degraded') || s.status.toLowerCase().includes('partial'));
    
    if (hasOutage) return 'Major Outage';
    if (hasDegraded) return 'Partial Outage';
    return 'All Systems Operational';
  };

  // Helper to get paginated incidents for a service
  const getPaginatedIncidents = (service: Service) => {
    const page = incidentPages[service.id] || 1;
    const sorted = [...(service.incidents || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const start = (page - 1) * INCIDENTS_PER_PAGE;
    const end = start + INCIDENTS_PER_PAGE;
    return sorted.slice(start, end);
  };

  // Helper to get total pages for a service
  const getTotalIncidentPages = (service: Service) => {
    return Math.max(1, Math.ceil(((service.incidents || []).length) / INCIDENTS_PER_PAGE));
  };

  // Handler for pagination
  const handleIncidentPageChange = (serviceId: number, newPage: number) => {
    setIncidentPages((prev) => ({ ...prev, [serviceId]: newPage }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Status Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <ConnectionStatus connected={connected} />
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
              </div>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-3 text-slate-300">Loading services...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Status Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <ConnectionStatus connected={connected} />
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
              </div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-300 font-medium">{error}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orgIds = Object.keys(data);
  if (orgIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Status Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <ConnectionStatus connected={connected} />
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
              </div>
            </div>
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Organizations Found</h3>
              <p className="text-slate-400">There are no organizations to display at this time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure services is always an array
  const services = selectedOrg && Array.isArray(data[selectedOrg]) ? data[selectedOrg] : [];
  const overallStatus = getOverallStatus(services);
  const metrics = getMetrics(services);

  return (
    <>
      <Toaster />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold">Status Dashboard</h1>
                </div>
                  <div className="flex items-center space-x-4">
                    <ConnectionStatus connected={connected} />
                <Button onClick={handleGetStarted} className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-3 rounded-lg font-medium backdrop-blur-sm transition-all">
                  Get Started
                </Button>
                  </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="org-select" className="block text-sm font-medium text-blue-100 mb-2">
                  Select Organization
                </label>
                  <select
                    id="org-select"
                    value={selectedOrg || ''}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                  >
                    {orgIds.map(orgId => (
                      <option key={orgId} value={orgId} className="bg-slate-800 text-white">
                        {orgNames[orgId] || orgId}
                      </option>
                    ))}
                  </select>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{orgName || 'Organization'}</h2>
                      <p className="text-blue-100 text-sm">
                        Current system status
                        {lastUpdate && (
                          <span className="ml-2 text-blue-200/80">
                            • Last updated: {lastUpdate}
                          </span>
                        )}
                      </p>
                  </div>
                  <StatusBadge status={overallStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Services"
                value={metrics.totalServices}
                icon={Globe}
                color="bg-blue-500"
              />
              <MetricCard
                title="Operational Services"
                value={metrics.operationalServices}
                icon={Shield}
                color="bg-emerald-500"
              />
              <MetricCard
                title="Total Incidents"
                value={metrics.totalIncidents}
                icon={AlertCircle}
                color="bg-amber-500"
              />
              <MetricCard
                title="Average Uptime"
                value={`${metrics.avgUptime}%`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
            </div>

            {services.length > 0 && (
              <div className="mb-8">
                <IncidentsChart services={services} />
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Services</h2>
              <span className="text-sm text-slate-400">{services.length} service{services.length !== 1 ? 's' : ''} monitored</span>
            </div>

            <div className="space-y-6">
              {services.map(service => (
                <div key={service.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                      {service.link && (
                        <a href={service.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-400">
                        Uptime: <UptimeBadge uptime={service.uptime} />
                      </span>
                      <StatusBadge status={service.status} />
                    </div>
                  </div>
                  
                  <p className="text-slate-300 mb-4">{service.description}</p>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Recent Incidents
                    </h4>
                    {service.incidents.length === 0 ? (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                          <span className="text-emerald-300 font-medium">No incidents reported</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                          {getPaginatedIncidents(service).map(incident => (
                          <div key={incident.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">{incident.title}</h5>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={
                                  incident.updates && incident.updates.length > 0
                                    ? [...incident.updates]
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].status
                                    : incident.status
                                } />
                                <span className="text-xs text-slate-400">
                                  {new Date(incident.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {incident.updates && incident.updates.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <h6 className="text-sm font-medium text-slate-300">Updates:</h6>
                                {[...incident.updates]
                                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                  .map((update, idx) => (
                                  <div key={idx} className="bg-slate-600/30 rounded-md p-3 border-l-4 border-blue-500">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-white">{update.status}</span>
                                      <span className="text-xs text-slate-400">
                                        {new Date(update.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300">{update.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                          {/* Pagination controls */}
                          {getTotalIncidentPages(service) > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm text-slate-300">
                                Showing {((incidentPages[service.id] || 1) - 1) * INCIDENTS_PER_PAGE + 1} to {Math.min((incidentPages[service.id] || 1) * INCIDENTS_PER_PAGE, (service.incidents || []).length)} of {service.incidents.length} incidents
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIncidentPageChange(service.id, Math.max(1, (incidentPages[service.id] || 1) - 1))}
                                  disabled={(incidentPages[service.id] || 1) === 1}
                                >
                                  Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, getTotalIncidentPages(service)) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={(incidentPages[service.id] || 1) === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleIncidentPageChange(service.id, pageNum)}
                                        className="w-8 h-8 p-0"
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                                  {getTotalIncidentPages(service) > 5 && (
                                    <>
                                      {(incidentPages[service.id] || 1) > 3 && <span className="text-slate-400">...</span>}
                                      {(incidentPages[service.id] || 1) > 3 && (incidentPages[service.id] || 1) < getTotalIncidentPages(service) - 2 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-8 h-8 p-0"
                                          disabled
                                        >
                                          {(incidentPages[service.id] || 1)}
                                        </Button>
                                      )}
                                      {(incidentPages[service.id] || 1) < getTotalIncidentPages(service) - 2 && <span className="text-slate-400">...</span>}
                                      {(incidentPages[service.id] || 1) < getTotalIncidentPages(service) - 2 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleIncidentPageChange(service.id, getTotalIncidentPages(service))}
                                          className="w-8 h-8 p-0"
                                        >
                                          {getTotalIncidentPages(service)}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIncidentPageChange(service.id, Math.min(getTotalIncidentPages(service), (incidentPages[service.id] || 1) + 1))}
                                  disabled={(incidentPages[service.id] || 1) === getTotalIncidentPages(service)}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}