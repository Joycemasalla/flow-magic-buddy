import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Check, Image as ImageIcon, Shapes } from 'lucide-react';
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
  bankLogo,
} from '@/types/account';
import { isBankSlug } from '@/lib/bankLogos';
import AccountAvatar from '@/components/accounts/AccountAvatar';
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

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('corrente');
  const [icon, setIcon] = useState('Wallet');
  const [color, setColor] = useState('#8B5CF6');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<'logo' | 'icon'>('icon');
  const [initialBalance, setInitialBalance] = useState('');
  const [ownerScope, setOwnerScope] = useState<AccountOwnerScope>('mine');
  const [saving, setSaving] = useState(false);

  // Reset whenever the sheet opens / target changes
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setType(editing?.type ?? 'corrente');
    setIcon(editing?.icon ?? 'Wallet');
    setColor(editing?.color ?? '#8B5CF6');
    setLogoUrl(editing?.logoUrl ?? null);
    setVisualMode(editing?.logoUrl ? 'logo' : 'icon');
    setInitialBalance(editing ? String(editing.initialBalance).replace('.', ',') : '');
    setOwnerScope(editing?.ownerScope ?? (isWallet ? 'joint' : 'mine'));
  }, [open, editing, isWallet]);

  const handlePreset = (p: typeof accountPresets[0]) => {
    setName(p.name);
    setColor(p.color);
    setIcon(p.icon);
    if (p.bankSlug) {
      setLogoUrl(bankLogo(p.bankSlug));
      setVisualMode('logo');
    } else {
      setLogoUrl(null);
      setVisualMode('icon');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const parsed = parseBRL(initialBalance) || 0;
    const finalLogo = visualMode === 'logo' ? logoUrl : null;
    setSaving(true);
    if (editing) {
      await updateAccount(editing.id, {
        name: name.trim(), type, icon, color, logoUrl: finalLogo,
        initialBalance: parsed, ownerScope, archived: editing.archived,
      });
    } else {
      await addAccount({
        name: name.trim(), type, icon, color, logoUrl: finalLogo,
        initialBalance: parsed, ownerScope, archived: false,
      });
    }
    setSaving(false);
    onClose();
  };

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
            <AccountAvatar
              account={{
                icon, color, name: name || 'Conta',
                logoUrl: visualMode === 'logo' ? logoUrl : null,
              }}
              size="lg"
            />
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

          {/* Owner scope */}
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

          {/* Visual mode toggle */}
          <div className="space-y-2">
            <Label>Aparência</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisualMode('logo')}
                className={cn(
                  'p-3 rounded-xl text-xs font-medium border-2 transition-all flex items-center justify-center gap-2',
                  visualMode === 'logo' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/40'
                )}
              >
                <ImageIcon className="w-4 h-4" /> Logo do banco
              </button>
              <button
                type="button"
                onClick={() => setVisualMode('icon')}
                className={cn(
                  'p-3 rounded-xl text-xs font-medium border-2 transition-all flex items-center justify-center gap-2',
                  visualMode === 'icon' ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/40'
                )}
              >
                <Shapes className="w-4 h-4" /> Ícone
              </button>
            </div>
          </div>

          {visualMode === 'logo' ? (
            <div className="space-y-2">
              <Label>Logo do banco</Label>
              {isBankSlug(logoUrl) ? (
                <p className="text-[11px] text-muted-foreground">
                  Logo bundlada no app — sem requisições externas. Use as sugestões acima para trocar de banco.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Selecione um banco nas sugestões acima para usar a logo oficial bundlada. Se o seu banco não estiver na lista, use o modo "Ícone".
                </p>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}

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
