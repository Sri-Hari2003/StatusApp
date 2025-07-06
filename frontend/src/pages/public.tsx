import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Zap, TrendingUp, Activity, Shield, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import { Button as ShadButton } from '../components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

const Button = ({ onClick, className, children }: { onClick: () => void; className: string; children: React.ReactNode }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}`}>
    {children}
  </button>
);

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
    incidents: service.incidents.length,
    status: service.status.toLowerCase()
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
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

export default function PublicStatusPage() {
  const [data, setData] = useState<OrgsServices>({});
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgNames, setOrgNames] = useState<{ [orgId: string]: string }>({});

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/public/orgs_services`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(json => {
        setData(json);
        const orgIds = Object.keys(json);
        if (orgIds.length > 0) setSelectedOrg(orgIds[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Could not load data.');
        setLoading(false);
      });
  }, []);

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

  const handleGetStarted = () => {
    window.location.href = '/';
  };

  const getMetrics = (services: Service[]) => {
    const totalServices = services.length;
    const operationalServices = services.filter(s => 
      s.status.toLowerCase().includes('operational') || s.status.toLowerCase().includes('active')
    ).length;
    const totalIncidents = services.reduce((sum, service) => sum + service.incidents.length, 0);
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
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
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
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
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
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                Get Started
              </Button>
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

  const orgOptions = orgIds.map(orgId => ({ id: orgId, name: orgNames[orgId] || orgId }));
  const services = selectedOrg ? data[selectedOrg] : [];
  const overallStatus = getOverallStatus(services);
  const metrics = getMetrics(services);

  return (
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
                <Button onClick={handleGetStarted} className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-3 rounded-lg font-medium backdrop-blur-sm transition-all">
                  Get Started
                </Button>
              </div>
              
              <div className="mb-6">
                <label htmlFor="org-select" className="block text-sm font-medium text-blue-100 mb-2">
                  Select Organization
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ShadButton variant="outline" className="min-w-[200px] flex justify-between items-center">
                      {orgName || 'Select organization'}
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </ShadButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {orgOptions.map(org => (
                      <DropdownMenuItem
                        key={org.id}
                        onSelect={() => setSelectedOrg(org.id)}
                        className={
                          (selectedOrg === org.id ? 'bg-blue-500/10 text-blue-400' : '') +
                          ' cursor-pointer'
                        }
                      >
                        {org.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{orgName || 'Organization'}</h2>
                    <p className="text-blue-100 text-sm">Current system status</p>
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
                        {[...service.incidents]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map(incident => (
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
  );
}