import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Plus, Copy, LogOut, Check, Link2, Trash2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProfileSwitcher() {
  const { wallets, activeWalletId, setActiveWalletId, createWallet, leaveWallet, deleteWallet, createInvite } = useWallet();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('Nossa Carteira');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<{ id: string; name: string; isOwner: boolean } | null>(null);


  const activeWallet = wallets.find((w) => w.id === activeWalletId) || null;
  const isCouple = !!activeWallet;

  const handleCreate = async () => {
    if (!name.trim()) return;
    const w = await createWallet(name.trim());
    if (w) {
      setCreateOpen(false);
      setName('Nossa Carteira');
    }
  };

  const handleInvite = async () => {
    if (!activeWalletId) return;
    const url = await createInvite(activeWalletId);
    if (url) setInviteUrl(url);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({ title: 'Link copiado!', description: 'Compartilhe com seu parceiro(a).' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all min-h-[40px] text-sm font-semibold',
              isCouple
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-primary/10 text-primary border-primary/30'
            )}
          >
            {isCouple ? <Users className="w-4 h-4 stroke-[1.5]" /> : <User className="w-4 h-4 stroke-[1.5]" />}
            <span className="hidden sm:inline truncate max-w-[120px]">
              {isCouple ? activeWallet!.name : 'Minha'}
            </span>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 z-[70]">
          <DropdownMenuLabel className="text-xs">Carteira ativa</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setActiveWalletId(null)}
            className={cn('gap-2', !activeWalletId && 'bg-primary/10 text-primary')}
          >
            <User className="w-4 h-4" /> Minha carteira
            {!activeWalletId && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>

          {wallets.map((w) => {
            const isOwner = user?.id === w.created_by;
            return (
              <div
                key={w.id}
                className={cn(
                  'group flex items-center rounded-sm transition-colors',
                  activeWalletId === w.id && 'bg-accent/10 text-accent'
                )}
              >
                <button
                  onClick={() => setActiveWalletId(w.id)}
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left min-w-0"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{w.name}</span>
                  {activeWalletId === w.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWalletToDelete({ id: w.id, name: w.name, isOwner });
                  }}
                  className="p-1.5 mr-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label={isOwner ? 'Excluir carteira' : 'Sair da carteira'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Criar carteira compartilhada
          </DropdownMenuItem>

          {activeWalletId && (
            <DropdownMenuItem onClick={handleInvite} className="gap-2">
              <Link2 className="w-4 h-4" /> Gerar link de convite
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create wallet sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl z-[60]">
          <SheetHeader>
            <SheetTitle>Nova carteira compartilhada</SheetTitle>
            <SheetDescription>
              Crie uma carteira separada para gerenciar finanças em conjunto.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nome da carteira</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Casa, Família..." />
            </div>
            <p className="text-xs text-muted-foreground">
              Você poderá convidar outra pessoa depois através de um link compartilhável.
            </p>
            <Button onClick={handleCreate} className="w-full rounded-2xl bg-gradient-primary">
              Criar carteira
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Invite link sheet */}
      <Sheet open={!!inviteUrl} onOpenChange={(o) => !o && setInviteUrl(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl z-[60]">
          <SheetHeader>
            <SheetTitle>Convide seu parceiro(a)</SheetTitle>
            <SheetDescription>
              Compartilhe este link. A pessoa precisa abrir já logada na conta dela. O link expira em 7 dias.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input value={inviteUrl || ''} readOnly className="text-xs" />
              <Button onClick={handleCopy} className="rounded-2xl shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
