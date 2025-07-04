import { useSignIn } from "@clerk/clerk-react";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  const { signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !setActive) return;
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
      console.error(err);
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = () => {
    if (!signIn) return;
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/dashboard",
      redirectUrlComplete: "/dashboard",
    });
  };

  const handleAppleLogin = () => {
    if (!signIn) return;
    signIn.authenticateWithRedirect({
      strategy: "oauth_apple",
      redirectUrl: "/dashboard",
      redirectUrlComplete: "/dashboard",
    });
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
      error={error}
    />
  );
} 