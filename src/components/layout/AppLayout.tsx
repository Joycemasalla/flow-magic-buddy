import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  MoreHorizontal,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import QuickRecordModal from '@/components/modals/QuickRecordModal';
import { OfflineBanner } from '@/components/OfflineBanner';

const desktopNav = [
  { path: '/', icon: LayoutDashboard, label: 'Início' },
  { path: '/transacoes', icon: Receipt, label: 'Transações' },
  { path: '/contas', icon: Wallet, label: 'Contas' },
  { path: '/investimentos', icon: TrendingUp, label: 'Investimentos' },
  { path: '/lembretes', icon: Bell, label: 'Gastos mensais' },
  { path: '/emprestimos', icon: HandCoins, label: 'Empréstimos' },
];

const moreItems = [
  { path: '/investimentos', icon: TrendingUp, label: 'Investimentos' },
  { path: '/lembretes', icon: Bell, label: 'Gastos mensais' },
  { path: '/emprestimos', icon: HandCoins, label: 'Empréstimos' },
];

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  const isMoreActive = moreItems.some((i) => location.pathname.startsWith(i.path));
  const hideAdd = location.pathname.startsWith('/transacoes/');

  const PrivacyButton = ({ className }: { className?: string }) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePrivacyMode}
      aria-label={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
      className={cn('h-11 w-11 rounded-xl', className)}
    >
      {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </Button>
  );

  const tabClass = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active ? 'text-primary' : 'text-muted-foreground'
    );

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
      <OfflineBanner />
      <div className="flex flex-1 min-w-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
          <div className="p-6">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Money<span className="text-primary">Flow</span>
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {desktopNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 h-11 rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary-soft text-primary font-bold'
                      : 'text-foreground-secondary font-semibold hover:bg-muted'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-1">
            <div className="flex items-center gap-3 mb-2 p-3 rounded-xl bg-muted">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start h-11" onClick={togglePrivacyMode}>
              {isPrivacyMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
            </Button>
            <Button variant="ghost" className="w-full justify-start h-11" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-destructive hover:text-destructive"
              onClick={() => setConfirmLogout(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <Button className="w-full h-11 mt-2" onClick={() => setIsQuickRecordOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nova transação
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 max-w-full flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-40 bg-background/95 border-b border-border">
            <h1 className="text-lg font-extrabold tracking-tight">
              Money<span className="text-primary">Flow</span>
            </h1>
            <PrivacyButton />
          </header>

          {/* Page Content — bottom padding = nav height + 24px */}
          <div className="w-full min-w-0 max-w-full flex-1 px-4 pt-4 pb-[calc(88px+env(safe-area-inset-bottom))] lg:p-8 overflow-x-hidden">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation — 5 itens */}
        <nav
          aria-label="Navegação principal"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-bottom"
        >
          <div className="flex items-end h-16 px-2 max-w-md mx-auto">
            <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
              <LayoutDashboard className="w-[22px] h-[22px]" />
              <span className="text-[11px] font-semibold">Início</span>
            </NavLink>
            <NavLink to="/transacoes" end className={({ isActive }) => tabClass(isActive)}>
              <Receipt className="w-[22px] h-[22px]" />
              <span className="text-[11px] font-semibold">Transações</span>
            </NavLink>
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => !hideAdd && setIsQuickRecordOpen(true)}
                disabled={hideAdd}
                aria-label="Nova transação"
                className="w-12 h-12 -translate-y-[18px] rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <NavLink to="/contas" className={({ isActive }) => tabClass(isActive)}>
              <Wallet className="w-[22px] h-[22px]" />
              <span className="text-[11px] font-semibold">Contas</span>
            </NavLink>
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={tabClass(isMoreActive || isMoreOpen)}
              aria-label="Mais opções"
            >
              <MoreHorizontal className="w-[22px] h-[22px]" />
              <span className="text-[11px] font-semibold">Mais</span>
            </button>
          </div>
        </nav>

        {/* "Mais" sheet */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetContent side="bottom" className="z-[60] rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]">
            <SheetHeader className="px-5 pt-5 pb-2 text-left">
              <SheetTitle className="text-lg font-extrabold">Mais</SheetTitle>
            </SheetHeader>
            <ul className="px-2 pb-4">
              {moreItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-muted text-left"
                  >
                    <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground-secondary" />
                    </span>
                    <span className="flex-1 text-sm font-semibold">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
              <li className="my-2 mx-3 border-t border-border" />
              <li className="px-3 pt-1 pb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Configurações
              </li>
              <li>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-muted text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </span>
                  <span className="flex-1 text-sm font-semibold">Tema</span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {theme === 'dark' ? 'Escuro' : 'Claro'}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-muted text-left text-destructive"
                >
                  <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-sm font-semibold">Sair</span>
                </button>
              </li>
            </ul>
          </SheetContent>
        </Sheet>

        <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
          <AlertDialogContent className="z-[70]">
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
              <AlertDialogDescription>Você precisará entrar novamente para ver suas finanças.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={signOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <QuickRecordModal isOpen={isQuickRecordOpen} onClose={() => setIsQuickRecordOpen(false)} />
      </div>
    </div>
  );
}
