import fs from 'fs';
let c = fs.readFileSync('src/contexts/TransactionContext.tsx', 'utf8');

const fetchCategoriesStr = `
      // ---- CUSTOM CATEGORIES ----
      let categoriesQuery = supabase.from('custom_categories').select('*');
      if (activeWalletId) {
        categoriesQuery = categoriesQuery.eq('wallet_id', activeWalletId);
      } else {
        categoriesQuery = categoriesQuery.is('wallet_id', null);
      }
      const { data: categoriesData } = await categoriesQuery;
      if (categoriesData) {
        import('@/types/transaction').then(m => {
          categoriesData.forEach(cat => {
            m.categoryLabels[cat.name] = cat.name;
            if (cat.color) m.categoryColors[cat.name] = cat.color;
            if (cat.icon) m.categoryIcons[cat.name] = cat.icon;
          });
        });
      }

      // ---- TRANSACTIONS ----`;

if (!c.includes('CUSTOM CATEGORIES')) {
  c = c.replace('      // ---- TRANSACTIONS ----', fetchCategoriesStr);
  fs.writeFileSync('src/contexts/TransactionContext.tsx', c);
}
