import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Receipt,
  Bell,
  HandCoins,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import QuickRecordModal from '@/components/modals/QuickRecordModal';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Início' },
  { path: '/transacoes', icon: Receipt, label: 'Transações' },
  { path: '/lembretes', icon: Bell, label: 'Lembretes' },
  { path: '/emprestimos', icon: HandCoins, label: 'Empréstimos' },
];

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold text-gradient">
            MoneyFlow
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerenciamento Financeiro
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Usuário</p>
              <p className="text-xs text-muted-foreground truncate">
                usuario@email.com
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pb-24 lg:pb-0">
        {/* Mobile Header - Simplified */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-40 border-b border-border/50">
          <h1 className="text-lg font-display font-bold text-gradient">
            MoneyFlow
          </h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 py-4 lg:p-8 overflow-auto">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation - Optimized */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-lg border-t border-border z-40 safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.slice(0, 2).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center h-full px-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className={cn('w-6 h-6', isActive && 'scale-110')} />
                  <span className="text-[11px] font-medium mt-1">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Center FAB Area - Placeholder for spacing */}
            <div className="w-16" />

            {navItems.slice(2).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center h-full px-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className={cn('w-6 h-6', isActive && 'scale-110')} />
                  <span className="text-[11px] font-medium mt-1">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </main>

      {/* Floating Action Button - Centered in nav */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsQuickRecordOpen(true)}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center border-4 border-background"
        style={{ boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)' }}
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </motion.button>

      {/* Desktop FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsQuickRecordOpen(true)}
        className="hidden lg:flex fixed right-8 bottom-8 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg items-center justify-center animate-pulse-glow"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />
    </div>
  );
}
