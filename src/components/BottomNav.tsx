import { Home, Layers, Plus, Users, Settings, Building2, QrCode } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminGlobal, isAdminEmpresa } = usePermissions();

  const adminGlobalItems = [
    { path: "/admin", icon: Home, label: "Dashboard" },
    { path: "/admin/tenants", icon: Building2, label: "Tenants" },
    { path: "/config", icon: Settings, label: "Config" },
  ];

  const tenantItems = [
    { path: "/dashboard", icon: Home, label: "Início" },
    { path: "/pecas", icon: Layers, label: "Peças" },
    { path: "/pecas/nova", icon: Plus, label: "Nova", isAction: true },
    { path: "/clientes", icon: Users, label: "Clientes" },
    ...(isAdminEmpresa ? [{ path: "/config", icon: Settings, label: "Config" }] : [{ path: "/scanner", icon: QrCode, label: "QR" }]),
  ];

  const items = isAdminGlobal ? adminGlobalItems : tenantItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
          const Icon = item.icon;

          if ("isAction" in item && item.isAction) {
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
