import { useState, useEffect, useMemo } from 'react';
import { MoreHorizontal, Plus, Pencil, Trash2, Settings2, Archive, ArchiveRestore, Wallet } from 'lucide-react';
import { useAccounts } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AccountFormSheet from '@/components/accounts/AccountFormSheet';
import AdjustBalanceSheet from '@/components/accounts/AdjustBalanceSheet';
import AccountAvatar from '@/components/accounts/AccountAvatar';
import { Account, accountOwnerLabels, accountTypeShort } from '@/types/account';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

export default function Accounts() {
  const { accounts, balances, totalBalance, loading, deleteAccount, updateAccount } = useAccounts();
  const { activeWalletId } = useWallet();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [adjusting, setAdjusting] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [menuFor, setMenuFor] = useState<Account | null>(null);
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const { active, archived, activeTotal } = useMemo(() => {
    const active = accounts.filter((a) => !a.archived);
    const archived = accounts.filter((a) => a.archived);
    const activeTotal = active.reduce((s, a) => s + (balances[a.id] ?? 0), 0);
    return { active, archived, activeTotal };
  }, [accounts, balances]);

  const list = tab === 'active' ? active : archived;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setFormOpen(true);
  };

  useEffect(() => {
    const handler = () => openNew();
    window.addEventListener('open-new-account', handler);
    return () => window.removeEventListener('open-new-account', handler);
  }, []);

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-28 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-[26px] font-extrabold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground truncate">Onde seu dinheiro está</p>
        </div>
        <Button onClick={openNew} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Nova conta</span>
        </Button>
      </div>

      {/* Resumo — 2 métricas */}
      {accounts.length > 0 && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Saldo total</p>
            <PrivacyValue
              value={activeTotal}
              className={cn('text-lg sm:text-xl font-bold font-display truncate block', activeTotal < 0 && 'text-expense')}
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">{active.length} ativa(s)</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Arquivadas</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-muted-foreground">
              {archived.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">contas</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {accounts.length > 0 && (
        <div className="segmented">
          {([
            { id: 'active' as const, label: `Ativas (${active.length})` },
            { id: 'archived' as const, label: `Arquivadas (${archived.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'segmented-item',
                tab === t.id ? 'segmented-item-active' : ''
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nenhuma conta cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cadastre seus bancos e carteiras para acompanhar onde seu dinheiro está.
          </p>
          <Button onClick={openNew} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira conta
          </Button>
        </div>
      ) : list.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === 'active' ? 'Nenhuma conta ativa.' : 'Nenhuma conta arquivada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => {
            const bal = balances[a.id] ?? 0;
            return (
              <div
                key={a.id}
                className={cn(
                  'bg-card border border-border rounded-2xl p-4 flex items-start gap-3',
                  a.archived && 'opacity-60'
                )}
              >
                <AccountAvatar account={a} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {accountTypeShort[a.type]}
                    {activeWalletId && ` · ${accountOwnerLabels[a.ownerScope]}`}
                  </p>
                  <PrivacyValue
                    value={bal}
                    className={cn('text-xl font-extrabold tabular-nums block mt-2', bal < 0 && 'text-expense')}
                  />
                </div>
                <button
                  onClick={() => setMenuFor(a)}
                  aria-label="Mais ações"
                  className="w-11 h-11 -mr-1 -mt-1 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          {tab === 'active' && (
            <button
              onClick={openNew}
              className="w-full rounded-2xl border border-dashed border-border p-4 flex items-center gap-3 text-left hover:bg-muted"
            >
              <span className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">Adicionar outra conta</span>
                <span className="block text-[13px] text-muted-foreground">Bancos, carteiras e cartões</span>
              </span>
            </button>
          )}
        </div>
      )}

      <Sheet open={!!menuFor} onOpenChange={(o) => !o && setMenuFor(null)}>
        <SheetContent side="bottom" className="z-[60] rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="px-5 pt-5 pb-2 text-left">
            <SheetTitle className="text-lg font-extrabold truncate">{menuFor?.name}</SheetTitle>
          </SheetHeader>
          {menuFor && (
            <ul className="px-2 pb-4">
              {[
                { label: 'Editar', icon: Pencil, run: () => openEdit(menuFor) },
                { label: 'Ajustar saldo', icon: Settings2, run: () => setAdjusting(menuFor) },
                {
                  label: menuFor.archived ? 'Desarquivar' : 'Arquivar',
                  icon: menuFor.archived ? ArchiveRestore : Archive,
                  run: () => updateAccount(menuFor.id, { archived: !menuFor.archived }),
                },
              ].map((it) => (
                <li key={it.label}>
                  <button
                    onClick={() => { const m = it.run; setMenuFor(null); m(); }}
                    className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-muted text-left text-sm font-semibold"
                  >
                    <it.icon className="w-5 h-5 text-foreground-secondary" /> {it.label}
                  </button>
                </li>
              ))}
              <li className="my-2 mx-3 border-t border-border" />
              <li>
                <button
                  onClick={() => { const m = menuFor; setMenuFor(null); setDeleting(m); }}
                  className="w-full flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-muted text-left text-sm font-semibold text-destructive"
                >
                  <Trash2 className="w-5 h-5" /> Excluir
                </button>
              </li>
            </ul>
          )}
        </SheetContent>
      </Sheet>

      <AccountFormSheet open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <AdjustBalanceSheet open={!!adjusting} onClose={() => setAdjusting(null)} account={adjusting} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              As transações vinculadas continuam no extrato, mas perderão a referência a esta conta. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) await deleteAccount(deleting.id);
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
