import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [showArchived, setShowArchived] = useState(false);

  const visibleAccounts = accounts.filter((a) => showArchived || !a.archived);

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
    <div className="space-y-4 pb-28 lg:pb-4 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold">Contas</h1>
          <p className="text-xs text-muted-foreground mt-1">Onde seu dinheiro está</p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-2xl bg-gradient-primary min-h-[44px]">
          <Plus className="w-4 h-4 mr-1" /> Nova conta
        </Button>
      </motion.div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="p-5 rounded-3xl bg-gradient-primary text-primary-foreground"
      >
        <p className="text-xs opacity-80 uppercase tracking-wide">Saldo total</p>
        <PrivacyValue value={totalBalance} className="text-3xl font-bold block mt-1" />
        <p className="text-xs opacity-80 mt-1">{accounts.filter((a) => !a.archived).length} conta(s) ativa(s)</p>
      </motion.div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}

      {!loading && accounts.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-border">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-3 font-semibold">Nenhuma conta cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre seus bancos, carteira e poupança para acompanhar onde seu dinheiro está.
          </p>
          <Button onClick={openNew} className="mt-4 rounded-2xl bg-gradient-primary">
            <Plus className="w-4 h-4 mr-1" /> Criar primeira conta
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {visibleAccounts.map((a) => {
          const bal = balances[a.id] ?? 0;
          return (
            <div
              key={a.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card',
                a.archived && 'opacity-60'
              )}
            >
              <AccountAvatar account={a} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{a.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {accountTypeShort[a.type]}
                  {activeWalletId && ` · ${accountOwnerLabels[a.ownerScope]}`}
                  {a.archived && ' · arquivada'}
                </p>
                <PrivacyValue
                  value={bal}
                  className={cn('font-bold text-base tabular-nums block mt-0.5', bal < 0 && 'text-expense')}
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

      {accounts.some((a) => a.archived) && (
        <button
          onClick={() => setShowArchived((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center py-2"
        >
          {showArchived ? 'Ocultar arquivadas' : `Mostrar arquivadas (${accounts.filter((a) => a.archived).length})`}
        </button>
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
