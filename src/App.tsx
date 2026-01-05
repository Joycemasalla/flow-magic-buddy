import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";
import Investments from "@/pages/Investments";
import Reminders from "@/pages/Reminders";
import Loans from "@/pages/Loans";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TransactionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transacoes" element={<Transactions />} />
                <Route path="/transacoes/nova" element={<TransactionForm />} />
                <Route path="/transacoes/editar/:id" element={<TransactionForm />} />
                <Route path="/investimentos" element={<Investments />} />
                <Route path="/lembretes" element={<Reminders />} />
                <Route path="/emprestimos" element={<Loans />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TransactionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;