import { useOrganization } from "@clerk/clerk-react";

type Props = {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const OrgRoleBasedAccess = ({ allowedRoles, fallback = null, children }: Props) => {
    const { isLoaded, membership } = useOrganization();
  
    if (!isLoaded) return null;
  
    const rawRole = membership?.role; // "org:admin"
    const normalizedRole = rawRole?.replace("org:", "").trim(); // "admin"
  
    const cleanedAllowedRoles = allowedRoles.map((r) => r.trim());
  
  
    if (!normalizedRole || !cleanedAllowedRoles.includes(normalizedRole)) {
      console.warn("Access denied: role", normalizedRole);
      return fallback;
    }
  
    return <>{children}</>;
  };
  
