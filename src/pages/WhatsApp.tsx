import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Copy, Check, RefreshCw, Link2Off, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const SANDBOX_NUMBER = '+1 415 523 8886';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

interface WhatsappLink {
  id: string;
  link_code: string;
  phone: string | null;
  verified_at: string | null;
}

export default function WhatsApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [link, setLink] = useState<WhatsappLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const webhookUrl = useMemo(
    () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`,
    []
  );

  const ensureLink = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_links')
      .select('id, link_code, phone, verified_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setLink(data as WhatsappLink);
    } else {
      const { data: created, error } = await supabase
        .from('whatsapp_links')
        .insert({ user_id: user.id, link_code: generateCode() })
        .select('id, link_code, phone, verified_at')
        .single();
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível gerar seu código.', variant: 'destructive' });
      } else {
        setLink(created as WhatsappLink);
      }
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    ensureLink();
  }, [ensureLink]);

  const regenerate = async () => {
    if (!link) return;
    const { data, error } = await supabase
      .from('whatsapp_links')
      .update({ link_code: generateCode(), phone: null, verified_at: null })
      .eq('id', link.id)
      .select('id, link_code, phone, verified_at')
      .single();
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setLink(data as WhatsappLink);
    toast({ title: 'Novo código gerado' });
  };

  const unlink = async () => {
    if (!link) return;
    const { data, error } = await supabase
      .from('whatsapp_links')
      .update({ phone: null, verified_at: null })
      .eq('id', link.id)
      .select('id, link_code, phone, verified_at')
      .single();
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setLink(data as WhatsappLink);
    toast({ title: 'Número desvinculado' });
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isLinked = !!link?.verified_at;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-4.5 h-4.5 text-primary stroke-[1.5]" />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold leading-tight">WhatsApp</h1>
          <p className="text-xs text-muted-foreground">Registre gastos por mensagem</p>
        </div>
      </div>

      {/* Status + código */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              isLinked ? 'bg-income/10 text-income' : 'bg-muted text-muted-foreground'
            )}
          >
            {isLinked ? 'Vinculado' : 'Não vinculado'}
          </span>
        </div>

        {isLinked ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Número conectado</p>
              <p className="text-base font-semibold">{link?.phone}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={unlink}>
              <Link2Off className="w-4 h-4 mr-2 stroke-[1.5]" />
              Desvincular número
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Seu código de vínculo</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-2xl font-display font-bold tracking-[0.2em] text-center py-3 rounded-xl bg-muted/50">
                  {loading ? '••••••' : link?.link_code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => link && copy(`vincular ${link.link_code}`)}
                >
                  {copied ? <Check className="w-4 h-4 text-income" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie no WhatsApp <strong>vincular {link?.link_code}</strong> para conectar seu número.
            </p>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={regenerate}>
              <RefreshCw className="w-3.5 h-3.5 mr-2 stroke-[1.5]" />
              Gerar novo código
            </Button>
          </div>
        )}
      </div>

      {/* Comandos */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">O que você pode enviar</h2>
        <div className="space-y-2 text-xs">
          {[
            ['gastei 35 no uber', 'Despesa de R$ 35 em Transporte'],
            ['despesa 120 mercado ontem', 'Despesa com a data de ontem'],
            ['recebi 3000 de salário', 'Receita de R$ 3.000'],
            ['gastos de hoje', 'Total do dia'],
            ['gastos da semana', 'Total da semana'],
            ['resumo do mês', 'Receitas, despesas e saldo'],
          ].map(([cmd, desc]) => (
            <div key={cmd} className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
              <code className="text-foreground font-medium">{cmd}</code>
              <span className="text-muted-foreground text-right shrink-0 max-w-[45%]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup */}
      <Collapsible>
        <div className="glass-card p-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Como ativar (grátis)</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3 text-xs text-muted-foreground">
            <p>
              1. Crie uma conta gratuita na Twilio e abra o <strong>WhatsApp Sandbox</strong> (Messaging &gt; Try it out).
            </p>
            <p>
              2. No WhatsApp, envie a palavra <strong>join …</strong> mostrada no sandbox para o número{' '}
              <strong>{SANDBOX_NUMBER}</strong>.
            </p>
            <p>
              3. No sandbox, em <strong>When a message comes in</strong>, cole esta URL (método POST):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all p-2 rounded-lg bg-muted/50 text-[10px] text-foreground">
                {webhookUrl}
              </code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copy(webhookUrl)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p>
              4. Envie <strong>vincular {link?.link_code ?? 'SEUCODIGO'}</strong> e comece a registrar.
            </p>
            <p className="text-[11px]">
              O sandbox é gratuito e as respostas do bot não consomem créditos. Se preferir um número próprio,
              a WhatsApp Cloud API da Meta funciona com a mesma URL.
            </p>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
