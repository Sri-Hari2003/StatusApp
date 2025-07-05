import { useSignIn } from "@clerk/clerk-react";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  const { signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !setActive) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      
      if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/dashboard";
      } else {
        console.log("Awaiting further steps (2FA, email verify, etc.)");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      
      // More specific error handling
      if (err.errors?.[0]?.code === "form_identifier_not_found") {
        setError("No account found with this email address");
      } else if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Incorrect password");
      } else if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("Account already exists");
      } else {
        setError("Sign-in failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!signIn) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!signIn) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_apple",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("Apple sign-in error:", err);
      setError("Apple sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          
          <LoginForm
            onSubmit={handleLogin}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
            error={error}
            isLoading={isLoading}
            onClearError={clearError}
          />
        </div>
      </div>
    </div>
  );
}