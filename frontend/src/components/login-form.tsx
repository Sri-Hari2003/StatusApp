import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react"
import { Activity, Shield, LogIn, CheckCircle, Monitor, BarChart3, Clock } from "lucide-react"
import { useState } from "react"

export function LoginForm() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating status indicators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-emerald-400 rounded-full animate-pulse delay-1500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/5 border-gray-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                StatusMonitor
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Access your service monitoring dashboard
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <SignedOut>
              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Monitor className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-xs text-gray-400">Service Monitoring</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xs text-gray-400">Analytics</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xs text-gray-400">Incident Timeline</div>
                </div>
              </div>

              <div className="space-y-4">
                <SignInButton mode="modal">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden"
                    onMouseEnter={() => setHoveredButton('signin')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <LogIn className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:translate-x-1" />
                    Sign In to Dashboard
                  </Button>
                </SignInButton>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center space-x-2 mt-6 text-gray-500 text-sm">
                <Shield className="w-4 h-4" />
                <span>Secured with enterprise-grade authentication</span>
              </div>
            </SignedOut>
            
            <SignedIn>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-semibold text-green-400">
                    Authentication Successful
                  </div>
                  <div className="text-gray-400">
                    Redirecting to your monitoring dashboard...
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </SignedIn>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}