import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Users } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

export default function JoinWallet() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { acceptInvite } = useWallet();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token inválido');
      return;
    }
    acceptInvite(token).then((result) => {
      if (result.success) {
        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Erro desconhecido');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-elevated rounded-3xl p-8 max-w-md w-full text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-8 h-8 text-primary stroke-[1.5]" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <h1 className="text-xl font-display font-bold">Aceitando convite...</h1>
            <p className="text-sm text-muted-foreground">Você está entrando na carteira compartilhada.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-income" />
            <h1 className="text-xl font-display font-bold">Bem-vindo(a) à carteira!</h1>
            <p className="text-sm text-muted-foreground">Redirecionando para o painel...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-expense" />
            <h1 className="text-xl font-display font-bold">Não foi possível entrar</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button onClick={() => navigate('/')} className="rounded-2xl">
              Voltar ao início
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
