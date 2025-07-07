import { useUser, useOrganizationList } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  Building2, 
  Users, 
  CheckCircle, 
  Loader2, 
  Monitor, 
  BarChart3,
  ArrowRight,
  Zap
} from "lucide-react";

export default function OnboardingPage() {
  const { isLoaded, user } = useUser();
  const { userMemberships, setActive, createOrganization } = useOrganizationList();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgCreated, setOrgCreated] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const steps = [
    { id: 1, title: "Welcome", description: "Setting up your account" },
    { id: 2, title: "Organization", description: "Creating your workspace" },
    { id: 3, title: "Complete", description: "Ready to monitor" }
  ];

  useEffect(() => {
    if (!isLoaded) return;

    const handleOrganizationSetup = async () => {
      // Check if user already belongs to any org
      if (userMemberships && userMemberships.data && userMemberships.data.length > 0) {
        const activeOrg = userMemberships.data.find((org: any) => org.membership?.isActive);
        if (activeOrg && setActive) {
          await setActive({ organization: activeOrg.organization.id });
          setCurrentStep(2);
          setTimeout(() => navigate("/dashboard"), 2000);
          return;
        }
      }

      // Move to organization creation step
      setCurrentStep(1);
    };

    handleOrganizationSetup();
  }, [isLoaded, userMemberships, user, navigate, setActive]);

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || isCreatingOrg || hasSubmitted || !createOrganization || !setActive) return;
    
    setHasSubmitted(true);
    setIsCreatingOrg(true);
    
    try {
      const org = await createOrganization({ name: orgName.trim() });
      await setActive({ organization: org.id });
      setOrgCreated(true);
      setIsCreatingOrg(false);
      setCurrentStep(2);
      
      // Redirect to dashboard after success
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (error) {
      console.error("Error creating organization:", error);
      setIsCreatingOrg(false);
      setHasSubmitted(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">StatusMonitor</h1>
          </div>
          <p className="text-gray-400 text-lg">Welcome! Let's set up your monitoring workspace.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-blue-400' : 'text-gray-600'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    index <= currentStep 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-600 text-gray-600'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-600 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Current Step */}
          <div className="space-y-6">
            {currentStep === 0 && (
              <Card className="bg-white/5 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">Welcome aboard!</CardTitle>
                  <CardDescription className="text-gray-400">
                    We're setting up your monitoring workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-gray-300">Preparing your account...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card className="bg-white/5 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">Create Your Organization</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set up your monitoring workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isCreatingOrg ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-gray-300">Creating organization...</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        This will only take a moment
                      </div>
                    </div>
                  ) : orgCreated ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Organization created successfully!</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        You've been assigned as the administrator
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Name
                        </label>
                        <Input
                          id="orgName"
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Enter your organization name"
                          className="w-full bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          disabled={isCreatingOrg}
                        />
                      </div>
                      <Button
                        onClick={handleCreateOrganization}
                        disabled={!orgName.trim() || isCreatingOrg}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-all duration-300"
                      >
                        {isCreatingOrg ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          'Create Organization'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-white/5 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <CardTitle className="text-xl text-white">All Set!</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your monitoring workspace is ready
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-green-400 font-medium">
                    🎉 Welcome to StatusMonitor!
                  </div>
                  <div className="text-gray-300 text-sm">
                    Redirecting you to your dashboard...
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Features Preview */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>What you'll get</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Role-based Access</div>
                    <div className="text-sm text-gray-400">Admins can add, update, or delete data; members have view-only access.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Organization Switching</div>
                    <div className="text-sm text-gray-400">Switch between or add new organizations easily.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Charts & Analytics</div>
                    <div className="text-sm text-gray-400">Visualize incident trends and service status over time.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Public Status Page</div>
                    <div className="text-sm text-gray-400">Share real-time status with external users via a public route.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Mobile Friendly</div>
                    <div className="text-sm text-gray-400">Fully responsive UI for phones and tablets.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-lime-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-lime-400" />
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Multi-Tenant Architecture</div>
                    <div className="text-sm text-gray-400">Strict data isolation and role enforcement for each organization.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Bottom Actions */}
        {currentStep === 2 && (
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 