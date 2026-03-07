import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuItemsForRole } from "@/lib/menuItems";
import { cn } from "@/lib/utils";

export const BottomNav = memo(function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const items = getMenuItemsForRole(user?.role).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/" && item.href !== "/admin" && location.pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button key={item.href} onClick={() => navigate(item.href)}
                className="flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button key={item.href} onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
