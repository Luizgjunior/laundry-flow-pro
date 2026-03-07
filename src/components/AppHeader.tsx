import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-14 lg:h-16 px-4 lg:px-6 flex items-center justify-between">
        <div className="lg:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-bold text-foreground">TexTrace</span>
        </div>

        <div className="hidden lg:block">
          <p className="text-sm text-muted-foreground">Gestão de Lavanderia Premium</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Notificações</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <ScrollArea className="max-h-64">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">Sem notificações</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}
                      className={`w-full text-left p-3 border-b border-border hover:bg-muted transition-colors ${!n.lida ? "bg-primary/5" : ""}`}
                    >
                      <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.mensagem}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </button>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{user?.nome}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-muted active:scale-95 lg:hidden">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
