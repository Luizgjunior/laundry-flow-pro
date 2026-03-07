import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AppNotification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  created_at: string;
  user_id?: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetched = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(20);
    const items = (data as unknown as AppNotification[]) || [];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.lida).length);
    fetched.current = true;
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    // Only fetch unread count initially for speed; full list loads lazily
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notificacoes")
        .select("*", { count: "exact", head: true })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("lida", false);
      setUnreadCount(count || 0);
    };
    fetchCount();

    const channel = supabase
      .channel("notifications-" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notificacoes",
      }, (payload) => {
        const n = payload.new as AppNotification;
        if (!n.user_id || n.user_id === user.id) {
          if (fetched.current) {
            setNotifications((prev) => [n, ...prev].slice(0, 20));
          }
          setUnreadCount((c) => c + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Lazy load full list when popover opens
  const ensureLoaded = useCallback(() => {
    if (!fetched.current) fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from("notificacoes").update({ lida: true }).eq("lida", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);
  }, [user]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, ensureLoaded };
}
