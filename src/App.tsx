import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Pecas from "./pages/Pecas";
import NovaPeca from "./pages/NovaPeca";
import PecaDetail from "./pages/PecaDetail";
import Triagem from "./pages/Triagem";
import PlanoTecnico from "./pages/PlanoTecnico";
import Producao from "./pages/Producao";
import Inspecao from "./pages/Inspecao";
import Entrega from "./pages/Entrega";
import Scanner from "./pages/Scanner";
import Clientes from "./pages/Clientes";
import NovoCliente from "./pages/NovoCliente";
import Upgrade from "./pages/Upgrade";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminTenantDetail from "./pages/admin/AdminTenantDetail";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import ConfigMaquinas from "./pages/config/ConfigMaquinas";
import ConfigProdutos from "./pages/config/ConfigProdutos";
import Aprovar from "./pages/Aprovar";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== "admin_global") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/aprovar/:token" element={<Aprovar />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pecas" element={<Pecas />} />
              <Route path="/pecas/nova" element={<NovaPeca />} />
              <Route path="/pecas/:id" element={<PecaDetail />} />
              <Route path="/pecas/:id/triagem" element={<Triagem />} />
              <Route path="/pecas/:id/plano" element={<PlanoTecnico />} />
              <Route path="/pecas/:id/producao" element={<Producao />} />
              <Route path="/pecas/:id/inspecao" element={<Inspecao />} />
              <Route path="/pecas/:id/entrega" element={<Entrega />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/novo" element={<NovoCliente />} />
              {/* Config */}
              <Route path="/config/maquinas" element={<ConfigMaquinas />} />
              <Route path="/config/produtos" element={<ConfigProdutos />} />
              <Route path="/upgrade" element={<Upgrade />} />
              {/* Admin Global */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} />
              <Route path="/admin/tenants/:id" element={<AdminRoute><AdminTenantDetail /></AdminRoute>} />
              <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
