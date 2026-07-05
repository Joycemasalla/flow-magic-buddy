import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Settings2, Archive, ArchiveRestore, Wallet } from 'lucide-react';
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

export default function Accounts() {
  const { accounts, balances, totalBalance, loading, deleteAccount, updateAccount } = useAccounts();
  const { activeWalletId } = useWallet();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [adjusting, setAdjusting] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
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
          <h1 className="text-xl sm:text-2xl font-display font-bold">Contas</h1>
          <p className="text-sm text-muted-foreground truncate">Onde seu dinheiro está</p>
        </div>
        <Button onClick={openNew} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nova</span>
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
        <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
          {([
            { id: 'active' as const, label: `Ativas (${active.length})` },
            { id: 'archived' as const, label: `Arquivadas (${archived.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 h-9 rounded-xl text-sm font-medium transition-colors',
                tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
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
                  'glass-card rounded-2xl p-3.5 flex items-center gap-3',
                  a.archived && 'opacity-60'
                )}
              >
                <AccountAvatar account={a} size="lg" />
                {/* Linha 1: nome + info · Linha 2: saldo */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {accountTypeShort[a.type]}
                    {activeWalletId && ` · ${accountOwnerLabels[a.ownerScope]}`}
                  </p>
                  <PrivacyValue
                    value={bal}
                    className={cn('font-bold text-base tabular-nums block mt-1', bal < 0 && 'text-expense')}
                  />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => setAdjusting(a)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Ajustar saldo"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateAccount(a.id, { archived: !a.archived })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={a.archived ? 'Desarquivar' : 'Arquivar'}
                  >
                    {a.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleting(a)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
