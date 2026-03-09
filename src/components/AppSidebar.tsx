import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuItemsForRole } from "@/lib/menuItems";
import { cn } from "@/lib/utils";

export const AppSidebar = memo(function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getMenuItemsForRole(user?.role);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-background flex flex-col z-40 hidden lg:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">T</span>
        </div>
        <div className="ml-3">
          <p className="font-semibold text-foreground text-sm">TextArea</p>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
            {user?.role === "admin_global" ? "Admin Global" : "Lavanderia"}
          </p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/" && item.href !== "/admin" && location.pathname.startsWith(item.href + "/"));
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user?.nome?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.funcao || user?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
});
