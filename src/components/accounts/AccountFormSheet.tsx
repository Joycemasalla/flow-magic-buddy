import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { X, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Account,
  AccountType,
  AccountOwnerScope,
  accountTypeLabels,
  accountOwnerLabels,
  accountPresets,
  accountColorPalette,
  accountIconOptions,
} from '@/types/account';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Account | null;
}

export default function AccountFormSheet({ open, onClose, editing }: Props) {
  const { addAccount, updateAccount } = useAccounts();
  const { activeWalletId } = useWallet();
  const isWallet = !!activeWalletId;

  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<AccountType>(editing?.type ?? 'corrente');
  const [icon, setIcon] = useState(editing?.icon ?? 'Wallet');
  const [color, setColor] = useState(editing?.color ?? '#8B5CF6');
  const [initialBalance, setInitialBalance] = useState(
    editing ? String(editing.initialBalance).replace('.', ',') : ''
  );
  const [ownerScope, setOwnerScope] = useState<AccountOwnerScope>(editing?.ownerScope ?? (isWallet ? 'joint' : 'mine'));
  const [saving, setSaving] = useState(false);

  // reset on open
  useState(() => {
    if (open) {
      setName(editing?.name ?? '');
      setType(editing?.type ?? 'corrente');
      setIcon(editing?.icon ?? 'Wallet');
      setColor(editing?.color ?? '#8B5CF6');
      setInitialBalance(editing ? String(editing.initialBalance).replace('.', ',') : '');
      setOwnerScope(editing?.ownerScope ?? (isWallet ? 'joint' : 'mine'));
    }
  });

  const handlePreset = (p: typeof accountPresets[0]) => {
    setName(p.name);
    setColor(p.color);
    setIcon(p.icon);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const parsed = parseFloat(initialBalance.replace(',', '.')) || 0;
    setSaving(true);
    if (editing) {
      await updateAccount(editing.id, {
        name: name.trim(), type, icon, color,
        initialBalance: parsed, ownerScope, archived: editing.archived,
      });
    } else {
      await addAccount({
        name: name.trim(), type, icon, color,
        initialBalance: parsed, ownerScope, archived: false,
      });
    }
    setSaving(false);
    onClose();
  };

  const Icon = (LucideIcons as any)[icon] || LucideIcons.Wallet;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl z-[60] max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Editar conta' : 'Nova conta'}</SheetTitle>
          <SheetDescription>
            Cadastre onde seu dinheiro fica. Saldo é calculado a partir das transações vinculadas e pode ser ajustado.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + '22', color }}
            >
              <Icon className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{name || 'Nome da conta'}</p>
              <p className="text-xs text-muted-foreground">{accountTypeLabels[type]}</p>
            </div>
          </div>

          {/* Presets */}
          {!editing && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sugestões</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {accountPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className="shrink-0 px-3 py-2 rounded-full text-xs font-medium border whitespace-nowrap"
                    style={{ borderColor: p.color + '55', color: p.color, background: p.color + '11' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Carteira..." />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(accountTypeLabels) as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'p-2 rounded-xl text-xs font-medium border-2 transition-all',
                    type === t ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/40'
                  )}
                >
                  {accountTypeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Initial balance */}
          <div className="space-y-2">
            <Label>{editing ? 'Saldo inicial (não recalcula extrato)' : 'Saldo atual'}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Owner scope (only in shared wallet) */}
          {isWallet && (
            <div className="space-y-2">
              <Label>Quem é dono(a) dessa conta?</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(accountOwnerLabels) as AccountOwnerScope[]).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOwnerScope(o)}
                    className={cn(
                      'p-2 rounded-xl text-xs font-medium border-2 transition-all',
                      ownerScope === o ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/40'
                    )}
                  >
                    {accountOwnerLabels[o]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {accountColorPalette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {accountIconOptions.map((iconName) => {
                const I = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      'aspect-square rounded-xl flex items-center justify-center border-2 transition-all',
                      icon === iconName ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/40'
                    )}
                  >
                    <I className="w-5 h-5 stroke-[1.5]" />
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="w-full h-12 rounded-2xl bg-gradient-primary"
          >
            <Check className="w-4 h-4 mr-2" />
            {editing ? 'Salvar alterações' : 'Criar conta'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
