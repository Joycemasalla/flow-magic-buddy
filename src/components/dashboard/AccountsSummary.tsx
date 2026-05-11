import { motion } from 'framer-motion';
import { Plus, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallet } from '@/contexts/WalletContext';
import AccountCard from '@/components/accounts/AccountCard';
import { PrivacyValue } from '@/components/ui/PrivacyValue';

export default function AccountsSummary() {
  const { accounts, balances, totalBalance } = useAccounts();
  const { activeWalletId } = useWallet();
  const navigate = useNavigate();

  const visible = accounts.filter((a) => !a.archived).slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> Minhas contas
          </h2>
          {accounts.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Total: <PrivacyValue value={totalBalance} className="font-semibold" />
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/contas')}
          className="text-xs text-primary font-semibold hover:underline shrink-0"
        >
          {accounts.length === 0 ? 'Adicionar' : 'Ver todas →'}
        </button>
      </div>

      {accounts.length === 0 ? (
        <button
          onClick={() => navigate('/contas')}
          className="w-full p-4 rounded-2xl border border-dashed border-border text-left flex items-center gap-3 hover:bg-muted/30 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Cadastrar uma conta</p>
            <p className="text-[10px] text-muted-foreground">Acompanhe quanto você tem em cada banco</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visible.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              balance={balances[a.id] ?? 0}
              showOwner={!!activeWalletId}
              onClick={() => navigate('/contas')}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
