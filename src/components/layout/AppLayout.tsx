import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Receipt,
  Bell,
  HandCoins,
  TrendingUp,
  Moon,
  Sun,
  User,
  LogOut,
  Eye,
  EyeOff,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Button } from '@/components/ui/button';
import QuickRecordModal from '@/components/modals/QuickRecordModal';
import NewInvestmentModal from '@/components/modals/NewInvestmentModal';
import NewLoanModal from '@/components/modals/NewLoanModal';
import NewReminderModal from '@/components/modals/NewReminderModal';
import { OfflineBanner } from '@/components/OfflineBanner';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Início', mobileLabel: 'Início' },
  { path: '/transacoes', icon: Receipt, label: 'Transações', mobileLabel: 'Trans.' },
  { path: '/contas', icon: Wallet, label: 'Contas', mobileLabel: 'Contas' },
  { path: '/investimentos', icon: TrendingUp, label: 'Investimentos', mobileLabel: 'Invest.' },
  { path: '/lembretes', icon: Bell, label: 'Gastos Mensais', mobileLabel: 'Mensais' },
  { path: '/emprestimos', icon: HandCoins, label: 'Empréstimos', mobileLabel: 'Emprést.' },
];

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const location = useLocation();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Intelligent FAB - Opens correct modal based on current route
  const handleFabClick = () => {
    const path = location.pathname;
    
    if (path === '/investimentos') {
      setIsInvestmentModalOpen(true);
    } else if (path === '/emprestimos') {
      setIsLoanModalOpen(true);
    } else if (path === '/lembretes') {
      setIsReminderModalOpen(true);
    } else if (path === '/contas') {
      window.dispatchEvent(new CustomEvent('open-new-account'));
    } else {
      // Default: Dashboard (/), Transactions (/transacoes) → Transaction modal
      setIsQuickRecordOpen(true);
    }
  };

  // Get the icon name for display based on current route
  const getFabIcon = () => {
    const path = location.pathname;
    const pathMap: Record<string, { icon: typeof Plus; label: string }> = {
      '/investimentos': { icon: TrendingUp, label: 'Novo Investimento' },
      '/emprestimos': { icon: HandCoins, label: 'Novo Empréstimo' },
      '/lembretes': { icon: Bell, label: 'Novo Gasto Mensal' },
      '/contas': { icon: Wallet, label: 'Nova Conta' },
    };
    return pathMap[path] || { icon: Plus, label: 'Nova Transação' };
  };

  const getCurrentFabIcon = getFabIcon();

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <OfflineBanner />
      <div className="flex flex-1">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6 space-y-1">
          <h1 className="text-2xl font-display font-bold">
            <span className="text-foreground">Money</span><span className="text-gradient">Flow</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Fintech de Luxo
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'usuario@email.com'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={togglePrivacyMode}
            >
              {isPrivacyMode ? (
                <EyeOff className="w-4 h-4 mr-2 stroke-[1.5]" />
              ) : (
                <Eye className="w-4 h-4 mr-2 stroke-[1.5]" />
              )}
              {isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 mr-2 stroke-[1.5]" />
              ) : (
                <Moon className="w-4 h-4 mr-2 stroke-[1.5]" />
              )}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2 stroke-[1.5]" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 max-w-full flex-1 flex flex-col min-h-screen pb-20 lg:pb-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40 backdrop-blur-2xl border-b border-border/40" style={{ background: 'hsl(var(--background) / 0.65)' }}>
          <h1 className="text-lg font-display font-bold">
            <span className="text-foreground">Money</span>
            <span className="text-gradient">Flow</span>
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePrivacyMode}
              className="h-9 w-9 rounded-full hover:bg-white/5"
            >
              {isPrivacyMode ? (
                <EyeOff className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Eye className="w-5 h-5 stroke-[1.5]" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full hover:bg-white/5">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Moon className="w-5 h-5 stroke-[1.5]" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 stroke-[1.5]" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full min-w-0 max-w-full flex-1 px-4 py-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom px-3 pb-2 pt-1">
        <div className="glass-elevated rounded-3xl mx-auto max-w-md px-2">
          <div className="flex justify-around items-center h-16 px-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-2 px-2 min-w-[52px] rounded-2xl transition-all duration-300',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-1 rounded-2xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn('w-5 h-5 mb-0.5 relative z-10 transition-transform stroke-[1.5]', isActive && 'scale-110')} />
                  <span className="text-[10px] font-medium leading-tight text-center relative z-10">
                    {item.mobileLabel}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Floating Action Button - Mobile with Contextual Icon */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleFabClick}
        title={getCurrentFabIcon.label}
        className="lg:hidden fixed right-5 bottom-[96px] z-50 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow"
      >
        <getCurrentFabIcon.icon className="w-6 h-6 stroke-[1.5]" />
      </motion.button>

      {/* Desktop FAB with Contextual Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFabClick}
        title={getCurrentFabIcon.label}
        className="hidden lg:flex fixed right-8 bottom-8 z-50 w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground shadow-glow items-center justify-center"
      >
        <getCurrentFabIcon.icon className="w-6 h-6 stroke-[1.5]" />
      </motion.button>

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />

      {/* New Investment Modal */}
      <NewInvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
      />

      {/* New Loan Modal */}
      <NewLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
      />

      {/* New Reminder Modal */}
      <NewReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
      </div>
    </div>
  );
}
