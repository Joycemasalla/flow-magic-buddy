import fs from 'fs';
let c = fs.readFileSync('src/pages/TransactionForm.tsx', 'utf8');

const importDialogStr = `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';`;

if (!c.includes('DialogContent')) {
  c = c.replace("import { DatePickerField } from '@/components/ui/DatePickerField';", "import { DatePickerField } from '@/components/ui/DatePickerField';\n" + importDialogStr);
}

const stateStr = `
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const { user } = useAuth();
  const { activeWalletId } = useWallet();

  const handleCreateCategory = async () => {
    if (!newCatName || !user) return;
    const { data, error } = await supabase.from('custom_categories').insert({
      name: newCatName,
      type: type,
      user_id: user.id,
      wallet_id: activeWalletId || null
    }).select().single();

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar a categoria.', variant: 'destructive' });
      return;
    }

    // Update in memory for immediate use
    categoryLabels[newCatName] = newCatName;
    setCategory(newCatName);
    setIsNewCategoryOpen(false);
    setNewCatName("");
    toast({ title: 'Sucesso', description: 'Categoria criada!' });
  };
`;

if (!c.includes('isNewCategoryOpen')) {
  c = c.replace('const navigate = useNavigate();', 'const navigate = useNavigate();' + stateStr);
}

const buttonStr = `
            {filteredCategories.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key as TransactionCategory)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all text-center',
                  category === key
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted/50 border-2 border-transparent'
                )}
              >
                <span className="text-xl">{categoryEmojis[key as TransactionCategory] || '📁'}</span>
                <span className="text-xs font-medium truncate w-full">{label}</span>
              </button>
            ))}

            {/* NEW CATEGORY BUTTON */}
            <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all text-center bg-muted/30 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
                >
                  <span className="text-xl">➕</span>
                  <span className="text-xs font-medium truncate w-full">Nova Categoria</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nome da Categoria</Label>
                    <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Viagem" />
                  </div>
                  <Button type="button" onClick={handleCreateCategory} className="w-full">Salvar Categoria</Button>
                </div>
              </DialogContent>
            </Dialog>
`;

if (!c.includes('NEW CATEGORY BUTTON')) {
  const regex = /\{filteredCategories\.map\(\(\[key, label\]\) => \([\s\S]*?\)\)\}/;
  c = c.replace(regex, buttonStr);
}

fs.writeFileSync('src/pages/TransactionForm.tsx', c);
