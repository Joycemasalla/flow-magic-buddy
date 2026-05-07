import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Wallet {
  id: string;
  name: string;
  type: 'couple';
  created_by: string;
  created_at: string;
}

export interface WalletInvite {
  id: string;
  wallet_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
}

interface WalletContextType {
  wallets: Wallet[];
  activeWalletId: string | null; // null = personal
  setActiveWalletId: (id: string | null) => void;
  loading: boolean;
  refreshWallets: () => Promise<void>;
  createWallet: (name: string) => Promise<Wallet | null>;
  leaveWallet: (walletId: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  createInvite: (walletId: string) => Promise<string | null>; // returns full URL
  acceptInvite: (token: string) => Promise<{ success: boolean; walletId?: string; error?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const ACTIVE_WALLET_KEY = 'moneyflow_active_wallet';

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_WALLET_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setActiveWalletId = useCallback((id: string | null) => {
    setActiveWalletIdState(id);
    try {
      if (id) localStorage.setItem(ACTIVE_WALLET_KEY, id);
      else localStorage.removeItem(ACTIVE_WALLET_KEY);
    } catch {}
  }, []);

  const refreshWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      setWallets(data as Wallet[]);
      // If active wallet no longer accessible, fall back to personal
      if (activeWalletId && !data.find((w) => w.id === activeWalletId)) {
        setActiveWalletId(null);
      }
    }
    setLoading(false);
  }, [user, activeWalletId, setActiveWalletId]);

  useEffect(() => {
    refreshWallets();
  }, [user]);

  const createWallet = async (name: string): Promise<Wallet | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('wallets')
      .insert({ name, type: 'couple', created_by: user.id })
      .select()
      .single();
    if (error || !data) {
      toast({ title: 'Erro', description: error?.message || 'Não foi possível criar a carteira', variant: 'destructive' });
      return null;
    }
    await refreshWallets();
    setActiveWalletId(data.id);
    toast({ title: 'Carteira criada!', description: `"${name}" está pronta para uso.` });
    return data as Wallet;
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) return;
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return;
    if (wallet.created_by !== user.id) {
      toast({ title: 'Apenas o criador pode excluir', description: 'Você pode sair da carteira em vez disso.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('wallets').delete().eq('id', walletId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    if (activeWalletId === walletId) setActiveWalletId(null);
    await refreshWallets();
    toast({ title: 'Carteira excluída', description: `"${wallet.name}" foi removida.` });
  };

  const leaveWallet = async (walletId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('wallet_members')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    if (activeWalletId === walletId) setActiveWalletId(null);
    await refreshWallets();
    toast({ title: 'Você saiu da carteira' });
  };

  const createInvite = async (walletId: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('wallet_invites')
      .insert({ wallet_id: walletId, created_by: user.id })
      .select()
      .single();
    if (error || !data) {
      toast({ title: 'Erro', description: error?.message || 'Não foi possível gerar o convite', variant: 'destructive' });
      return null;
    }
    return `${window.location.origin}/convite/${data.token}`;
  };

  const acceptInvite = async (token: string) => {
    if (!user) return { success: false, error: 'Faça login primeiro' };
    // Find invite
    const { data: invite, error: inviteErr } = await supabase
      .from('wallet_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (inviteErr || !invite) return { success: false, error: 'Convite inválido' };
    if (invite.used_at) return { success: false, error: 'Convite já utilizado' };
    if (new Date(invite.expires_at) < new Date()) return { success: false, error: 'Convite expirado' };

    // Add as member
    const { error: memberErr } = await supabase
      .from('wallet_members')
      .insert({ wallet_id: invite.wallet_id, user_id: user.id, role: 'member' });
    if (memberErr && !memberErr.message.includes('duplicate')) {
      return { success: false, error: memberErr.message };
    }

    // Mark invite used
    await supabase
      .from('wallet_invites')
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq('id', invite.id);

    await refreshWallets();
    setActiveWalletId(invite.wallet_id);
    return { success: true, walletId: invite.wallet_id };
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        activeWalletId,
        setActiveWalletId,
        loading,
        refreshWallets,
        createWallet,
        leaveWallet,
        createInvite,
        acceptInvite,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
