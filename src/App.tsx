import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy loaded pages
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pecas = lazy(() => import("./pages/Pecas"));
const NovaPeca = lazy(() => import("./pages/NovaPeca"));
const PecaDetail = lazy(() => import("./pages/PecaDetail"));
const Triagem = lazy(() => import("./pages/Triagem"));
const PlanoTecnico = lazy(() => import("./pages/PlanoTecnico"));
const Producao = lazy(() => import("./pages/Producao"));
const Inspecao = lazy(() => import("./pages/Inspecao"));
const Entrega = lazy(() => import("./pages/Entrega"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Clientes = lazy(() => import("./pages/Clientes"));
const NovoCliente = lazy(() => import("./pages/NovoCliente"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTenants = lazy(() => import("./pages/admin/AdminTenants"));
const AdminTenantDetail = lazy(() => import("./pages/admin/AdminTenantDetail"));
const AdminFinanceiro = lazy(() => import("./pages/admin/AdminFinanceiro"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));
const ConfigMaquinas = lazy(() => import("./pages/config/ConfigMaquinas"));
const ConfigProdutos = lazy(() => import("./pages/config/ConfigProdutos"));
const ConfigEquipe = lazy(() => import("./pages/config/ConfigEquipe"));
const Aprovar = lazy(() => import("./pages/Aprovar"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/aprovar/:token" element={<Aprovar />} />
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
                  <Route path="/config/maquinas" element={<ConfigMaquinas />} />
                  <Route path="/config/produtos" element={<ConfigProdutos />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  {/* Admin Global */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} />
                  <Route path="/admin/tenants/:id" element={<AdminRoute><AdminTenantDetail /></AdminRoute>} />
                  <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
                  <Route path="/admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <InstallPrompt />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
