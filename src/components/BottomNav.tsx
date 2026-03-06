import { Home, Layers, Plus, Users, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Início" },
  { path: "/pecas", icon: Layers, label: "Peças" },
  { path: "/pecas/nova", icon: Plus, label: "Nova", isAction: true },
  { path: "/clientes", icon: Users, label: "Clientes" },
  { path: "/config", icon: Settings, label: "Config", adminOnly: true },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin_global" || user?.role === "admin_empresa";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const active = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
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
