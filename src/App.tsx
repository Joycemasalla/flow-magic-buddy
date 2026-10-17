import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";

// Route-level code-splitting — lighter navigation on mobile
const Transactions = lazy(() => import("@/pages/Transactions"));
const TransactionForm = lazy(() => import("@/pages/TransactionForm"));
const Investments = lazy(() => import("@/pages/Investments"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Loans = lazy(() => import("@/pages/Loans"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const JoinWallet = lazy(() => import("@/pages/JoinWallet"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />
        <Route
          path="/convite/:token"
          element={
            <ProtectedRoute>
              <JoinWallet />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transactions />} />
          <Route path="/transacoes/nova" element={<TransactionForm />} />
          <Route path="/transacoes/editar/:id" element={<TransactionForm />} />
          <Route path="/investimentos" element={<Investments />} />
          <Route path="/lembretes" element={<Reminders />} />
          <Route path="/emprestimos" element={<Loans />} />
          <Route path="/contas" element={<Accounts />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <WalletProvider>
            <TransactionProvider>
              <AccountProvider>
                <PrivacyProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                  </TooltipProvider>
                </PrivacyProvider>
              </AccountProvider>
            </TransactionProvider>
          </WalletProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
