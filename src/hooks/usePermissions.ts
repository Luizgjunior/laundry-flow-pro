import { useAuth } from "@/contexts/AuthContext";

type AccessArea = "admin_routes" | "tenant_config" | "team_management" | "pieces" | "clients";

export function usePermissions() {
  const { user } = useAuth();

  const isAdminGlobal = user?.role === "admin_global";
  const isAdminEmpresa = user?.role === "admin_empresa";
  const isUsuario = user?.role === "usuario";

  const canAccess = (area: AccessArea): boolean => {
    switch (area) {
      case "admin_routes":
        return isAdminGlobal;
      case "tenant_config":
      case "team_management":
        return isAdminGlobal || isAdminEmpresa;
      case "pieces":
      case "clients":
        return !isAdminGlobal; // admin_global uses /admin routes
      default:
        return false;
    }
  };

  return { canAccess, isAdminGlobal, isAdminEmpresa, isUsuario, user };
}
