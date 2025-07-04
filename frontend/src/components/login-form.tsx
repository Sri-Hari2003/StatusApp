import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react"

export function LoginForm() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignedOut>
            <div className="flex flex-col gap-4">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign in with Clerk
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="text-center text-green-600">You are signed in!</div>
          </SignedIn>
        </CardContent>
      </Card>
      
    </div>
  )
}
