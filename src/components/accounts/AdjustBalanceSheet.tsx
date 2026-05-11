import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Account } from '@/types/account';
import { useAccounts } from '@/contexts/AccountContext';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account | null;
}

export default function AdjustBalanceSheet({ open, onClose, account }: Props) {
  const { balances, adjustBalance } = useAccounts();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && account) {
      const current = balances[account.id] ?? 0;
      setValue(current.toFixed(2).replace('.', ','));
    }
  }, [open, account, balances]);

  if (!account) return null;
  const current = balances[account.id] ?? 0;

  const handleSubmit = async () => {
    const parsed = parseFloat(value.replace(',', '.'));
    if (isNaN(parsed)) return;
    setSaving(true);
    await adjustBalance(account.id, parsed);
    setSaving(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl z-[60]">
        <SheetHeader>
          <SheetTitle>Ajustar saldo de {account.name}</SheetTitle>
          <SheetDescription>
            Vamos criar uma transação automática de "Ajuste de saldo" com a diferença para que o saldo bata com o que você informar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-4 pb-4">
          <div className="p-3 rounded-2xl bg-muted/40">
            <p className="text-xs text-muted-foreground">Saldo atual calculado</p>
            <p className="text-xl font-bold">R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="space-y-2">
            <Label>Novo saldo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 h-12 text-lg font-semibold"
                autoFocus
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 rounded-2xl bg-gradient-primary">
            Confirmar ajuste
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
