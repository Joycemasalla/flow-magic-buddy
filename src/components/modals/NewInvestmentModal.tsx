import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  Landmark,
  PiggyBank,
  BarChart3,
  Bitcoin,
  Layers,
  Wallet,
  Coins,
  Calendar,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import {
  InvestmentType,
  investmentTypeLabels,
  Investment,
  TesouroDiretoDetails,
  AcoesDetails,
  CriptoDetails,
  RendaFixaDetails,
  PoupancaDetails,
  FundosDetails,
} from '@/types/investment';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<InvestmentType, React.ElementType> = {
  tesouro_direto: Landmark,
  renda_fixa: PiggyBank,
  acoes: BarChart3,
  cripto: Bitcoin,
  fundos: Layers,
  poupanca: Wallet,
  outros: Coins,
};

type Step = 'type' | 'basic' | 'details' | 'confirm';

export default function NewInvestmentModal({ isOpen, onClose }: NewInvestmentModalProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null);
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [jaInvestido, setJaInvestido] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Specific details
  const [tesouroDireto, setTesouroDireto] = useState<TesouroDiretoDetails>({
    titulo: '',
    taxa: 0,
    precoUnitario: 0,
    vencimento: '',
  });
  const [acoes, setAcoes] = useState<AcoesDetails>({
    ticker: '',
    quantidade: 0,
    precoMedio: 0,
  });
  const [cripto, setCripto] = useState<CriptoDetails>({
    moeda: '',
    quantidade: 0,
    precoMedio: 0,
  });
  const [rendaFixa, setRendaFixa] = useState<RendaFixaDetails>({
    instituicao: '',
    taxa: 0,
    tipoTaxa: 'cdi',
    vencimento: '',
  });
  const [poupanca, setPoupanca] = useState<PoupancaDetails>({
    instituicao: '',
    objetivo: '',
  });
  const [fundos, setFundos] = useState<FundosDetails>({
    nomeGestor: '',
    tipoFundo: '',
    taxaAdministracao: 0,
  });

  const { addInvestment, markInvestmentAsDone } = useTransactions();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('type');
      setSelectedType(null);
      setNome('');
      setValor('');
      setDescricao('');
      setSelectedDate(new Date());
      setJaInvestido(false);
      setTesouroDireto({ titulo: '', taxa: 0, precoUnitario: 0, vencimento: '' });
      setAcoes({ ticker: '', quantidade: 0, precoMedio: 0 });
      setCripto({ moeda: '', quantidade: 0, precoMedio: 0 });
      setRendaFixa({ instituicao: '', taxa: 0, tipoTaxa: 'cdi', vencimento: '' });
      setPoupanca({ instituicao: '', objetivo: '' });
      setFundos({ nomeGestor: '', tipoFundo: '', taxaAdministracao: 0 });
    }
  }, [isOpen]);

  const handleTypeSelect = (type: InvestmentType) => {
    setSelectedType(type);
    setStep('basic');
  };

  const handleBasicSubmit = () => {
    if (!nome.trim() || !valor.trim()) {
      toast({
        title: 'Preencha os campos',
        description: 'Nome e valor são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    // Skip details for 'outros' type
    if (selectedType === 'outros') {
      setStep('confirm');
    } else {
      setStep('details');
    }
  };

  const handleDetailsSubmit = () => {
    setStep('confirm');
  };

  const getSpecificDetails = () => {
    switch (selectedType) {
      case 'tesouro_direto':
        return tesouroDireto;
      case 'acoes':
        return acoes;
      case 'cripto':
        return cripto;
      case 'renda_fixa':
        return rendaFixa;
      case 'poupanca':
        return poupanca;
      case 'fundos':
        return fundos;
      default:
        return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsProcessing(true);

    const parsedValor = parseFloat(valor.replace(',', '.'));

    const investment: Omit<Investment, 'id' | 'createdAt'> = {
      nome,
      tipo: selectedType,
      valorInvestido: parsedValor,
      dataInvestimento: selectedDate.toISOString().split('T')[0],
      jaInvestido,
      descricao: descricao || undefined,
      detalhesEspecificos: getSpecificDetails(),
    };

    addInvestment(investment);

    toast({
      title: jaInvestido ? '✅ Investimento registrado!' : '📋 Investimento planejado!',
      description: `${nome} - R$ ${parsedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });

    setIsProcessing(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 'basic') setStep('type');
    else if (step === 'details') setStep('basic');
    else if (step === 'confirm') {
      if (selectedType === 'outros') {
        setStep('basic');
      } else {
        setStep('details');
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const renderTypeSelection = () => (
    <motion.div
      key="type"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">Selecione o tipo de investimento:</p>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(investmentTypeLabels) as InvestmentType[]).map((type) => {
          const Icon = iconMap[type];
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTypeSelect(type)}
              className="flex flex-col items-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
            >
              <Icon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">{investmentTypeLabels[type]}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  const renderBasicInfo = () => (
    <motion.div
      key="basic"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Nome do investimento</Label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Tesouro IPCA+ 2035"
        />
      </div>

      <div className="space-y-2">
        <Label>Valor a investir</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data do aporte</Label>
        <p className="text-xs text-muted-foreground -mt-1">Pode ser uma data futura para investimentos planejados</p>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Calendar className="mr-2 h-4 w-4" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Notas ou observações..."
          rows={2}
        />
      </div>

      <Button onClick={handleBasicSubmit} className="w-full">
        Continuar
      </Button>
    </motion.div>
  );

  const renderDetails = () => {
    if (!selectedType) return null;

    return (
      <motion.div
        key="details"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          Detalhes específicos de {investmentTypeLabels[selectedType]}:
        </p>

        {selectedType === 'tesouro_direto' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={tesouroDireto.titulo}
                onChange={(e) => setTesouroDireto({ ...tesouroDireto, titulo: e.target.value })}
                placeholder="Ex: IPCA+ 2035"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Taxa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tesouroDireto.taxa || ''}
                  onChange={(e) => setTesouroDireto({ ...tesouroDireto, taxa: parseFloat(e.target.value) || 0 })}
                  placeholder="6.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tesouroDireto.precoUnitario || ''}
                  onChange={(e) => setTesouroDireto({ ...tesouroDireto, precoUnitario: parseFloat(e.target.value) || 0 })}
                  placeholder="2850.45"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={tesouroDireto.vencimento}
                onChange={(e) => setTesouroDireto({ ...tesouroDireto, vencimento: e.target.value })}
              />
            </div>
          </>
        )}

        {selectedType === 'acoes' && (
          <>
            <div className="space-y-2">
              <Label>Ticker</Label>
              <Input
                value={acoes.ticker}
                onChange={(e) => setAcoes({ ...acoes, ticker: e.target.value.toUpperCase() })}
                placeholder="PETR4"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={acoes.quantidade || ''}
                  onChange={(e) => setAcoes({ ...acoes, quantidade: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Médio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={acoes.precoMedio || ''}
                  onChange={(e) => setAcoes({ ...acoes, precoMedio: parseFloat(e.target.value) || 0 })}
                  placeholder="35.50"
                />
              </div>
            </div>
          </>
        )}

        {selectedType === 'cripto' && (
          <>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input
                value={cripto.moeda}
                onChange={(e) => setCripto({ ...cripto, moeda: e.target.value.toUpperCase() })}
                placeholder="BTC"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={cripto.quantidade || ''}
                  onChange={(e) => setCripto({ ...cripto, quantidade: parseFloat(e.target.value) || 0 })}
                  placeholder="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Médio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cripto.precoMedio || ''}
                  onChange={(e) => setCripto({ ...cripto, precoMedio: parseFloat(e.target.value) || 0 })}
                  placeholder="150000"
                />
              </div>
            </div>
          </>
        )}

        {selectedType === 'renda_fixa' && (
          <>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input
                value={rendaFixa.instituicao}
                onChange={(e) => setRendaFixa({ ...rendaFixa, instituicao: e.target.value })}
                placeholder="Nubank, XP, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Taxa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rendaFixa.taxa || ''}
                  onChange={(e) => setRendaFixa({ ...rendaFixa, taxa: parseFloat(e.target.value) || 0 })}
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Taxa</Label>
                <select
                  value={rendaFixa.tipoTaxa}
                  onChange={(e) => setRendaFixa({ ...rendaFixa, tipoTaxa: e.target.value as 'cdi' | 'ipca' | 'prefixado' })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="cdi">% do CDI</option>
                  <option value="ipca">IPCA +</option>
                  <option value="prefixado">Prefixado</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={rendaFixa.vencimento}
                onChange={(e) => setRendaFixa({ ...rendaFixa, vencimento: e.target.value })}
              />
            </div>
          </>
        )}

        {selectedType === 'poupanca' && (
          <>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input
                value={poupanca.instituicao}
                onChange={(e) => setPoupanca({ ...poupanca, instituicao: e.target.value })}
                placeholder="Nubank, Caixa, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo (opcional)</Label>
              <Input
                value={poupanca.objetivo || ''}
                onChange={(e) => setPoupanca({ ...poupanca, objetivo: e.target.value })}
                placeholder="Reserva de emergência"
              />
            </div>
          </>
        )}

        {selectedType === 'fundos' && (
          <>
            <div className="space-y-2">
              <Label>Gestora</Label>
              <Input
                value={fundos.nomeGestor}
                onChange={(e) => setFundos({ ...fundos, nomeGestor: e.target.value })}
                placeholder="XP, BTG, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Fundo</Label>
                <Input
                  value={fundos.tipoFundo}
                  onChange={(e) => setFundos({ ...fundos, tipoFundo: e.target.value })}
                  placeholder="Multimercado"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa Admin (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fundos.taxaAdministracao || ''}
                  onChange={(e) => setFundos({ ...fundos, taxaAdministracao: parseFloat(e.target.value) || 0 })}
                  placeholder="2.0"
                />
              </div>
            </div>
          </>
        )}

        <Button onClick={handleDetailsSubmit} className="w-full">
          Continuar
        </Button>
      </motion.div>
    );
  };

  const renderConfirmation = () => {
    const parsedValor = parseFloat(valor.replace(',', '.')) || 0;

    return (
      <motion.div
        key="confirm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="space-y-4"
      >
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">{selectedType && investmentTypeLabels[selectedType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-bold text-primary">
              R$ {parsedValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">
              {format(selectedDate, 'dd/MM/yyyy')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-income/5 border border-income/20 rounded-xl">
          <div>
            <p className="font-medium">Já realizei este investimento</p>
            <p className="text-xs text-muted-foreground">
              Registra como investido e cria a despesa
            </p>
          </div>
          <Switch
            checked={jaInvestido}
            onCheckedChange={setJaInvestido}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full gap-2"
        >
          <Check className="w-4 h-4" />
          {jaInvestido ? 'Registrar Investimento' : 'Planejar Investimento'}
        </Button>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border rounded-t-3xl safe-area-bottom max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-card">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-4 sm:px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {step !== 'type' && (
                    <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <h2 className="text-lg sm:text-xl font-bold">
                    {step === 'type' && 'Novo Investimento'}
                    {step === 'basic' && 'Informações'}
                    {step === 'details' && 'Detalhes'}
                    {step === 'confirm' && 'Confirmar'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {step === 'type' && renderTypeSelection()}
                {step === 'basic' && renderBasicInfo()}
                {step === 'details' && renderDetails()}
                {step === 'confirm' && renderConfirmation()}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
